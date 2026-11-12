---
# GitHub Pages(Jekyll)가 이 파일을 공개 사이트(/CLAUDE.md, /CLAUDE.html)로 내보내지 않도록 막는 설정입니다. 지우지 마세요.
published: false
---

# 과외마루 홈페이지 작업 규칙 (집·회사 공통)

이 저장소는 GitHub Pages로 배포되는 정적 사이트입니다(`main` 브랜치 루트 `/` → https://signaturetutoring.co.kr).
`main`에 병합되는 순간 운영 사이트에 반영되므로, 모든 차수 작업은 아래 순서와 금지 사항을 지킵니다.

## 1. 작업 전 환경 확인 (Windows)

- **Git 실행 경로**: PATH에 `git`이 없을 수 있습니다. 먼저 `Get-Command git`을 확인하고, 없으면 GitHub Desktop에 들어 있는 git을 씁니다.
  `(Get-ChildItem "$env:LOCALAPPDATA\GitHubDesktop\app-*\resources\app\git\cmd\git.exe" | Sort-Object FullName | Select-Object -Last 1).FullName`
- **GitHub CLI**: `gh` 또는 `C:\Program Files\GitHub CLI\gh.exe`. 작업 전에 `gh auth status`로 로그인 계정을 확인합니다.
- `gh auth setup-git`이 git을 찾지 못하면, 그 명령 안에서만 GitHub Desktop git 폴더를 PATH 앞에 붙여 실행합니다(시스템 PATH는 바꾸지 않음).
- **인증이 실패하면 반복 시도하지 말고 멈춘 뒤 원인을 보고합니다.** 토큰·비밀번호를 파일이나 명령 기록에 남기지 않습니다.
- 셸에서 Push가 안 되는 PC(인증 미설정)에서는 커밋까지만 하고, Push·PR은 사용자에게 GitHub Desktop으로 요청합니다.

## 2. 차수 작업 순서

1. `git fetch origin` 후 최신 `origin/main` 커밋을 확인합니다.
2. 메인 작업 폴더의 미커밋 변경(`git status --short`)과 다른 worktree·브랜치를 건드리지 않습니다.
3. 차수마다 새 브랜치와 새 worktree를 만듭니다.
   `git worktree add --no-track -b work/<차수>-<이름> <새 폴더> origin/main`
   (`--no-track` 필수: upstream이 `origin/main`으로 잡히면 Push가 main으로 갈 위험이 있습니다.)
4. 작업 전에 변경할 파일 목록과 범위를 정하고, 작업 후 `git diff --name-only`가 그 목록과 같은지 확인합니다. 범위 밖 파일이 바뀌었으면 중단합니다.
5. 검사를 모두 통과한 뒤에만 커밋합니다(아래 3장). 대량 변경 커밋은 `git -c gc.auto=0 commit`으로 worktree 정리(prune)를 막습니다.
6. **작업 브랜치만 Push**합니다: `git push -u origin work/<차수>-<이름>`
7. 현재 차수 PR을 새로 만듭니다: `gh pr create --base main --head work/<차수>-<이름> --title "..." --body "..."`
8. PR 변경 파일 목록(`gh pr view <번호> --json files,mergeable,mergeStateStatus`)이 로컬 변경 목록과 같은지 비교합니다.
9. 충돌, 검사 실패, 예상하지 못한 변경이 하나라도 있으면 병합하지 않고 보고합니다.
10. **현재 차수에서 만든 PR만** 병합합니다: `gh pr merge <번호> --merge` (기존 PR과 같은 병합 커밋 방식).
11. 병합 커밋의 Pages 배포 결과를 확인합니다:
    `https://api.github.com/repos/dkfmaqqhh-cyber/signature-tutoring/actions/runs?head_sha=<병합 커밋>` 에서 `pages build and deployment`가 `completed / success`인지 보고, 운영 페이지가 main 내용과 같은지 직접 엽니다.
12. **배포 성공을 확인하기 전에는 '완료'라고 보고하지 않습니다.** 보고에는 PR 번호, 병합 커밋, 배포 결과를 넣습니다.

## 3. 커밋 전 검사

- **화면**: PC 1280px, 태블릿 768px, 모바일 390px·320px에서 가로 스크롤, 글자 잘림·겹침, 상담 버튼 가림, 콘솔 오류, 깨진 요청(404) 0건.
- **링크**: 내부 링크·앵커 깨짐 0건, 상담·전화·카카오톡·수업료(`/tutoring/#price`) 링크 정상.
- **SEO 보존**: title, description, canonical, robots, H1, OG, JSON-LD, FAQ(화면 질문·답변과 FAQ JSON-LD 일치)를 수정 전과 비교해 의도한 변경 외 차이 0건.
- **sitemap**: XML 파싱 정상, 기존 URL 수·순서 유지, 중복 0건.
- **수업료**: `tutoring/index.html` `#price`나 가격을 적은 FAQ를 바꿨다면 `node tools/price/check-price-consistency.mjs` 통과(불일치 0건). 점검 대상과 함께 볼 위치는 `tools/price/README.md`.
- 검사 스크립트와 임시 파일은 저장소가 아닌 작업용 임시 폴더에 둡니다.

## 4. 콘텐츠·사이트 보호 규칙

- **GA4 비활성 유지**: `js/script.js`의 `ANALYTICS_ENABLED`는 사용자 승인 없이 바꾸지 않습니다(개인정보처리방침에 '분석 도구 사용 안 함'으로 공개).
- **전화번호는 화면 글자로 노출하지 않습니다**(`tel:` 링크·버튼은 유지).
- 기존 SEO 메타, FAQ, 상담·시범수업 안내, 수업료 링크, 학교·지역 정보, 조건부 방문수업 문구를 보호합니다.
- 확인되지 않은 학교별 출제 경향, 시험 일정, 지역 통계, 성적 향상 사례, 후기, 보장 표현을 만들지 않습니다.
- **실제 콘텐츠를 바꾼 페이지만** JSON-LD `dateModified`와 sitemap `lastmod` 두 날짜를 실제 수정일로 맞춥니다. `datePublished`는 바꾸지 않고, 모든 페이지 날짜를 한꺼번에 오늘로 바꾸지 않습니다.
- 화면에는 '최종 업데이트'·'페이지 업데이트'·정보글 '수정일' 같은 관리용 날짜를 표시하지 않습니다([464차] 삭제). 정보글 작성일, 개인정보처리방침 시행일, 본문의 일정·출처 기준일은 화면에 유지합니다.
- 지역 페이지 CSS는 `style.css?v=` 버전 쿼리를 쓰므로, CSS를 바꾸면 영향받는 페이지의 버전도 함께 올립니다.

## 5. 금지 사항

- `main` 직접 Push, `--force` / `--force-with-lease` Push 금지.
- 미커밋 변경 덮어쓰기, 다른 worktree·브랜치 수정·삭제 금지.
- **열려 있는 기존 PR #1(`draft/middle-english-writing-test`)은 병합·수정·닫기 모두 금지.**
- 작업 범위 밖의 저장소 설정, GitHub 권한, 브랜치 보호 규칙, Pages 설정 변경 금지.
- 사용자 확인 없이 대량 삭제, noindex 추가, URL 변경 금지.

## 6. Windows 작업 시 알려진 주의점

- PowerShell 5.1에서는 `&&`가 없습니다. 따옴표로 감싼 실행 파일은 앞에 `&`를 붙여 실행합니다.
- `gh ... --jq` 안의 큰따옴표는 PowerShell이 지울 수 있어, `--jq '{a, b}'`처럼 따옴표 없는 형식을 씁니다.
- 저장소는 `core.autocrlf=true`라 작업 파일은 CRLF입니다. `git show` 결과와 비교할 때는 줄바꿈을 맞춘 뒤 비교합니다.
- 한글 경로가 들어간 `.ps1` 파일은 BOM 없는 UTF-8로 저장하면 경로가 깨지므로, 명령을 직접 실행하거나 node 스크립트를 씁니다.
