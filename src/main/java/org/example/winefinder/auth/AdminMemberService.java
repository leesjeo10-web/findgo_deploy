package org.example.winefinder.auth;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.example.winefinder.image.ImageRepository;
import org.example.winefinder.image.ImageService;
import org.example.winefinder.image.ItemImage;
import org.example.winefinder.item.repository.ItemRepository;
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
    private final ItemRepository items;
    private final ImageRepository itemImages;
    private final ImageService imageFiles;

    // 회원 id별 등록한 물품 수(학생 목록에 표시)
    public Map<Long, Long> itemCountsByMember() {
        return items.countGroupByUserId().stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
    }

    // 학생 목록. 관리자 계정은 빼고 아이디 순으로 돌려줍니다.
    public List<Member> students() {
        return members.findByRoleOrderByLoginIdAsc(Role.STUDENT);
    }

    // 학생 추가. 아이디·이름은 앞뒤 공백을 지우고, 비밀번호는 그대로 씁니다.
    // 처음 로그인하면 비밀번호를 바꾸도록 mustChangePassword=true로 만듭니다.
    @Transactional
    // 전화번호는 선택입니다. 비우면 학생이 첫 로그인 때 입력합니다.
    public Member addStudent(String loginId, String name, String phone, String password) {
        String id = loginId == null ? "" : loginId.strip();
        String trimmedName = name == null ? "" : name.strip();
        if (id.isEmpty()) throw badRequest("아이디를 입력해주세요.");
        if (!id.matches("\\d{4}")) throw badRequest("아이디는 숫자 4자리로 입력해주세요.");
        if (AccountInitializer.ADMIN_LOGIN_ID.equals(id)) throw duplicate(); // 관리자 아이디(0000)는 예약
        if (trimmedName.isEmpty()) throw badRequest("이름을 입력해주세요.");
        if (trimmedName.length() > 40) throw badRequest("이름은 40자 이하로 입력해주세요.");
        if (password == null || password.isEmpty()) throw badRequest("비밀번호를 입력해주세요.");
        if (password.length() < 8 || password.length() > 64) throw badRequest("비밀번호는 8~64자로 입력해주세요.");
        String normalizedPhone = AuthService.normalizePhone(phone);
        if (members.existsByLoginId(id)) throw duplicate();
        try {
            Member student = new Member(id, trimmedName, passwords.encode(password), Role.STUDENT, true);
            student.changePhone(normalizedPhone);
            return members.saveAndFlush(student);
        } catch (DataIntegrityViolationException e) { // 동시에 같은 아이디를 추가한 경우
            throw duplicate();
        }
    }

    // 학생 비밀번호 초기화. 학생은 다음 로그인 후 비밀번호를 바꿔야 합니다(mustChangePassword=true).
    // 이미 발급된 토큰은 만료될 때까지 쓸 수 있습니다(첫 버전은 막지 않음).
    @Transactional
    public void resetPassword(Long id, String password) {
        Member student = members.findById(id).orElseThrow(AdminMemberService::studentNotFound);
        if (student.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 계정의 비밀번호는 화면에서 변경할 수 없습니다.");
        }
        if (password == null || password.isEmpty()) throw badRequest("비밀번호를 입력해주세요.");
        if (password.length() < 8 || password.length() > 64) throw badRequest("비밀번호는 8~64자로 입력해주세요.");
        student.resetPassword(passwords.encode(password));
    }

    // 학생 삭제. 그 학생의 물품·사진 기록·계정을 한 트랜잭션으로 지우고, 사진 파일은 커밋 뒤에 지웁니다.
    @Transactional
    public void deleteStudent(Long id) {
        Member student = members.findById(id).orElseThrow(AdminMemberService::studentNotFound);
        if (student.isAdmin()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 계정은 삭제할 수 없습니다.");
        List<ItemImage> images = itemImages.findByUserId(id);
        items.deleteByUserId(id);
        itemImages.deleteAllInBatch(images);
        members.delete(student);
        imageFiles.deleteFilesAfterCommit(images.stream().map(ItemImage::getFilename).toList());
    }

    private static ResponseStatusException studentNotFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 학생을 찾을 수 없습니다.");
    }
    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
    private static ResponseStatusException duplicate() {
        return new ResponseStatusException(HttpStatus.CONFLICT, DUPLICATE_LOGIN_ID);
    }
}
