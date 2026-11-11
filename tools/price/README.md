# tools/price — 공개 수업료 일치 점검 (452차)

`/tutoring/#price` 표가 바뀌었는데 다른 페이지 FAQ에 예전 가격이 남는 것을 막기 위한 **읽기 전용** 점검입니다. 사이트 파일을 고치지 않습니다.

## 실행
```
node tools/price/check-price-consistency.mjs
```
- 통과: `가격 일치: 대상 N/N개 통과`, 종료 코드 0
- 불일치: `✗ 파일 — 항목: 내용` 목록, 종료 코드 1
- `--root 폴더`로 다른 사본(임시 복사본 등)을 점검할 수 있습니다.

## 무엇을 비교하나
원본 = `tutoring/index.html`의 `#price` (가격은 이 도구에 적혀 있지 않고 매번 원본 표에서 읽습니다)
- 방문과외 행의 학년별 칸(`data-label`) · 단위 `월` · 금액 · `원부터`, 표 머리글과 학년 이름 일치
- 표 아래 안내문의 `주 N회, 1회 N분, 월 N회 기준`과 표 행 설명(`주 N회 · 1회 N분`) 일치

대상 = 스크립트의 `TARGETS` (현재 `area/ulsan/nam/math/index.html`의 '남구 수학과외 비용은 어떻게 정해지나요?')
- 화면 FAQ 답변과 FAQPage JSON-LD 답변이 각각 1개이고 서로 같은지
- 두 답변 모두에 `학년 월 금액원부터`가 원본과 같은 짝으로 있는지, 원본에 없는 금액이 없는지
- `주 N회`·`1회 N분`·`월 N회`가 원본과 같은지

## 수업료를 바꿀 때 함께 확인할 곳
1. `tutoring/index.html` `#price` 표·안내문 (원본)
2. 이 점검의 대상: `area/ulsan/nam/math/index.html` 비용 FAQ (화면 + JSON-LD)
3. 이 점검에 포함되지 않은 곳 — 직접 확인: `index.html` 메인 FAQ '과외비는 어떻게 정해지나요?'(화면 + JSON-LD), `tutoring/index.html` 대문 안내 문단(442차, 초등 시작 금액·기준)
4. 내용을 바꾼 페이지는 화면 날짜·`dateModified`·`sitemap.xml` lastmod도 함께 갱신

다른 페이지에 가격을 새로 적으면 `TARGETS`에 그 파일과 질문을 추가하세요.
