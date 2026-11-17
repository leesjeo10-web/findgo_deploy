package org.example.winefinder.common;

import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.example.winefinder.image.ImageService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

// 모든 오류 응답을 {"message": "..."} 형식으로 맞춥니다.
// Bean Validation 오류만 {"message": "입력값을 확인해 주세요.", "errors": ["필드: 문구"]} 형식입니다.
@Slf4j
@RestControllerAdvice
public class ApiExceptionHandler {
    static final String INVALID_INPUT = "입력값을 확인해 주세요.";

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> status(ResponseStatusException error) {
        return message(error.getStatusCode(), error.getReason() == null ? "요청을 처리할 수 없습니다." : error.getReason());
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException error) {
        var fields = error.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage()).toList();
        return ResponseEntity.badRequest().body(Map.of("message", INVALID_INPUT, "errors", fields));
    }
    // 깨진 JSON, 잘못된 enum 값(type=UNKNOWN 등), 빠진 쿼리·파일 파라미터
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class, MissingServletRequestPartException.class})
    ResponseEntity<?> badInput() {
        return message(HttpStatus.BAD_REQUEST, INVALID_INPUT);
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<?> conflict() {
        return message(HttpStatus.CONFLICT, "중복되거나 다른 데이터와 충돌하는 요청입니다.");
    }
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<?> uploadSize() {
        return message(HttpStatusCode.valueOf(413), ImageService.FORMAT_OR_SIZE);
    }
    // multipart가 아닌 요청 등으로 사진을 읽지 못한 경우
    @ExceptionHandler(MultipartException.class)
    ResponseEntity<?> multipart() {
        return message(HttpStatus.BAD_REQUEST, ImageService.PROCESS_FAILED);
    }
    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<?> noResource() {
        return message(HttpStatus.NOT_FOUND, "요청한 주소를 찾을 수 없습니다.");
    }
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<?> method() {
        return message(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 요청 방식입니다.");
    }
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<?> mediaType() {
        return message(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "지원하지 않는 요청 형식입니다.");
    }
    // 위에서 따로 다루지 않은 오류. Spring 기본 오류(ErrorResponse)는 원래 상태 코드를 유지하고,
    // 예상하지 못한 오류는 내용은 로그에만 남기고 500으로 응답합니다.
    @ExceptionHandler(Exception.class)
    ResponseEntity<?> unexpected(Exception error) {
        if (error instanceof org.springframework.web.ErrorResponse known && !known.getStatusCode().is5xxServerError()) {
            return message(known.getStatusCode(), "요청을 처리할 수 없습니다.");
        }
        log.error("처리하지 못한 오류", error);
        return message(HttpStatus.INTERNAL_SERVER_ERROR, "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }

    private static ResponseEntity<?> message(HttpStatusCode status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}
