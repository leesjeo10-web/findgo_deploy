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

    // 내 비밀번호 변경. 관리자 계정은 화면에서 바꿀 수 없습니다(403).
    // 새 비밀번호 길이 → 현재 비밀번호 순서로 확인합니다. 비밀번호는 공백을 지우지 않습니다.
    @Transactional
    public void changePassword(Authentication authentication, String currentPassword, String newPassword) {
        Member member = current(authentication);
        if (member.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 계정의 비밀번호는 화면에서 변경할 수 없습니다.");
        }
        if (newPassword == null || newPassword.length() < 8 || newPassword.length() > 64) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호는 8~64자로 입력해주세요.");
        }
        if (currentPassword == null || !passwords.matches(currentPassword, member.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "현재 비밀번호가 올바르지 않습니다.");
        }
        member.changePassword(passwords.encode(newPassword));
    }

    // 내 연락처 변경. 전화번호는 지울 수 없고 바꾸기만 합니다(물품이 찾는 중이든 해결 완료든 같음).
    // 관리자는 교무실 번호도 함께 필수로 바꿉니다. 학생이 보낸 officePhone은 무시합니다.
    @Transactional
    public Member changePhone(Authentication authentication, String phone, String officePhone) {
        Member member = current(authentication);
        String normalized = normalizePhone(phone);
        if (normalized == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PHONE_REQUIRED);
        if (member.isAdmin()) {
            String office = normalizeOfficePhone(officePhone);
            if (office == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "교무실 번호를 입력해주세요.");
            member.changeOfficePhone(office);
        }
        member.changePhone(normalized);
        return member;
    }

    static final String PHONE_REQUIRED = "전화번호를 입력해주세요.";

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

    // 교무실(일반 전화) 번호: 02-123-4567, 031-1234-5678 모양으로 맞춥니다. 비어 있으면 null
    public static String normalizeOfficePhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        String digits = phone.replaceAll("\\D", "");
        int area;
        if (digits.matches("02\\d{7,8}")) area = 2;
        else if (digits.matches("0(3[1-3]|4[1-4]|5[1-5]|6[1-4]|70)\\d{7,8}")) area = 3;
        else throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "교무실 번호 형식을 확인해 주세요.");
        int mid = digits.length() - 4;
        return digits.substring(0, area) + "-" + digits.substring(area, mid) + "-" + digits.substring(mid);
    }
}
