package org.example.winefinder.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "회원 인증", description = "로그인, 내 정보, 비밀번호·전화번호 변경")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor // 생성자 자동 생성 (final 붙여진거)
public class AuthController {
    private final AuthService auth;

    @Schema(description = "로그인 입력 정보")
    public record LoginRequest(
            @Schema(description = "로그인 아이디. 학생은 숫자 4자리, 관리자는 admin", example = "1109", requiredMode = Schema.RequiredMode.REQUIRED)
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
            @Schema(description = "로그인 아이디", example = "1109") String loginId,
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

    @Schema(description = "비밀번호 변경 입력 정보")
    public record PasswordChangeRequest(
            @Schema(description = "현재 비밀번호", example = "initial-password", accessMode = Schema.AccessMode.WRITE_ONLY, requiredMode = Schema.RequiredMode.REQUIRED) String currentPassword,
            @Schema(description = "새 비밀번호 (8~64자)", example = "new-password-1", accessMode = Schema.AccessMode.WRITE_ONLY, requiredMode = Schema.RequiredMode.REQUIRED) String newPassword) {}

    @Schema(description = "전화번호 변경 입력 정보")
    public record PhoneChangeRequest(
            @Schema(description = "휴대전화 번호(필수). 01012345678, 010-1234-5678 모두 가능. 지울 수 없습니다", example = "010-1234-5678", requiredMode = Schema.RequiredMode.REQUIRED) String phone,
            @Schema(description = "교무실 번호. 관리자는 필수, 학생은 보내도 무시합니다", example = "02-123-4567", nullable = true) String officePhone) {}

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

    @Operation(summary = "내 비밀번호 변경", description = "토큰이 필요합니다. 성공하면 204이고 mustChangePassword가 false가 됩니다. "
            + "새 비밀번호가 8~64자가 아니거나 현재 비밀번호가 틀리면 400, 관리자 계정은 403입니다.")
    @ApiResponse(responseCode = "204", description = "변경됨")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PatchMapping("/me/password")
    public void changePassword(@Parameter(hidden = true) Authentication authentication, @RequestBody PasswordChangeRequest request) {
        auth.changePassword(authentication, request.currentPassword(), request.newPassword());
    }

    @Operation(summary = "내 연락처 변경", description = "토큰이 필요합니다. 전화번호는 지울 수 없어 phone이 null이거나 빈 값이면 400 \"전화번호를 입력해주세요.\"입니다. "
            + "관리자는 officePhone(교무실 번호)도 필수입니다. 010-1234-5678 모양으로 저장하고 내 정보를 돌려줍니다. 형식이 틀리면 400입니다.")
    @PatchMapping("/me")
    public MemberResponse changePhone(@Parameter(hidden = true) Authentication authentication, @RequestBody PhoneChangeRequest request) {
        return MemberResponse.from(auth.changePhone(authentication, request.phone(), request.officePhone()));
    }
}
