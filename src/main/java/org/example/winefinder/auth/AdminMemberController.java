package org.example.winefinder.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// /api/admin/** 는 SecurityConfig에서 ADMIN만 들어올 수 있습니다(학생은 403).
@Tag(name = "관리자 - 학생 관리", description = "선생님(관리자)만 사용합니다. 학생 목록 조회와 학생 추가")
@RestController
@RequestMapping("/api/admin/members")
@RequiredArgsConstructor
public class AdminMemberController {
    private final AdminMemberService admin;

    @Schema(description = "학생 정보")
    public record StudentResponse(
            @Schema(description = "회원 ID", example = "1") Long id,
            @Schema(description = "로그인 아이디(숫자 4자리 학번)", example = "1109") String loginId,
            @Schema(description = "이름", example = "김민수") String name) {
        static StudentResponse from(Member m) { return new StudentResponse(m.getId(), m.getLoginId(), m.getName()); }
    }

    @Schema(description = "학생 추가 입력 정보")
    public record StudentCreateRequest(
            @Schema(description = "로그인 아이디. 숫자 4자리 학번(예: 1109 = 1학년 1반 9번)", example = "1109", requiredMode = Schema.RequiredMode.REQUIRED) String loginId,
            @Schema(description = "이름. 40자 이하", example = "김민수", requiredMode = Schema.RequiredMode.REQUIRED) String name,
            @Schema(description = "휴대전화 번호(선택). 비우면 학생이 첫 로그인 때 입력합니다", example = "010-1234-5678", nullable = true) String phone,
            @Schema(description = "초기 비밀번호. 8~64자", example = "initial-password", accessMode = Schema.AccessMode.WRITE_ONLY, requiredMode = Schema.RequiredMode.REQUIRED) String password) {}

    @Operation(summary = "학생 목록 조회", description = "관리자 토큰이 필요합니다. 관리자 계정은 빼고 아이디 순으로 반환합니다. 학생 토큰은 403입니다.")
    @GetMapping
    public List<StudentResponse> students() {
        return admin.students().stream().map(StudentResponse::from).toList();
    }

    @Operation(summary = "학생 추가", description = "관리자 토큰이 필요합니다. 성공하면 201이고, 학생은 첫 로그인 후 비밀번호를 바꿔야 합니다(mustChangePassword=true). "
            + "아이디가 숫자 4자리가 아니면 400 \"아이디는 숫자 4자리로 입력해주세요.\", 이미 있는 아이디면 409입니다.")
    @PostMapping
    public ResponseEntity<StudentResponse> addStudent(@RequestBody StudentCreateRequest request) {
        var student = StudentResponse.from(admin.addStudent(request.loginId(), request.name(), request.phone(), request.password()));
        return ResponseEntity.created(URI.create("/api/admin/members/" + student.id())).body(student);
    }
}
