package org.example.winefinder.auth;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

// 앱이 시작될 때 계정을 준비합니다.
// 1) 선생님(관리자) 0000 계정이 없으면 ADMIN_INITIAL_PASSWORD로 만듭니다. 값이 없으면 경고 로그만 남깁니다.
// 2) STUDENTS_CSV에 파일 경로가 있으면 loginId,name,phone,initialPassword 형식으로 읽어 없는 아이디만 추가합니다.
//    phone은 비워도 됩니다(학생이 첫 로그인 때 입력).
@Slf4j
@Component
public class AccountInitializer implements ApplicationRunner {
    // 관리자 아이디. 숫자 4자리라 학생 아이디 형식과 같으므로 학생 추가·CSV에서는 쓸 수 없게 막습니다(예약).
    static final String ADMIN_LOGIN_ID = "0000";
    static final String ADMIN_NAME = "선생님";
    private static final String CSV_HEADER = "loginId,name,phone,initialPassword";

    private final MemberRepository members;
    private final PasswordEncoder passwords;
    private final String adminInitialPassword;
    private final String studentsCsv;

    public AccountInitializer(MemberRepository members, PasswordEncoder passwords,
                              @Value("${app.admin.initial-password:}") String adminInitialPassword,
                              @Value("${app.students-csv:}") String studentsCsv) {
        this.members = members;
        this.passwords = passwords;
        this.adminInitialPassword = adminInitialPassword;
        this.studentsCsv = studentsCsv;
    }

    @Override
    public void run(ApplicationArguments args) {
        createAdminIfMissing();
        importStudents();
    }

    void createAdminIfMissing() {
        if (members.existsByLoginId(ADMIN_LOGIN_ID)) return;
        if (adminInitialPassword == null || adminInitialPassword.isEmpty()) {
            log.warn("관리자(0000) 계정이 없지만 ADMIN_INITIAL_PASSWORD가 설정되지 않아 만들지 않았습니다.");
            return;
        }
        members.saveAndFlush(new Member(ADMIN_LOGIN_ID, ADMIN_NAME, passwords.encode(adminInitialPassword), Role.ADMIN, false));
        log.info("관리자(0000) 계정을 만들었습니다.");
    }

    void importStudents() {
        if (studentsCsv == null || studentsCsv.isBlank()) return;
        Path path = Path.of(studentsCsv.strip());
        List<String> lines;
        try {
            lines = Files.readAllLines(path, StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.warn("STUDENTS_CSV 파일을 읽지 못해 학생 등록을 건너뜁니다: {}", path);
            return;
        }
        int added = 0, skipped = 0;
        for (int i = 0; i < lines.size(); i++) {
            String line = i == 0 ? lines.get(i).replace("﻿", "") : lines.get(i); // 엑셀 UTF-8 BOM 제거
            if (line.isBlank() || (i == 0 && line.strip().equalsIgnoreCase(CSV_HEADER))) continue;
            // 비밀번호에 쉼표가 들어 있어도 되도록 네 칸까지만 나눕니다. 비밀번호는 공백을 지우지 않습니다.
            String[] cols = line.split(",", 4);
            String loginId = cols.length > 0 ? cols[0].strip() : "";
            String name = cols.length > 1 ? cols[1].strip() : "";
            String phone = null;
            boolean phoneOk = true;
            try {
                phone = AuthService.normalizePhone(cols.length > 2 ? cols[2] : "");
            } catch (ResponseStatusException e) {
                phoneOk = false;
            }
            String password = cols.length > 3 ? cols[3] : "";
            if (!loginId.matches("\\d{4}") || name.isEmpty() || name.length() > 40 || !phoneOk
                    || password.length() < 8 || password.length() > 64) {
                log.warn("STUDENTS_CSV {}번째 줄은 형식이 맞지 않아 건너뜁니다.", i + 1); // 비밀번호는 로그에 남기지 않음
                skipped++;
                continue;
            }
            if (ADMIN_LOGIN_ID.equals(loginId)) {
                log.warn("STUDENTS_CSV {}번째 줄은 관리자 아이디(0000)라 건너뜁니다.", i + 1);
                skipped++;
                continue;
            }
            if (members.existsByLoginId(loginId)) {
                skipped++;
                continue;
            }
            Member student = new Member(loginId, name, passwords.encode(password), Role.STUDENT, true);
            student.changePhone(phone);
            members.saveAndFlush(student);
            added++;
        }
        log.info("STUDENTS_CSV 학생 등록: 추가 {}명, 건너뜀 {}줄", added, skipped);
    }
}
