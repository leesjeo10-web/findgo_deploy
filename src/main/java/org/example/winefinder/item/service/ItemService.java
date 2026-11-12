package org.example.winefinder.item.service;

import java.time.LocalDate;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.example.winefinder.auth.MemberRepository;
import org.example.winefinder.image.ImageService;
import org.example.winefinder.item.dto.*;
import org.example.winefinder.item.entity.*;
import org.example.winefinder.item.repository.ItemRepository;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemService {
    private final ItemRepository items;
    private final ImageService images;
    private final MemberRepository members;

    @Transactional
    public ItemResponse create(ItemCreateRequest request, Long userId) {
        validate(request.type(), request.name(), request.description(), request.location(), request.storageLocation(), request.lostFoundAt());
        images.requireOwned(request.imageUrl(), userId);
        Item item = new Item(userId, request.type(), request.name().strip(), request.description().strip(),
                request.status() == null ? ItemStatus.OPEN : request.status(), request.location().strip(),
                request.type() == ItemType.FOUND ? request.storageLocation() : null, request.imageUrl(), request.lostFoundAt());
        return ItemResponse.from(items.save(item));
    }

    public Page<ItemResponse> findAll(String keyword, ItemType type, ItemStatus status,
                                      String sort, int page, int size, Long userId) {
        if (page < 0 || size < 1 || size > 100 || !("latest".equals(sort) || "oldest".equals(sort))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page ≥ 0, size 1~100, sort latest/oldest를 사용하세요.");
        }
        if (keyword != null && keyword.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "검색어는 100자 이하로 입력하세요.");
        }
        Specification<Item> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            if (type != null) predicates.add(cb.equal(root.get("type"), type));
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (userId != null) predicates.add(cb.equal(root.get("userId"), userId));
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.strip().toLowerCase(Locale.ROOT)
                        .replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
                predicates.add(cb.or(cb.like(cb.lower(root.get("name")), pattern, '!'),
                        cb.like(cb.lower(root.get("description")), pattern, '!'),
                        cb.like(cb.lower(root.get("location")), pattern, '!'),
                        cb.like(cb.lower(root.get("storageLocation")), pattern, '!')));
            }
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        // 등록 일시 기준, 같은 시각이면 id 순서로 정렬합니다.
        var direction = "oldest".equals(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return items.findAll(spec, PageRequest.of(page, size, Sort.by(direction, "createdAt", "id"))).map(ItemResponse::from);
    }

    // 상세에는 작성자 이름과 전화번호를 넣습니다.
    public ItemDetailResponse findById(Long id) {
        Item item = getItem(id);
        return ItemDetailResponse.from(item, members.findById(item.getUserId()).orElse(null));
    }

    @Transactional
    public ItemResponse update(Long id, ItemUpdateRequest request, Long userId) {
        Item item = owned(id, userId);
        validate(request.type(), request.name(), request.description(), request.location(), request.storageLocation(), request.lostFoundAt());
        if (request.status() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status를 입력하세요.");
        // 기존 사진은 유지 가능하며, 교체 사진은 본인이 업로드한 사진이어야 합니다.
        String oldImageUrl = item.getImageUrl();
        boolean imageChanged = !Objects.equals(oldImageUrl, request.imageUrl());
        if (imageChanged) images.requireOwned(request.imageUrl(), userId);
        item.update(request.type(), request.name().strip(), request.description().strip(), request.status(),
                request.location().strip(), request.type() == ItemType.FOUND ? request.storageLocation() : null,
                request.imageUrl(), request.lostFoundAt());
        if (imageChanged) images.release(oldImageUrl); // 바꾸거나 비운 예전 사진 정리
        return ItemResponse.from(item);
    }

    @Transactional
    public ItemResponse status(Long id, ItemStatus status, Long userId) {
        if (status == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status를 입력하세요.");
        Item item = owned(id, userId);
        item.update(item.getType(), item.getName(), item.getDescription(), status, item.getLocation(),
                item.getStorageLocation(), item.getImageUrl(), item.getLostFoundAt());
        return ItemResponse.from(item);
    }

    @Transactional
    // 삭제는 작성자 또는 관리자가 할 수 있습니다. 수정·상태 변경은 작성자만 할 수 있습니다.
    public void delete(Long id, Long userId, boolean admin) {
        Item item = admin ? getItem(id) : owned(id, userId);
        items.delete(item);
        images.release(item.getImageUrl()); // 물품 사진도 함께 정리
    }

    public List<ItemResponse> similar(String name, ItemType type, Long excludeId) {
        if (name == null || name.isBlank() || name.length() > 100 || type == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "물품 이름(1~100자)과 type을 입력하세요.");
        }
        var tokens = Arrays.stream(name.toLowerCase(Locale.ROOT).strip().split("[\\s,./()\\-]+"))
                .filter(t -> t.length() >= 2).distinct().toList();
        if (tokens.isEmpty()) return List.of();
        // 간단한 키워드 추천: 반대 유형의 미해결 물품 중 최근 100건을 비교합니다.
        return findAll(null, type == ItemType.LOST ? ItemType.FOUND : ItemType.LOST,
                ItemStatus.OPEN, "latest", 0, 100, null).getContent().stream()
                .filter(i -> !Objects.equals(i.id(), excludeId))
                .map(i -> Map.entry(i, tokens.stream().filter(t ->
                        (i.name() + " " + Objects.toString(i.description(), "")).toLowerCase(Locale.ROOT).contains(t)).count()))
                .filter(e -> e.getValue() > 0)
                .sorted(Map.Entry.<ItemResponse, Long>comparingByValue().reversed())
                .limit(3).map(Map.Entry::getKey).toList();
    }

    private Item getItem(Long id) {
        return items.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "물품을 찾을 수 없습니다."));
    }
    private Item owned(Long id, Long userId) {
        Item item = getItem(id);
        if (!item.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인이 등록한 물품만 변경할 수 있습니다.");
        }
        return item;
    }
    private void validate(ItemType type, String name, String description, String location, String storage, LocalDate date) {
        if (type == null || date == null || date.isAfter(LocalDate.now()) || name == null || name.isBlank()
                || description == null || description.isBlank() || location == null || location.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유형·이름·설명·장소·날짜는 필수이며 미래 날짜는 사용할 수 없습니다.");
        }
        if (name.length() > 100 || description.length() > 2000 || location.length() > 100
                || (storage != null && storage.length() > 100)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이름·장소는 100자, 설명은 2000자 이하로 입력하세요.");
        }
    }
}
