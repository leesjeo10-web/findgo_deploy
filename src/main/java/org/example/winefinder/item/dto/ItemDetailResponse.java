package org.example.winefinder.item.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.example.winefinder.auth.Member;
import org.example.winefinder.item.entity.Item;
import org.example.winefinder.item.entity.ItemStatus;
import org.example.winefinder.item.entity.ItemType;

// 물품 상세 응답. 목록 응답(ItemResponse)에 작성자 이름과 전화번호를 더합니다.
@Schema(description = "물품 상세 정보. 목록 항목에 작성자 이름·전화번호가 추가됩니다.")
public record ItemDetailResponse(
        @Schema(description = "물품 ID", example = "1") Long id,
        @Schema(description = "작성자 ID", example = "1") Long userId,
        @Schema(description = "물품 유형: LOST=분실물, FOUND=습득물", example = "FOUND") ItemType type,
        @Schema(description = "물품 이름", example = "검정 우산") String name,
        @Schema(description = "물품 특징과 설명", example = "손잡이에 파란 스티커가 있습니다.") String description,
        @Schema(description = "진행 상태: OPEN=찾는 중, RESOLVED=해결 완료", example = "OPEN") ItemStatus status,
        @Schema(description = "분실 또는 습득 장소", example = "도서관") String location,
        @Schema(description = "습득물 보관 장소. 분실물은 null", example = "학생회실") String storageLocation,
        @Schema(description = "사진 URL. 없으면 null", example = "/api/images/123e4567-e89b-12d3-a456-426614174000.jpg") String imageUrl,
        @Schema(description = "분실 또는 습득 날짜", example = "2026-10-01") LocalDate lostFoundAt,
        @Schema(description = "서버에서 생성한 등록 일시", example = "2026-10-01T09:00:00") LocalDateTime createdAt,
        @Schema(description = "작성자 이름", example = "홍길동") String userName,
        @Schema(description = "작성자 전화번호. 없으면 null", example = "010-1234-5678", nullable = true) String userPhone
) {
    public static ItemDetailResponse from(Item item, Member writer) {
        return new ItemDetailResponse(item.getId(), item.getUserId(), item.getType(), item.getName(),
                item.getDescription(), item.getStatus(), item.getLocation(), item.getStorageLocation(),
                item.getImageUrl(), item.getLostFoundAt(), item.getCreatedAt(),
                writer == null ? null : writer.getName(), writer == null ? null : writer.getPhone());
    }
}
