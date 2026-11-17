package org.example.winefinder.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

// @Scheduled 작업(연결되지 않은 사진 자동 삭제)을 켭니다.
@Configuration
@EnableScheduling
public class SchedulingConfig {}
