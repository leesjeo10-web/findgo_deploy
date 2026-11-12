package org.example.winefinder.image;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import javax.imageio.ImageIO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.winefinder.item.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.*;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageService {
    // 어떤 물품에도 연결되지 않은 사진은 업로드(파일 생성) 후 이 시간이 지나면 지웁니다.
    static final Duration UNLINKED_LIFETIME = Duration.ofHours(3);
    private static final String FILE_PATTERN = "[0-9a-f-]{36}\\.jpg";

    private final ImageRepository images;
    private final ItemRepository items;
    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;
    private static final String PREFIX = "/api/images/";
    public static final String PROCESS_FAILED = "사진을 처리하지 못했습니다. 다른 사진을 선택해주세요.";
    public static final String FORMAT_OR_SIZE = "JPG/PNG, 5MB 이하 사진만 올릴 수 있습니다. 다른 사진을 선택해주세요.";

    @Transactional
    public String upload(MultipartFile file, Long userId) {
        if (file.getSize() > 5 * 1024 * 1024) throw new ResponseStatusException(org.springframework.http.HttpStatusCode.valueOf(413), FORMAT_OR_SIZE);
        if (file.isEmpty()) throw processFailed();
        Path target = null;
        try (var input = ImageIO.createImageInputStream(file.getInputStream())) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw processFailed(); // 이미지가 아님
            var reader = readers.next();
            BufferedImage source;
            try {
                reader.setInput(input);
                String format = reader.getFormatName();
                if (!format.equalsIgnoreCase("jpeg") && !format.equalsIgnoreCase("png")) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, FORMAT_OR_SIZE); // GIF·BMP 등
                }
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width < 1 || height < 1 || (long) width * height > 20_000_000) {
                    throw processFailed(); // 해상도 0 또는 2천만 화소 초과
                }
                source = reader.read(0);
            } finally { reader.dispose(); }
            double scale = Math.min(1, 1600.0 / Math.max(source.getWidth(), source.getHeight()));
            var normalized = new BufferedImage(Math.max(1, (int) (source.getWidth() * scale)),
                    Math.max(1, (int) (source.getHeight() * scale)), BufferedImage.TYPE_INT_RGB);
            var graphics = normalized.createGraphics();
            try {
                graphics.setColor(Color.WHITE);
                graphics.fillRect(0, 0, normalized.getWidth(), normalized.getHeight());
                graphics.drawImage(source, 0, 0, normalized.getWidth(), normalized.getHeight(), null);
            } finally { graphics.dispose(); }
            String name = UUID.randomUUID() + ".jpg";
            Path directory = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(directory);
            target = directory.resolve(name);
            try (var output = Files.newOutputStream(target, StandardOpenOption.CREATE_NEW)) {
                if (!ImageIO.write(normalized, "jpeg", output)) throw new IOException("JPEG encoder unavailable");
            }
            Path savedFile = target;
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCompletion(int status) {
                            if (status != STATUS_COMMITTED) {
                                try { Files.deleteIfExists(savedFile); } catch (IOException ignored) { }
                            }
                        }
                    });
            images.saveAndFlush(new ItemImage(name, userId));
            return PREFIX + name;
        } catch (ResponseStatusException error) {
            throw error;
        } catch (IOException error) {
            if (target != null) {
                try { Files.deleteIfExists(target); } catch (IOException ignored) { }
            }
            throw processFailed();
        }
    }

    @Transactional(readOnly = true)
    public void requireOwned(String url, Long userId) {
        if (url == null || url.isBlank()) return;
        if (!url.matches("/api/images/[0-9a-f-]{36}\\.jpg")) throw invalid();
        var image = images.findById(url.substring(PREFIX.length())).orElseThrow(ImageService::invalid);
        if (!image.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "본인이 올린 사진만 첨부할 수 있습니다.");
        }
    }

    // 물품을 지우거나 사진을 바꾸거나 비웠을 때 예전 사진을 정리합니다.
    // 같은 사진을 쓰는 다른 물품이 있으면 남깁니다. item_image 기록은 지금, 파일은 커밋 뒤에 지웁니다.
    @Transactional
    public void release(String url) {
        if (url == null || !url.matches("/api/images/" + FILE_PATTERN)) return;
        if (items.existsByImageUrl(url)) return;
        String filename = url.substring(PREFIX.length());
        images.deleteById(filename);
        deleteFilesAfterCommit(List.of(filename));
    }

    // 파일은 DB 커밋이 끝난 뒤에 지웁니다(롤백되면 남겨 둠). 트랜잭션 밖이면 바로 지웁니다.
    public void deleteFilesAfterCommit(Collection<String> filenames) {
        if (filenames.isEmpty()) return;
        List<String> targets = List.copyOf(filenames);
        if (!org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            deleteFiles(targets);
            return;
        }
        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override
                    public void afterCommit() { deleteFiles(targets); }
                });
    }

    // 10분마다 연결되지 않은 지 3시간이 지난 사진을 지웁니다.
    @Scheduled(initialDelay = 10, fixedDelay = 10, timeUnit = TimeUnit.MINUTES)
    @Transactional
    public void deleteUnlinkedImages() { deleteUnlinkedImages(Instant.now()); }

    // 기준은 서버에 저장된 파일의 생성 시각입니다. 지운 개수를 돌려줍니다.
    @Transactional
    public int deleteUnlinkedImages(Instant now) {
        Path directory = directory();
        if (!Files.isDirectory(directory)) return 0;
        Instant cutoff = now.minus(UNLINKED_LIFETIME);
        List<String> expired = new java.util.ArrayList<>();
        try (var files = Files.list(directory)) {
            for (Path file : files.toList()) {
                String filename = file.getFileName().toString();
                if (!filename.matches(FILE_PATTERN)) continue;
                Instant created = Files.readAttributes(file, BasicFileAttributes.class).creationTime().toInstant();
                if (!created.isBefore(cutoff) || items.existsByImageUrl(PREFIX + filename)) continue;
                images.deleteById(filename);
                expired.add(filename);
            }
        } catch (IOException e) {
            log.warn("연결되지 않은 사진을 정리하지 못했습니다: {}", e.getMessage());
        }
        deleteFilesAfterCommit(expired);
        if (!expired.isEmpty()) log.info("연결되지 않은 사진 {}개를 지웠습니다.", expired.size());
        return expired.size();
    }

    private void deleteFiles(List<String> filenames) {
        for (String filename : filenames) {
            if (!filename.matches(FILE_PATTERN)) continue;
            try {
                Files.deleteIfExists(directory().resolve(filename));
            } catch (IOException e) {
                log.warn("사진 파일을 지우지 못했습니다: {}", filename);
            }
        }
    }

    private Path directory() { return Path.of(uploadDir).toAbsolutePath().normalize(); }

    public Resource read(String filename) {
        if (!filename.matches("[0-9a-f-]{36}\\.jpg")) throw notFound();
        var file = new FileSystemResource(Path.of(uploadDir).toAbsolutePath().normalize().resolve(filename));
        if (!file.isReadable()) throw notFound();
        return file;
    }
    private static ResponseStatusException processFailed() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, PROCESS_FAILED);
    }
    private static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "JPG 또는 PNG 사진을 업로드한 뒤 반환된 imageUrl을 사용하세요.");
    }
    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "사진을 찾을 수 없습니다.");
    }
}
