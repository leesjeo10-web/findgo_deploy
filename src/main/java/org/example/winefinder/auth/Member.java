package org.example.winefinder.auth;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

//회원정보 entity
@Entity
@Table(name = "members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 기본 생성자 - 값 조회 객체 생성 **(PROTECTED - 외부에서 사용 X )
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) //자동 증가
    private Long id;

    // 로그인 아이디. 학생은 숫자 4자리(예: 1109), 관리자는 admin. 만든 뒤 바꾸지 않습니다.
    @Column(nullable = false, unique = true, length = 20, updatable = false)
    private String loginId;

    // 이름. 만든 뒤 바꾸지 않습니다.
    @Column(nullable = false, length = 40, updatable = false)
    private String name;

    @Column(nullable = false)
    private String passwordHash;

    // 전화번호 (선택, 010-0000-0000 형식). 없으면 null
    // 학생은 필수(첫 로그인 때 입력할 수 있음), 한 번 넣으면 지울 수 없고 바꾸기만 합니다.
    @Column(length = 13)
    private String phone;

    // 교무실 번호 (관리자만, 02-000-0000 / 031-000-0000 형식). 학생은 null
    @Column(length = 13)
    private String officePhone;

    // STUDENT / ADMIN. 기존 행이 있는 테이블에 컬럼이 추가될 때를 위해 DB 기본값도 둡니다.
    @Enumerated(EnumType.STRING)
    @ColumnDefault("'STUDENT'")
    @Column(nullable = false, length = 10)
    private Role role = Role.STUDENT;

    // true면 프론트엔드가 비밀번호 변경 화면으로 보냅니다. 서버는 다른 API를 막지 않습니다.
    @ColumnDefault("true")
    @Column(nullable = false)
    private boolean mustChangePassword = true;

    public Member(String loginId, String name, String passwordHash, Role role, boolean mustChangePassword) { // 회원 객체 생성
        this.loginId = loginId;
        this.name = name;
        this.passwordHash = passwordHash;
        this.role = role;
        this.mustChangePassword = mustChangePassword;
    }

    public boolean isAdmin() { return role == Role.ADMIN; }

    // 비밀번호를 바꾸면 더 이상 변경 화면으로 보내지 않습니다.
    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
        this.mustChangePassword = false;
    }

    public void changePhone(String phone) { this.phone = phone; }

    public void changeOfficePhone(String officePhone) { this.officePhone = officePhone; }
}
