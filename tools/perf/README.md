# tools/perf — 글꼴 지연 로드 블록 (446·448·449차)

Pretendard 글꼴 CSS(jsdelivr)를 `<link rel="stylesheet">`로 바로 불러오면 첫 화면 표시가 글꼴을 기다립니다.
메인 `index.html`의 [278·279차] 방식(첫 화면을 먼저 그린 뒤 글꼴을 불러와 한 번에 전환)을 같은 구조의 페이지에 넣는 도구입니다.

## 파일
- `font-defer.mjs` — 대상 분류·적용. 인자 없이 실행하면 점검만 하고, `--apply`일 때만 파일을 바꿉니다.
  이미 블록이 있는 파일은 '기적용'으로 건너뛰므로 여러 번 실행해도 블록이 늘지 않습니다. `--json 파일`로 분류 결과를 저장합니다.
- `verify-font-defer.mjs [기준 커밋]` — 적용 뒤 점검(파일 수정 없음). 바뀐 HTML이 모두 대상 그룹인지,
  블록을 원래 한 줄로 되돌리면 기준 커밋 원본과 같은지(블록 외 변경 0), 동기 링크·noscript·선택자·태그 짝을 확인합니다.
  Windows에서 git이 PATH에 없으면 `GIT` 환경변수로 git.exe 경로를 지정합니다.

## 대상 그룹 (구조 조건이 모두 맞아야 적용)
| 그룹 | 경로 | body class | CSS | 대표(측정) |
|---|---|---|---|---|
| area-subject-math | `area/{시도}/{구}/math/` (세종 `area/sejong/math/` 포함) | `page-area page-region page-subarea page-subject gu-v2` | `style.css?v=168` | 울산 남구 수학 (448차) |
| area-grade-middle | `area/{시도}/{구}/middle/` (세종 포함) | `… gu-v2 vz297` | `style.css?v=301` | 울산 남구 중학생 (448차) |

공통 조건: `<header class="sig-header">`, `<section class="ar-hero rg-hero rg-hero-solid"`, `<nav class="sig-float`, 동기 글꼴 링크 정확히 1개.
첫 화면 글꼴 대상 선택자: `header`, `.rg-hero`, `.sig-float`.

449차 제외(구조 다름): `area/seoul/gwangjin/math/`·`middle/`(gu-v2 없음), `area/seoul/seongbuk/math/`(style.css?v=155).
강남 학년×과목 구버전(`area/seoul/gangnam/{학년}/math/`, noindex)은 경로 조건에서 빠집니다.

## 새 그룹을 추가할 때
1. 그 템플릿 대표 페이지 1개를 수정 전·후 같은 조건으로 Lighthouse 모바일 측정(448차 방식)하고, 글꼴이 실제로 첫 화면을 막는지 확인합니다.
2. 1280·768·390·320 화면에서 최종 배치가 수정 전과 같은지, 글꼴 차단 시 본문·상담 링크가 보이는지 확인합니다.
3. 확인된 뒤에만 `GROUPS`에 조건을 추가하고 첫 화면 선택자가 다르면 블록을 그 그룹용으로 나눕니다.

## 생성 도구와의 관계
지역 페이지 생성기는 저장소에 없습니다(작업 당시 임시 폴더에서만 사용). 나중에 생성기로 지역 페이지를 다시 만들면 이 블록이 빠지므로,
재생성 뒤 `node tools/perf/font-defer.mjs --apply`를 다시 실행하거나 생성 템플릿의 글꼴 링크를 이 블록으로 바꿔 주세요.
