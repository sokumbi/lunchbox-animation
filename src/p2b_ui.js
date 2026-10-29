/* =========================================================
   런치박스 UI 부품 — 계산기 액정(도트 글자) · 7세그먼트 숫자 · 추가 아이콘
   ========================================================= */
Object.assign(IC, {
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5M12 2.5v3.5"/>',
  camlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="16" r="1.6" fill="currentColor"/>',
  pingpong: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  bubbles: '<circle cx="9" cy="15" r="4"/><circle cx="16" cy="8" r="3"/><circle cx="17.5" cy="17" r="2"/>',
  hearts: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor"/>',
  boom: '<path d="M12 2.5l2 5 5-2-2 5 5 1.5-5 2 2 5-5-2-2 5-2-5-5 2 2-5-5-2 5-1.5-2-5 5 2z"/>',
  speed: '<path d="M3 6h9M3 12h14M3 18h9M15 6h3M19 12h2M15 18h3"/>',
  puff: '<path d="M7 17a4 4 0 0 1 0-8 5 5 0 0 1 9.5-1.5A4 4 0 1 1 17 17z"/>',
  excl: '<path d="M12 4v10"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>',
  quest: '<path d="M9 8a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.4-1.5 2.4v1"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>',
  drop: '<path d="M12 3.5c-3 4-5 7-5 10a5 5 0 0 0 10 0c0-3-2-6-5-10z"/>',
  light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  rain: '<path d="M7 14a4 4 0 0 1 .5-8 5 5 0 0 1 9.5 1A3.5 3.5 0 0 1 17 14z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>',
  snow: '<path d="M12 3v18M4.5 7.5l15 9M4.5 16.5l15-9"/>',
  dizzy: '<path d="M12 12a2 2 0 1 1 2-2 4 4 0 1 1-4 4 6 6 0 1 1 6-6"/>',
  text: '<path d="M5 6h14M12 6v13M9 19h6"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  wind: '<path d="M3 9h11a3 3 0 1 0-3-3M3 14h15a3 3 0 1 1-3 3M3 19h7"/>',
  foot: '<ellipse cx="9" cy="8" rx="3" ry="4.5" fill="currentColor" stroke="none"/><ellipse cx="15.5" cy="16" rx="3" ry="4.5" fill="currentColor" stroke="none"/>',
  wave: '<path d="M2 14c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3M2 19c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3"/><path d="M5 9c1-3 4-5 7-5"/>',
  drum: '<ellipse cx="12" cy="9" rx="8" ry="3"/><path d="M4 9v7c0 1.7 3.6 3 8 3s8-1.3 8-3V9M8 3l3 4M16 3l-3 4"/>',
  gong: '<circle cx="12" cy="13" r="6"/><circle cx="12" cy="13" r="2"/><path d="M4 21V5h16v16"/>',
  sad: '<circle cx="12" cy="12" r="9"/><path d="M8.5 16.5q3.5-3 7 0"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/>',
  spring: '<path d="M6 20h12M8 17c8 0 8-2.5 0-2.5s-8-2.5 0-2.5 8-2.5 0-2.5 8-2.5 0-2.5"/><circle cx="12" cy="4" r="1.6" fill="currentColor"/>',
  pop: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2"/>',
  splash: '<path d="M3 19c3 0 3-2 6-2s3 2 6 2 3-2 6-2"/><path d="M12 15c-2-3-4-5-4-8M12 15c2-3 4-5 4-8M12 15V5"/>',
  hold: '<rect x="3" y="6" width="5" height="12" rx="1"/><rect x="9.5" y="6" width="5" height="12" rx="1"/><rect x="16" y="6" width="5" height="12" rx="1"/>',
  menu: '<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="16" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/>',
  switchCam: '<path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 12.5a3 3 0 0 1 5.4-1.8M15 13.5a3 3 0 0 1-5.4 1.8"/><path d="M14.5 9v2h-2M9.5 17v-2h2"/>',
  ff: '<path d="M4 6l8 6-8 6zM12 6l8 6-8 6z" fill="currentColor" stroke="none"/>',
  rew: '<path d="M20 6l-8 6 8 6zM12 6l-8 6 8 6z" fill="currentColor" stroke="none"/>'
});

/* ---------- 계산기 액정: 글자를 작은 도트로 찍어요 ---------- */
const LCD_FONT = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
function lcdDots(text, px = 16) {
  const c = document.createElement('canvas'), x = c.getContext('2d');
  x.font = `700 ${px}px ${LCD_FONT}`;
  const w = Math.ceil(x.measureText(text).width) + 2, hh = px + 8;
  c.width = Math.max(1, w); c.height = hh;
  x.font = `700 ${px}px ${LCD_FONT}`; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText(text, 1, hh / 2 + 1);
  const d = x.getImageData(0, 0, c.width, hh).data;
  let top = hh, bot = -1;
  const on = [];
  for (let j = 0; j < hh; j++) for (let i = 0; i < c.width; i++) if (d[(j * c.width + i) * 4 + 3] > 110) { on.push([i, j]); top = Math.min(top, j); bot = Math.max(bot, j); }
  return { cols: c.width, rows: Math.max(1, bot - top + 1), top, on };
}
const LCD = {
  els: new Set(),
  make(text, cls = '') {
    const box = h('div', { class: 'lcd ' + cls, role: 'img', 'aria-label': text });
    const cv = h('canvas'); box.append(h('div', { class: 'lcd-glass' }, cv));
    box.__text = text; box.__cv = cv;
    this.els.add(box);
    requestAnimationFrame(() => this.paint(box));
    return box;
  },
  set(box, text) { if (!box || box.__text === text) return; box.__text = text; box.setAttribute('aria-label', text); this.paint(box); },
  paint(box) {
    const cv = box.__cv; if (!cv || !cv.isConnected) return;
    const w = cv.clientWidth, hh = cv.clientHeight; if (!w || !hh) return;
    const dpr = Math.min(3, devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr);
    const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, hh);
    const g = lcdDots(box.__text, 16);
    const pitch = Math.min((hh * .86) / g.rows, (w * .94) / g.cols);
    const ox = (w - g.cols * pitch) / 2, oy = (hh - g.rows * pitch) / 2, r = pitch * .4;
    // 꺼진 도트 (액정 배경 격자)
    x.fillStyle = 'rgba(37,44,31,.07)';
    const cols = Math.floor(w / pitch), rows = Math.floor(hh / pitch), gx = (w - cols * pitch) / 2, gy = (hh - rows * pitch) / 2;
    x.beginPath();
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const cx = gx + i * pitch + pitch / 2, cy = gy + j * pitch + pitch / 2; x.moveTo(cx + r, cy); x.arc(cx, cy, r, 0, 6.283); }
    x.fill();
    // 켜진 도트 — 격자에 맞춰 찍어요
    const sx = Math.round((ox - gx) / pitch), sy = Math.round((oy - gy) / pitch);
    x.fillStyle = 'rgba(37,44,31,.9)'; x.beginPath();
    for (const [i, j] of g.on) { const cx = gx + (i + sx) * pitch + pitch / 2, cy = gy + (j - g.top + sy) * pitch + pitch / 2; x.moveTo(cx + r, cy); x.arc(cx, cy, r, 0, 6.283); }
    x.fill();
  },
  repaintAll() { for (const b of [...this.els]) { if (!b.isConnected) { this.els.delete(b); continue; } this.paint(b); } }
};
if (window.ResizeObserver) { const ro = new ResizeObserver(() => LCD.repaintAll()); addEventListener('DOMContentLoaded', () => ro.observe(document.getElementById('app'))); setTimeout(() => { const a = document.getElementById('app'); a && ro.observe(a); }, 0); }
if (document.fonts && document.fonts.load) document.fonts.load(`700 16px "Noto Sans KR"`, '가나다').then(() => LCD.repaintAll()).catch(() => { });

/* ---------- 7세그먼트 숫자 (FRAME 카운터) ---------- */
function seg7(str) {
  const SEG = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg' };
  const dw = 60, dh = 100, gap = 18, t = 11;
  let s = '';
  [...str].forEach((ch, n) => {
    const ox = n * (dw + gap);
    const P = {
      a: [ox + t * .6, 0, dw - t * 1.2, t], d: [ox + t * .6, dh - t, dw - t * 1.2, t], g: [ox + t * .6, dh / 2 - t / 2, dw - t * 1.2, t],
      f: [ox, t * .6, t, dh / 2 - t * .9], b: [ox + dw - t, t * .6, t, dh / 2 - t * .9], e: [ox, dh / 2 + t * .3, t, dh / 2 - t * .9], c: [ox + dw - t, dh / 2 + t * .3, t, dh / 2 - t * .9]
    };
    for (const k in P) { const [x, y, w, hh] = P[k]; s += `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="${t / 2}" class="${(SEG[ch] || '').includes(k) ? 'on' : 'off'}"/>`; }
  });
  const W7 = str.length * dw + (str.length - 1) * gap;
  return `<svg class="seg7" viewBox="-4 -4 ${W7 + 8} ${dh + 8}" aria-hidden="true">${s}</svg>`;
}

/* ---------- 런치박스 키 만들기 ---------- */
function key(label, { ic, cls = '', onclick, aria, title, html, disabled } = {}) {
  return h('button', { class: 'key ' + cls, type: 'button', onclick, disabled: disabled || null, 'aria-label': aria || null, title: title || null,
    html: html || ((ic ? icon(ic, 'ki') : '') + (label ? `<span class="kl">${label}</span>` : '')) });
}
