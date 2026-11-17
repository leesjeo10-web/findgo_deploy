package org.example.winefinder.auth;

import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

// 로그인 토큰 발급. subject = 회원 id, role 클레임 = STUDENT/ADMIN
@Service
public class JwtService {
    private final JwtEncoder encoder;
    private final long expiresSeconds;

    public JwtService(JwtEncoder encoder, @Value("${app.jwt.expires-seconds:3600}") long expiresSeconds) {
        this.encoder = encoder;
        this.expiresSeconds = expiresSeconds;
    }

    public String issue(Member member) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(String.valueOf(member.getId()))
                .issuedAt(now)
                .expiresAt(now.plusSeconds(expiresSeconds))
                .claim("role", member.getRole().name())
                .build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }

    // 토큰 유효 시간(초). 로그인 응답의 expiresIn에 사용합니다.
    public long expiresSeconds() { return expiresSeconds; }
}
