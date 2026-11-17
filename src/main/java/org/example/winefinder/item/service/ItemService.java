package org.example.winefinder.item.service;

import java.time.LocalDate;
import java.time.ZoneId;
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
    static final String NOT_FOUND = "해당 물품을 찾을 수 없습니다. 삭제되었거나 주소가 잘못되었을 수 있습니다.";
    static final String NOT_OWNER = "본인이 등록한 물품만 수정·삭제할 수 있습니다.";
    static final String TOO_LONG = "이름·장소는 100자, 설명은 2000자 이하로 입력하세요.";
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    // 물품 종류(선택 입력). 프론트엔드 선택지와 같은 값을 씁니다.
    public static final List<String> CATEGORIES = List.of("전자기기", "지갑/카드", "의류", "가방", "필기구", "기타");
    static final String INVALID_CATEGORY = "물품 종류를 확인해주세요.";

    private final ItemRepository items;
    private final ImageService images;
    private final MemberRepository members;

    @Transactional
    public ItemResponse create(ItemCreateRequest request, Long userId) {
        Fields f = validate(request.type(), request.name(), request.description(), request.location(), request.storageLocation(), request.lostFoundAt());
        String imageUrl = blankToNull(request.imageUrl());
        images.requireOwned(imageUrl, userId);
        Item item = new Item(userId, request.type(), f.name(), f.description(),
                request.status() == null ? ItemStatus.OPEN : request.status(), f.location(),
                f.storageLocation(), imageUrl, request.lostFoundAt());
        item.changeCategory(category(request.itemCategory()));
        return ItemResponse.from(items.save(item));
    }

    public Page<ItemResponse> findAll(String keyword, ItemType type, ItemStatus status, String itemCategory,
                                      String sort, int page, int size, Long userId) {
        if (page < 0 || size < 1 || size > 100 || !("latest".equals(sort) || "oldest".equals(sort))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page ≥ 0, size 1~100, sort latest/oldest를 사용하세요.");
        }
        if (keyword != null && keyword.strip().length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "검색어는 100자 이하로 입력하세요.");
        }
        String category = category(itemCategory);
        Specification<Item> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            if (type != null) predicates.add(cb.equal(root.get("type"), type));
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (category != null) predicates.add(cb.equal(root.get("itemCategory"), category));
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
        Fields f = validate(request.type(), request.name(), request.description(), request.location(), request.storageLocation(), request.lostFoundAt());
        if (request.status() == null) throw badRequest(STATUS_REQUIRED);
        String category = category(request.itemCategory());
        // 기존 사진은 유지 가능하며, 교체 사진은 본인이 업로드한 사진이어야 합니다.
        String imageUrl = blankToNull(request.imageUrl());
        String oldImageUrl = item.getImageUrl();
        boolean imageChanged = !Objects.equals(blankToNull(oldImageUrl), imageUrl);
        if (imageChanged) images.requireOwned(imageUrl, userId);
        item.update(request.type(), f.name(), f.description(), request.status(),
                f.location(), f.storageLocation(), imageUrl, request.lostFoundAt());
        item.changeCategory(category); // 비우면 기존 값도 지웁니다.
        if (imageChanged) images.release(oldImageUrl); // 바꾸거나 비운 예전 사진 정리
        return ItemResponse.from(item);
    }

    @Transactional
    public ItemResponse status(Long id, ItemStatus status, Long userId) {
        if (status == null) throw badRequest(STATUS_REQUIRED);
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
                ItemStatus.OPEN, null, "latest", 0, 100, null).getContent().stream()
                .filter(i -> !Objects.equals(i.id(), excludeId))
                .map(i -> Map.entry(i, tokens.stream().filter(t ->
                        (i.name() + " " + Objects.toString(i.description(), "")).toLowerCase(Locale.ROOT).contains(t)).count()))
                .filter(e -> e.getValue() > 0)
                .sorted(Map.Entry.<ItemResponse, Long>comparingByValue().reversed())
                .limit(3).map(Map.Entry::getKey).toList();
    }

    private Item getItem(Long id) {
        return items.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, NOT_FOUND));
    }
    private Item owned(Long id, Long userId) {
        Item item = getItem(id);
        if (!item.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, NOT_OWNER);
        }
        return item;
    }
    private static final String STATUS_REQUIRED = "상태를 입력해주세요.";

    // 앞뒤 공백을 지운 값. 공백만 있으면 빈 값(null)으로 봅니다.
    private record Fields(String name, String description, String location, String storageLocation) {}

    // 필수 입력 → 글자 수(공백 제거 후) → 날짜(오늘, Asia/Seoul 기준) 순서로 확인합니다.
    // 분실물(LOST)은 보관 장소를 저장하지 않고, 습득물(FOUND)은 보관 장소가 필수입니다.
    private Fields validate(ItemType type, String name, String description, String location, String storage, LocalDate date) {
        String n = blankToNull(name), d = blankToNull(description), l = blankToNull(location), s = blankToNull(storage);
        if (type == null) throw badRequest("유형을 입력해주세요.");
        if (n == null) throw badRequest("이름을 입력해주세요.");
        if (d == null) throw badRequest("설명을 입력해주세요.");
        if (l == null) throw badRequest("장소를 입력해주세요.");
        if (type == ItemType.FOUND && s == null) throw badRequest("보관 장소를 입력해주세요.");
        if (date == null) throw badRequest("날짜를 입력해주세요.");
        if (type == ItemType.LOST) s = null;
        if (n.length() > 100 || d.length() > 2000 || l.length() > 100 || (s != null && s.length() > 100)) {
            throw badRequest(TOO_LONG);
        }
        if (date.isAfter(LocalDate.now(SEOUL))) throw badRequest("미래 날짜는 입력할 수 없습니다.");
        return new Fields(n, d, l, s);
    }
    // 물품 종류: 비어 있으면 null, 정해진 목록에 없으면 400
    private static String category(String value) {
        String c = blankToNull(value);
        if (c != null && !CATEGORIES.contains(c)) throw badRequest(INVALID_CATEGORY);
        return c;
    }
    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
