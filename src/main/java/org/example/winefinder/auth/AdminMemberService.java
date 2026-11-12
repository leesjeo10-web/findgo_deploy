package org.example.winefinder.auth;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

// 선생님(관리자)의 학생 계정 관리
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminMemberService {
    static final String DUPLICATE_LOGIN_ID = "이미 등록된 아이디입니다.";

    private final MemberRepository members;
    private final PasswordEncoder passwords;

    // 학생 목록. 관리자 계정은 빼고 아이디 순으로 돌려줍니다.
    public List<Member> students() {
        return members.findByRoleOrderByLoginIdAsc(Role.STUDENT);
    }

    // 학생 추가. 아이디·이름은 앞뒤 공백을 지우고, 비밀번호는 그대로 씁니다.
    // 처음 로그인하면 비밀번호를 바꾸도록 mustChangePassword=true로 만듭니다.
    @Transactional
    public Member addStudent(String loginId, String name, String password) {
        String id = loginId == null ? "" : loginId.strip();
        String trimmedName = name == null ? "" : name.strip();
        if (id.isEmpty()) throw badRequest("아이디를 입력해주세요.");
        if (!id.matches("\\d{4}")) throw badRequest("아이디는 숫자 4자리로 입력해주세요.");
        if (trimmedName.isEmpty()) throw badRequest("이름을 입력해주세요.");
        if (trimmedName.length() > 40) throw badRequest("이름은 40자 이하로 입력해주세요.");
        if (password == null || password.isEmpty()) throw badRequest("비밀번호를 입력해주세요.");
        if (password.length() < 8 || password.length() > 64) throw badRequest("비밀번호는 8~64자로 입력해주세요.");
        if (members.existsByLoginId(id)) throw duplicate();
        try {
            return members.saveAndFlush(new Member(id, trimmedName, passwords.encode(password), Role.STUDENT, true));
        } catch (DataIntegrityViolationException e) { // 동시에 같은 아이디를 추가한 경우
            throw duplicate();
        }
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
    private static ResponseStatusException duplicate() {
        return new ResponseStatusException(HttpStatus.CONFLICT, DUPLICATE_LOGIN_ID);
    }
}
