#!/usr/bin/env node
// [449차] 지역 페이지 글꼴 지연 로드 블록 적용·점검 도구 (README.md 참고)
//   node tools/perf/font-defer.mjs            → 점검만 (대상·기적용·제외 목록 출력, 파일 수정 없음)
//   node tools/perf/font-defer.mjs --apply    → 대상 파일에만 적용 (이미 적용된 파일은 건너뜀 → 여러 번 실행해도 블록이 늘지 않음)
//   node tools/perf/font-defer.mjs --json out.json  → 분류 결과를 JSON으로 저장
//   node tools/perf/font-defer.mjs --check    → [479차] 누락 검사: 블록이 빠진 대상(지역 페이지 재생성 등)이 있으면 목록을 출력하고 종료 코드 1 (파일 수정 없음)
// 대상 그룹은 아래 GROUPS에 적힌 구조 조건이 모두 일치하는 파일만. 새 그룹은 대표 페이지 측정(448차 방식) 후에만 추가.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
const APPLY = process.argv.includes('--apply');
const CHECK = process.argv.includes('--check');
const JSON_OUT = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;

const FONT_URL = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const SYNC_LINK = `<link rel="stylesheet" href="${FONT_URL}">`;
const MARK = '글꼴 로딩'; // 블록 첫 주석에 들어가는 표식 (446·448·449차 공통)

// 448차에서 측정·검증한 그룹 (울산 남구 math·middle이 대표) · 경로 = area/{시도}/{구}/… 또는 세종처럼 area/{시도}/… (강남 학년×과목 구버전 area/seoul/gangnam/{학년}/math/는 경로부터 제외)
// [478차] 그룹 추가: 같은 과목 템플릿(english·korean·science·social, 강남 영어 측정) · 지역 허브(/area/) · 상담(consult.html)
//   그룹별 선택 항목: hero(첫 화면 구조 표식) · float(false면 .sig-float를 HTML에서 확인하지 않음 — 상담 페이지는 script.js가 만듦) · sel(첫 화면 글자 선택자) · head(블록 첫 주석)
//   hero·sel·head를 적지 않은 그룹은 449차 블록과 글자 하나까지 같음
const HERO = '<section class="ar-hero rg-hero rg-hero-solid"';
const SELECTORS = "['header','.rg-hero','.sig-float']";
const HEAD449 = `[449차] ${MARK} = /tutoring/ [446차]·울산 남구 [448차] 방식 · 첫 화면 대상 header·.rg-hero·.sig-float`;
const GROUPS = [
  { name: 'area-subject-math', file: /^area\/[^/]+\/(?:[^/]+\/)?math\/index\.html$/, body: 'page-area page-region page-subarea page-subject gu-v2', css: 'style.css?v=168' },
  { name: 'area-grade-middle', file: /^area\/[^/]+\/(?:[^/]+\/)?middle\/index\.html$/, body: 'page-area page-region page-subarea page-subject gu-v2 vz297', css: 'style.css?v=301' },
  { name: 'area-subject-other', file: /^area\/[^/]+\/(?:[^/]+\/)?(?:english|korean|science|social)\/index\.html$/, body: 'page-area page-region page-subarea page-subject gu-v2', css: 'style.css?v=168',
    head: `[478차] ${MARK} = 수학 과목 템플릿 [449차]와 같은 블록(같은 과목 템플릿 영어·국어·과학·사회) · 첫 화면 대상 header·.rg-hero·.sig-float` },
  { name: 'area-hub', file: /^area\/index\.html$/, body: 'page-area page-area-hub', css: 'style.css?v=475', hero: '<section class="ar-hero" aria-labelledby="arTitle">', sel: "['header','.ar-hero','.sig-float']",
    head: `[478차] ${MARK} = /tutoring/ [446차] 방식 · 지역별 과외 허브 · 첫 화면 대상 header·.ar-hero·.sig-float` },
  { name: 'consult', file: /^consult\.html$/, body: undefined, css: 'href="css/style.css"', hero: '<section class="page-hero no-visual consult-hero">', float: false, sel: "['header','.consult-hero','.consult-main']",
    head: `[478차] ${MARK} = /tutoring/ [446차] 방식 · 상담 신청 · 첫 화면 대상 header·.consult-hero·.consult-main(신청서)` },
];
export const selOf = g => (g && g.sel) || SELECTORS;

// 446차(/tutoring/)·448차(울산 남구)에서 검증한 블록과 같은 내용 · 첫 화면 대상 선택자만 그룹별
const block = (nl, g) => [
  `<!-- ${(g && g.head) || HEAD449} · 도구: tools/perf/font-defer.mjs · 되돌리기: 이 블록 전체를 아래 한 줄로 교체`,
  `       ${SYNC_LINK} -->`,
  `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>`,
  `<style>`,
  `@font-face{font-family:"Malgun Gothic";src:local("Malgun Gothic");font-weight:100 550}`,
  `@font-face{font-family:"Malgun Gothic";src:local("Malgun Gothic Bold");font-weight:551 1000}`,
  `@font-face{font-family:"Malgun Gothic";src:local("Malgun Gothic");font-weight:100 550;size-adjust:84%;unicode-range:U+0000-00FF,U+2000-206F,U+1100-11FF,U+3130-318F,U+AC00-D7A3}`,
  `@font-face{font-family:"Malgun Gothic";src:local("Malgun Gothic Bold");font-weight:551 1000;size-adjust:84%;unicode-range:U+0000-00FF,U+2000-206F,U+1100-11FF,U+3130-318F,U+AC00-D7A3}`,
  `html.pf-wait body, html.pf-wait body *{font-family:"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif !important}`,
  `</style>`,
  `<script>(function(){var d=document,h=d.documentElement,u='${FONT_URL}',done=false;h.classList.add('pf-wait');`,
  `function show(){if(!done){done=true;h.classList.remove('pf-wait');}}`,
  `function load(){var l=d.createElement('link');l.rel='stylesheet';l.href=u;l.onload=function(){var t='';${selOf(g)}.forEach(function(q){var e=d.querySelector(q);if(e)t+=e.textContent;});try{Promise.all(['400','700','900'].map(function(w){return d.fonts.load(w+' 1em "Pretendard Variable"',t);})).then(show,show);}catch(e){show();}};l.onerror=show;d.head.appendChild(l);setTimeout(show,6000);}`,
  `var started=false;function start(){if(!started){started=true;setTimeout(load,0);}}`,
  `var P=window.PerformanceObserver,ok=P&&P.supportedEntryTypes&&P.supportedEntryTypes.indexOf('paint')>=0;`,
  `if(ok){new P(function(l){l.getEntries().forEach(function(e){if(e.name==='first-contentful-paint')start();});}).observe({type:'paint',buffered:true});}`,
  `else{var go=function(){requestAnimationFrame(function(){setTimeout(start,0);});};if(d.readyState==='loading'){d.addEventListener('DOMContentLoaded',go);}else{go();}}`,
  `})();</script>`,
  `<noscript>${SYNC_LINK}</noscript>`,
].join(nl);

const stripComments = s => s.replace(/<!--[\s\S]*?-->/g, '');
export function classify(rel, html) {
  const g = GROUPS.find(x => x.file.test(rel));
  if (!g) return { status: 'out' };
  const body = (html.match(/<body[^>]*class="([^"]*)"/) || [])[1];
  const live = stripComments(html);
  const sync = live.split(SYNC_LINK).length - 1;           // 주석 밖 동기 링크 수(noscript 안 포함)
  const noscript = (live.match(/<noscript><link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/gh\/orioncactus\/pretendard[^"]*"><\/noscript>/g) || []).length;
  const pfScript = (live.match(/h\.classList\.add\('pf-wait'\)/g) || []).length;
  const reasons = [];
  if (body !== g.body) reasons.push(`body="${body}"`);
  if (!live.includes(g.css)) reasons.push(`css≠${g.css}`);
  if (!live.includes(g.hero || HERO)) reasons.push('hero 구조 다름');
  if (!/<header class="sig-header"/.test(live)) reasons.push('header 없음');
  if (g.float !== false && !/<nav class="sig-float/.test(live)) reasons.push('.sig-float 없음');
  if (pfScript > 0 || html.includes(MARK)) {
    if (pfScript === 1 && sync - noscript === 0 && noscript === 1) return { status: 'applied', group: g.name };
    return { status: 'exclude', group: g.name, reasons: [...reasons, `기적용 형태 이상(pf ${pfScript}, sync ${sync}, noscript ${noscript})`] };
  }
  if (sync !== 1) reasons.push(`동기 글꼴 링크 ${sync}개`);
  return reasons.length ? { status: 'exclude', group: g.name, reasons } : { status: 'target', group: g.name };
}
export const groupOf = rel => GROUPS.find(x => x.file.test(rel));
export function transform(html, rel) {
  const g = groupOf(rel);
  if (!g) throw new Error('대상 그룹 아님: ' + rel);
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const i = html.indexOf(SYNC_LINK);
  if (i < 0 || html.indexOf(SYNC_LINK, i + 1) >= 0) throw new Error('동기 글꼴 링크가 정확히 1개가 아님');
  return html.slice(0, i) + block(nl, g) + html.slice(i + SYNC_LINK.length);
}
// 되돌린 결과가 원본과 같은지 점검용: 블록을 원래 한 줄로 바꿈 · [478차] 그룹별 블록이라 경로(rel)도 받음
export function revert(html, rel) {
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const b = block(nl, groupOf(rel));
  return html.includes(b) ? html.replace(b, SYNC_LINK) : html;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const res = { target: [], applied: [], exclude: [] };
  for (const f of [...walk(path.join(ROOT, 'area')), path.join(ROOT, 'consult.html')]) { // [478차] 상담 페이지 추가
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    const html = fs.readFileSync(f, 'utf8');
    const c = classify(rel, html);
    if (c.status === 'out') continue;
    res[c.status].push({ rel, group: c.group, reasons: c.reasons });
    if (APPLY && c.status === 'target') fs.writeFileSync(f, transform(html, rel), 'utf8');
  }
  for (const g of GROUPS) {
    const n = k => res[k].filter(x => x.group === g.name).length;
    console.log(`${g.name}: 전체 ${n('target') + n('applied') + n('exclude')} · 기적용 ${n('applied')} · ${APPLY ? '이번 적용' : '적용 대상'} ${n('target')} · 제외 ${n('exclude')}`);
  }
  for (const x of res.exclude) console.log(`  제외 ${x.rel} — ${x.reasons.join(', ')}`);
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(res, null, 1));
  if (CHECK && !APPLY && res.target.length) { for (const x of res.target) console.log(`  누락 ${x.rel}`); console.log(`글꼴 지연 블록 누락 ${res.target.length}개 → node tools/perf/font-defer.mjs --apply 실행 후 verify-font-defer.mjs로 확인`); process.exitCode = 1; }
  else if (CHECK) console.log('글꼴 지연 블록 누락 0개');
}
