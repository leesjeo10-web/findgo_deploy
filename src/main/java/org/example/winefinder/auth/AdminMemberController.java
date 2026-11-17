package org.example.winefinder.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// /api/admin/** 는 SecurityConfig에서 ADMIN만 들어올 수 있습니다(학생은 403).
@Tag(name = "관리자 - 학생 관리", description = "선생님(관리자)만 사용합니다. 학생 목록·추가·비밀번호 초기화·삭제")
@RestController
@RequestMapping("/api/admin/members")
@RequiredArgsConstructor
public class AdminMemberController {
    private final AdminMemberService admin;

    @Schema(description = "학생 정보. 비밀번호는 포함하지 않습니다.")
    public record StudentResponse(
            @Schema(description = "회원 ID", example = "1") Long id,
            @Schema(description = "로그인 아이디(숫자 4자리 학번)", example = "1109") String loginId,
            @Schema(description = "이름", example = "김민수") String name,
            @Schema(description = "휴대전화 번호. 아직 입력하지 않았으면 null", example = "010-1234-5678", nullable = true) String phone,
            @Schema(description = "true면 아직 비밀번호를 바꾸지 않은 상태(첫 로그인 전 또는 초기화 후)", example = "true") boolean mustChangePassword,
            @Schema(description = "계정을 만든 일시. 예전에 만든 계정은 null일 수 있음", example = "2026-11-17T09:00:00", nullable = true) LocalDateTime createdAt,
            @Schema(description = "이 학생이 등록한 물품 수", example = "2") long itemCount) {
        static StudentResponse from(Member m, long itemCount) {
            return new StudentResponse(m.getId(), m.getLoginId(), m.getName(), m.getPhone(), m.isMustChangePassword(), m.getCreatedAt(), itemCount);
        }
    }

    @Schema(description = "학생 추가 입력 정보")
    public record StudentCreateRequest(
            @Schema(description = "로그인 아이디. 숫자 4자리 학번(예: 1109 = 1학년 1반 9번)", example = "1109", requiredMode = Schema.RequiredMode.REQUIRED) String loginId,
            @Schema(description = "이름. 40자 이하", example = "김민수", requiredMode = Schema.RequiredMode.REQUIRED) String name,
            @Schema(description = "휴대전화 번호(선택). 비우면 학생이 첫 로그인 때 입력합니다", example = "010-1234-5678", nullable = true) String phone,
            @Schema(description = "초기 비밀번호. 8~64자", example = "initial-password", accessMode = Schema.AccessMode.WRITE_ONLY, requiredMode = Schema.RequiredMode.REQUIRED) String password) {}

    @Operation(summary = "학생 목록 조회", description = "관리자 토큰이 필요합니다. 관리자 계정은 빼고 아이디 순으로 반환합니다. 전화번호·비밀번호 변경 필요 여부·등록일·등록한 물품 수를 함께 줍니다. 학생 토큰은 403입니다.")
    @GetMapping
    public List<StudentResponse> students() {
        Map<Long, Long> counts = admin.itemCountsByMember();
        return admin.students().stream().map(m -> StudentResponse.from(m, counts.getOrDefault(m.getId(), 0L))).toList();
    }

    @Operation(summary = "학생 추가", description = "관리자 토큰이 필요합니다. 성공하면 201이고, 학생은 첫 로그인 후 비밀번호를 바꿔야 합니다(mustChangePassword=true). "
            + "아이디가 숫자 4자리가 아니면 400 \"아이디는 숫자 4자리로 입력해주세요.\", 이미 있는 아이디면 409입니다.")
    @PostMapping
    public ResponseEntity<StudentResponse> addStudent(@RequestBody StudentCreateRequest request) {
        var student = StudentResponse.from(admin.addStudent(request.loginId(), request.name(), request.phone(), request.password()), 0);
        return ResponseEntity.created(URI.create("/api/admin/members/" + student.id())).body(student);
    }

    @Schema(description = "비밀번호 초기화 입력 정보")
    public record PasswordResetRequest(
            @Schema(description = "새 초기 비밀번호. 8~64자", example = "reset-password", accessMode = Schema.AccessMode.WRITE_ONLY, requiredMode = Schema.RequiredMode.REQUIRED) String password) {}

    @Operation(summary = "학생 비밀번호 초기화", description = "관리자 토큰이 필요합니다. 성공하면 204이고 학생은 다음 로그인 후 비밀번호를 바꿔야 합니다(mustChangePassword=true). "
            + "대상이 관리자 계정이면 403, 없는 회원이면 404입니다. 이미 발급된 토큰은 만료될 때까지 쓸 수 있습니다.")
    @ApiResponse(responseCode = "204", description = "초기화됨")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PatchMapping("/{id}/password")
    public void resetPassword(@PathVariable @Parameter(description = "회원 ID", example = "1") Long id, @RequestBody PasswordResetRequest request) {
        admin.resetPassword(id, request.password());
    }

    @Operation(summary = "학생 삭제", description = "관리자 토큰이 필요합니다. 학생이 등록한 물품과 사진도 함께 지웁니다. 성공하면 204입니다. "
            + "대상이 관리자 계정이면 403 \"관리자 계정은 삭제할 수 없습니다.\", 없는 회원이면 404입니다.")
    @ApiResponse(responseCode = "204", description = "삭제됨")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    public void deleteStudent(@PathVariable @Parameter(description = "회원 ID", example = "1") Long id) {
        admin.deleteStudent(id);
    }
}
