# 시그니처과외 학습정보 자동 발행 지침 (예약 작업용)

월·목 오전 예약 작업이 이 문서를 그대로 따라 글 1편을 작성·게시합니다.
사이트: https://signaturetutoring.co.kr (GitHub Pages, 저장소 `dkfmaqqhh-cyber/signature-tutoring`, `main` 브랜치 푸시 → 약 1분 뒤 반영)

## 0. 준비
1. 저장소가 없으면 `add_repo`(owner `dkfmaqqhh-cyber`, repo `signature-tutoring`, access `push`)로 연결한 뒤 안내된 명령으로 clone.
2. `git pull` 로 최신 상태 맞추기.
3. 커밋 작성자: `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit ...`

## 1. 오늘 쓸 글 고르기
- `tools/blog/roadmap.json` 에서 `status`가 `todo`인 글 중 **번호가 가장 작은 1편**. (date는 계획일일 뿐, 밀려도 순서대로 발행)
- **시기 확인**: 고른 글의 `season_until`이 오늘(한국 날짜)보다 이전이면 시기가 지난 글입니다. `status`를 `skipped`로 바꾸고 다음 글을 고릅니다. (예: 수능이 끝난 뒤의 '수능 3주 전' 글)
- 시기가 맞는 글이라도 본문에 '지금 시기'를 반영합니다. 예: 시험 기간이면 이번 기말고사 기준, 방학 전이면 방학 시작 전 준비 기준으로 씁니다.
- `todo`가 하나도 없으면: 같은 형식으로 다음 12주(24편) 로드맵을 새로 만들어 `roadmap.json`에 추가·커밋하고, 그 첫 글을 작성합니다. 주제는 시기(시험·방학·새 학기·검정고시 공고), 사이트 서비스(초중고 1:1, 방문·화상, 검정고시, 영어·일본어 회화, 코딩), 이미 쓴 글과 겹치지 않는 것으로.

## 2. 사실 확인 (가장 중요)
- `need_check` 항목과, 본문에 넣을 **모든 제도·수치·일정**은 WebSearch/WebFetch 로 공식 출처에서 확인합니다.
- 우선 출처: 교육부(moe.go.kr), 시·도교육청, 한국교육과정평가원(kice.re.kr), 국가법령정보센터(law.go.kr), 학교알리미, 국가교육과정정보센터(ncic.re.kr), 시험 주관 기관 공식 사이트(JLPT 등). 언론 기사는 보조로만. **개인 블로그·카페·학원 광고 글은 출처로 쓰지 않습니다.**
- 확인하지 못한 사실은 **본문에서 빼거나** "학교·교육청 공고를 확인해 주세요"처럼 확인 방법만 안내합니다. 추정치를 사실처럼 쓰지 않습니다.
- 학교·지역마다 다른 내용은 "학교마다 다를 수 있습니다"로 구분합니다.
- 실제로 확인한 페이지만 `sources`에 넣습니다 (1~5개, https).

## 3. 글쓰기 기준 (SEO + AEO + GEO)
- 독자: 초·중·고 학부모와 학생. 존댓말, 차분한 정보성 문체.
- **광고·홍보 금지**: "최고", "1위", "보장", "무조건", 업체 자랑, 가격 할인 문구 없음. 상담 유도는 맨 아래 CTA 한 곳만.
- **가짜 후기 금지**: 실제 학생 사례·후기·성적 향상 수치를 지어내지 않습니다. 경험형 문장이 필요하면 "수업에서 자주 보는 경우는 ~입니다"처럼 일반화하고, 예시 숫자는 표나 문장에 **(예시)**로 표시합니다.
- **목표: 학부모가 궁금한 것을 검색했을 때 이 글이 노출되고, 읽은 뒤 상담 문의로 이어지는 것.**
- 키워드 배치 (`keywords[0]`=주 키워드, 나머지=보조 키워드):
  - 주 키워드: 제목 앞쪽, description, lead 첫 문장, h2 1곳, FAQ 1곳에 **자연스럽게** 넣습니다. 같은 단어를 억지로 반복하지 않습니다(본문 전체 4~6회 정도).
  - 보조 키워드: 각각 h2 또는 본문 문단에 1~2회. `keywords` 배열(구조화데이터)에는 4~6개 모두 넣습니다.
  - `keywords`는 네이버 키워드도구 표기(띄어쓰기 없음)입니다. 글에서는 자연스럽게 띄어 씁니다(예: 중학교기말고사 → 중학교 기말고사). `search_volume`(월간 검색수)이 큰 키워드를 제목·소제목에 우선 배치합니다.
  - `parent_questions`는 학부모가 실제로 검색하는 질문입니다. 문장을 거의 그대로 h2 또는 FAQ 질문으로 씁니다.
  - 검색 결과에서 눌러 보고 싶게: 제목에 숫자·대상·시기(예: '중학생', '4주', '겨울방학')를 넣습니다. 과장·낚시 제목은 쓰지 않습니다.
- 제목: 45자 이하. 로드맵 제목을 다듬어도 됨.
- description: 60~160자, 주 키워드 포함, 글에서 무엇을 알 수 있는지.
- lead(도입문): 2~3문장으로 질문에 바로 답하는 요약. 핵심어는 `<strong>`.
- 본문 소제목(h2) 5~7개, 가능하면 **질문형**("~은 무엇인가요?", "~은 언제 필요할까요?").
- **각 h2 바로 다음 첫 문단은 1~2문장으로 결론부터** (AI 검색·답변 노출용). 그 뒤에 설명·표·목록.
- 표 1개 이상(비교·정리), 체크리스트나 단계 목록 1개 이상.
- 본문 분량: 공백 제외 2,500자 이상 (보통 3,000~4,500자).
- 용어는 처음 나올 때 한 문장으로 정의.
- 내부 링크 2개 이상: 관련 학습정보 글(`info/*.html`, 같은 폴더라 `파일명.html`)과 서비스 페이지(`../grade/elementary.html`, `../grade/middle.html`, `../grade/high.html`, `../subject/math.html`, `../subject/english.html`, `../subject/korean.html`, `../subject/science.html`, `../tutoring/visit.html`, `../tutoring/online.html`, `../ged/index.html`, `../conversation/index.html`, `../coding/index.html`) 중 자연스러운 곳.
- FAQ 4~6개: 실제 검색할 법한 질문, 답은 2~4문장 평문(HTML 태그 없이).
- 마지막에 1:1 수업 언급이 필요하면 "1:1 수업에서는 일반적으로 ~하는 방식으로 진행하는 경우가 많습니다" 수준으로 한 문장만.

### 본문 HTML에서 쓸 수 있는 요소 (기존 디자인과 동일)
```html
<p>문단</p>  <h3>작은 제목</h3>  <ul><li>…</li></ul>  <ol><li>…</li></ol>
<ol class="post-check"><li><strong>항목</strong> — 설명</li></ol>        <!-- 번호 원 강조 목록 -->
<div class="post-table-wrap"><table class="post-table">
  <thead><tr><th scope="col">…</th></tr></thead>
  <tbody><tr><th scope="row">…</th><td>…</td></tr></tbody>
</table></div>
<div class="post-related-grid">
  <a class="post-related-card" href="../grade/middle.html"><span class="post-related-cat">학년별 과외</span><strong>중학생과외 안내</strong></a>
</div>
```
`<h2>`는 `sections`에서 자동 생성되므로 `html` 안에 쓰지 않습니다. 이미지·스크립트·인라인 style 금지.

## 4. 글 내용 파일 작성: `tools/blog/posts/<slug>.json`
```json
{
  "no": 1,
  "slug": "final-exam-middle-math",
  "title": "…",
  "description": "…",
  "category": "내신 관리 · 중등 수학",
  "keywords": ["주 키워드", "보조1", "보조2"],
  "lead": "도입문 (HTML 가능: <strong>)",
  "cover_alt": "대표 이미지 설명",
  "summary": ["핵심 1 (HTML 가능)", "핵심 2", "핵심 3"],
  "sections": [{"id": "영문-소문자-하이픈", "h2": "질문형 소제목", "html": "<p>…</p>"}],
  "faq": [{"q": "질문", "a": "평문 답변"}],
  "sources": [{"org": "교육부", "title": "자료/페이지 제목", "url": "https://…"}],
  "disclaimer": "이 글은 일반적인 참고 정보이며 … 학교 안내를 확인해 주세요.",
  "cta_title": "글 주제에 맞는 한 줄 (예: 기말 수학, 어디서부터 보완할지 막막하다면)",
  "cta_text": "학년과 과목, 현재 상황을 남겨주시면 상담 내용을 확인해 안내드립니다.",
  "related": ["기존-글-slug-1", "기존-글-slug-2"],
  "card_summary": "목록 카드에 보일 1문장 (40~60자)",
  "cover": { "palette": "로드맵 palette", "badge": "분류 · 세부", "title": "줄바꿈은 \\n, 강조는 *별표*", "keys": ["키워드칩1", "키워드칩2"], "cardTitle": "…", "cardTag": "예시", "cardType": "rows | checks | steps | compare", "items": [], "lens": false }
}
```
- `cover` 형식은 `tools/cover/covers.json`의 `_설명`과 기존 항목을 참고 (제목 3줄 이내, 한 줄 10자 안팎).
- `related`는 실제 있는 `info/*.html` 중 주제가 가까운 2개.

## 5. 생성·검사
```bash
python3 tools/blog/build.py tools/blog/posts/<slug>.json
```
- 글 HTML, 대표 이미지(webp·jpg), 학습정보 목록, sitemap, 로드맵 상태가 한 번에 반영됩니다.
- "검사 실패"가 나오면 JSON을 고쳐 다시 실행 (통과할 때까지 푸시 금지).
- 화면 확인: Playwright(Chromium `/opt/pw-browsers/...`)로 `info/<slug>.html`을 모바일(390px)과 PC(1280px) 전체 화면 캡처해 직접 보고, 글자 넘침·표 깨짐·이미지 누락이 없는지 확인. 대표 이미지(`images/info/<slug>.jpg`)도 열어서 글자가 잘리지 않는지 확인.

## 6. 게시
```bash
git add info/<slug>.html images/info/<slug>.* tools/ learning/index.html sitemap.xml
git commit -m "content: 학습정보 새 글 - <제목> (자동 발행 <번호>번)" -m "<트레일러>"
git push origin main
```
- 푸시 거절 시 `git pull --rebase` 후 다시 푸시. 충돌이 이 글과 무관한 파일이면 원격 내용을 우선.
- 약 1~2분 뒤 `https://signaturetutoring.co.kr/info/<slug>.html` 이 열리는지 WebFetch로 확인.

## 7. 완료 보고 (사용자에게 한국어로)
- 글 제목, 주소, 주 키워드, 확인한 출처, 확인 못 해 뺀 내용(있다면).
- "네이버 서치어드바이저 → 웹페이지 수집 요청에 주소를 넣으면 반영이 빨라질 수 있습니다" 한 줄.
- 실패했다면 어느 단계에서 왜 멈췄는지와, 푸시하지 않았다는 사실.
