package org.example.winefinder.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "내 정보 응답. 비밀번호와 비밀번호 해시는 포함하지 않습니다.")
//프론트 응답 DTO
public record MemberResponse(
        @Schema(description = "회원 ID", example = "1") Long id,
        @Schema(description = "로그인 아이디. 학생은 숫자 4자리, 관리자는 0000", example = "1109") String loginId,
        @Schema(description = "이름", example = "홍길동") String name,
        @Schema(description = "휴대전화 번호. 아직 입력하지 않았으면 null(프론트엔드가 입력 화면으로 보냄)", example = "010-1234-5678") String phone,
        @Schema(description = "교무실 번호. 관리자만 있고 학생은 null", example = "02-123-4567", nullable = true) String officePhone,
        @Schema(description = "역할: STUDENT=학생, ADMIN=관리자", example = "STUDENT") Role role,
        @Schema(description = "true면 비밀번호를 바꿔야 하는 상태", example = "true") boolean mustChangePassword,
        @Schema(description = "계정을 만든 일시. 예전에 만든 계정은 null일 수 있음", example = "2026-11-17T09:00:00", nullable = true) LocalDateTime createdAt) {
    public static MemberResponse from(Member member) {
        return new MemberResponse(member.getId(), member.getLoginId(), member.getName(), member.getPhone(), member.getOfficePhone(),
                member.getRole(), member.isMustChangePassword(), member.getCreatedAt());
    }
}
