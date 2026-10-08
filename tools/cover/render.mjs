// [73차] 정보글 대표 이미지 만들기 (1200x630 → images/info/<파일명>.webp + .jpg)
// 사용법: node tools/cover/render.mjs <파일명>
//   설정은 tools/cover/covers.json 의 "<파일명>" 항목을 사용합니다.
// Chrome/Chromium 위치: 환경변수 CHROME_PATH → 자주 쓰는 설치 경로 순서로 찾습니다.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const slug = process.argv[2];
if (!slug) { console.error('사용법: node tools/cover/render.mjs <파일명>'); process.exit(1); }
const covers = JSON.parse(fs.readFileSync(path.join(HERE, 'covers.json'), 'utf8'));
const cover = covers[slug];
if (!cover) { console.error(`covers.json 에 "${slug}" 설정이 없습니다.`); process.exit(1); }

const candidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);
const chromePath = candidates.find(p => fs.existsSync(p));
if (!chromePath) { console.error('Chrome/Chromium 을 찾지 못했습니다. CHROME_PATH 환경변수로 경로를 지정하세요.'); process.exit(2); }

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'cover-'));
const htmlPath = path.join(work, 'cover.html');
const tpl = fs.readFileSync(path.join(HERE, 'template.html'), 'utf8');
fs.writeFileSync(htmlPath, tpl.replace('/*COVER*/null', JSON.stringify(cover).replace(/</g, '\\u003c')));

const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(chromePath, ['--headless=new', '--no-sandbox', `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(work, 'profile')}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(300); try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); target = l.find(t => t.type === 'page'); } catch {} }
if (!target) { console.error('Chrome 연결 실패'); chrome.kill(); process.exit(3); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = {};
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: pathToFileURL(htmlPath).href });
await sleep(1500);
await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true });
await sleep(600);
const outDir = path.join(ROOT, 'images', 'info');
fs.mkdirSync(outDir, { recursive: true });
const clip = { x: 0, y: 0, width: 1200, height: 630, scale: 1 };
for (const [fmt, ext, quality] of [['webp', 'webp', 82], ['jpeg', 'jpg', 86]]) {
  const r = await send('Page.captureScreenshot', { format: fmt, quality, clip });
  const out = path.join(outDir, `${slug}.${ext}`);
  fs.writeFileSync(out, Buffer.from(r.result.data, 'base64'));
  console.log('저장:', path.relative(ROOT, out), fs.statSync(out).size, 'bytes');
}
ws.close(); chrome.kill(); process.exit(0);
