package org.example.winefinder.auth;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "내 정보 응답. 비밀번호와 비밀번호 해시는 포함하지 않습니다.")
//프론트 응답 DTO
public record MemberResponse(
        @Schema(description = "회원 ID", example = "1") Long id,
        @Schema(description = "로그인 아이디. 학생은 숫자 4자리, 관리자는 admin", example = "1109") String loginId,
        @Schema(description = "이름", example = "홍길동") String name,
        @Schema(description = "전화번호. 없으면 null", example = "010-1234-5678") String phone,
        @Schema(description = "역할: STUDENT=학생, ADMIN=관리자", example = "STUDENT") Role role,
        @Schema(description = "true면 비밀번호를 바꿔야 하는 상태", example = "true") boolean mustChangePassword) {
    public static MemberResponse from(Member member) {
        return new MemberResponse(member.getId(), member.getLoginId(), member.getName(), member.getPhone(),
                member.getRole(), member.isMustChangePassword());
    }
}
