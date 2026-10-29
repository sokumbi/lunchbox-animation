'use strict';
/* =========================================================
   런치박스애니메이션 — 스톱모션 애니메이션 만들기
   (앱 이름은 아래 BRAND 에서 바꿀 수 있어요)
   ========================================================= */
const BRAND = { app: '런치박스애니메이션' };
/* 무대 해상도 — 작품 포맷(P.fmt)에 따라 바뀌어요. 긴 변 960 (setFormat, p3a_core) */
let W = 960, H = 540;
const $ = (s, r = document) => r.querySelector(s);
/* 세로로 들고 있어도 가로로 보이게 화면 전체를 90° 돌려요. 돌렸을 때 손가락 좌표도 같이 바꿔요. */
const ROT = { on: false };
function appPt(e) { return ROT.on ? { x: e.clientY, y: innerWidth - e.clientX } : { x: e.clientX, y: e.clientY }; }
function appRect(el) {
  const r = el.getBoundingClientRect(); if (!ROT.on) return r;
  return { left: r.top, top: innerWidth - r.right, width: r.height, height: r.width, right: r.bottom, bottom: innerWidth - r.left };
}
function layoutApp() {
  const app = document.getElementById('app'); if (!app) return;
  const coarse = matchMedia('(pointer:coarse)').matches;
  ROT.on = innerHeight > innerWidth && (coarse || innerWidth < 900);
  if (ROT.on) Object.assign(app.style, { width: innerHeight + 'px', height: innerWidth + 'px', left: innerWidth + 'px', top: '0px', transform: 'rotate(90deg)', transformOrigin: '0 0' });
  else Object.assign(app.style, { width: '', height: '', left: '0px', top: '0px', transform: '', transformOrigin: '' });
}
addEventListener('resize', layoutApp);
addEventListener('orientationchange', () => setTimeout(layoutApp, 250));
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const fmt = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); };
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; }
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}
function seeded(seed) { let s = 0; for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ---------- 아이콘 ---------- */
const IC = {
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  cam: '<path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  onion: '<rect x="3" y="7" width="12" height="12" rx="2" opacity=".45"/><rect x="6" y="5" width="12" height="12" rx="2" opacity=".7"/><rect x="9" y="3" width="12" height="12" rx="2"/>',
  grid: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16M3 9.5h18M3 14.5h18"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  speaker: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  home: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  flip: '<path d="M12 3v18M8 7 3 12l5 5zM16 7l5 5-5 5z"/>',
  rotL: '<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/>',
  rotR: '<path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M20 4v5h-5"/>',
  bigger: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6M11 8v6"/>',
  smaller: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6"/>',
  front: '<rect x="3" y="3" width="11" height="11" rx="2" opacity=".5"/><rect x="10" y="10" width="11" height="11" rx="2" fill="currentColor"/>',
  backL: '<rect x="10" y="10" width="11" height="11" rx="2" opacity=".5"/><rect x="3" y="3" width="11" height="11" rx="2" fill="currentColor"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 7.5 20 18M8.5 16.5 20 6"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-1 .2"/><path d="M20 4v14h-7"/>',
  sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  rewind: '<path d="M11 6 4 12l7 6zM20 6l-7 6 7 6z" fill="currentColor" stroke="none"/>',
  insert: '<path d="M12 4v16M4 8h4M4 16h4M16 8h4M16 16h4"/>'
};
const icon = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;
const ib = (n, label, cls = 'btn sm', attrs = {}) => h('button', { class: cls, type: 'button', ...attrs, html: icon(n) + (label ? `<span>${label}</span>` : '') , 'aria-label': attrs['aria-label'] || label || n });

/* ---------- 토스트 & 모달 ---------- */
let toastT;
function toast(msg, ms = 2400, top = false) {
  $$('.toast').forEach(t => t.remove());
  const t = h('div', { class: 'toast' + (top ? ' top' : ''), role: 'status' }, msg);
  ($('#app') || document.body).append(t); clearTimeout(toastT); toastT = setTimeout(() => t.remove(), ms);
}
function modal(build, { wide = false, close = true } = {}) {
  const bg = h('div', { class: 'modal-bg' });
  const box = h('div', { class: 'modal' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true' });
  bg.append(box); $('#modals').append(bg);
  const api = { close() { bg.remove(); api.onclose && api.onclose(); }, box };
  if (close) bg.addEventListener('pointerdown', e => { if (e.target === bg) api.close(); });
  build(box, api);
  setTimeout(() => { const f = box.querySelector('input,textarea,select'); f && f.focus(); }, 60);
  return api;
}
function confirmBox(title, text, okLabel = '확인', danger = false) {
  return new Promise(res => {
    modal((b, m) => {
      b.append(h('h2', {}, title), h('p', { class: 'hint', style: { fontSize: '15px', margin: 0 } }, text),
        h('div', { class: 'acts' },
          h('button', { class: 'btn', onclick: () => { m.close(); res(false); } }, '취소'),
          h('button', { class: 'btn ' + (danger ? 'rec' : 'primary'), onclick: () => { m.close(); res(true); } }, okLabel)));
    });
  });
}

/* ---------- 저장소 (브라우저 IndexedDB) ---------- */
const DB = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      try {
        const r = indexedDB.open('artenova-anistudio', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('projects', { keyPath: 'id' });
        r.onsuccess = () => { this._db = r.result; res(this._db); };
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
  },
  async tx(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction('projects', mode); const st = t.objectStore('projects');
      const out = fn(st); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error);
    });
  },
  put(obj) { return this.tx('readwrite', st => st.put(obj)); },
  get(id) { return this.tx('readonly', st => st.get(id)); },
  del(id) { return this.tx('readwrite', st => st.delete(id)); },
  all() { return this.tx('readonly', st => st.getAll()); }
};

/* =========================================================
   그림 도구
   ========================================================= */
const INK = '#1e1a2c';
function paperShadow(ctx, on = true) {
  ctx.shadowColor = on ? 'rgba(0,0,0,.33)' : 'transparent';
  ctx.shadowOffsetX = on ? 2 : 0; ctx.shadowOffsetY = on ? 4 : 0; ctx.shadowBlur = on ? 3 : 0;
}
/* =========================================================
   효과 (영상 위에 얹는 그림)
   ========================================================= */
const FX = [
  { id: 'sparkle', name: '반짝반짝' }, { id: 'bubbles', name: '보글보글' }, { id: 'hearts', name: '하트' },
  { id: 'boom', name: '쾅!' }, { id: 'speed', name: '집중선' }, { id: 'puff', name: '펑 연기' },
  { id: 'excl', name: '느낌표' }, { id: 'quest', name: '물음표' }, { id: 'sweat', name: '땀방울' },
  { id: 'light', name: '빛줄기' }, { id: 'rain', name: '비' }, { id: 'snow', name: '눈' },
  { id: 'dizzy', name: '어질어질' }, { id: 'text', name: '글자' }
];
const FULLSCREEN_FX = { rain: 1, snow: 1, light: 1 };
function drawFx(ctx, e, lt) {
  // lt: 0~dur 사이 경과 시간
  const x = e.x * W, y = e.y * H, s = e.s || 1, rnd = seeded(e.id || e.type), d = e.dur || 2;
  const inA = clamp(lt / .25, 0, 1), outA = clamp((d - lt) / .3, 0, 1), A = Math.min(inA, outA);
  ctx.save(); paperShadow(ctx, false); ctx.globalAlpha = A;
  switch (e.type) {
    case 'sparkle': {
      for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, r = 20 + rnd() * 70, tw = (Math.sin(lt * 7 + i * 1.7) + 1) / 2;
        star4(ctx, x + Math.cos(a) * r * s, y + Math.sin(a) * r * s, (6 + rnd() * 12) * s * (.3 + tw), i % 3 ? '#fff6b0' : '#ffd23f'); }
      break; }
    case 'bubbles': {
      ctx.lineWidth = 3 * s; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.fillStyle = 'rgba(200,235,255,.25)';
      for (let i = 0; i < 10; i++) { const bx = x + (rnd() - .5) * 90 * s, sp = 40 + rnd() * 60, r = (5 + rnd() * 11) * s; const yy = y - ((lt * sp + rnd() * 100) % 160) * s;
        ctx.beginPath(); ctx.arc(bx + Math.sin(lt * 3 + i) * 6 * s, yy, r, 0, 7); ctx.fill(); ctx.stroke(); }
      break; }
    case 'hearts': {
      for (let i = 0; i < 6; i++) { const hx = x + (rnd() - .5) * 110 * s, yy = y - ((lt * 50 + rnd() * 90) % 130) * s, k = (12 + rnd() * 10) * s;
        heart(ctx, hx + Math.sin(lt * 2 + i) * 8, yy, k, i % 2 ? '#ff6f91' : '#ff9fb4'); }
      break; }
    case 'boom': {
      const k = s * (1 + .15 * Math.sin(Math.min(lt, .4) * 20) * (1 - Math.min(lt / .4, 1))) * (lt < .15 ? lt / .15 : 1);
      ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(-.08);
      burst(ctx, 0, 0, 96, 60, 14, '#ffd23f'); burst(ctx, 0, 0, 70, 44, 14, '#ff7a3d', false);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.font = '52px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeText(e.text || '쾅!', 0, 4); ctx.fillText(e.text || '쾅!', 0, 4);
      break; }
    case 'speed': {
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 40; i++) { const a = rnd() * 6.28, r0 = (110 + rnd() * 40) * s, len = (200 + rnd() * 300), j = Math.sin(lt * 30 + i) * 10;
        ctx.lineWidth = 2 + rnd() * 5; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (r0 + j), y + Math.sin(a) * (r0 + j)); ctx.lineTo(x + Math.cos(a) * (r0 + len), y + Math.sin(a) * (r0 + len)); ctx.stroke(); }
      break; }
    case 'puff': {
      const p = clamp(lt / .8, 0, 1);
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + rnd(), r = ease(p) * 70 * s; const pr = (26 - p * 10) * s;
        ctx.fillStyle = 'rgba(240,240,245,' + (1 - p * .7) + ')'; ctx.strokeStyle = 'rgba(30,26,44,' + (1 - p) + ')'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * .7, pr, 0, 7); ctx.fill(); ctx.stroke(); }
      break; }
    case 'excl': case 'quest': {
      const b = Math.abs(Math.sin(lt * 6)) * 10 * s * (lt < 1 ? 1 : .4);
      ctx.translate(x, y - b); ctx.scale(s, s);
      ctx.font = '86px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.fillStyle = e.type === 'excl' ? '#ff5a4a' : '#ffd23f';
      const ch = e.type === 'excl' ? '!' : '?'; ctx.strokeText(ch, 0, 0); ctx.fillText(ch, 0, 0);
      break; }
    case 'sweat': {
      for (let i = 0; i < 3; i++) { const yy = y + ((lt * 60 + i * 20) % 50) * s; const xx = x + (i - 1) * 22 * s;
        ctx.fillStyle = '#8ad0f5'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xx, yy - 16 * s); ctx.quadraticCurveTo(xx + 11 * s, yy, xx, yy + 6 * s); ctx.quadraticCurveTo(xx - 11 * s, yy, xx, yy - 16 * s); ctx.fill(); ctx.stroke(); }
      break; }
    case 'light': {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) { const bx = x + (i - 2.5) * 70 * s + Math.sin(lt + i) * 20; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,240,180,.35)'); g.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx - 14, 0); ctx.lineTo(bx + 14, 0); ctx.lineTo(bx + 60, H); ctx.lineTo(bx - 20, H); ctx.fill(); }
      break; }
    case 'rain': {
      ctx.strokeStyle = 'rgba(200,225,255,.7)'; ctx.lineWidth = 2;
      for (let i = 0; i < 90; i++) { const rx = rnd() * W * 1.2, sp = 600 + rnd() * 300, yy = (lt * sp + rnd() * H) % (H + 40) - 20; ctx.beginPath(); ctx.moveTo(rx - yy * .15, yy); ctx.lineTo(rx - yy * .15 - 5, yy + 18); ctx.stroke(); }
      ctx.fillStyle = 'rgba(40,60,100,.18)'; ctx.fillRect(0, 0, W, H);
      break; }
    case 'snow': {
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (let i = 0; i < 70; i++) { const sx = rnd() * W, sp = 30 + rnd() * 50, yy = (lt * sp + rnd() * H) % H, r = 2 + rnd() * 4; ctx.beginPath(); ctx.arc(sx + Math.sin(lt + i) * 14, yy, r, 0, 7); ctx.fill(); }
      break; }
    case 'dizzy': {
      ctx.translate(x, y); ctx.scale(s, s * .45);
      for (let i = 0; i < 4; i++) { const a = lt * 4 + i * Math.PI / 2; ctx.save(); ctx.scale(1, 1 / .45); star4(ctx, Math.cos(a) * 60, Math.sin(a) * 60 * .45, 12, '#ffd23f'); ctx.restore(); }
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 60, 60, 0, 0, 7); ctx.stroke();
      break; }
    case 'text': {
      ctx.translate(x, y); ctx.scale(s, s); const tx = e.text || '앗!';
      ctx.font = '54px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(tx).width + 50;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(-w / 2, -42, w, 84, 40); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-20, 40); ctx.lineTo(-34, 70); ctx.lineTo(0, 41); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.fillText(tx, 0, 3);
      break; }
  }
  ctx.restore();
}
function star4(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill(); }
function heart(ctx, x, y, k, c) { ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + k * .9); ctx.bezierCurveTo(x - k * 1.6, y - k * .2, x - k * .6, y - k * 1.3, x, y - k * .35); ctx.bezierCurveTo(x + k * .6, y - k * 1.3, x + k * 1.6, y - k * .2, x, y + k * .9); ctx.fill(); ctx.stroke(); }
function burst(ctx, x, y, R, r, n, c, stroke = true) { ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * 6.283, rr = i % 2 ? r : R; ctx.lineTo(x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); if (stroke) ctx.stroke(); }

/* =========================================================
   소리 — 효과음·배경음악을 앱 안에서 직접 만들어요 (파일 없이)
   ========================================================= */
const SFX = [
  { id: 'pop', name: '뽁', desc: '짠! 나타날 때' }, { id: 'boing', name: '뿅', desc: '깡충 뛸 때' },
  { id: 'boom', name: '쾅', desc: '부딪힐 때' }, { id: 'swoosh', name: '휘익', desc: '빠르게 지나갈 때' },
  { id: 'ding', name: '띠링', desc: '좋은 생각!' }, { id: 'sparkle', name: '반짝', desc: '마법·보물' },
  { id: 'drop', name: '똑', desc: '물방울' }, { id: 'bubbles', name: '보글보글', desc: '물속 거품' },
  { id: 'splash', name: '첨벙', desc: '물에 들어갈 때' }, { id: 'wave', name: '철썩', desc: '파도' },
  { id: 'steps', name: '깡충깡충', desc: '토끼 발걸음' }, { id: 'drum', name: '둥둥', desc: '북소리' },
  { id: 'gong', name: '징', desc: '용궁·등장' }, { id: 'fail', name: '띠로리', desc: '속았을 때' }
];
const BGM = [
  { id: 'sea', name: '평화로운 바닷속', desc: '잔잔하고 몽글몽글' },
  { id: 'palace', name: '용궁 궁중음악', desc: '느리고 장엄하게' },
  { id: 'worry', name: '걱정과 슬픔', desc: '아픈 용왕님' },
  { id: 'journey', name: '씩씩한 길 떠나기', desc: '힘차게 출발' },
  { id: 'tension', name: '두근두근 긴장', desc: '위기의 순간' },
  { id: 'chase', name: '신나는 도망', desc: '빠르고 경쾌하게' },
  { id: 'happy', name: '행복한 마무리', desc: '밝은 끝맺음' }
];
const midi = n => 440 * Math.pow(2, (n - 69) / 12);

const AE = {
  ctx: null, sfx: {}, bgm: {}, buses: {},
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.connect(c.destination);
    for (const k of ['bgm', 'sfx', 'voice', 'narr', 'ui']) { const g = c.createGain(); g.connect(this.master); this.buses[k] = g; }
    this.duck = c.createGain(); this.duck.connect(this.buses.bgm);
    return c;
  },
  noiseBuf(oc, dur) { const b = oc.createBuffer(1, Math.ceil(oc.sampleRate * dur), oc.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; },
  async render(dur, fn) {
    const sr = 44100, oc = new OfflineAudioContext(1, Math.ceil(sr * dur), sr);
    const out = oc.createGain(); out.connect(oc.destination);
    fn(oc, out, this.mk(oc, out));
    return oc.startRendering();
  },
  mk(oc, out) {
    const env = (g, t, a, d, peak) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
    const tone = (type, f0, f1, t, dur, peak = .5, a = .005) => { const o = oc.createOscillator(), g = oc.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur); env(g, t, a, dur, peak); o.connect(g).connect(out); o.start(t); o.stop(t + a + dur + .05); return o; };
    const noise = (t, dur, peak, ftype = 'bandpass', f0 = 1000, f1 = 1000, q = 1) => { const s = oc.createBufferSource(); s.buffer = this.noiseBuf(oc, dur + .1); const f = oc.createBiquadFilter(); f.type = ftype; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); const g = oc.createGain(); env(g, t, .01, dur, peak); s.connect(f).connect(g).connect(out); s.start(t); s.stop(t + dur + .1); };
    const pluck = (t, f, dur = .8, v = .3) => { const o = oc.createOscillator(), o2 = oc.createOscillator(), g = oc.createGain(), lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur); o.type = 'triangle'; o2.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.03, t); o.frequency.exponentialRampToValueAtTime(f, t + .06); o2.frequency.value = f; const g2 = oc.createGain(); g2.gain.value = .25; env(g, t, .004, dur, v); o.connect(lp); o2.connect(g2).connect(lp); lp.connect(g).connect(out); o.start(t); o2.start(t); o.stop(t + dur + .1); o2.stop(t + dur + .1); };
    const pad = (t, f, dur, v = .12) => { for (const det of [-4, 4]) { const o = oc.createOscillator(), g = oc.createGain(); o.type = 'sine'; o.frequency.value = f; o.detune.value = det; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * .35); g.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(out); o.start(t); o.stop(t + dur + .05); } };
    const flute = (t, f, dur, v = .16) => { const o = oc.createOscillator(), g = oc.createGain(), l = oc.createOscillator(), lg = oc.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * .98, t); o.frequency.linearRampToValueAtTime(f, t + .12); l.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .012, t + dur * .6); l.connect(lg).connect(o.frequency); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + .08); g.gain.setValueAtTime(v, t + dur - .15); g.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(out); o.start(t); l.start(t); o.stop(t + dur + .05); l.stop(t + dur + .05); noise(t, .12, v * .25, 'bandpass', f * 2, f * 2, 2); };
    const drum = (t, v = .6, f = 120) => { tone('sine', f, f * .45, t, .35, v); noise(t, .05, v * .3, 'lowpass', 900, 300); };
    const tick = (t, v = .12) => noise(t, .04, v, 'highpass', 6000, 8000, .7);
    const bell = (t, f, dur = 1.5, v = .18) => { tone('sine', f, f, t, dur, v); tone('sine', f * 2.76, f * 2.76, t, dur * .4, v * .35); tone('sine', f * 5.4, f * 5.4, t, dur * .2, v * .12); };
    return { env, tone, noise, pluck, pad, flute, drum, tick, bell };
  },
  SFX_DEF: {
    pop: [0.25, (oc, o, m) => { m.tone('sine', 900, 180, 0, .12, .7); m.noise(0, .03, .3, 'highpass', 3000, 3000); }],
    boing: [0.6, (oc, o, m) => { const os = m.tone('sine', 180, 900, 0, .45, .55); const l = oc.createOscillator(), lg = oc.createGain(); l.frequency.value = 18; lg.gain.value = 60; l.connect(lg).connect(os.frequency); l.start(0); l.stop(.6); }],
    boom: [1.2, (oc, o, m) => { m.tone('sine', 110, 35, 0, 1, .9); m.noise(0, .8, .7, 'lowpass', 1800, 120); }],
    swoosh: [0.6, (oc, o, m) => { m.noise(0, .5, .6, 'bandpass', 400, 3500, 2.5); }],
    ding: [1.4, (oc, o, m) => { m.bell(0, 1318, 1.1, .35); m.bell(.13, 1760, 1.2, .35); }],
    sparkle: [1.4, (oc, o, m) => { [2093, 2637, 3136, 2349, 2793, 3520].forEach((f, i) => m.tone('sine', f, f, i * .07, .5, .18)); }],
    drop: [0.35, (oc, o, m) => { m.tone('sine', 500, 1500, 0, .09, .6); m.tone('sine', 1400, 1400, .09, .15, .15); }],
    bubbles: [1.4, (oc, o, m) => { for (let i = 0; i < 11; i++) { const t = i * .11 + Math.random() * .04, f = 300 + Math.random() * 500; m.tone('sine', f, f * 2.4, t, .07, .3); } }],
    splash: [1.2, (oc, o, m) => { m.noise(0, .9, .7, 'bandpass', 2500, 500, .8); m.tone('sine', 220, 70, 0, .3, .4); for (let i = 0; i < 6; i++) m.tone('sine', 700 + Math.random() * 600, 1600, .15 + i * .09, .06, .15); }],
    wave: [3.2, (oc, o, m) => { const s = oc.createBufferSource(); s.buffer = AE.noiseBuf(oc, 3.2); const f = oc.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(300, 0); f.frequency.linearRampToValueAtTime(2200, 1.1); f.frequency.linearRampToValueAtTime(400, 3); const g = oc.createGain(); g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.7, 1.1); g.gain.linearRampToValueAtTime(0, 3.1); s.connect(f).connect(g).connect(o); s.start(0); }],
    steps: [1.2, (oc, o, m) => { for (let i = 0; i < 4; i++) { m.tone('sine', 260, 120, i * .26, .09, .55); m.noise(i * .26, .04, .2, 'bandpass', 1500, 1500, 1); } }],
    drum: [1.4, (oc, o, m) => { m.drum(0, .9, 100); m.drum(.45, .8, 100); }],
    gong: [3.2, (oc, o, m) => { [180, 263, 377, 455, 612].forEach((f, i) => m.tone('sine', f * 1.01, f, 0, 3 - i * .4, .25 - i * .035, .01)); m.noise(0, .2, .2, 'bandpass', 600, 300, 1); }],
    fail: [1.6, (oc, o, m) => { [587, 554, 523, 494].forEach((f, i) => { const os = m.tone('triangle', f, f, i * .3, i === 3 ? .8 : .26, .3); }); }]
  },
  async getSfx(id) {
    if (!this.sfx[id]) { const d = this.SFX_DEF[id]; this.sfx[id] = this.render(d[0], d[1]); }
    return this.sfx[id];
  },
  BGM_DEF: {
    sea: [12, (oc, o, m) => { const ch = [[57, 64, 69], [55, 62, 67], [53, 60, 65], [55, 62, 69]]; ch.forEach((c, i) => c.forEach(n => m.pad(i * 3, midi(n), 3.4, .07))); const r = seeded('sea'); for (let i = 0; i < 14; i++) m.bell(r() * 11, midi([76, 79, 81, 84, 86][Math.floor(r() * 5)]), 1.6, .07); }],
    palace: [12, (oc, o, m) => { [0, 2, 4, 6, 8, 10].forEach((t, i) => { m.drum(t, .5, 90); if (i % 2) m.drum(t + .5, .25, 140); }); const mel = [[67, 2], [69, 1], [72, 1], [74, 2], [72, 1], [69, 1], [67, 2], [64, 1], [67, 1]]; let t = 0; mel.forEach(([n, d]) => { m.flute(t, midi(n), d * .98, .13); t += d; }); [43, 50, 48, 43].forEach((n, i) => m.pad(i * 3, midi(n), 3.2, .08)); for (let i = 0; i < 12; i++) m.pluck(i + .5, midi([55, 60, 62, 67][i % 4]), .9, .12); }],
    worry: [12.8, (oc, o, m) => { const mel = [[69, 1.6], [67, .8], [64, 1.6], [62, .8], [60, 1.6], [62, .8], [64, 3.2], [57, 2.4]]; let t = 0; mel.forEach(([n, d]) => { m.flute(t, midi(n), d * .97, .12); t += d; }); [[45, 52], [41, 48], [43, 50], [45, 52]].forEach((c, i) => c.forEach(n => m.pad(i * 3.2, midi(n), 3.4, .07))); }],
    journey: [9.6, (oc, o, m) => { const sc = [60, 62, 64, 67, 69, 72, 74]; const r = seeded('jr'); let k = 3; for (let i = 0; i < 16; i++) { const t = i * .6; if (i % 4 === 0) m.drum(t, .55, 110); if (i % 4 === 2) m.drum(t, .35, 150); m.tick(t + .3); k = clamp(k + Math.floor(r() * 3) - 1, 0, sc.length - 1); m.pluck(t, midi(sc[k]), .55, .2); if (i % 2 === 0) m.pluck(t, midi(sc[k] - 12), .5, .12); } [48, 43, 45, 43].forEach((n, i) => m.pad(i * 2.4, midi(n), 2.5, .06)); }],
    tension: [8, (oc, o, m) => { for (let i = 0; i < 32; i++) { const t = i * .25; m.pluck(t, midi(i % 8 === 6 ? 46 : 45), .22, .22); if (i % 8 === 0) m.drum(t, .6, 70); } [[57, 60], [56, 59]].forEach((c, i) => c.forEach(n => { const g = oc.createGain(), os = oc.createOscillator(), tr = oc.createOscillator(), tg = oc.createGain(); os.type = 'sawtooth'; os.frequency.value = midi(n); const f = oc.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; tr.frequency.value = 9; tg.gain.value = .03; g.gain.value = .035; tr.connect(tg).connect(g.gain); os.connect(f).connect(g).connect(o); os.start(i * 4); tr.start(i * 4); os.stop(i * 4 + 4); tr.stop(i * 4 + 4); })); }],
    chase: [6.4, (oc, o, m) => { const sc = [62, 64, 67, 69, 71, 74, 76]; const pat = [0, 2, 4, 5, 4, 2, 3, 1, 0, 2, 4, 6, 5, 4, 2, 1]; for (let i = 0; i < 32; i++) { const t = i * .2; m.pluck(t, midi(sc[pat[i % 16]] + (i >= 16 ? 0 : 0)), .18, .2); m.tick(t + .1, .08); if (i % 2 === 0) m.drum(t, i % 4 === 0 ? .55 : .3, i % 4 === 0 ? 100 : 160); } [50, 55, 52, 50].forEach((n, i) => m.pluck(i * 1.6, midi(n), 1.5, .15)); }],
    happy: [8.8, (oc, o, m) => { const ar = [[60, 64, 67, 72], [65, 69, 72, 77], [67, 71, 74, 79], [60, 64, 67, 72]]; ar.forEach((c, i) => { for (let j = 0; j < 8; j++) { const t = i * 2.2 + j * .275; m.bell(t, midi(c[j % 4] + 12), .5, .07); if (j % 2 === 0) m.pluck(t, midi(c[(j / 2) % 4]), .4, .14); } m.drum(i * 2.2, .45, 110); m.drum(i * 2.2 + 1.1, .3, 140); m.pad(i * 2.2, midi(c[0] - 12), 2.3, .07); }); }]
  },
  async getBgm(id) {
    if (!this.bgm[id]) { const d = this.BGM_DEF[id]; this.bgm[id] = this.render(d[0], d[1]); }
    return this.bgm[id];
  },
  preview: null,
  async playPreview(kind, id) {
    this.init(); this.stopPreview();
    const buf = kind === 'sfx' ? await this.getSfx(id) : await this.getBgm(id);
    const s = this.ctx.createBufferSource(); s.buffer = buf; s.connect(this.buses.ui); s.start();
    if (kind === 'bgm') s.stop(this.ctx.currentTime + Math.min(buf.duration, 8));
    this.preview = s; return s;
  },
  stopPreview() { try { this.preview && this.preview.stop(); } catch (e) { } this.preview = null; },
  click(v = .25) { if (!this.ctx) return; const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(1800, c.currentTime); o.frequency.exponentialRampToValueAtTime(600, c.currentTime + .05); g.gain.setValueAtTime(v, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .08); o.connect(g).connect(this.buses.ui); o.start(); o.stop(c.currentTime + .1); }
};
