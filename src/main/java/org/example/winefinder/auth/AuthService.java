package org.example.winefinder.auth;

import lombok.RequiredArgsConstructor;
import org.example.winefinder.config.SecurityConfig;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {
    private final MemberRepository members;
    private final PasswordEncoder passwords;
    private final JwtService tokens;

    // 로그인: 아이디는 앞뒤 공백을 지우고, 비밀번호는 그대로 비교합니다.
    // 아이디가 없거나 비밀번호가 틀려도 같은 401 문구로 응답합니다(어느 쪽이 틀렸는지 알려주지 않음).
    public Member login(String loginId, String password) {
        return members.findByLoginId(loginId.strip())
                .filter(m -> passwords.matches(password, m.getPasswordHash())) // 입력 비밀번호와 저장된 해시 비교
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "아이디 또는 비밀번호가 올바르지 않습니다. 다시 입력해주세요."));
    }

    public String issueToken(Member member) { return tokens.issue(member); }

    public long tokenExpiresSeconds() { return tokens.expiresSeconds(); }

    // 현재 authentication에 맞는 회원 조회
    // 토큰의 subject(회원 id)로 찾습니다. 토큰은 유효해도 회원이 삭제됐으면 401입니다.
    public Member current(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw unauthorized(); // HttpStatus.UNAUTHORIZED - 401
        }
        Long id;
        try {
            id = Long.valueOf(jwt.getSubject());
        } catch (NumberFormatException e) {
            throw unauthorized();
        }
        return members.findById(id).orElseThrow(AuthService::unauthorized);
    }

    private static ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, SecurityConfig.LOGIN_REQUIRED);
    }

    // 01012345678, 010-1234-5678 어떻게 써도 010-1234-5678 모양으로 맞춰서 저장
    // 비어 있으면 null (선택 입력)
    public static String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        String digits = phone.replaceAll("\\D", ""); // 숫자만 남기기
        if (!digits.matches("01[016789]\\d{7,8}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "전화번호 형식을 확인해 주세요.");
        }
        int mid = digits.length() - 4;
        return digits.substring(0, 3) + "-" + digits.substring(3, mid) + "-" + digits.substring(mid);
    }
}
