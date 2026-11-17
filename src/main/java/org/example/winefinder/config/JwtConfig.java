package org.example.winefinder.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;

// JWT(HS256) 발급·검증 도구 등록. 비밀키는 환경 변수 JWT_SECRET(app.jwt.secret)에서만 읽습니다.
@Configuration
public class JwtConfig {
    // 만료된 토큰을 구분하기 위한 오류 설명. SecurityConfig가 401 문구를 고를 때 사용합니다.
    public static final String EXPIRED = "token_expired";

    private final SecretKey key;

    public JwtConfig(@Value("${app.jwt.secret:}") String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET 환경 변수에 32바이트 이상의 비밀키를 설정하세요.");
        }
        this.key = new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }

    @Bean
    JwtDecoder jwtDecoder() {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        // 만료 검사: 만료 시각이 지나면 EXPIRED 설명을 담아 실패시킵니다. (서명이 틀린 토큰은 이 단계 전에 실패)
        decoder.setJwtValidator(jwt -> {
            Instant expiresAt = jwt.getExpiresAt();
            if (expiresAt == null) {
                return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "exp 없음", null));
            }
            if (!Instant.now().isBefore(expiresAt)) {
                return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", EXPIRED, null));
            }
            return OAuth2TokenValidatorResult.success();
        });
        return decoder;
    }
}
