# 찾Go 기획 문서

**현재 개발 상태:** [로그인 없는 프론트엔드 구현·검증 기록](frontend-implementation.md). 사용자가 로그인·토큰·실제 서버 연결을 보류하고 물품 기능 구현을 시작하도록 요청했다.

**현재 구현 준비 기준:** [2026-11-12 기획 재검토](spec-review-2026-11-12.md), [폴더·컴포넌트 구조](frontend-structure.md), [재사용 부품 19종](reusable-components.md), [최신 결정](decisions.md).

아래 1~9 문서는 이전에 가져온 기획 스냅샷이다. 새 Notion 문서 전체를 다시 내려받아 덮어쓴 결과가 아니며, 이메일·회원가입·비회원 이용 등 오래된 내용이 남아 있다. 구현 때는 위 최신 검토와 현재 Notion·백엔드 계약을 우선한다.

| 순서 | 문서 | 파일 |
| --- | --- | --- |
| 1 | 서비스 개요와 목표 | [service-overview.md](service-overview.md) |
| 2 | 대상 사용자와 문제 | [target-users.md](target-users.md) |
| 3 | 핵심 기능과 우선순위 | [features.md](features.md) |
| 4 | 사용자 이용 흐름 | [user-flow.md](user-flow.md) |
| 5 | 기능 동작과 예외 상황 | [feature-rules.md](feature-rules.md) |
| 6 | 기술 스택과 전체 구조 | [tech-stack.md](tech-stack.md) |
| 7 | API 명세서 | [api-spec.md](api-spec.md) |
| 8 | ERD와 데이터 모델 | [erd.md](erd.md) |
| 9 | 프론트엔드·백엔드 데이터 흐름 | [data-flow.md](data-flow.md) |

결정한 내용과 팀 확인이 필요한 항목은 [decisions.md](decisions.md)에 모아 둡니다.

[디자인 파일 검토](design-review.md)는 2026-11-11의 원본 분석 기록이며, 이후 정책 변경은 최신 검토에 정리했다.
