# credleaf-fe

CredLeaf의 발급자 콘솔과 공개 검증 화면입니다.

## 기술 스택

- React 최신 버전 + React Compiler
- TypeScript
- Next.js App Router
- ky API client
- GitHub Actions CI

## 주요 기능

- 자격증명 템플릿 목록과 생성 화면
- 증명 발급과 폐기 화면
- QR 검증 결과 상태 UI: 유효, 만료, 폐기, 찾을 수 없음
- 감사 로그 검색, 필터, cursor pagination UI
- 빈 상태, 로딩, API 오류 상태
- 공통 ky client 기반 API 요청과 에러 처리
