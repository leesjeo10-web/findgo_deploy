package org.example.winefinder.item.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import org.example.winefinder.item.entity.ItemType;
import org.example.winefinder.item.entity.ItemStatus;

/** 전체 수정 요청. 선택 필드의 null은 기존 값을 지웁니다. */
@Schema(description = "물품 전체 수정 요청. 선택 필드를 null로 보내면 기존 값도 제거됩니다.")
public record ItemUpdateRequest(
        @Schema(description = "물품 유형: LOST=분실물, FOUND=습득물", example = "FOUND", requiredMode = Schema.RequiredMode.REQUIRED)
        ItemType type,
        @Schema(description = "물품 이름. 앞뒤 공백을 지운 뒤 1~100자입니다.", example = "검정 우산", requiredMode = Schema.RequiredMode.REQUIRED)
        String name,
        @Schema(description = "물품 특징과 설명. 앞뒤 공백을 지운 뒤 1~2000자입니다.", example = "손잡이에 파란 스티커가 있습니다.", requiredMode = Schema.RequiredMode.REQUIRED)
        String description,
        @Schema(description = "진행 상태: OPEN=찾는 중, RESOLVED=해결 완료", example = "OPEN", requiredMode = Schema.RequiredMode.REQUIRED)
        ItemStatus status,
        @Schema(description = "분실 또는 습득 장소. 앞뒤 공백을 지운 뒤 1~100자입니다.", example = "도서관", requiredMode = Schema.RequiredMode.REQUIRED)
        String location,
        @Schema(description = "습득물 보관 장소. 습득물(FOUND)은 필수, 분실물(LOST)은 보내도 저장하지 않습니다(null). 최대 100자입니다.", example = "학생회실", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        String storageLocation,
        @Schema(description = "본인이 업로드한 사진 URL 한 개(/api/images/...). 사진이 없으면 null이며 빈 문자열도 null로 저장합니다.", example = "/api/images/123e4567-e89b-12d3-a456-426614174000.jpg", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        String imageUrl,
        @Schema(description = "분실 또는 습득 날짜(YYYY-MM-DD). 오늘(Asia/Seoul) 이후 날짜는 허용하지 않습니다.", example = "2026-10-01", requiredMode = Schema.RequiredMode.REQUIRED)
        LocalDate lostFoundAt
) {}
