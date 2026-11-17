package org.example.winefinder.item.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 작성자(members.id). 등록할 때 정하고 바꾸지 않습니다.
    @Column(nullable = false, updatable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemType type;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemStatus status;

    @Column(nullable = false)
    private String location;

    private String storageLocation;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    // 물품 종류(선택). ItemService.CATEGORIES 중 하나이거나 null
    @Column(length = 20)
    private String itemCategory;

    public void changeCategory(String itemCategory) { this.itemCategory = itemCategory; }

    @Column(nullable = false)
    private LocalDate lostFoundAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Item(Long userId, ItemType type, String name, String description, ItemStatus status,
                String location, String storageLocation, String imageUrl, LocalDate lostFoundAt) {
        this.userId = userId;
        update(type, name, description, status, location, storageLocation, imageUrl, lostFoundAt);
    }

    public void update(ItemType type, String name, String description, ItemStatus status,
                       String location, String storageLocation, String imageUrl, LocalDate lostFoundAt) {
        this.type = type;
        this.name = name;
        this.description = description;
        this.status = status;
        this.location = location;
        this.storageLocation = storageLocation;
        this.imageUrl = imageUrl;
        this.lostFoundAt = lostFoundAt;
    }

    @PrePersist
    private void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
