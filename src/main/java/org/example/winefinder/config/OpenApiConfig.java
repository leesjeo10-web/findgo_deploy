package org.example.winefinder.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    OpenAPI findgoOpenApi() {
        return new OpenAPI().info(new Info().title("찾GO API").version("v1")
                .description("교내 분실물·습득물 서비스. 로그인과 사진 조회를 뺀 모든 API에 "
                        + "Authorization: Bearer {accessToken} 헤더가 필요합니다."));
    }
}
