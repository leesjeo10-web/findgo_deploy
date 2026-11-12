package org.example.winefinder.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "회원 인증", description = "로그인, 내 정보")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor // 생성자 자동 생성 (final 붙여진거)
public class AuthController {
    private final AuthService auth;

    @Schema(description = "로그인 입력 정보")
    public record LoginRequest(
            @Schema(description = "로그인 아이디. 학생은 숫자 6자리, 관리자는 admin", example = "261109", requiredMode = Schema.RequiredMode.REQUIRED)
            @NotBlank(message = "아이디를 입력해주세요.") String loginId,
            @Schema(description = "비밀번호", example = "example-password", accessMode = Schema.AccessMode.WRITE_ONLY, requiredMode = Schema.RequiredMode.REQUIRED)
            @NotEmpty(message = "비밀번호를 입력해주세요.") String password) {}
    /*
    NotEmpty - null,"" : X / **(" " 공백 허용 - 비밀번호는 공백을 지우지 않음)
    NotBlank - null,""," " : X / **(문자열 전용)
    */

    @Schema(description = "로그인 응답에 들어가는 회원 정보")
    public record LoginUser(
            @Schema(description = "회원 ID", example = "1") Long id,
            @Schema(description = "로그인 아이디", example = "261109") String loginId,
            @Schema(description = "이름", example = "홍길동") String name,
            @Schema(description = "역할: STUDENT=학생, ADMIN=관리자", example = "STUDENT") Role role,
            @Schema(description = "true면 비밀번호 변경 화면으로 보내야 합니다", example = "true") boolean mustChangePassword) {
        static LoginUser from(Member m) {
            return new LoginUser(m.getId(), m.getLoginId(), m.getName(), m.getRole(), m.isMustChangePassword());
        }
    }

    @Schema(description = "로그인 결과")
    public record LoginResponse(
            @Schema(description = "API 호출 시 Authorization: Bearer 뒤에 붙일 토큰") String accessToken,
            @Schema(description = "토큰 종류", example = "Bearer") String tokenType,
            @Schema(description = "토큰 유효 시간(초)", example = "3600") long expiresIn,
            @Schema(description = "로그인한 회원") LoginUser user) {}

    @Operation(summary = "로그인", description = "토큰 없이 호출합니다. 아이디·비밀번호가 맞으면 accessToken을 발급합니다. "
            + "틀리면 어느 쪽이 틀렸는지 알려주지 않고 401입니다. 빈 칸은 400입니다. 로그아웃 API는 없으며 프론트엔드가 토큰을 지웁니다.")
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        Member member = auth.login(request.loginId(), request.password());
        return new LoginResponse(auth.issueToken(member), "Bearer", auth.tokenExpiresSeconds(), LoginUser.from(member));
    }

    @Operation(summary = "내 회원 정보 조회", description = "토큰이 필요합니다. 비밀번호 및 비밀번호 해시는 반환하지 않습니다. 토큰이 없거나 잘못됐으면 401입니다.")
    @GetMapping("/me")
    public MemberResponse me(@Parameter(hidden = true) Authentication authentication) {
        //@Parameter(hidden = true) - Swagger에 입력항목에서 삭제
        return MemberResponse.from(auth.current(authentication));//authentication에 맞는 회원 MemberResponse 정보 조회
    }
}
