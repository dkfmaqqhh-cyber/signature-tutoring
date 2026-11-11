#!/usr/bin/env node
// [449차] 지역 페이지 글꼴 지연 로드 블록 적용·점검 도구 (README.md 참고)
//   node tools/perf/font-defer.mjs            → 점검만 (대상·기적용·제외 목록 출력, 파일 수정 없음)
//   node tools/perf/font-defer.mjs --apply    → 대상 파일에만 적용 (이미 적용된 파일은 건너뜀 → 여러 번 실행해도 블록이 늘지 않음)
//   node tools/perf/font-defer.mjs --json out.json  → 분류 결과를 JSON으로 저장
// 대상 그룹은 아래 GROUPS에 적힌 구조 조건이 모두 일치하는 파일만. 새 그룹은 대표 페이지 측정(448차 방식) 후에만 추가.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
const APPLY = process.argv.includes('--apply');
const JSON_OUT = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;

const FONT_URL = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const SYNC_LINK = `<link rel="stylesheet" href="${FONT_URL}">`;
const MARK = '글꼴 로딩'; // 블록 첫 주석에 들어가는 표식 (446·448·449차 공통)

// 448차에서 측정·검증한 그룹 (울산 남구 math·middle이 대표) · 경로 = area/{시도}/{구}/… 또는 세종처럼 area/{시도}/… (강남 학년×과목 구버전 area/seoul/gangnam/{학년}/math/는 경로부터 제외)
const GROUPS = [
  { name: 'area-subject-math', file: /^area\/[^/]+\/(?:[^/]+\/)?math\/index\.html$/, body: 'page-area page-region page-subarea page-subject gu-v2', css: 'style.css?v=168' },
  { name: 'area-grade-middle', file: /^area\/[^/]+\/(?:[^/]+\/)?middle\/index\.html$/, body: 'page-area page-region page-subarea page-subject gu-v2 vz297', css: 'style.css?v=301' },
];
const HERO = '<section class="ar-hero rg-hero rg-hero-solid"';
const SELECTORS = "['header','.rg-hero','.sig-float']";

// 446차(/tutoring/)·448차(울산 남구)에서 검증한 블록과 같은 내용 · 첫 화면 대상 선택자만 지역 페이지용
const block = nl => [
  `<!-- [449차] ${MARK} = /tutoring/ [446차]·울산 남구 [448차] 방식 · 첫 화면 대상 header·.rg-hero·.sig-float · 도구: tools/perf/font-defer.mjs · 되돌리기: 이 블록 전체를 아래 한 줄로 교체`,
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
  `function load(){var l=d.createElement('link');l.rel='stylesheet';l.href=u;l.onload=function(){var t='';${SELECTORS}.forEach(function(q){var e=d.querySelector(q);if(e)t+=e.textContent;});try{Promise.all(['400','700','900'].map(function(w){return d.fonts.load(w+' 1em "Pretendard Variable"',t);})).then(show,show);}catch(e){show();}};l.onerror=show;d.head.appendChild(l);setTimeout(show,6000);}`,
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
  if (!live.includes(HERO)) reasons.push('hero 구조 다름');
  if (!/<header class="sig-header"/.test(live)) reasons.push('header 없음');
  if (!/<nav class="sig-float/.test(live)) reasons.push('.sig-float 없음');
  if (pfScript > 0 || html.includes(MARK)) {
    if (pfScript === 1 && sync - noscript === 0 && noscript === 1) return { status: 'applied', group: g.name };
    return { status: 'exclude', group: g.name, reasons: [...reasons, `기적용 형태 이상(pf ${pfScript}, sync ${sync}, noscript ${noscript})`] };
  }
  if (sync !== 1) reasons.push(`동기 글꼴 링크 ${sync}개`);
  return reasons.length ? { status: 'exclude', group: g.name, reasons } : { status: 'target', group: g.name };
}
export function transform(html) {
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const i = html.indexOf(SYNC_LINK);
  if (i < 0 || html.indexOf(SYNC_LINK, i + 1) >= 0) throw new Error('동기 글꼴 링크가 정확히 1개가 아님');
  return html.slice(0, i) + block(nl) + html.slice(i + SYNC_LINK.length);
}
// 되돌린 결과가 원본과 같은지 점검용: 블록을 원래 한 줄로 바꿈
export function revert(html) {
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const b = block(nl);
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
  for (const f of walk(path.join(ROOT, 'area'))) {
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    const html = fs.readFileSync(f, 'utf8');
    const c = classify(rel, html);
    if (c.status === 'out') continue;
    res[c.status].push({ rel, group: c.group, reasons: c.reasons });
    if (APPLY && c.status === 'target') fs.writeFileSync(f, transform(html), 'utf8');
  }
  for (const g of GROUPS) {
    const n = k => res[k].filter(x => x.group === g.name).length;
    console.log(`${g.name}: 전체 ${n('target') + n('applied') + n('exclude')} · 기적용 ${n('applied')} · ${APPLY ? '이번 적용' : '적용 대상'} ${n('target')} · 제외 ${n('exclude')}`);
  }
  for (const x of res.exclude) console.log(`  제외 ${x.rel} — ${x.reasons.join(', ')}`);
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(res, null, 1));
}
