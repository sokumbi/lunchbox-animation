/* =========================================================
   Stop Motion Studio 동작 따라 하기 (2026-10-29, 아이폰 실제 앱을 눌러 보며 옮김)
   · 컷 메뉴(그리드): 카메라 삽입 · 일시중지 · 오디오 · 편집 · 장면 나누기 · 선택 · 잘라내기 · 복사 · 붙여넣기 · 거꾸로 · 삭제
   · 눈금 막대(ruler): 가운데 주황 줄에 맞춰 손가락으로 밀어 값을 골라요 (일시중지·속도·볼륨·회전·밝기)
   · 아래 판(smsSheet): ✕ · 제목 · ✓, 그 아래 아이콘 탭
   · 프로젝트 설정(⚙): 속도 · 페이드 · 전경 · 효과(색) · 품질 · 재생 · 기타
   · 컷 편집: 회전 · 뒤집기 · 밝기 · 대비 · 색 / 소리 클립: 볼륨 · 속도 · 목소리 효과
   · 더하기: 이미지 · 비디오 · 오디오 · 제목 카드 · 제작진
   소리·효과 위치({sid, off})는 컷을 넣고 빼거나 길이를 바꿀 때 같이 옮겨서 어긋나지 않게 해요
   ========================================================= */
Object.assign(IC, {
  select: '<rect x="3" y="6" width="5" height="12" rx="1"/><rect x="9.5" y="6" width="5" height="12" rx="1" fill="currentColor"/><rect x="16" y="6" width="5" height="12" rx="1"/>',
  paste: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6"/>',
  split: '<path d="M12 3v18M4 7h5v10H4M20 7h-5v10h5"/>',
  reverse: '<path d="M9 7H5V3M5 7a8 8 0 1 1-1.5 6"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  titlecard: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h10M9 14h6"/>',
  credits: '<circle cx="9" cy="9" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 8h5M16 12h5M17 16h4"/>',
  fade: '<path d="M4 18L12 6l8 12z"/>',
  fg: '<rect x="3" y="5" width="18" height="14" rx="2"/><rect x="7" y="8.5" width="10" height="7" rx="1" stroke-dasharray="2 2"/>',
  quality: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10v4M7 12h3M10 10v4M14 10h1.5a2 2 0 0 1 0 4H14z"/>',
  loop: '<path d="M4 11V9a3 3 0 0 1 3-3h11l-3-3M20 13v2a3 3 0 0 1-3 3H6l3 3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  flipV: '<path d="M3 12h18M6 4h12l-6 5zM6 20h12l-6-5z"/>'
});

/* ---------- 작품 모양(look): 페이드 · 전경 · 색 · 품질 · 반복 재생 ---------- */
function look() { return P.look || (P.look = { fin: 'none', fout: 'none', fg: 'none', filt: 'none', q: 'hd', loop: false }); }
const FILTS = [['none', '없음'], ['gray', '흑백'], ['sepia', '세피아'], ['old', '옛날 영화'], ['warm', '따뜻하게'], ['cool', '차갑게'], ['night', '밤']];
const FGS = [['none', '없음'], ['binoc', '쌍안경'], ['frame', '액자'], ['bars', '영화 띠'], ['round', '둥근 창'], ['film', '필름']];
const FADES = [['none', '없음'], ['black', '검정'], ['white', '흰색']];
const QUALS = [['sd', 'SD', '854×480 · 가벼워요'], ['hd', 'HD', '1280×720'], ['fhd', 'FHD', '1920×1080 · 선명해요']];
function drawFilt(ctx, k) {
  if (!k || k === 'none') return;
  const blend = (op, color, a = 1) => { ctx.save(); ctx.globalCompositeOperation = op; ctx.globalAlpha = a; ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore(); };
  if (k === 'gray' || k === 'sepia' || k === 'old') blend('saturation', '#808080');
  if (k === 'sepia' || k === 'old') blend('color', '#8a5a2b', .85);
  if (k === 'warm') blend('soft-light', '#ff9a3c', .55);
  if (k === 'cool') blend('soft-light', '#3c8cff', .55);
  if (k === 'night') { blend('multiply', '#2b3a78', .75); blend('screen', '#0a1030', .3); }
  if (k === 'old') {
    ctx.save(); const g = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,10,0,.75)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,240,210,.35)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < 3; i++) { const x = Math.random() * W; ctx.moveTo(x, 0); ctx.lineTo(x + (Math.random() - .5) * 20, H); }
    ctx.stroke(); ctx.restore();
  }
}
function drawFg(ctx, k) {
  if (!k || k === 'none') return;
  ctx.save(); ctx.fillStyle = '#000';
  if (k === 'binoc') { const r = H * .42; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2 - r * .78, H / 2, r, 0, 7); ctx.moveTo(W / 2 + r * .78 + r, H / 2); ctx.arc(W / 2 + r * .78, H / 2, r, 0, 7); ctx.fill('evenodd'); }
  else if (k === 'frame') { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#f3d27a'); g.addColorStop(.5, '#a8741a'); g.addColorStop(1, '#f0c862'); ctx.strokeStyle = g; ctx.lineWidth = 44; ctx.strokeRect(22, 22, W - 44, H - 44); ctx.strokeStyle = '#5a3a08'; ctx.lineWidth = 4; ctx.strokeRect(44, 44, W - 88, H - 88); }
  else if (k === 'bars') { const b = H * .12; ctx.fillRect(0, 0, W, b); ctx.fillRect(0, H - b, W, b); }
  else if (k === 'round') { const g = ctx.createRadialGradient(W / 2, H / 2, H * .38, W / 2, H / 2, H * .52); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, '#000'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  else if (k === 'film') { const b = 46; ctx.fillRect(0, 0, W, b); ctx.fillRect(0, H - b, W, b); ctx.fillStyle = '#f6f6f1'; for (let x = 14; x < W; x += 44) { ctx.beginPath(); ctx.roundRect(x, 13, 22, 20, 4); ctx.roundRect(x, H - 33, 22, 20, 4); ctx.fill(); } }
  ctx.restore();
}
function drawFade(ctx, t, lk, total) {
  const F = .8; let a = 0, c = null;
  if (lk.fin !== 'none' && t < F) { a = 1 - t / F; c = lk.fin; }
  if (lk.fout !== 'none' && t > total - F) { const b = (t - (total - F)) / F; if (b > a) { a = b; c = lk.fout; } }
  if (a <= 0 || !c) return;
  ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = c === 'white' ? '#fff' : '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
}

/* ---------- 눈금 막대 ---------- */
function ruler({ min, max, step = 1, value, major = 5, bigAt = null, label = v => v, onInput }) {
  const PX = 14, n = Math.round((max - min) / step);
  const track = h('div', { class: 'rl-track' });
  for (let k = 0; k <= n; k++) { const v = +(min + k * step).toFixed(3), big = bigAt ? bigAt(v) : k % major === 0; track.append(h('i', { class: big ? 'b' : '' }, big ? h('span', {}, String(label(v))) : '')); }
  const sc = h('div', { class: 'rl-sc' }, track), box = h('div', { class: 'rl' }, sc, h('b', { class: 'rl-mark' }));
  let cur = value, lock = 0;
  sc.addEventListener('scroll', () => {
    if (performance.now() < lock) return;
    const v = +clamp(min + Math.round(sc.scrollLeft / PX) * step, min, max).toFixed(3);
    if (v !== cur) { cur = v; onInput(v); }
  }, { passive: true });
  box.set = v => { lock = performance.now() + 120; cur = v; sc.scrollLeft = (v - min) / step * PX; };
  requestAnimationFrame(() => box.set(value));
  return box;
}

/* ---------- 아래 판: ✕ · 제목 · ✓ + 아이콘 탭 ---------- */
function smsSheet({ title, tabs = null, tab, render, ok, cancel }) {
  if (!ED.open) return null;
  if (ED.cap) edCapClose();
  if (Player.playing) Player.pause();
  edSheetClose(true);
  ED.sheet = 'custom'; ED.popOpen = false; edPopPaint();
  const el = h('div', { class: 'bs sms' });
  EDel.root.append(el); EDel.sheetEl = el; EDel.root.classList.add('has-sheet');
  ED.sheetCancel = cancel || null;
  const st = { tab: tab || (tabs ? tabs[0][0] : null) };
  const paint = () => {
    el.innerHTML = '';
    const cur = tabs && tabs.find(t => t[0] === st.tab);
    el.append(h('div', { class: 'bs-head' },
      h('button', { class: 'bs-x', type: 'button', 'aria-label': '취소', html: icon('x'), onclick: () => edSheetClose() }),
      h('b', { class: 'bs-title' }, cur ? cur[2] : title),
      h('button', { class: 'bs-ok', type: 'button', 'aria-label': '확인', html: icon('check2'), onclick: async () => { ED.sheetCancel = null; ED.paint = null; if (ok) await ok(st); edSheetClose(); } })));
    if (tabs && tabs.length > 1) el.append(h('div', { class: 'bs-tabs' }, ...tabs.map(([k, ic, l]) => h('button', { type: 'button', class: k === st.tab ? 'on' : '', 'aria-label': l, title: l, html: icon(ic), onclick: () => { AE.stopPreview(); st.tab = k; paint(); } }))));
    const body = h('div', { class: 'bs-body' }), foot = h('div', { class: 'bs-foot' });
    el.append(body, foot);
    render(st.tab, body, foot, st, paint);
  };
  EDel.sheetRender = paint; paint();
  return st;
}
/* 그림 고르기 칸 (작은 그림 + 이름) */
function pickTile(label, on, onclick, draw) {
  const cv = h('canvas', { width: 160, height: 90 });
  if (draw) { const c = cv.getContext('2d'); c.scale(160 / W, 90 / H); c.fillStyle = '#000'; c.fillRect(0, 0, W, H); draw(c); }
  return h('button', { class: 'pk' + (on ? ' on' : '') + (draw ? '' : ' txt'), type: 'button', 'aria-label': label, onclick }, draw ? cv : '', h('span', {}, label));
}
const selImg = () => { const sf = selFrame(); return sf ? sf.f.img : null; };

/* ---------- 컷 다루기: 시간 계산 · 넣기 · 빼기 (소리·효과도 같이 옮겨요) ---------- */
let FCLIP = null;   // 복사·잘라내기 한 컷들
function sceneT(s, idx) { const a = s.trimIn, b = Math.max(a, s.frames.length - s.trimOut); idx = clamp(idx, a, b); let n = 0; for (let i = a; i < idx; i++) n += s.frames[i].hold; return n / P.fps; }
function shiftItems(s, t, d) {
  if (!d) return;
  for (const k of ['fx', 'sfx', 'voices', 'narrs']) for (const it of P[k]) {
    if (it.sid !== s.id) continue;
    if (d > 0) { if (it.off >= t - 1e-6) it.off += d; }
    else if (it.off >= t - d - 1e-6) it.off += d; else if (it.off > t) it.off = t;
  }
}
function insFrames(s, a, list) {
  const len = s.frames.length, act = a >= s.trimIn && a <= len - s.trimOut, t = sceneT(s, a);
  s.frames.splice(a, 0, ...list);
  if (act) shiftItems(s, t, list.reduce((x, f) => x + f.hold, 0) / P.fps);
  else if (a < s.trimIn) s.trimIn += list.length; else s.trimOut += list.length;
}
function delFrames(s, a, n) {
  const len = s.frames.length, t0 = sceneT(s, a), t1 = sceneT(s, a + n);
  const inHead = Math.max(0, Math.min(a + n, s.trimIn) - a), tailS = len - s.trimOut, inTail = Math.max(0, a + n - Math.max(a, tailS));
  s.frames.splice(a, n); s.trimIn -= inHead; s.trimOut -= inTail;
  shiftItems(s, t0, -(t1 - t0));
}
function setHold(s, i, v) { const old = s.frames[i].hold; if (old === v) return; const act = i >= s.trimIn && i < s.frames.length - s.trimOut, t = sceneT(s, i + 1); s.frames[i].hold = v; if (act) shiftItems(s, t, (v - old) / P.fps); }
const cloneFr = f => ({ id: uid(), hold: f.hold, blob: f.blob, url: f.url, img: f.img });
/* 고른 범위: 선택 모드면 처음~끝, 아니면 고른 컷 하나 */
function mRange() {
  const sf = selFrame(); if (!sf) return null;
  const m = ED.msel, L = sf.s.frames.length;
  if (m && m.sid === sf.s.id) { const a = clamp(Math.min(m.a, m.b), 0, L - 1), b = clamp(Math.max(m.a, m.b), 0, L - 1); return { s: sf.s, a, n: b - a + 1 }; }
  return { s: sf.s, a: sf.i, n: 1 };
}
function inMsel(s, i) { const m = ED.msel; return !!m && m.sid === s.id && i >= Math.min(m.a, m.b) && i <= Math.max(m.a, m.b); }
function edAfterOp(s, i) {
  ED.msel = null; ED.popOpen = false; changed();
  if (s && s.frames.length) edSetSel(s.id, clamp(i, 0, s.frames.length - 1)); else { ED.sel = null; edFixSel(); if (ED.sel) edSetSel(ED.sel.sid, ED.sel.i); }
  edStrip();
}

/* ---------- 컷 메뉴 (그리드) ---------- */
function edPopGrid(pop) {
  const R = mRange(); if (!R) return;
  const { s, a, n } = R, multi = n > 1, sf = selFrame();
  const it = (ic, label, fn, { off = false, cls = '' } = {}) => h('button', { class: cls, type: 'button', disabled: off || null, onclick: fn, html: icon(ic) + `<span>${label}</span>` });
  pop.append(
    it('cam', '카메라 삽입', () => { ED.popOpen = false; ED.msel = null; edCapOpen(); }),
    it('timer', '일시중지', () => holdSheet()),
    it('music', '오디오', () => edAudioAt()),
    it('edit', '편집', () => frameEdit()),
    it('split', '장면 나누기', () => { ED.msel = null; edSplit(s, sf.i); }, { off: multi || sf.i === 0 }),
    it('select', ED.msel ? '선택 해제' : '선택', () => { ED.msel = ED.msel ? null : { sid: s.id, a: sf.i, b: sf.i }; ED.popOpen = false; edStrip(false); if (ED.msel) toast('다른 컷을 누르면 거기까지 함께 골라요', 1800); }, { cls: ED.msel ? 'on' : '' }),
    it('scissors', '잘라내기', () => { FCLIP = s.frames.slice(a, a + n).map(cloneFr); delFrames(s, a, n); edAfterOp(s, a); toast(`컷 ${n}개를 잘라 냈어요. 붙여넣기로 옮겨 넣어요`, 1800); }),
    it('copy', '복사', () => { FCLIP = s.frames.slice(a, a + n).map(cloneFr); ED.msel = null; ED.popOpen = false; edStrip(false); toast(`컷 ${n}개를 복사했어요. 붙여넣기로 넣어요`, 1600); }),
    it('paste', '붙여넣기', () => { const list = FCLIP.map(cloneFr); insFrames(s, a + n, list); edAfterOp(s, a + n + list.length - 1); toast(`컷 ${list.length}개를 붙였어요`, 1200); }, { off: !FCLIP || !FCLIP.length }),
    it('reverse', '거꾸로', () => { s.frames.splice(a, n, ...s.frames.slice(a, a + n).reverse()); edAfterOp(s, a + n - 1); toast(`컷 ${n}개를 거꾸로 돌렸어요`, 1200); }, { off: !multi }),
    it('trash', '삭제', () => { delFrames(s, a, n); edAfterOp(s, a); }, { cls: 'red' }));
}

/* 일시중지: 이 컷을 몇 번 보여 줄지 */
function holdSheet() {
  const R = mRange(); if (!R) return;
  const { s, a, n } = R; let v = s.frames[a].hold;
  const desc = () => `${v}번 보여 줘요 · ${(v / P.fps).toFixed(1)}초` + (n > 1 ? ` · 컷 ${n}개 모두` : '');
  smsSheet({ title: '일시중지', render: (tab, body, foot) => {
    const d = h('span', { class: 'bs-tip c' }, desc());
    body.append(ruler({ min: 1, max: 60, value: v, bigAt: x => x === 1 || x % 5 === 0, onInput: x => { v = x; d.textContent = desc(); } }));
    foot.append(d);
  }, ok: () => { for (let i = a + n - 1; i >= a; i--) setHold(s, i, v); ED.msel = null; changed(); edStrip(false); } });
}

/* 오디오: 이 컷에서 시작하는 소리가 있으면 클립 판, 없으면 소리 판 */
function soundsAt() {
  const sf = selFrame(); if (!sf) return [];
  const t0 = frameT(sf.s, sf.i), t1 = t0 + sf.f.hold / P.fps, out = [];
  for (const [k, list] of [['sfx', P.sfx], ['voices', P.voices], ['narrs', P.narrs]]) for (const it of list) { const t = absT(it); if (t != null && t >= t0 - 1e-6 && t < t1) out.push({ k, it }); }
  return out;
}
function edAudioAt() {
  const list = soundsAt();
  if (!list.length) { ED.tab = 'sfx'; ED.popOpen = false; edSheet('sound'); return; }
  clipSheet(list);
}
const VFX = [['none', '없음'], ['robot', '로봇'], ['radio', '라디오'], ['walkie', '무전기'], ['echo', '메아리'], ['cave', '동굴']];
function clipName(c) { return c.k === 'sfx' ? (SFX.find(x => x.id === c.it.snd) || {}).name || '효과음' : c.k === 'voices' ? `대사 ${c.it.who || ''}`.trim() : '내레이션'; }
function clipDur(c) { if (c.k === 'sfx') { const p = AE.sfx[c.it.snd]; return p && p.__buf ? p.__buf.duration : 1; } return c.it.dur || (c.it.buf ? c.it.buf.duration : 1); }
function clipSheet(list) {
  let cur = list[0];
  const keep = list.map(c => ({ c, vol: c.it.vol, rate: c.it.rate, vfx: c.it.vfx }));
  smsSheet({ title: '오디오', tabs: [['vol', 'speaker', '볼륨'], ['rate', 'speed', '속도'], ['vfx', 'sparkle', '목소리 효과']],
    cancel: () => { for (const k of keep) Object.assign(k.c.it, { vol: k.vol, rate: k.rate, vfx: k.vfx }); },
    render: (tab, body, foot, st, paint) => {
      const it = cur.it;
      if (list.length > 1) body.append(h('div', { class: 'bs-pick' }, ...list.map(c => h('button', { type: 'button', class: c === cur ? 'on' : '', onclick: () => { cur = c; paint(); } }, clipName(c)))));
      else body.append(h('div', { class: 'bs-pick' }, h('button', { type: 'button', class: 'on' }, clipName(cur))));
      if (tab === 'vol') body.append(ruler({ min: 0, max: 150, step: 5, major: 2, value: Math.round((it.vol ?? 1) * 100), label: v => v, onInput: v => { it.vol = v / 100; } }));
      else if (tab === 'rate') body.append(ruler({ min: -40, max: 40, step: 5, major: 2, value: Math.round(((it.rate || 1) - 1) * 100), label: v => (v > 0 ? '+' : '') + v, onInput: v => { it.rate = 1 + v / 100; } }));
      else body.append(h('div', { class: 'pk-row list' }, ...VFX.map(([k, l]) => pickTile(l, (it.vfx || 'none') === k, () => { it.vfx = k === 'none' ? undefined : k; paint(); playClip(); }))));
      foot.append(
        h('button', { class: 'bs-btn red', type: 'button', onclick: () => { const L = P[cur.k], i = L.indexOf(it); if (i >= 0) L.splice(i, 1); ED.sheetCancel = null; changed(); edSheetClose(); toast('소리를 지웠어요', 1200); } }, '삭제'),
        h('button', { class: 'bs-btn or', type: 'button', onclick: () => playClip() }, '재생'));
    }, ok: () => { changed(); toast('소리를 바꿨어요', 1000); } });
  function playClip() { const t = absT(cur.it); if (t == null) return; Player.seek(t); Player.play({ until: Math.min(TL().total, t + clipDur(cur) / (cur.it.rate || 1) + .2) }); }
}
/* 목소리 효과 — Player.startBuf가 소리를 이 앞에 연결해요. 만든 노드는 keep에 넣어 재생이 끝나면 같이 멈춰요 */
function vfxIn(c, kind, dest, keep) {
  const g = (v = 1) => { const n = c.createGain(); n.gain.value = v; keep.push(n); return n; };
  const bq = (type, f, q = 1) => { const n = c.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; keep.push(n); return n; };
  const shaper = amt => { const n = c.createWaveShaper(), cur = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; cur[i] = Math.tanh(x * amt) / Math.tanh(amt); } n.curve = cur; keep.push(n); return n; };
  const inp = g();
  if (kind === 'radio') inp.connect(bq('highpass', 500)).connect(bq('lowpass', 3200)).connect(shaper(2)).connect(dest);
  else if (kind === 'walkie') inp.connect(bq('bandpass', 1600, 1.5)).connect(shaper(6)).connect(g(.6)).connect(dest);
  else if (kind === 'robot') { const rm = g(0), o = c.createOscillator(); o.frequency.value = 55; o.connect(rm.gain); o.start(); keep.push(o); inp.connect(rm).connect(g(1.8)).connect(dest); }
  else if (kind === 'echo') { const d = c.createDelay(1); d.delayTime.value = .28; keep.push(d); const fb = g(.45); inp.connect(dest); inp.connect(d); d.connect(fb).connect(d); d.connect(g(.6)).connect(dest); }
  else if (kind === 'cave') { inp.connect(dest); for (const [t, v] of [[.05, .5], [.11, .38], [.19, .27], [.3, .18], [.45, .1]]) { const d = c.createDelay(1); d.delayTime.value = t; keep.push(d); inp.connect(d).connect(g(v)).connect(dest); } }
  else inp.connect(dest);
  return inp;
}

/* ---------- 컷 편집: 회전 · 뒤집기 · 밝기 · 대비 · 색 ---------- */
const COLS = [['none', '없음'], ['gray', '흑백'], ['sepia', '세피아'], ['warm', '따뜻하게'], ['cool', '차갑게'], ['vivid', '또렷하게']];
function adjCanvas(img, a, w = W, hh = H) {
  const cv = h('canvas', { width: w, height: hh }), c = cv.getContext('2d');
  c.fillStyle = '#000'; c.fillRect(0, 0, w, hh);
  const r = a.rot * Math.PI / 180, cs = Math.abs(Math.cos(r)), sn = Math.abs(Math.sin(r)), k = Math.max((w * cs + hh * sn) / w, (w * sn + hh * cs) / hh);
  c.save(); c.translate(w / 2, hh / 2); c.rotate(r); c.scale((a.fx ? -1 : 1) * k, (a.fy ? -1 : 1) * k); c.translate(-w / 2, -hh / 2); drawCover(c, img, w, hh); c.restore();
  if (a.br || a.ct || a.col !== 'none') {
    const d = c.getImageData(0, 0, w, hh), p = d.data, cf = Math.pow((100 + a.ct) / 100, 2), bb = a.br * 2.2;
    for (let i = 0; i < p.length; i += 4) {
      let R = (p[i] - 128) * cf + 128 + bb, G = (p[i + 1] - 128) * cf + 128 + bb, B = (p[i + 2] - 128) * cf + 128 + bb;
      if (a.col !== 'none') {
        const l = .299 * R + .587 * G + .114 * B;
        if (a.col === 'gray') R = G = B = l;
        else if (a.col === 'sepia') { const r0 = R, g0 = G, b0 = B; R = .393 * r0 + .769 * g0 + .189 * b0; G = .349 * r0 + .686 * g0 + .168 * b0; B = .272 * r0 + .534 * g0 + .131 * b0; }
        else if (a.col === 'warm') { R = R * 1.08 + 12; B = B * .88; }
        else if (a.col === 'cool') { R = R * .88; B = B * 1.08 + 12; }
        else if (a.col === 'vivid') { R = l + (R - l) * 1.5; G = l + (G - l) * 1.5; B = l + (B - l) * 1.5; }
      }
      p[i] = R; p[i + 1] = G; p[i + 2] = B;
    }
    c.putImageData(d, 0, 0);
  }
  return cv;
}
function frameEdit() {
  const R = mRange(); if (!R) return;
  const { s, a, n } = R, img = s.frames[a].img;
  const adj = { rot: 0, fx: false, fy: false, br: 0, ct: 0, col: 'none' };
  let pv = adjCanvas(img, adj), pend = 0;
  const redo = () => { cancelAnimationFrame(pend); pend = requestAnimationFrame(() => { pv = adjCanvas(img, adj); }); };
  ED.paint = ctx => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.drawImage(pv, 0, 0, W, H); };
  smsSheet({ title: '편집', tabs: [['rot', 'rotR', '회전'], ['flip', 'flip', '뒤집기'], ['br', 'sun', '밝기'], ['ct', 'contrast', '대비'], ['col', 'palette', '색']],
    cancel: () => { ED.paint = null; },
    render: (tab, body, foot, st, paint) => {
      if (tab === 'rot') body.append(ruler({ min: -45, max: 45, step: 1, major: 5, value: adj.rot, onInput: v => { adj.rot = v; redo(); } }));
      else if (tab === 'br') body.append(ruler({ min: -50, max: 50, step: 2, major: 5, value: adj.br, onInput: v => { adj.br = v; redo(); } }));
      else if (tab === 'ct') body.append(ruler({ min: -50, max: 50, step: 2, major: 5, value: adj.ct, onInput: v => { adj.ct = v; redo(); } }));
      else if (tab === 'flip') body.append(h('div', { class: 'pk-row list' },
        h('button', { class: 'pk txt' + (adj.fx ? ' on' : ''), type: 'button', onclick: () => { adj.fx = !adj.fx; redo(); paint(); }, html: icon('flip') + '<span>좌우 뒤집기</span>' }),
        h('button', { class: 'pk txt' + (adj.fy ? ' on' : ''), type: 'button', onclick: () => { adj.fy = !adj.fy; redo(); paint(); }, html: icon('flipV') + '<span>위아래 뒤집기</span>' })));
      else body.append(h('div', { class: 'pk-row list' }, ...COLS.map(([k, l]) => pickTile(l, adj.col === k, () => { adj.col = k; redo(); paint(); }, c => c.drawImage(adjCanvas(img, { ...adj, col: k }, 320, 180), 0, 0, W, H)))));
      if (n > 1) foot.append(h('span', { class: 'bs-tip c' }, `고른 컷 ${n}개에 모두 바꿔 넣어요`));
    },
    ok: async () => {
      if (!adj.rot && !adj.fx && !adj.fy && !adj.br && !adj.ct && adj.col === 'none') return;
      toast(n > 1 ? `컷 ${n}개를 바꾸는 중…` : '컷을 바꾸는 중…', 1200);
      for (let i = a; i < a + n; i++) {
        const f = s.frames[i]; try { await f.img.decode(); } catch (e) { }
        const blob = await new Promise(r => adjCanvas(f.img, adj).toBlob(r, 'image/jpeg', .9));
        if (blob) s.frames[i] = { ...f, id: uid(), blob, ...loadImg(blob) };
      }
      ED.msel = null; changed(); edStrip(false);
    } });
}

/* ---------- 프로젝트 설정 (⚙) ---------- */
function smsSettings() {
  const old = { ...look() }, oldFps = P.fps; let fps = P.fps;
  const lk = look(), rerender = () => { TLc = null; };
  const thumb = patch => c => { const im = selImg(); if (im) drawCover(c, im); drawFilt(c, patch.filt ?? lk.filt); drawFg(c, patch.fg ?? lk.fg); };
  const st0 = { side: 'in' };
  const frames = () => P.scenes.reduce((x, s) => x + s.frames.slice(s.trimIn, s.frames.length - s.trimOut).reduce((y, f) => y + f.hold, 0), 0);
  const mmss = sec => { sec = Math.round(sec); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); };
  smsSheet({ title: '설정', tabs: [['speed', 'speed', '속도'], ['fade', 'fade', '페이드'], ['fg', 'fg', '전경'], ['filt', 'palette', '효과'], ['q', 'quality', '품질'], ['play', 'loop', '재생'], ['etc', 'sliders', '기타']],
    cancel: () => { Object.assign(lk, old); rerender(); },
    render: (tab, body, foot, st, paint) => {
      if (tab === 'speed') {
        const d = h('span', { class: 'bs-tip c' });
        const say = () => { d.textContent = `동영상 속도 (1초에 몇 장). ${mmss(frames() / fps)} @ ${fps} FPS`; };
        body.append(ruler({ min: 1, max: 30, value: fps, bigAt: v => v === 1 || v % 5 === 0, label: v => v, onInput: v => { fps = v; say(); } })); say(); foot.append(d);
      } else if (tab === 'fade') {
        const k = st0.side === 'in' ? 'fin' : 'fout';
        body.append(h('div', { class: 'pk-row list' }, ...FADES.map(([v, l]) => pickTile(l, lk[k] === v, () => { lk[k] = v; paint(); }, c => { const im = selImg(); if (im) drawCover(c, im); if (v !== 'none') { c.fillStyle = v === 'white' ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.7)'; c.fillRect(0, 0, W, H); } }))));
        foot.append(h('div', { class: 'bs-seg' }, ...[['in', '페이드 인'], ['out', '페이드 아웃']].map(([v, l]) => h('button', { type: 'button', class: st0.side === v ? 'on' : '', onclick: () => { st0.side = v; paint(); } }, l))));
      } else if (tab === 'fg') body.append(h('div', { class: 'pk-row list' }, ...FGS.map(([v, l]) => pickTile(l, lk.fg === v, () => { lk.fg = v; paint(); }, thumb({ fg: v })))));
      else if (tab === 'filt') body.append(h('div', { class: 'pk-row list' }, ...FILTS.map(([v, l]) => pickTile(l, lk.filt === v, () => { lk.filt = v; paint(); }, thumb({ filt: v })))));
      else if (tab === 'q') { body.append(h('div', { class: 'pk-row list' }, ...QUALS.map(([v, l, sub]) => h('button', { class: 'pk txt big' + (lk.q === v ? ' on' : ''), type: 'button', onclick: () => { lk.q = v; paint(); } }, h('b', {}, l), h('span', {}, sub))))); foot.append(h('span', { class: 'bs-tip c' }, '영상 파일을 만들 때의 크기예요')); }
      else if (tab === 'play') body.append(h('div', { class: 'pk-row list' },
        h('button', { class: 'pk txt' + (lk.loop ? ' on' : ''), type: 'button', onclick: () => { lk.loop = true; paint(); }, html: icon('loop') + '<span>반복 재생</span>' }),
        h('button', { class: 'pk txt' + (!lk.loop ? ' on' : ''), type: 'button', onclick: () => { lk.loop = false; paint(); }, html: icon('next') + '<span>한 번 재생</span>' })));
      else {
        const seg = (vals, cur, set) => h('div', { class: 'bs-seg' }, ...vals.map(v => h('button', { type: 'button', class: cur === v ? 'on' : '', onclick: () => { set(v); paint(); } }, String(v))));
        body.append(h('div', { class: 'bs-etc' },
          h('label', { class: 'bs-sl' }, '제목', h('input', { class: 'bs-in wide', value: P.title, maxlength: 40, oninput: e => { P.title = e.target.value; }, onchange: changed })),
          h('div', { class: 'bs-sl' }, '한 번 찍을 때', seg([1, 2, 3, 4], P.hold, v => { P.hold = v; changed(); })),
          h('label', { class: 'toggle bs-tg' }, h('input', { type: 'checkbox', checked: P.fade, onchange: e => { P.fade = e.target.checked; changed(); } }), '장면 바뀔 때 부드럽게'),
          h('label', { class: 'toggle bs-tg' }, h('input', { type: 'checkbox', checked: P.subs, onchange: e => { P.subs = e.target.checked; changed(); } }), '대사 자막')));
      }
    },
    ok: () => {
      if (fps !== oldFps) { const k = P.fps / fps; for (const key of ['fx', 'sfx', 'voices', 'narrs']) for (const it of P[key]) it.off *= k; P.fps = fps; }
      changed(); edStrip(false);
    } });
}

/* ---------- 제목 카드 · 제작진 ---------- */
const CARDS = [['lunch', '런치박스'], ['chalk', '칠판'], ['sky', '하늘'], ['space', '우주'], ['silent', '무성 영화'], ['paper', '종이'], ['sea', '바닷속']];
function drawCard(ctx, tpl, main, sub, credits) {
  const lg = (a, b, c1, c2) => { const g = ctx.createLinearGradient(0, a, 0, b); g.addColorStop(0, c1); g.addColorStop(1, c2); return g; };
  let fg = '#fff', acc = '#CF5D2A', font = 'Jua, sans-serif';
  ctx.save();
  if (tpl === 'lunch') { ctx.fillStyle = '#F4EFE5'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#CF5D2A'; ctx.fillRect(0, 0, W, 36); ctx.fillRect(0, H - 36, W, 36); fg = '#111'; }
  else if (tpl === 'chalk') { ctx.fillStyle = '#26342b'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 26; ctx.strokeRect(13, 13, W - 26, H - 26); acc = '#f4e36b'; }
  else if (tpl === 'sky') { ctx.fillStyle = lg(0, H, '#4aa8f0', '#bfe6ff'); ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; for (const [x, y, r] of [[150, 110, 40], [200, 100, 52], [250, 115, 38], [700, 420, 46], [760, 405, 58], [820, 425, 40]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); } ctx.fillStyle = '#5cbf4a'; ctx.fillRect(0, H - 40, W, 40); fg = '#0b3b73'; acc = '#fff'; }
  else if (tpl === 'space') { ctx.fillStyle = lg(0, H, '#0b0b2a', '#2a1150'); ctx.fillRect(0, 0, W, H); for (let i = 0; i < 90; i++) { const x = (i * 137.5) % W, y = (i * 71.3) % H; ctx.fillStyle = `rgba(255,255,255,${.3 + (i % 5) / 7})`; ctx.fillRect(x, y, i % 7 ? 2 : 3, i % 7 ? 2 : 3); } acc = '#7fe3ff'; }
  else if (tpl === 'silent') { ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = '#d8d0b8'; ctx.lineWidth = 3; ctx.strokeRect(60, 50, W - 120, H - 100); ctx.lineWidth = 1; ctx.strokeRect(72, 62, W - 144, H - 124); fg = '#efe6cc'; acc = '#bfb59a'; font = 'Georgia, serif'; }
  else if (tpl === 'paper') { ctx.fillStyle = '#fbf7ec'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = '#b9d3ee'; ctx.lineWidth = 2; for (let y = 60; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } ctx.strokeStyle = '#f0a0a0'; ctx.beginPath(); ctx.moveTo(110, 0); ctx.lineTo(110, H); ctx.stroke(); fg = '#1d3d7a'; acc = '#e2412e'; }
  else if (tpl === 'sea') { ctx.fillStyle = lg(0, H, '#0e6aa8', '#063457'); ctx.fillRect(0, 0, W, H); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; for (const [x, y, r] of [[120, 400, 14], [140, 350, 9], [130, 310, 6], [840, 300, 16], [860, 250, 10], [850, 210, 6]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); } ctx.fillStyle = '#e8c27a'; ctx.beginPath(); ctx.ellipse(W / 2, H + 40, W * .7, 90, 0, 0, 7); ctx.fill(); acc = '#ffd36b'; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = fg;
  if (credits) {
    const ls = (credits || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 8);
    ctx.font = `44px ${font}`; ctx.fillStyle = acc; ctx.fillText(main || '만든 사람', W / 2, H / 2 - (ls.length * 40) / 2 - 30);
    ctx.font = `32px ${font}`; ctx.fillStyle = fg; ls.forEach((l, i) => ctx.fillText(l, W / 2, H / 2 - (ls.length * 40) / 2 + 30 + i * 40));
  } else {
    ctx.font = `76px ${font}`; const lines = wrapText(ctx, main || '제목', W * .8).slice(0, 2);
    lines.forEach((l, i) => ctx.fillText(l, W / 2, H / 2 - 20 - (lines.length - 1) * 42 + i * 84));
    if (sub) { ctx.font = `30px ${font}`; ctx.fillStyle = acc; ctx.fillText(sub, W / 2, H / 2 + 40 + (lines.length - 1) * 42); }
  }
  ctx.restore();
}
function edCard(kind) {
  const c = { tpl: 'lunch', main: kind === 'title' ? (P.title || '') : '만든 사람', sub: '아르떼노바 스톱모션', names: '감독 · \n촬영 · \n목소리 · ', sec: 3 };
  ED.paint = ctx => drawCard(ctx, c.tpl, c.main, c.sub, kind === 'credits' ? c.names : null);
  smsSheet({ title: kind === 'title' ? '제목 카드' : '제작진', cancel: () => { ED.paint = null; },
    render: (tab, body, foot, st, paint) => {
      body.append(h('div', { class: 'pk-row list' }, ...CARDS.map(([k, l]) => pickTile(l, c.tpl === k, () => { c.tpl = k; paint(); }, ctx => drawCard(ctx, k, c.main, c.sub, kind === 'credits' ? c.names : null)))));
      foot.append(h('input', { class: 'bs-in wide', value: c.main, maxlength: 30, 'aria-label': kind === 'title' ? '제목' : '머리글', oninput: e => { c.main = e.target.value; } }),
        kind === 'title' ? h('input', { class: 'bs-in wide', value: c.sub, maxlength: 30, 'aria-label': '작은 글', oninput: e => { c.sub = e.target.value; } })
          : h('textarea', { class: 'bs-ta', rows: 2, 'aria-label': '만든 사람들 (한 줄에 한 명)', oninput: e => { c.names = e.target.value; } }, c.names),
        h('div', { class: 'bs-seg' }, ...[2, 3, 4].map(v => h('button', { type: 'button', class: c.sec === v ? 'on' : '', onclick: () => { c.sec = v; paint(); } }, v + '초'))));
    },
    ok: async () => {
      const off = h('canvas', { width: W, height: H }); drawCard(off.getContext('2d'), c.tpl, c.main, c.sub, kind === 'credits' ? c.names : null);
      const blob = await new Promise(r => off.toBlob(r, 'image/jpeg', .9)); if (!blob) return;
      const f = { id: uid(), hold: Math.round(c.sec * P.fps), blob, ...loadImg(blob) };
      if (kind === 'title') { const s = P.scenes[0]; insFrames(s, s.trimIn, [f]); edAfterOp(s, s.trimIn); toast('맨 앞에 제목 카드를 넣었어요', 1500); }
      else { const s = P.scenes[P.scenes.length - 1], at = s.frames.length - s.trimOut; insFrames(s, at, [f]); edAfterOp(s, at); toast('맨 끝에 제작진 카드를 넣었어요', 1500); }
    } });
}

/* ---------- 비디오에서 컷 뽑기 ---------- */
function pickFile(accept) {
  return new Promise(res => {
    const inp = h('input', { type: 'file', accept, style: { position: 'fixed', left: '-9999px' } });
    document.body.append(inp); inp.onchange = () => { res(inp.files[0] || null); inp.remove(); }; inp.click();
  });
}
async function edImportVideo() {
  const file = await pickFile('video/*'); if (!file) return;
  const v = h('video', { muted: true, playsinline: true, preload: 'auto' }); v.muted = true; v.src = URL.createObjectURL(file);
  const ok = await new Promise(r => { v.onloadeddata = () => r(true); v.onerror = () => r(false); setTimeout(() => r(v.readyState >= 2), 8000); });
  if (!ok || !v.duration) { toast('이 영상은 열 수 없어요'); return; }
  const MAX = 10, dur = Math.min(v.duration, MAX), step = 1 / P.fps, n = Math.max(1, Math.floor(dur / step));
  const sp = capSpot(), list = [], off = h('canvas', { width: W, height: H }), c = off.getContext('2d');
  for (let k = 0; k < n; k++) {
    await new Promise(r => { v.onseeked = r; v.currentTime = Math.min(v.duration - .01, k * step); setTimeout(r, 1500); });
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H); drawCover(c, v);
    const blob = await new Promise(r => off.toBlob(r, 'image/jpeg', .85));
    if (blob) list.push({ id: uid(), hold: 1, blob, ...loadImg(blob) });
    if (k % 12 === 0) toast(`영상에서 컷을 뽑는 중… ${k + 1} / ${n}`, 1500);
  }
  URL.revokeObjectURL(v.src);
  if (!list.length) return;
  insFrames(sp.s, sp.at, list); edAfterOp(sp.s, sp.at + list.length - 1);
  toast(`영상에서 컷 ${list.length}개를 넣었어요` + (v.duration > MAX ? ` (앞 ${MAX}초만)` : ''), 2400);
}

/* ---------- 갤러리: 길게 누르면 메뉴 ---------- */
function longPress(el, fn) {
  let tm = 0, x = 0, y = 0, fired = false;
  el.addEventListener('pointerdown', e => { fired = false; x = e.clientX; y = e.clientY; clearTimeout(tm); tm = setTimeout(() => { fired = true; try { navigator.vibrate && navigator.vibrate(10); } catch (er) { } fn(); }, 550); });
  const stop = () => clearTimeout(tm);
  el.addEventListener('pointerup', stop); el.addEventListener('pointercancel', stop); el.addEventListener('pointerleave', stop);
  el.addEventListener('pointermove', e => { if (Math.hypot(e.clientX - x, e.clientY - y) > 10) stop(); });
  el.addEventListener('click', e => { if (fired) { e.stopImmediatePropagation(); e.preventDefault(); fired = false; } }, true);
  el.addEventListener('contextmenu', e => e.preventDefault());
}
function renameWork(d) {
  modal((b, m) => {
    const inp = h('input', { class: 'input', value: d.title || '', maxlength: 40, 'aria-label': '새 이름' });
    const go = async () => { d.title = inp.value.trim() || d.title; d.updated = Date.now(); await DB.put(d); m.close(); openGallery(); toast('이름을 바꿨어요', 1200); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    b.append(h('h2', {}, '이름 바꾸기'), inp, h('div', { class: 'acts' }, h('button', { class: 'btn', type: 'button', onclick: m.close }, '취소'), h('button', { class: 'btn primary', type: 'button', onclick: go }, '바꾸기')));
    setTimeout(() => inp.select(), 50);
  });
}
