package org.example.winefinder.auth;

import jakarta.persistence.*;
import lombok.*;
//회원정보 entity
@Entity
@Table(name = "members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 기본 생성자 - 값 조회 객체 생성 **(PROTECTED - 외부에서 사용 X )
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) //자동 증가
    private Long id;
    @Column(nullable = false, unique = true, length = 254)
    private String email;
    @Column(nullable = false, length = 40)
    private String name;
    @Column(nullable = false)
    private String passwordHash;

    public Member(String email, String name, String passwordHash) { // 회원 객체 생성
        this.email = email;
        this.name = name;
        this.passwordHash = passwordHash;
    }
}
