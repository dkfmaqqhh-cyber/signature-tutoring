#!/usr/bin/env node
// [452차] 공개 수업료(/tutoring/#price)와 지역 FAQ 비용 답변의 가격 일치 점검 — 읽기 전용 (README.md 참고)
//   node tools/price/check-price-consistency.mjs [--root 폴더]
// 원본 표에서 학년별 금액·단위·수업 기준을 읽어 TARGETS의 FAQ(화면 + FAQPage JSON-LD)와 비교합니다.
// 가격은 이 코드에 적지 않습니다. 불일치하면 파일·항목을 출력하고 종료 코드 1. 사이트 파일은 고치지 않습니다.
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const ai = process.argv.indexOf('--root');
const ROOT = ai > 0 ? path.resolve(process.argv[ai + 1]) : path.resolve(here, '../..');

const SOURCE = 'tutoring/index.html';
// 공개 수업료를 문장으로 옮겨 적은 곳. 가격을 다른 페이지에 새로 적으면 여기에도 추가합니다.
const TARGETS = [
  { file: 'area/ulsan/nam/math/index.html', question: '남구 수학과외 비용은 어떻게 정해지나요?' },
];

const errors = [];
const fail = (file, item, detail) => errors.push(`${file} — ${item}: ${detail}`);
const text = s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const read = rel => { const p = path.join(ROOT, rel); if (!fs.existsSync(p)) { fail(rel, '파일', '없음'); return null; } return fs.readFileSync(p, 'utf8'); };

// ── 1. 원본 표 읽기 ──
function readSource() {
  const html = read(SOURCE); if (!html) return null;
  const sec = (html.match(/<section[^>]*id="price"[\s\S]*?<\/section>/) || [])[0];
  if (!sec) { fail(SOURCE, '#price', '섹션 없음'); return null; }
  const row = (sec.match(/<tr class="is-visit">[\s\S]*?<\/tr>/) || [])[0];
  if (!row) { fail(SOURCE, '#price 방문과외 행', '없음'); return null; }
  const head = [...sec.matchAll(/<th scope="col">([\s\S]*?)<\/th>/g)].map(m => text(m[1])).slice(1);
  const cells = [...row.matchAll(/<td data-label="([^"]+)">([\s\S]*?)<\/td>/g)].map(m => {
    const m2 = m[2].match(/<span class="tu-ptable-m">([^<]*)<\/span><b>([\d,]+)<\/b><span class="tu-ptable-u">([^<]*)<\/span>/);
    return { grade: m[1], unit: m2 && m2[1].trim(), amount: m2 && m2[2], suffix: m2 && m2[3].trim() };
  });
  if (!cells.length) fail(SOURCE, '#price 금액 칸', '읽지 못함');
  cells.forEach((c, i) => {
    if (!c.amount) fail(SOURCE, `${c.grade} 칸`, '금액 형식을 읽지 못함');
    if (head[i] !== c.grade) fail(SOURCE, `${c.grade} 칸`, `표 머리글(${head[i]})과 data-label 불일치`);
    if (c.unit !== '월') fail(SOURCE, `${c.grade} 단위`, `'월'이 아님 (${c.unit})`);
    if (c.suffix !== '원부터') fail(SOURCE, `${c.grade} 조건`, `'원부터'가 아님 (${c.suffix})`);
  });
  const guide = text((sec.match(/<div class="tu-price-guide">([\s\S]*?)<\/div>/) || [])[1] || '');
  const b = guide.match(/주\s*(\d+)회,\s*1회\s*(\d+)분,\s*월\s*(\d+)회 기준/);
  if (!b) { fail(SOURCE, '수업 기준', `'주 N회, 1회 N분, 월 N회 기준' 문장을 찾지 못함`); return null; }
  const basis = { perWeek: b[1], minutes: b[2], perMonth: b[3] };
  const small = text((row.match(/<small>([\s\S]*?)<\/small>/) || [])[1] || '');
  const sb = small.match(/주\s*(\d+)회\s*·\s*1회\s*(\d+)분/);
  if (!sb || sb[1] !== basis.perWeek || sb[2] !== basis.minutes) fail(SOURCE, '수업 기준', `표 행 설명(${small})과 안내문(${guide.slice(0, 40)}…) 불일치`);
  if (Number(basis.perWeek) * 4 !== Number(basis.perMonth)) fail(SOURCE, '수업 기준', `주 ${basis.perWeek}회와 월 ${basis.perMonth}회가 맞지 않음`);
  return { cells, basis };
}

// ── 2. 대상 FAQ 비교 ──
function faqAnswers(rel, html, q) {
  const screen = [...html.matchAll(/<article class="rg-faq-item">\s*<h3>([\s\S]*?)<\/h3>(?:\s*<!--[\s\S]*?-->)?\s*<p>([\s\S]*?)<\/p>/g)]
    .filter(m => text(m[1]) === q).map(m => text(m[2]));
  const ld = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j; try { j = JSON.parse(m[1]); } catch (e) { fail(rel, 'JSON-LD', '파싱 실패 ' + e.message); continue; }
    for (const node of (j['@graph'] || [j])) if (node['@type'] === 'FAQPage') for (const x of node.mainEntity || []) if (x.name === q) ld.push(x.acceptedAnswer?.text || '');
  }
  return { screen, ld };
}
function checkAnswer(rel, where, ans, src) {
  const amounts = new Set(src.cells.map(c => c.amount));
  for (const c of src.cells) {
    const want = `${c.grade} ${c.unit} ${c.amount}${c.suffix}`;
    if (!ans.includes(want)) {
      const near = (ans.match(new RegExp(c.grade.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^.]{0,20}?원(?:부터)?')) || [])[0];
      fail(rel, `${where} ${c.grade}`, `'${want}' 없음` + (near ? ` (현재: '${near}')` : ' (학년 표기 없음)'));
    }
  }
  for (const a of ans.match(/\d{1,3}(?:,\d{3})+원/g) || []) if (!amounts.has(a.replace('원', ''))) fail(rel, `${where} 금액`, `원본 표에 없는 금액 ${a}`);
  const { perWeek, minutes, perMonth } = src.basis;
  // 답변 안의 '주 N회'·'1회 N분'·'월 N회'가 모두 원본 값이어야 함(하나 이상 있어야 함)
  for (const [unit, re, want] of [['주 ?회', /주\s*(\d+)회/g, perWeek], ['1회 ?분', /1회\s*(\d+)분/g, minutes], ['월 ?회', /월\s*(\d+)회/g, perMonth]]) {
    const got = [...ans.matchAll(re)].map(m => m[1]);
    if (!got.length || got.some(n => n !== want)) fail(rel, `${where} 기준`, `${unit.replace('?', want)}이어야 함 (현재: ${got.map(n => unit.replace('?', n)).join(', ') || '없음'})`);
  }
}

const src = readSource();
let checked = 0;
if (src) for (const t of TARGETS) {
  const html = read(t.file); if (!html) continue;
  const { screen, ld } = faqAnswers(t.file, html, t.question);
  if (screen.length !== 1) fail(t.file, '화면 FAQ', `질문 '${t.question}' ${screen.length}개`);
  if (ld.length !== 1) fail(t.file, 'FAQ JSON-LD', `질문 '${t.question}' ${ld.length}개`);
  if (screen[0] !== undefined && ld[0] !== undefined && screen[0] !== ld[0]) fail(t.file, '화면·JSON-LD', '답변 문구가 서로 다름');
  if (screen[0] !== undefined) checkAnswer(t.file, '화면 답변', screen[0], src);
  if (ld[0] !== undefined) checkAnswer(t.file, 'JSON-LD 답변', ld[0], src);
  checked++;
}
if (src) console.log(`원본 ${SOURCE}: ${src.cells.map(c => `${c.grade} ${c.unit} ${c.amount}${c.suffix}`).join(' / ')} · 주 ${src.basis.perWeek}회·1회 ${src.basis.minutes}분·월 ${src.basis.perMonth}회`);
if (errors.length) { console.log(`불일치 ${errors.length}건:`); errors.forEach(e => console.log('  ✗ ' + e)); process.exit(1); }
console.log(`가격 일치: 대상 ${checked}/${TARGETS.length}개 통과`);
