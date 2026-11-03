package org.example.winefinder.auth;

import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

    @Transactional
    public MemberResponse signup(String email, String name, String password) {
        String normalized = normalizeEmail(email);
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이름을 입력해 주세요."); // HttpStatus.BAD_REQUEST - 400
        }
        if (members.existsByEmail(normalized)) { // existsByEmail - db에 해당 이메일 기록 있는지 확인
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다."); // HttpStatus.CONFLICT - 409
        }
        return MemberResponse.from(members.saveAndFlush(new Member(normalized, name.strip(), passwords.encode(password))));
        // 결과 - dto로 프론트에 반환
        // saveAndFlush - Member entity db에 저장  / passwords.encode(password) - 비밀 번호 해시 처리
    }
    // 현재 authentication에 맞는 회원 조회
    public Member current(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            //authentication.isAuthenticated() - 인증 상태 확인
            //authentication.getPrincipal() - 로그인 확인 ** (로그인O → 이메일·권한 등이 담긴 UserDetails / 로그인X -> "anonymousUser")
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."); // HttpStatus.UNAUTHORIZED - 401
        }
        return members.findByEmail(normalizeEmail(authentication.getName()))
                //findByEmail - 이메일로 DB에서 회원 조회
                //authentication.getName() - 로그인 사용자의 식별 이름 ( email )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "계정을 찾을 수 없습니다."));
    }

    public static String normalizeEmail(String email) {
        return email == null ? "" : email.strip().toLowerCase(Locale.ROOT);
        //공백제거, 형식 맞춤 처리한  email 반환
    }
}
