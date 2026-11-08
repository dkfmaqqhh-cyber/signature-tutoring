---
# GitHub Pages(Jekyll)가 이 파일을 공개 페이지로 내보내지 않도록 막는 설정입니다. 지우지 마세요.
published: false
---

# 전국 지역 학년·과목 페이지 학습 안내 고유화 진행 현황

- 최종 갱신: 2026-11-08 (391차)
- 대상: sitemap.xml 2,145 URL 중 `area/<시·도>/<시·군·구>/<elementary|middle|high|math|english|korean|science|social>/` 1,832페이지
- 제외: 메인·안내 등 비지역 33, 지역 대문 1, 시·도 대문 17, 시·군·구 대문 262 (학년·과목 페이지가 아니라 구조가 다름). 세종은 대문만 있고 학년·과목 페이지 없음
- 고유화 판정: 페이지 첫 학습 안내 목록(초등 `mt-reason` 4, 중·고 `ar-step` 5, 과목 `mt-reason` 4)의 항목이 같은 유형의 다른 어떤 페이지와도 겹치지 않으면 완료. 부산 371·372차의 2항목 목록 8페이지는 Git 기록상 완료

## 시·도별 현황

| 시·도 | 시·군·구 | 대상 | 완료 | 미완료 | 391차 변경 |
|---|---:|---:|---:|---:|---:|
| 서울 | 25 | 200 | 200 | 0 | 0 |
| 부산 | 16 | 128 | 128 | 0 | 0 |
| 인천 | 11 | 88 | 88 | 0 | 0 |
| 대구 | 9 | 72 | 72 | 0 | 0 |
| 대전 | 5 | 40 | 40 | 0 | 0 |
| 광주 | 5 | 40 | 40 | 0 | 0 |
| 울산 | 5 | 40 | 40 | 0 | 0 |
| 세종 | 0 | 0 | 0 | 0 | 0 |
| 경기 | 31 | 248 | 248 | 0 | 48 |
| 강원 | 18 | 144 | 1 | 143 | 0 |
| 충북 | 11 | 88 | 0 | 88 | 0 |
| 충남 | 15 | 120 | 0 | 120 | 0 |
| 전북 | 14 | 112 | 0 | 112 | 0 |
| 전남 | 22 | 176 | 1 | 175 | 0 |
| 경북 | 22 | 176 | 0 | 176 | 0 |
| 경남 | 18 | 144 | 0 | 144 | 0 |
| 제주 | 2 | 16 | 0 | 16 | 0 |
| **합계** | | **1832** | **858** | **974** | **48** |

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
| 381차 | 9cc2115d | 대구 중·동·서·남·북구 40페이지 |
| 382차 | 71cf311a | 대구 수성구·달서구·달성군·군위군 32페이지 (대구 9개 구·군 72페이지 완료) |
| 383차 | 05be25e4 | 대전 동·중·서·유성·대덕구 40페이지 (대전 5개 구 40페이지 완료) |
| 384차 | 804c823f | 광주 동·서(영어 제외)·남·북·광산구 39페이지 (368차 서구 영어 포함 광주 40페이지 완료) |
| 385차 | ed430d4a | 울산 중·남·동·북구·울주군 40페이지 (울산 완료, 광역시 전체 완료) |
| 386차 | 3f8c5287 | 경기 가평·고양·과천·광명·광주시(과학 제외) 39페이지 |
| 387차 | af91944b | 경기 구리·군포·김포·남양주·동두천시 40페이지 |
| 388차 | ed96b234 | 경기 부천·성남·수원·시흥·안산시 40페이지 |
| 389차 | b8740d65 | 경기 안성·안양·양주시·양평군·여주시 40페이지 |
| 390차 | a44ff273 | 경기 연천군·오산·용인·의왕·의정부시 40페이지 |
| 391차 | (이 차수 커밋) | 경기 이천·파주·평택·포천·하남·화성시 48페이지 (경기 31개 시·군 248페이지 완료) |

## 미완료 페이지 (시·도 → 시·군·구, sitemap 순서)

시·군·구별 표기: 미완료 페이지 수. 8 미만이면 일부 페이지(368차 시범)가 이미 완료된 곳으로, 표기된 페이지만 수정합니다.

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
- 382차: 대구 수성구·달서구·달성군·군위군 32페이지 완료 (대구 완료)
- 383차: 대전 동·중·서·유성·대덕구 40페이지 완료 (대전 완료)
- 384차: 광주 동·서·남·북구·광산구 39페이지 완료 (광주 완료)
- 385차: 울산 중·남·동·북구·울주군 40페이지 완료 (울산 완료, 서울·부산·인천·대구·대전·광주·울산 광역시 전체 완료)
- 386차: 경기 가평군·고양시·과천시·광명시·광주시(과학 제외) 39페이지 완료
- 387차: 경기 구리·군포·김포·남양주·동두천시 40페이지 완료
- 388차: 경기 부천·성남·수원·시흥·안산시 40페이지 완료
- 389차: 경기 안성·안양·양주시·양평군·여주시 40페이지 완료
- 390차: 경기 연천군·오산·용인·의왕·의정부시 40페이지 완료
- 391차: 경기 이천·파주·평택·포천·하남·화성시 48페이지 완료 (경기 완료)
- 392차: 강원 춘천·원주·강릉·동해·태백시 40페이지 (sitemap 순서, 이후 강원 103페이지)
- 이후: 강원 143 → 충북 88 → 충남 120 → 전북 112 → 전남 175 → 경북 176 → 경남 144 → 제주 16

## 작업 원칙

- 페이지마다 첫 학습 안내 목록만 학년·과목에 맞는 구체적 학습 주제로 교체. 지역명 치환·학교·실적·후기 생성 금지
- 새 제목·문장은 전국 `area/` 전체와 정확히 일치하는 중복 0건이 되도록 검사
- 수정 페이지만 화면 최종 업데이트·JSON-LD dateModified·sitemap lastmod 갱신, datePublished·SEO 메타·FAQ·링크·CTA 유지
- 경기 중등 페이지는 첫 목록이 3항목이고 이어지는 중1·중2·중3 목록은 원래 시마다 다름 → 첫 목록(ol) 안의 항목만 교체
- 화면 검사는 실제 브라우저(가로 스크롤·상담 버튼 화면 밖/클릭·푸터 가림·글자 넘침·JS 오류·404)로 판정. 206차 batchcheck.js의 학년 페이지 '버튼가림'은 수정 전에도 나오는 기존 오탐
