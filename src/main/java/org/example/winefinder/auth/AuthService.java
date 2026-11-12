package org.example.winefinder.auth;

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

    // 임시: 4단계에서 회원가입 API와 함께 삭제합니다.
    @Transactional
    public MemberResponse signup(String loginId, String name, String password) {
        String id = loginId == null ? "" : loginId.strip();
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이름을 입력해주세요."); // HttpStatus.BAD_REQUEST - 400
        }
        if (members.existsByLoginId(id)) { // existsByLoginId - db에 해당 아이디 기록 있는지 확인
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 아이디입니다."); // HttpStatus.CONFLICT - 409
        }
        return MemberResponse.from(members.saveAndFlush(new Member(id, name.strip(), passwords.encode(password), Role.STUDENT, true)));
        // saveAndFlush - Member entity db에 저장  / passwords.encode(password) - 비밀 번호 해시 처리
    }

    // 현재 authentication에 맞는 회원 조회
    public Member current(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요한 기능입니다."); // HttpStatus.UNAUTHORIZED - 401
        }
        return members.findByLoginId(authentication.getName())
                //authentication.getName() - 로그인 사용자의 아이디 (loginId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요한 기능입니다."));
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
