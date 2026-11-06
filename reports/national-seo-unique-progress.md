---
# GitHub Pages(Jekyll)가 이 파일을 공개 페이지로 내보내지 않도록 막는 설정입니다. 지우지 마세요.
published: false
---

# 전국 지역 학년·과목 페이지 학습 안내 고유화 진행 현황

- 최종 갱신: 2026-11-06 (381차)
- 대상: sitemap.xml 2,145 URL 중 `area/<시·도>/<시·군·구>/<elementary|middle|high|math|english|korean|science|social>/` 1,832페이지
- 제외: 메인·안내 등 비지역 33, 지역 대문 1, 시·도 대문 17, 시·군·구 대문 262 (학년·과목 페이지가 아니라 구조가 다름). 세종은 대문만 있고 학년·과목 페이지 없음
- 고유화 판정: 페이지 첫 학습 안내 목록(초등 `mt-reason` 4, 중·고 `ar-step` 5, 과목 `mt-reason` 4)의 항목이 같은 유형의 다른 어떤 페이지와도 겹치지 않으면 완료. 부산 371·372차의 2항목 목록 8페이지는 Git 기록상 완료

## 시·도별 현황

| 시·도 | 시·군·구 | 대상 | 완료 | 미완료 | 381차 변경 |
|---|---:|---:|---:|---:|---:|
| 서울 | 25 | 200 | 200 | 0 | 0 |
| 부산 | 16 | 128 | 128 | 0 | 0 |
| 인천 | 11 | 88 | 88 | 0 | 0 |
| 대구 | 9 | 72 | 40 | 32 | 40 |
| 대전 | 5 | 40 | 0 | 40 | 0 |
| 광주 | 5 | 40 | 1 | 39 | 0 |
| 울산 | 5 | 40 | 0 | 40 | 0 |
| 세종 | 0 | 0 | 0 | 0 | 0 |
| 경기 | 31 | 248 | 1 | 247 | 0 |
| 강원 | 18 | 144 | 1 | 143 | 0 |
| 충북 | 11 | 88 | 0 | 88 | 0 |
| 충남 | 15 | 120 | 0 | 120 | 0 |
| 전북 | 14 | 112 | 0 | 112 | 0 |
| 전남 | 22 | 176 | 1 | 175 | 0 |
| 경북 | 22 | 176 | 0 | 176 | 0 |
| 경남 | 18 | 144 | 0 | 144 | 0 |
| 제주 | 2 | 16 | 0 | 16 | 0 |
| **합계** | | **1832** | **460** | **1372** | **40** |

## 완료 기록 (다시 수정하지 않음)

| 차수 | 커밋 | 범위 |
|---|---|---|
| 368차 | a903dcf3 | 시범 6페이지: 부산 북구 중등·동구 초등, 경기 광주시 과학, 광주 서구 영어, 강원 양양군 수학, 전남 무안군 고등 |
| 370~372차 | b8c0530d · 0d4eda7b · e8fbfdf4 | 부산 16개 구·군 128페이지 전체 |
| 374차 | 0951122c | 서울 강남·강서·마포·서초·송파 40페이지 |
| 375차 | 5f6ec78f | 서울 종로·중·용산·성동·광진 40페이지 |
| 376차 | afc10c95 | 서울 동대문·중랑·성북·강북·도봉 40페이지 |
| 377차 | de09858a | 서울 노원·은평·서대문·양천·구로 40페이지 |
| 378차 | ad245c31 | 서울 금천·영등포·동작·관악·강동 40페이지 (서울 25개 구 200페이지 완료) |
| 379차 | 56556e9a | 인천 제물포·영종·미추홀·연수·남동 40페이지 |
| 380차 | e7777856 | 인천 부평·계양·서해·검단·강화·옹진 48페이지 (인천 11개 구 88페이지 완료) |
| 381차 | (이 차수 커밋) | 대구 중·동·서·남·북구 40페이지 |

## 미완료 페이지 (시·도 → 시·군·구, sitemap 순서)

시·군·구별 표기: 미완료 페이지 수. 8 미만이면 일부 페이지(368차 시범)가 이미 완료된 곳으로, 표기된 페이지만 수정합니다.

- **대구** (32페이지): suseong, dalseo, dalseong, gunwi
- **대전** (40페이지): dong, jung, seo, yuseong, daedeok
- **광주** (39페이지): dong, seo(7: korean·math·social·science·elementary·middle·high), nam, buk, gwangsan
- **울산** (40페이지): jung, nam, dong, buk, ulju
- **경기** (247페이지): gapyeong, goyang, gwacheon, gwangmyeong, gwangju(7: korean·english·math·social·elementary·middle·high), guri, gunpo, gimpo, namyangju, dongducheon, bucheon, seongnam, suwon, siheung, ansan, anseong, anyang, yangju, yangpyeong, yeoju, yeoncheon, osan, yongin, uiwang, uijeongbu, icheon, paju, pyeongtaek, pocheon, hanam, hwaseong
- **강원** (143페이지): chuncheon, wonju, gangneung, donghae, taebaek, sokcho, samcheok, hongcheon, hoengseong, yeongwol, pyeongchang, jeongseon, cheorwon, hwacheon, yanggu, inje, goseong, yangyang(7: korean·english·social·science·elementary·middle·high)
- **충북** (88페이지): cheongju, chungju, jecheon, boeun, okcheon, yeongdong, jeungpyeong, jincheon, goesan, eumseong, danyang
- **충남** (120페이지): cheonan, gongju, boryeong, asan, seosan, nonsan, gyeryong, dangjin, geumsan, buyeo, seocheon, cheongyang, hongseong, yesan, taean
- **전북** (112페이지): jeonju, gunsan, iksan, jeongeup, namwon, gimje, wanju, jinan, muju, jangsu, imsil, sunchang, gochang, buan
- **전남** (175페이지): mokpo, yeosu, suncheon, naju, gwangyang, damyang, gokseong, gurye, goheung, boseong, hwasun, jangheung, gangjin, haenam, yeongam, muan(7: korean·english·math·social·science·elementary·middle), hampyeong, yeonggwang, jangseong, wando, jindo, sinan
- **경북** (176페이지): pohang, gyeongju, gimcheon, andong, gumi, yeongju, yeongcheon, sangju, mungyeong, gyeongsan, uiseong, cheongsong, yeongyang, yeongdeok, cheongdo, goryeong, seongju, chilgok, yecheon, bonghwa, uljin, ulleung
- **경남** (144페이지): changwon, jinju, tongyeong, sacheon, gimhae, miryang, geoje, yangsan, uiryeong, haman, changnyeong, goseong, namhae, hadong, sancheong, hamyang, geochang, hapcheon
- **제주** (16페이지): jeju-city, seogwipo

## 이후 차수 계획 (약 40페이지씩, 실제 미완료 지역 순서)

- 380차: 인천 부평·계양·서해·검단·강화·옹진 48페이지 완료 (인천 완료)
- 381차: 대구 중·동·서·남·북구 40페이지 완료
- 382차: 대구 수성구·달서구·달성군·군위군 32페이지 → 대구 완료
- 383차: 대전 5개 구 40페이지 / 384차: 광주 39페이지 / 385차: 울산 40페이지
- 이후: 경기 247 → 강원 143 → 충북 88 → 충남 120 → 전북 112 → 전남 175 → 경북 176 → 경남 144 → 제주 16

## 작업 원칙

- 페이지마다 첫 학습 안내 목록만 학년·과목에 맞는 구체적 학습 주제로 교체. 지역명 치환·학교·실적·후기 생성 금지
- 새 제목·문장은 전국 `area/` 전체와 정확히 일치하는 중복 0건이 되도록 검사
- 수정 페이지만 화면 최종 업데이트·JSON-LD dateModified·sitemap lastmod 갱신, datePublished·SEO 메타·FAQ·링크·CTA 유지
- 화면 검사는 실제 브라우저(가로 스크롤·상담 버튼 화면 밖/클릭·푸터 가림·글자 넘침·JS 오류·404)로 판정. 206차 batchcheck.js의 학년 페이지 '버튼가림'은 수정 전에도 나오는 기존 오탐
