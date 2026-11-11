#!/usr/bin/env node
// [449차] font-defer.mjs 적용 결과 점검 (파일 수정 없음)
//   node tools/perf/verify-font-defer.mjs [기준 커밋=origin/main]
// 1) git diff로 바뀐 HTML이 모두 font-defer.mjs 대상 그룹인지  2) 블록을 원래 한 줄로 되돌리면 기준 커밋 원본과 같은지(블록 외 변경 0)
// 3) 주석 밖 동기 글꼴 링크 0 · noscript 1 · pf-wait 스크립트 1 · 선택자 정확 · 블록이 style.css 링크보다 앞 · script/style/head 태그 짝
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { classify, revert } from './font-defer.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
const BASE = process.argv[2] || 'origin/main';
const GIT = process.env.GIT || 'git';
const git = (...a) => execFileSync(GIT, ['-C', ROOT, '-c', 'core.quotepath=false', ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const changed = git('diff', '--name-only', BASE, '--').split('\n').filter(Boolean);
const lf = s => s.replace(/\r\n/g, '\n');
const count = (s, re) => (s.match(re) || []).length;
let fail = 0; const bad = m => { fail++; console.log('FAIL ' + m); };
const html = changed.filter(f => f.endsWith('.html'));
const other = changed.filter(f => !f.endsWith('.html') && !f.startsWith('tools/perf/'));
if (other.length) bad('HTML·도구 외 변경: ' + other.join(', '));
for (const rel of html) {
  const cur = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const c = classify(rel, cur);
  if (c.status !== 'applied') { bad(`${rel} 대상 그룹·적용 형태 아님 (${c.status} ${c.reasons || ''})`); continue; }
  const orig = git('show', `${BASE}:${rel}`);
  if (lf(revert(cur)) !== lf(orig)) bad(`${rel} 블록 외 변경 있음`);
  const live = cur.replace(/<!--[\s\S]*?-->/g, '');
  if (count(live, /<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/gh\/orioncactus\/pretendard[^>]*>/g) !== 1 || count(live, /<noscript><link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/gh\/orioncactus\/pretendard/g) !== 1) bad(`${rel} 동기 링크/noscript 수 이상`);
  if (count(live, /\['header','\.rg-hero','\.sig-float'\]/g) !== 1) bad(`${rel} 선택자 이상`);
  if (live.indexOf("classList.add('pf-wait')") > live.search(/<link rel="stylesheet" href="[^"]*css\/style\.css/)) bad(`${rel} 블록이 style.css 뒤`);
  for (const [o, cl] of [['<script', '</script>'], ['<style', '</style>'], ['<noscript', '</noscript>']]) if (count(live, new RegExp(o + '[\\s>]', 'g')) !== count(live, new RegExp(cl, 'g'))) bad(`${rel} ${o} 짝 불일치`);
  if (count(cur, /<\/head>/g) !== 1 || count(cur, /<body[\s>]/g) !== 1 || !/<\/html>\s*$/.test(cur)) bad(`${rel} head/body/html 구조 이상`);
  if (cur.charCodeAt(0) === 0xFEFF) bad(`${rel} BOM 생김`);
  if (cur.includes('\r\n') !== fs.readFileSync(path.join(ROOT, rel), 'latin1').includes('\r\n')) bad(`${rel} 줄바꿈`);
}
console.log(`점검: 변경 HTML ${html.length}개 · 기타 ${other.length}개 · 실패 ${fail}`);
process.exit(fail ? 1 : 0);
