package org.example.winefinder.config;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtValidationException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;

@Configuration
public class SecurityConfig {
    public static final String LOGIN_REQUIRED = "로그인이 필요한 기능입니다.";
    public static final String LOGIN_EXPIRED = "로그인이 만료되었습니다. 다시 로그인해주세요.";
    public static final String ADMIN_ONLY = "관리자만 사용할 수 있는 기능입니다.";

    @Bean // <- Spring Securit 객체가 사용할 수 있도록 설정
    //비밀번호 검사 도구 등록
    //PBKDF2 방식으로 해시 처리, 로그인할 때 입력한 비밀번호가 맞는지 검사
    PasswordEncoder passwordEncoder() {
        // PBKDF2는 긴 UTF-8 비밀번호도 잘리지 않으며 사용자마다 무작위 salt를 사용합니다.
        return new org.springframework.security.crypto.password.DelegatingPasswordEncoder("pbkdf2@SpringSecurity_v5_8",
                java.util.Map.of("pbkdf2@SpringSecurity_v5_8",
                        org.springframework.security.crypto.password.Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8()));
    }

    @Bean
    //요청별 보안 규칙. 세션·CSRF 없이 Authorization: Bearer {토큰}으로만 인증합니다.
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // 401: 토큰 없음·잘못된 토큰 / 만료된 토큰 문구를 나눕니다.
        AuthenticationEntryPoint unauthorized = (req, res, ex) ->
                write(res, 401, isExpired(ex) ? LOGIN_EXPIRED : LOGIN_REQUIRED);
        // 403: /api/admin/** 에 관리자가 아닌 회원이 접근한 경우
        AccessDeniedHandler forbidden = (req, res, ex) -> write(res, 403, ADMIN_ONLY);

        return http.cors(cors -> {})
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(r -> r
                        // 토큰 없이 쓸 수 있는 경로
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/images/*").permitAll()
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**", "/error").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(o -> o
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(roleConverter()))
                        .authenticationEntryPoint(unauthorized)
                        .accessDeniedHandler(forbidden))
                .exceptionHandling(e -> e.authenticationEntryPoint(unauthorized).accessDeniedHandler(forbidden))
                .build();
    }

    // 토큰의 role 클레임(STUDENT/ADMIN)을 ROLE_STUDENT/ROLE_ADMIN 권한으로 바꿉니다.
    private static JwtAuthenticationConverter roleConverter() {
        var authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("role");
        authorities.setAuthorityPrefix("ROLE_");
        var converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }

    // JwtConfig의 만료 검사가 실패시킨 경우인지 원인을 따라가며 확인합니다.
    private static boolean isExpired(Throwable error) {
        for (Throwable e = error; e != null; e = e.getCause()) {
            if (e instanceof JwtValidationException invalid && invalid.getErrors().stream()
                    .anyMatch(err -> JwtConfig.EXPIRED.equals(err.getDescription()))) {
                return true;
            }
        }
        return false;
    }

    private static void write(HttpServletResponse res, int status, String message) throws IOException {
        res.setStatus(status);
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
