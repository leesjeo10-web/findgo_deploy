package org.example.winefinder.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "회원 인증", description = "회원가입, 내 정보")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor // 생성자 자동 생성 (final 붙여진거)
public class AuthController {
    private final AuthService auth;

    @Schema(description = "회원가입 입력 정보 (임시: 4단계에서 삭제)")
    public record SignupRequest(
            @Schema(description = "로그인 아이디. 숫자 6자리", example = "261109", requiredMode = Schema.RequiredMode.REQUIRED)
            @NotBlank @Pattern(regexp = "^\\s*\\d{6}\\s*$", message = "아이디는 숫자 6자리로 입력해주세요.") String loginId,
            @Schema(description = "이름. 1~40자", example = "홍길동", requiredMode = Schema.RequiredMode.REQUIRED)
            @NotBlank @Size(max = 40) String name,
            @Schema(description = "비밀번호. 8~64자", example = "example-password", accessMode = Schema.AccessMode.WRITE_ONLY, requiredMode = Schema.RequiredMode.REQUIRED)
            @NotNull @Size(min = 8, max = 64) String password) {}
    /*
    NotNull - null : X / **( ""," " 빈 문자열 허용)
    NotBlank - null,""," " : X / **(문자열 전용)
    */
    // 회원가입
    @Operation(summary = "회원가입", description = "임시 API(4단계에서 삭제). 아이디·이름·비밀번호로 학생 계정을 만듭니다. 중복 아이디는 409입니다.")
    @PostMapping("/signup") //
    @ResponseStatus(HttpStatus.CREATED) //가입 성공 시 create 상태코드 전송 (201)
    public MemberResponse signup(@Valid @RequestBody SignupRequest request) {
        //Valid - DTO 조건 검사
        //SignupRequest - 프론트 회원가입 정보 DTO
        return auth.signup(request.loginId(), request.name(), request.password()); // 서비스에 정보 전달 - 회원가입
    }


    @Operation(summary = "내 회원 정보 조회", description = "로그인 세션이 필요합니다. 비밀번호 및 비밀번호 해시는 반환하지 않습니다. 로그인하지 않았으면 401입니다.")
    @GetMapping("/me")
    public MemberResponse me(@Parameter(hidden = true) Authentication authentication) {
        //@Parameter(hidden = true) - Swagger에 입력항목에서 삭제
        return MemberResponse.from(auth.current(authentication));//authentication에 맞는 회원 MemberResponse 정보 조회
    }
}
