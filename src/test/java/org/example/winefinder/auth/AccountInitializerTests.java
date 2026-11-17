package org.example.winefinder.auth;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AccountInitializerTests {
    @Autowired MemberRepository members;
    @Autowired PasswordEncoder passwords;
    @TempDir Path dir;

    @BeforeEach
    void setup() { members.deleteAll(); }

    private AccountInitializer initializer(String adminPassword, String csv) {
        return new AccountInitializer(members, passwords, adminPassword, csv);
    }

    @Test
    void createsAdminOnlyWhenMissing() throws Exception {
        initializer("admin-password-1", "").run(null);
        var admin = members.findByLoginId("0000").orElseThrow();
        assertEquals(Role.ADMIN, admin.getRole());
        assertEquals("선생님", admin.getName());
        assertFalse(admin.isMustChangePassword());
        assertTrue(passwords.matches("admin-password-1", admin.getPasswordHash()));

        // 이미 있으면 다른 값이 와도 만들거나 바꾸지 않습니다.
        initializer("other-password-2", "").run(null);
        assertEquals(1, members.count());
        assertTrue(passwords.matches("admin-password-1", members.findByLoginId("0000").orElseThrow().getPasswordHash()));
    }

    @Test
    void skipsAdminWhenPasswordIsNotSet() throws Exception {
        initializer("", "").run(null);
        assertFalse(members.existsByLoginId("0000"));
    }

    @Test
    void importsOnlyNewValidStudentsFromCsv() throws Exception {
        members.saveAndFlush(new Member("1101", "기존 학생", passwords.encode("existing-pass"), Role.STUDENT, false));
        Path csv = dir.resolve("students.csv");
        Files.writeString(csv, String.join("\n",
                "﻿loginId,name,phone,initialPassword",
                "1101,덮어쓰기 시도,,new-password-1",           // 이미 있는 아이디 → 건너뜀
                " 1102 , 홍길동 , 01012345678 ,pass,word-123",  // 전화번호 정규화, 비밀번호의 쉼표 허용
                "",
                "abc1,잘못된 아이디,,password-123",             // 형식 오류 → 건너뜀
                "261105,예전 6자리,,password-123",             // 4자리가 아님 → 건너뜀
                "1103,짧은 비번,,short",                       // 8자 미만 → 건너뜀
                "1105,번호 오류,123,password-123",             // 전화번호 형식 오류 → 건너뜀
                "0000,관리자 아이디,,password-123",             // 관리자 예약 아이디 → 건너뜀
                "1104,김철수,,password-456"), StandardCharsets.UTF_8);  // 전화번호 없음 → 첫 로그인 때 입력

        initializer("", csv.toString()).run(null);

        assertEquals(3, members.count());
        var existing = members.findByLoginId("1101").orElseThrow();
        assertEquals("기존 학생", existing.getName());
        assertTrue(passwords.matches("existing-pass", existing.getPasswordHash()));

        var hong = members.findByLoginId("1102").orElseThrow();
        assertEquals("홍길동", hong.getName());
        assertEquals(Role.STUDENT, hong.getRole());
        assertTrue(hong.isMustChangePassword());
        assertTrue(passwords.matches("pass,word-123", hong.getPasswordHash()));
        assertEquals("010-1234-5678", hong.getPhone());
        assertNull(members.findByLoginId("1104").orElseThrow().getPhone());
        assertFalse(members.existsByLoginId("1105"));
        assertFalse(members.existsByLoginId("1103"));
        assertFalse(members.existsByLoginId("261105"));
        assertFalse(members.existsByLoginId("0000"));
    }

    @Test
    void doesNothingWithoutCsvPathOrWithMissingFile() throws Exception {
        initializer("", "").run(null);
        initializer("", dir.resolve("none.csv").toString()).run(null);
        assertEquals(0, members.count());
    }
}
