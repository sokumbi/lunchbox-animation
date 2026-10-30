/* =========================================================
   단순한 세 화면 (2026-10-31) — 초등학생이 혼자 쓸 수 있게
   1. 내 작품(openGallery): 큰 카드 + "새 작품". 누르면 바로 촬영
   2. 촬영(openShoot): 카메라 가득 + 큰 빨간 찰칵. 아래 필름에서 컷을 누르면 다시 찍기 · 지우기 · 여기 뒤에 찍기
   3. 꾸미기(openDeco): 영상 + 말하기(녹음) · 소리(효과음) · 배경음악 · 내보내기, 빠르기 셋
   작품은 장면 하나(P.scenes[0])만 써요. 예전 작품에 장면이 여럿이면 열 때 하나로 합쳐요
   ========================================================= */
IC.share = '<path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/>';
IC.folder = '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>';
IC.restore = '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5"/>';
IC.timer = '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6M12 2v3"/>';
IC.switchCam = IC.switchCam || '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><path d="M9.5 14a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0"/><path d="M15 11l2-1.5M9 17l-2 1.5"/>';
IC.bell = '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>';
IC.replace = '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"/>';
const SFX_IC = { pop: 'pop', boing: 'spring', boom: 'boom', swoosh: 'wind', ding: 'bell', sparkle: 'sparkle', drop: 'drop', bubbles: 'bubbles', splash: 'splash', wave: 'wave', steps: 'foot', drum: 'drum', gong: 'gong', fail: 'sad' };
const SPEEDS = [[4, '느리게'], [6, '보통'], [10, '빠르게']];
const V = { screen: null, ins: null, retake: null, onion: true, grid: false, timer: 0, cdT: null, raf: 0, tool: 'voice', rec: null, pv: false };
let EL = {};
const sc = () => P.scenes[0];
const nFrames = () => sc().frames.length;
const agoText = t => { const s = (Date.now() - t) / 1000; if (s < 60) return '지금'; if (s < 3600) return `${Math.floor(s / 60)}분 전`; if (s < 86400) return `${Math.floor(s / 3600)}시간 전`; if (s < 86400 * 7) return `${Math.floor(s / 86400)}일 전`; return new Date(t).toLocaleDateString('ko-KR'); };
const workSec = d => d.scenes.reduce((a, s) => a + s.frames.reduce((x, f) => x + f.hold, 0), 0) / (d.fps || 6);
const mmss = s => { s = Math.round(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const thumbURL = d => d.thumb ? (d._turl || (d._turl = URL.createObjectURL(d.thumb))) : '';
/* 예전 작품(장면 여럿·앞뒤 자르기)을 장면 하나로 합쳐요 */
function flattenScenes() {
  if (P.scenes.length === 1 && !P.scenes[0].trimIn && !P.scenes[0].trimOut) return;
  const first = P.scenes[0], out = [], move = {}; let t = 0;
  for (const s of P.scenes) { move[s.id] = t; const fr = s.frames.slice(s.trimIn, s.frames.length - s.trimOut); out.push(...fr); t += fr.reduce((a, f) => a + f.hold, 0) / P.fps; if (!first.bgm && s.bgm) first.bgm = s.bgm; }
  for (const k of ['fx', 'sfx', 'voices', 'narrs']) for (const it of P[k]) { if (move[it.sid] != null) { it.off += move[it.sid]; it.sid = first.id; } }
  first.frames = out; first.trimIn = first.trimOut = 0; P.scenes = [first]; TLc = null;
}
/* 컷 넣기·빼기 — 그 뒤의 소리 위치도 같이 옮겨요 */
function shiftItems(t, d) { if (!d) return; for (const k of ['fx', 'sfx', 'voices', 'narrs']) for (const it of P[k]) { if (d > 0) { if (it.off >= t - 1e-6) it.off += d; } else if (it.off >= t - d - 1e-6) it.off += d; else if (it.off > t) it.off = t; } }
const frameT0 = i => sc().frames.slice(0, i).reduce((a, f) => a + f.hold, 0) / P.fps;
function insFrames(a, list) { const t = frameT0(a); sc().frames.splice(a, 0, ...list); shiftItems(t, list.reduce((x, f) => x + f.hold, 0) / P.fps); }
function delFrames(a, n) { const t0 = frameT0(a), t1 = frameT0(a + n); sc().frames.splice(a, n); shiftItems(t0, -(t1 - t0)); }
function setFps(n) { const k = P.fps / n; for (const key of ['fx', 'sfx', 'voices', 'narrs']) for (const it of P[key]) it.off *= k; P.fps = n; }
/* 예전 이름 — 되돌리기(undo)가 goStep(S.step)으로 화면을 새로 그려요 */
function goStep() { if (V.screen === 'shoot') shootPaint(); else if (V.screen === 'deco') decoPaint(); }
function leaveStep() { closeScreen(); }
function closeScreen() {
  if (!V.screen) return;
  cancelAnimationFrame(V.raf); clearTimeout(V.cdT); V.cdT = null; V.pv = false; V.retake = null; V.ins = null;
  if (V.rec && V.rec.active) V.rec.stop(); Mic.release(); Cam.stop();
  Player.pause(); Player.onState = null; if (P) Player.attach(null); AE.stopPreview();
  removeEventListener('keydown', onKey); V.screen = null; EL = {};
}
function onKey(e) { if (e.target.closest('input,textarea')) return; if (V.screen === 'shoot' && e.code === 'Space') { e.preventDefault(); shutter(); } else if (V.screen === 'deco' && e.code === 'Space') { e.preventDefault(); Player.toggle(); } }
const rb = (ic, label, onclick, cls = '') => h('button', { class: 'ri ' + cls, type: 'button', 'aria-label': label, title: label, onclick, html: icon(ic) + `<span>${label}</span>` });

/* =========================================================
   1. 내 작품
   ========================================================= */
let galTab = 'movies';
async function openGallery(o = {}) {
  closeScreen(); show('library');
  const root = $('#library'); root.className = 'screen gal-screen'; root.innerHTML = '';
  const up = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async e => { const f = e.target.files[0]; if (!f) return; const d = await importProjectFile(f); if (d) { toast(`“${d.title}”을(를) 불러왔어요`); openGallery(); } } });
  const tab = (ic, label, id, short = label) => h('button', { class: 'g-rb' + (galTab === id ? ' on' : ''), type: 'button', 'aria-label': label, html: icon(ic) + `<span>${short}</span>`, onclick: () => { galTab = id; openGallery(); } });
  const rail = h('nav', { class: 'g-rail' }, tab('folder', '내 작품', 'movies'), tab('trash', '휴지통', 'trash'), h('span', { class: 'g-sp' }),
    h('button', { class: 'g-rb', type: 'button', 'aria-label': '작품 파일 불러오기', html: icon('upload') + '<span>불러오기</span>', onclick: () => up.click() }), up);
  const { list, trash } = await loadWorks();
  const isTrash = galTab === 'trash';
  const grid = h('div', { class: 'g-grid list' });
  if (!isTrash) grid.append(h('button', { class: 'g-card new', type: 'button', 'aria-label': '새 작품', onclick: e => newWork(e.currentTarget) }, h('span', { class: 'th', html: icon('plus') }), h('span', { class: 'tt' }, h('b', {}, '새 작품'))));
  else if (!trash.length) grid.append(h('p', { class: 'g-none' }, `지운 작품은 ${TRASH_DAYS}일 동안 여기 있다가 저절로 없어져요.`));
  for (const d of isTrash ? trash : list) {
    const th = h('span', { class: 'th' + (d.thumb ? '' : ' empty'), html: d.thumb ? '' : icon('film') });
    if (d.thumb) th.style.backgroundImage = `url(${thumbURL(d)})`;
    const sub = isTrash ? `${Math.max(1, Math.ceil((d.trashed + TRASH_DAYS * 864e5 - Date.now()) / 864e5))}일 뒤에 없어져요` : `${agoText(d.updated || d.created)} · ${mmss(workSec(d))}`;
    const card = h('div', { class: 'g-card', role: 'button', tabindex: 0, 'data-id': d.id, 'aria-label': `${d.title || '제목 없음'} 열기` }, th, h('span', { class: 'tt' }, h('b', {}, d.title || '제목 없음'), h('small', {}, sub)),
      h('button', { class: 'g-more', type: 'button', 'aria-label': '메뉴', html: icon('more'), onclick: e => { e.stopPropagation(); menu(); } }));
    const menu = () => isTrash ? trashMenu(card, d) : workMenu(card, d);
    card.onclick = () => isTrash ? menu() : openWork(d, card);
    card.onkeydown = e => { if (e.key === 'Enter') card.onclick(); };
    card.oncontextmenu = e => { e.preventDefault(); menu(); };
    longPress(card, menu);
    card.style.setProperty('--i', Math.min(grid.children.length, 14));
    grid.append(card);
  }
  root.append(rail, h('div', { class: 'g-main' }, h('div', { class: 'g-top' }, h('b', { class: 'g-h' }, isTrash ? '휴지통' : BRAND.app)), grid));
  if (o.focus) { const c = $(`.g-card[data-id="${o.focus}"]`, grid); if (c) c.scrollIntoView({ block: 'nearest' }); }
  return grid;
}
async function newWork(card) {
  const { list } = await loadWorks();
  let n = list.length + 1, title = `작품 ${n}`; while (list.some(d => d.title === title)) title = `작품 ${++n}`;
  P = newProject(title); setFormat(P.fmt); TLc = null; await saveProject();
  await zoomFrom(card, ''); openShoot(); zoomDone();
}
async function openWork(d, card) {
  const pr = openProject(d);
  await zoomFrom(card, thumbURL(d));
  await pr; flattenScenes();
  if (nFrames()) openDeco(); else openShoot();
  zoomDone();
}
async function toGallery() {
  const id = P && P.id, cv = EL.cv;
  const snapURL = (() => { try { return cv ? cv.toDataURL('image/jpeg', .6) : ''; } catch (e) { return ''; } })();
  closeScreen(); await saveProject(); P = null; TLc = null;
  const grid = await openGallery({ focus: id });
  const card = id && $(`.g-card[data-id="${id}"]`, grid);
  if (card) zoomInto(card, snapURL);
}
/* ---------- 확대 · 축소 전환 ---------- */
const ZOOM_MS = 380, ZEASE = 'cubic-bezier(.2,.85,.25,1)', ZOOM = { z: null };
function rectBox(el) { const r = appRect(el), a = appRect($('#app')); return { left: r.left - a.left, top: r.top - a.top, width: r.width, height: r.height }; }
function zoomer(url) { const z = h('div', { class: 'zoomer' + (url ? '' : ' empty'), html: url ? '' : icon('film') }); if (url) z.style.backgroundImage = `url(${url})`; $('#app').append(z); return z; }
const pxBox = o => ({ left: o.left + 'px', top: o.top + 'px', width: o.width + 'px', height: o.height + 'px' });
function zoomFrom(el, url) {
  const b = rectBox(el), z = zoomer(url), full = { left: 0, top: 0, width: $('#app').clientWidth, height: $('#app').clientHeight };
  ZOOM.z = z; $('#library').classList.add('zooming');
  return z.animate([{ ...pxBox(b), borderRadius: '12px' }, { ...pxBox(full), borderRadius: '0px' }], { duration: ZOOM_MS, easing: ZEASE, fill: 'forwards' }).finished.catch(() => { });
}
function zoomDone() { const z = ZOOM.z; ZOOM.z = null; $('#library').classList.remove('zooming'); if (!z) return; z.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).finished.catch(() => { }).then(() => z.remove()); }
function zoomInto(el, url) {
  const b = rectBox(el), z = zoomer(url), full = { left: 0, top: 0, width: $('#app').clientWidth, height: $('#app').clientHeight };
  el.style.visibility = 'hidden';
  z.animate([{ ...pxBox(full), borderRadius: '0px' }, { ...pxBox(b), borderRadius: '12px' }], { duration: ZOOM_MS, easing: ZEASE, fill: 'forwards' }).finished.catch(() => { }).then(() => { el.style.visibility = ''; z.remove(); });
}
/* ---------- 길게 누르기 메뉴 · 알림창 ---------- */
function ctxMenu(anchor, items, { lift = false } = {}) {
  closeCtx();
  const app = $('#app'), b = rectBox(anchor), AW = app.clientWidth, AH = app.clientHeight;
  const bg = h('div', { class: 'cm-bg' + (lift ? ' dim' : ''), onpointerdown: e => { if (e.target === bg) closeCtx(); } });
  if (lift) { const ghost = anchor.cloneNode(true); ghost.classList.add('cm-lift'); ghost.removeAttribute('data-id'); Object.assign(ghost.style, pxBox(b)); bg.append(ghost); }
  const menu = h('div', { class: 'cm', role: 'menu' });
  for (const it of items) {
    if (it.sep) { menu.append(h('i', { class: 'cm-sep' })); continue; }
    menu.append(h('button', { class: 'cm-i' + (it.red ? ' red' : ''), type: 'button', role: 'menuitem', onclick: () => { closeCtx(); it.fn(); } }, h('span', { class: 'cm-ic', html: it.ic ? icon(it.ic) : '' }), h('span', {}, it.label)));
  }
  bg.append(menu); app.append(bg);
  const mw = menu.offsetWidth, mh = menu.offsetHeight, pad = 8;
  let x = b.left + b.width + 10, ox = '0 30%';
  if (x + mw > AW - pad) { x = b.left - mw - 10; ox = '100% 30%'; }
  if (x < pad) { x = clamp(b.left, pad, AW - mw - pad); ox = '50% 0'; }
  Object.assign(menu.style, { left: x + 'px', top: clamp(b.top, pad, AH - mh - pad) + 'px', transformOrigin: ox });
  try { navigator.vibrate && navigator.vibrate(8); } catch (e) { }
}
function closeCtx() { const bg = $('.cm-bg'); if (!bg) return; bg.classList.add('out'); bg.style.pointerEvents = 'none'; setTimeout(() => bg.remove(), 170); }
function workMenu(card, d) {
  ctxMenu(card, [
    { label: '이름 바꾸기', ic: 'edit', fn: () => renameWork(d) },
    { label: '작품 파일로 저장', ic: 'download', fn: () => exportProjectFile(d) },
    { sep: true },
    { label: '지우기', ic: 'trash', red: true, fn: async () => { if (await iosAlert('작품을 지울까요?', `휴지통으로 옮겨요. ${TRASH_DAYS}일 동안은 되살릴 수 있어요.`, '지우기', true)) await trashWork(card, d); } }
  ], { lift: true });
}
function trashMenu(card, d) {
  ctxMenu(card, [
    { label: '되살리기', ic: 'restore', fn: async () => { delete d.trashed; delete d._turl; await DB.put(d); toast(`“${d.title}”을(를) 되살렸어요`, 1500); openGallery(); } },
    { sep: true },
    { label: '완전히 지우기', ic: 'trash', red: true, fn: async () => { if (await iosAlert('완전히 지울까요?', '완전히 지우면 다시 되살릴 수 없어요.', '지우기', true)) { await DB.del(d.id); openGallery(); } } }
  ], { lift: true });
}
async function trashWork(card, d) { d.trashed = Date.now(); delete d._turl; await DB.put(d); card.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.6)', opacity: 0 }], { duration: 240, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => { }).then(() => openGallery()); }
function renameWork(d) { iosAlert('이름 바꾸기', '', '저장', false, d.title || '').then(async v => { if (typeof v !== 'string' || !v.trim()) return; d.title = v.trim(); d.updated = Date.now(); delete d._turl; await DB.put(d); openGallery(); }); }
function iosAlert(title, text, okLabel = '확인', danger = false, value = null) {
  return new Promise(res => {
    const inp = value != null ? h('input', { class: 'al-in', value, maxlength: 40, 'aria-label': title }) : null;
    const done = v => { bg.classList.add('out'); setTimeout(() => bg.remove(), 160); res(v); };
    const ok = () => done(inp ? inp.value : true);
    const bg = h('div', { class: 'al-bg', onpointerdown: e => { if (e.target === bg) done(false); } },
      h('div', { class: 'al', role: 'alertdialog', 'aria-modal': 'true' }, h('b', { class: 'al-t' }, title), text ? h('p', { class: 'al-p' }, text) : '', inp || '',
        h('div', { class: 'al-acts' }, h('button', { type: 'button', onclick: () => done(false) }, '취소'), h('button', { class: danger ? 'red' : 'ok', type: 'button', onclick: ok }, okLabel))));
    if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
    $('#app').append(bg);
    if (inp) setTimeout(() => { inp.focus(); inp.select(); }, 60);
  });
}
function longPress(el, fn) {
  let tm = 0, x = 0, y = 0, fired = false;
  el.addEventListener('pointerdown', e => { fired = false; x = e.clientX; y = e.clientY; clearTimeout(tm); tm = setTimeout(() => { fired = true; try { navigator.vibrate && navigator.vibrate(10); } catch (er) { } fn(); }, 550); });
  const stop = () => clearTimeout(tm);
  el.addEventListener('pointerup', stop); el.addEventListener('pointercancel', stop); el.addEventListener('pointerleave', stop);
  el.addEventListener('pointermove', e => { if (Math.hypot(e.clientX - x, e.clientY - y) > 10) stop(); });
  el.addEventListener('click', e => { if (fired) { e.stopImmediatePropagation(); e.preventDefault(); fired = false; } }, true);
  el.addEventListener('contextmenu', e => e.preventDefault());
}

/* =========================================================
   2. 촬영 — 카메라 가득 · 큰 빨간 찰칵 · 아래 필름에서 컷 고치기
   ========================================================= */
function openShoot() {
  closeScreen(); show('studio'); V.screen = 'shoot'; S.step = 'shoot'; histInit();
  const body = $('#stBody'); body.innerHTML = '';
  const cv = h('canvas', { class: 'stage', width: W, height: H });
  const flash = h('div', { class: 'flash' }), cd = h('div', { class: 'countdown', hidden: true }), nocam = h('div', { class: 'nocam', hidden: true });
  const banner = h('div', { class: 'sh-banner', hidden: true });
  const film = h('div', { class: 'sh-film' });
  const mon = h('div', { class: 'sh-mon' }, cv, flash, cd, nocam, banner, film);
  const onionB = rb('onion', '겹쳐보기', () => { V.onion = !V.onion; onionB.classList.toggle('on', V.onion); }, V.onion ? 'on' : '');
  const gridB = rb('grid', '격자', () => { V.grid = !V.grid; gridB.classList.toggle('on', V.grid); }, V.grid ? 'on' : '');
  const left = h('div', { class: 'sh-l rail' }, rb('back', '내 작품', toGallery), rb('undo', '되돌리기', undo), onionB, gridB, rb('image', '사진', importPhotos));
  const timerB = rb('timer', '타이머', () => { V.timer = ({ 0: 3, 3: 5, 5: 0 })[V.timer]; stopTimer(); timerPaint(); });
  const shutterB = h('button', { class: 'shutter', type: 'button', 'aria-label': '찰칵', onclick: shutter }, h('span', { class: 'in' }));
  const doneB = h('button', { class: 'sh-done', type: 'button', 'aria-label': '다 찍었어요', onclick: () => { if (!nFrames()) { toast('먼저 찰칵을 눌러 한 컷이라도 찍어 보세요', 2200); return; } openDeco(); }, html: icon('sparkle') + '<span>다 찍었어요<b>꾸미기 ›</b></span>' });
  const right = h('div', { class: 'sh-r rail' }, rb('switchCam', '카메라', async () => { if (Cam.failed) { camStart(); return; } if (!(await Cam.next())) toast('바꿀 수 있는 다른 카메라가 없어요'); }), timerB, shutterB, doneB);
  body.append(h('div', { class: 'sh' }, left, h('div', { class: 'sh-c' }, mon), right));
  EL = { cv, ctx: cv.getContext('2d'), flash, cd, nocam, banner, film, timerB, shutterB };
  addEventListener('keydown', onKey);
  timerPaint(); shootPaint(); camStart();
  cancelAnimationFrame(V.raf); shootLoop();
}
/* 찍으면 들어갈 자리 */
const capAt = () => V.retake != null ? V.retake : (V.ins != null ? V.ins : nFrames());
function shootPaint() {
  if (V.screen !== 'shoot') return;
  const fr = sc().frames, at = capAt(), film = EL.film; film.innerHTML = '';
  if (V.retake != null && !fr[V.retake]) V.retake = null;
  if (V.ins != null && V.ins > fr.length) V.ins = null;
  film.append(h('span', { class: 'sh-cnt' }, h('b', {}, String(fr.length)), '컷'));
  const list = h('div', { class: 'sh-list list' });
  fr.forEach((f, i) => {
    if (V.ins === i) list.append(h('i', { class: 'sh-ins' }));
    list.append(h('button', { class: 'sh-fr' + (V.retake === i ? ' retake' : ''), type: 'button', 'aria-label': `${i + 1}번 컷`, onclick: () => cutPanel(i) }, h('img', { src: f.url, alt: '' }), h('b', {}, String(i + 1))));
  });
  if (V.ins === fr.length) list.append(h('i', { class: 'sh-ins' }));
  if (!fr.length) list.append(h('span', { class: 'sh-none' }, '찰칵을 누르면 여기에 컷이 쌓여요'));
  film.append(list);
  requestAnimationFrame(() => { const el = list.children[Math.min(at, list.children.length - 1)]; if (el) list.scrollLeft = el.offsetLeft - list.clientWidth / 2 + el.offsetWidth / 2; });
  const b = EL.banner;
  if (V.retake != null) { b.hidden = false; b.innerHTML = ''; b.append(`${V.retake + 1}번 컷을 다시 찍어요`, h('button', { type: 'button', onclick: () => { V.retake = null; shootPaint(); } }, '그만두기')); }
  else if (V.ins != null) { b.hidden = false; b.innerHTML = ''; b.append(V.ins ? `${V.ins}번 컷 뒤에 찍어요` : '맨 앞에 찍어요', h('button', { type: 'button', onclick: () => { V.ins = null; shootPaint(); } }, '맨 뒤에 찍기')); }
  else b.hidden = true;
}
function timerPaint() { const b = EL.timerB; if (!b) return; b.classList.toggle('on', !!V.timer); b.innerHTML = icon('timer') + `<span>${V.timer ? V.timer + '초' : '타이머'}</span>`; }
async function camStart() { EL.nocam.hidden = true; const ok = await Cam.start(); if (!ok && V.screen === 'shoot') noCam(); }
function noCam() {
  const n = EL.nocam; n.hidden = false; n.innerHTML = '';
  const denied = Cam.reason === 'NotAllowedError';
  n.append(h('span', { html: icon('cam'), style: { width: '40px', height: '40px', color: '#CF5D2A' } }),
    h('b', {}, denied ? '카메라 사용이 막혀 있어요' : '이 화면에서는 카메라를 켤 수 없어요'),
    h('p', {}, denied ? '주소창 옆 자물쇠(설정)에서 카메라를 허용하고 다시 시도를 눌러요. 그동안은 찰칵을 누르면 폰 카메라 앱으로 한 컷씩 찍어요.' : '찰칵을 누르면 폰 카메라 앱이 열려요. 한 장 찍을 때마다 한 컷이 쌓여요.'),
    h('div', { class: 'row', style: { justifyContent: 'center' } }, ib('image', '사진 여러 장 불러오기', 'btn sm', { onclick: importPhotos }), ib('rotR', '다시 시도', 'btn sm ghost', { style: { color: '#fff' }, onclick: camStart })));
}
function shootLoop() {
  if (V.screen !== 'shoot') return;
  V.raf = requestAnimationFrame(shootLoop);
  const ctx = EL.ctx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const fr = sc().frames, at = capAt();
  if (Cam.video && Cam.stream && Cam.video.videoWidth) drawCam(ctx, Cam.video);
  else if (fr[at - 1]) drawCover(ctx, fr[at - 1].img);
  if (V.onion && Cam.stream) {
    const oa = .42, p1 = V.retake != null ? fr[V.retake] : fr[at - 1], p2 = V.retake != null ? fr[V.retake - 1] : fr[at - 2];
    if (p2) { ctx.globalAlpha = oa * .5; drawCover(ctx, p2.img); }
    if (p1) { ctx.globalAlpha = oa; drawCover(ctx, p1.img); }
    ctx.globalAlpha = 1;
  }
  if (V.grid) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const x of [W / 3, W * 2 / 3]) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (const y of [H / 3, H * 2 / 3]) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke(); }
}
function shutter() {
  if (V.cdT) { stopTimer(); return; }
  if (!V.timer || !Cam.stream) { capture(); return; }
  let n = V.timer;
  const tick = () => {
    if (V.screen !== 'shoot') return;
    if (n <= 0) { EL.cd.hidden = true; V.cdT = null; EL.shutterB.classList.remove('run'); capture(); return; }
    EL.cd.hidden = false; EL.cd.textContent = n; beep(n === 1 ? 1320 : 880); n--;
    V.cdT = setTimeout(tick, 1000); EL.shutterB.classList.add('run');
  };
  tick();
}
function stopTimer() { clearTimeout(V.cdT); V.cdT = null; if (EL.cd) EL.cd.hidden = true; if (EL.shutterB) EL.shutterB.classList.remove('run'); }
function beep(f) { AE.init(); const c = AE.ctx; if (!c) return; const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.12, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .12); o.connect(g).connect(AE.buses.ui); o.start(); o.stop(c.currentTime + .14); }
async function capture() {
  if (!Cam.stream || !Cam.video || !Cam.video.videoWidth) { const f = await pickImages({ capture: true }); for (const x of f) { const b = await fileToFrameBlob(x); b && addFrame(b); } return; }
  const off = h('canvas', { width: W, height: H }), c = off.getContext('2d');
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H); drawCam(c, Cam.video);
  AE.init(); AE.click(); EL.flash.classList.remove('go'); void EL.flash.offsetWidth; EL.flash.classList.add('go');
  try { navigator.vibrate && navigator.vibrate(15); } catch (e) { }
  addFrame(await new Promise(r => off.toBlob(r, 'image/jpeg', .88)));
}
function addFrame(blob) {
  const fr = sc().frames;
  if (V.retake != null && fr[V.retake]) { const f = fr[V.retake]; Object.assign(f, { blob, ...loadImg(blob) }); V.retake = null; toast('다시 찍었어요', 1000); }
  else { const at = capAt(); insFrames(at, [{ id: uid(), hold: 1, blob, ...loadImg(blob) }]); if (V.ins != null) V.ins = at + 1; }
  changed(); shootPaint();
}
async function importPhotos() { const f = await pickImages({ multiple: true }); for (const x of f) { const b = await fileToFrameBlob(x); b && addFrame(b); } if (f.length) toast(`사진 ${f.length}장을 넣었어요`); }
/* 컷 창: 큰 그림 + 다시 찍기 · 여기 뒤에 찍기 · 지우기 */
function cutPanel(i) {
  const fr = sc().frames; if (!fr[i]) return;
  modal((b, m) => {
    const img = h('img', { class: 'cut-img', src: fr[i].url, alt: `${i + 1}번 컷` });
    const nav = d => { m.close(); cutPanel(clamp(i + d, 0, fr.length - 1)); };
    const act = (ic, label, fn, cls = '') => h('button', { class: 'cut-b ' + cls, type: 'button', onclick: fn, html: icon(ic) + `<span>${label}</span>` });
    b.append(h('div', { class: 'cut' },
      h('div', { class: 'cut-pic' }, h('button', { class: 'cut-nav', type: 'button', 'aria-label': '앞 컷', disabled: i === 0 || null, html: icon('back'), onclick: () => nav(-1) }), img,
        h('button', { class: 'cut-nav', type: 'button', 'aria-label': '뒤 컷', disabled: i === fr.length - 1 || null, html: icon('next'), onclick: () => nav(1) })),
      h('div', { class: 'cut-acts' }, h('b', { class: 'cut-t' }, `${i + 1}번 컷 / ${fr.length}`),
        act('replace', '다시 찍기', () => { m.close(); V.retake = i; V.ins = null; shootPaint(); toast(`${i + 1}번 컷을 다시 찍어요. 찰칵을 누르세요`, 2200); }),
        act('insert', '여기 뒤에 찍기', () => { m.close(); V.ins = i + 1; V.retake = null; shootPaint(); }),
        act('trash', '지우기', () => { m.close(); delFrames(i, 1); if (V.retake === i) V.retake = null; if (V.ins != null && V.ins > i) V.ins--; changed(); shootPaint(); toast('컷을 지웠어요. 되돌리기로 살릴 수 있어요', 1800); }, 'red'),
        h('button', { class: 'btn', type: 'button', onclick: m.close }, '닫기'))));
  }, { wide: true });
}

/* =========================================================
   3. 꾸미기 · 보여주기 — 영상 + 말하기 · 소리 · 배경음악 · 내보내기
   ========================================================= */
const TOOLS = [['voice', 'mic', '말하기'], ['sfx', 'bell', '소리'], ['bgm', 'music', '배경음악'], ['share', 'share', '내보내기']];
function openDeco() {
  closeScreen(); show('studio'); V.screen = 'deco'; S.step = 'deco'; histInit();
  const body = $('#stBody'); body.innerHTML = '';
  const cv = h('canvas', { class: 'stage', width: W, height: H });
  const big = h('button', { class: 'dc-play', type: 'button', 'aria-label': '재생', html: icon('play'), onclick: () => Player.toggle() });
  const sub = h('div', { class: 'guide', hidden: true });
  const stage = h('div', { class: 'dc-mon', onclick: e => { if (e.target === cv) Player.toggle(); } }, cv, big, sub);
  const rng = h('input', { class: 'dc-rng', type: 'range', min: 0, max: 1, step: .001, value: 0, 'aria-label': '위치', oninput: e => { Player.seek(+e.target.value * TL().total); decoTool(); } });
  const marks = h('div', { class: 'dc-marks' }), time = h('span', { class: 'dc-time' }, '0:00');
  const bar = h('div', { class: 'dc-bar' }, h('button', { class: 'ri sm', type: 'button', 'aria-label': '처음으로', html: icon('rewind'), onclick: () => { Player.seek(0); decoTool(); } }), h('div', { class: 'dc-track' }, marks, rng), time);
  const speed = h('div', { class: 'dc-speed' }, h('span', {}, '빠르기'), ...SPEEDS.map(([n, l]) => h('button', { type: 'button', class: P.fps === n ? 'on' : '', onclick: e => { Player.pause(); setFps(n); changed(); [...e.target.parentElement.querySelectorAll('button')].forEach(b => b.classList.toggle('on', b === e.target)); Player.seek(Math.min(Player.t, TL().total)); decoMarks(); } }, l)));
  const left = h('div', { class: 'dc-l rail' }, rb('back', '내 작품', toGallery), rb('cam', '촬영', openShoot, 'cam'), rb('undo', '되돌리기', undo), speed);
  const tabs = h('div', { class: 'dc-tabs' }, ...TOOLS.map(([k, ic, l]) => h('button', { type: 'button', class: k === V.tool ? 'on' : '', 'aria-label': l, html: icon(ic) + `<span>${l}</span>`, onclick: () => { if (V.rec && V.rec.active) V.rec.stop(); AE.stopPreview(); V.tool = k; decoTool(); } })));
  const pane = h('div', { class: 'dc-pane list' });
  body.append(h('div', { class: 'dc' }, left, h('div', { class: 'dc-c' }, stage, bar), h('div', { class: 'dc-r' }, tabs, pane)));
  EL = { cv, big, sub, rng, marks, time, tabs, pane, stage };
  Player.attach(cv, { onTick: t => { if (!EL.rng) return; const T = TL().total; EL.rng.value = T ? t / T : 0; EL.time.textContent = fmt(t) + ' / ' + fmt(T); } });
  Player.onState = on => { EL.big.classList.toggle('hide', on); EL.big.innerHTML = icon(on ? 'pause' : 'play'); if (!on) decoTool(); };
  Player.t = 0; Player.draw();
  addEventListener('keydown', onKey);
  decoPaint();
}
function decoPaint() { if (V.screen !== 'deco') return; Player.draw(); decoMarks(); decoTool(); }
function decoMarks() {
  const m = EL.marks; if (!m) return; m.innerHTML = ''; const T = TL().total || 1;
  for (const s of P.sfx) { const t = absT(s); if (t != null) m.append(h('i', { class: 'sfx', style: { left: (t / T * 100) + '%' } })); }
  for (const n of P.narrs) { const t = absT(n); if (t != null) m.append(h('i', { class: 'narr', style: { left: (t / T * 100) + '%', width: (Math.min(n.dur, T - t) / T * 100) + '%' } })); }
}
function decoTool() {
  const pane = EL.pane; if (!pane) return; pane.innerHTML = '';
  [...EL.tabs.children].forEach((b, i) => b.classList.toggle('on', TOOLS[i][0] === V.tool));
  ({ voice: paneVoice, sfx: paneSfx, bgm: paneBgm, share: paneShare })[V.tool](pane);
}
const tile = (ic, label, on, onclick, color) => { const t = h('button', { class: 'tl' + (on ? ' on' : ''), type: 'button', 'aria-label': label, onclick, html: `<i>${icon(ic)}</i><span>${label}</span>` }); t.style.setProperty('--tc', color); return t; };
/* 말하기: 영상을 보면서 녹음 → 지금 자리에 들어가요. 녹음한 말은 아래 목록에서 듣거나 지워요 */
function paneVoice(pane) {
  const on = V.rec && V.rec.active;
  const recB = h('button', { class: 'rec-big' + (on ? ' run' : ''), type: 'button', 'aria-label': on ? '녹음 멈추기' : '녹음', html: icon(on ? 'stop' : 'mic') + `<span>${on ? '멈추기' : '녹음'}</span>`, onclick: async () => {
    if (V.rec && V.rec.active) { V.rec.stop(); return; }
    if (!TL().total) { toast('먼저 촬영에서 컷을 찍어요'); return; }
    if (Player.t >= TL().total - .05) Player.seek(0);
    V.rec = recordFlow({ kind: 'narrs', wrap: EL.stage, line: null, onState: s => { EL.sub.hidden = s !== 'rec'; if (s === 'rec') EL.sub.textContent = '● 말하는 중… 다 말하면 멈추기를 눌러요'; decoTool(); }, onDone: () => { decoMarks(); decoTool(); toast('말을 넣었어요!', 1400); } });
    await V.rec.start();
  } });
  pane.append(h('p', { class: 'dc-tip' }, on ? '영상이 흐르는 동안 말해요' : '녹음을 누르면 3, 2, 1 뒤에 영상이 흐르면서 녹음돼요'), recB);
  const list = h('div', { class: 'clips list' });
  const ns = [...P.narrs].sort((a, b) => absT(a) - absT(b));
  ns.forEach((n, i) => list.append(h('div', { class: 'clip' }, h('b', {}, `말 ${i + 1}`), h('small', {}, `${fmt(absT(n))}부터 ${n.dur.toFixed(1)}초`),
    h('button', { type: 'button', 'aria-label': '듣기', html: icon('play'), disabled: on || null, onclick: () => { Player.seek(absT(n)); Player.play({ until: absT(n) + n.dur + .2 }); } }),
    h('button', { class: 'red', type: 'button', 'aria-label': '지우기', html: icon('x'), disabled: on || null, onclick: () => { P.narrs = P.narrs.filter(x => x !== n); changed(); decoMarks(); decoTool(); } }))));
  if (!ns.length && !on) list.append(h('span', { class: 'dc-none' }, Mic.failed ? '마이크를 쓸 수 없으면 소리 파일을 넣어요' : '아직 넣은 말이 없어요'));
  pane.append(list);
  if (Mic.failed) pane.append(h('button', { class: 'btn sm', type: 'button', onclick: () => uploadAudio('narrs', null, () => { decoMarks(); decoTool(); }) }, '소리 파일 넣기'));
}
/* 소리(효과음): 누르면 지금 자리에 들어가고 바로 들려요. 같은 자리에 이미 있으면 빼요 */
function paneSfx(pane) {
  AE.init(); Promise.all(SFX.map(s => AE.getSfx(s.id))).catch(() => { });
  const t = Player.t, here = s => P.sfx.find(x => x.snd === s.id && Math.abs(absT(x) - t) < .35);
  const grid = h('div', { class: 'tiles' });
  for (const s of SFX) grid.append(tile(SFX_IC[s.id] || 'speaker', s.name, !!here(s), () => {
    if (!TL().total) { toast('먼저 촬영에서 컷을 찍어요'); return; }
    const old = here(s);
    if (old) { P.sfx = P.sfx.filter(x => x !== old); toast(`${s.name} 소리를 뺐어요`, 1000); }
    else { const it = { id: uid(), snd: s.id, vol: 1 }; setAbs(it, t); P.sfx.push(it); AE.playPreview('sfx', s.id); }
    changed(); decoMarks(); decoTool();
  }, '#CF5D2A'));
  pane.append(h('p', { class: 'dc-tip' }, Player.playing ? '영상이 흐르는 중에 누르면 그 순간에 들어가요' : '영상을 멈춘 자리에 소리가 들어가요. 한 번 더 누르면 빠져요'), grid,
    P.sfx.length ? h('button', { class: 'btn sm ghost', type: 'button', style: { color: '#fff', alignSelf: 'center' }, onclick: async () => { if (await iosAlert('소리를 모두 지울까요?', `넣은 소리 ${P.sfx.length}개가 지워져요.`, '지우기', true)) { P.sfx = []; changed(); decoMarks(); decoTool(); } } }, `넣은 소리 ${P.sfx.length}개 모두 지우기`) : '');
}
/* 배경음악: 하나 고르면 작품 전체에 깔려요 */
function paneBgm(pane) {
  const cur = sc().bgm, grid = h('div', { class: 'tiles' });
  const set = id => { sc().bgm = id; changed(); if (id) AE.playPreview('bgm', id); else AE.stopPreview(); decoTool(); };
  grid.append(tile('mute', '음악 없음', !cur, () => set(null), '#4E9A63'));
  for (const b of BGM) grid.append(tile('music', b.name, cur === b.id, () => set(b.id), '#4E9A63'));
  pane.append(h('p', { class: 'dc-tip' }, '눌러서 들어 봐요. 고른 음악이 작품 전체에 깔려요'), grid,
    h('label', { class: 'toggle dc-tg' }, h('input', { type: 'checkbox', checked: P.duck, onchange: e => { P.duck = e.target.checked; changed(); } }), '말할 때 음악 작게'));
}
/* 내보내기: 영상 파일(저장·보내기) · 작품 파일 */
function paneShare(pane) {
  const big = (ic, label, sub, onclick, cls = '') => h('button', { class: 'share-b ' + cls, type: 'button', onclick, html: `${icon(ic)}<b>${label}</b><small>${sub}</small>` });
  pane.append(h('label', { class: 'dc-title' }, h('span', {}, '작품 이름'), h('input', { class: 'input', value: P.title, maxlength: 40, 'aria-label': '작품 이름', oninput: e => { P.title = e.target.value; changed(); } })),
    h('p', { class: 'dc-tip' }, `컷 ${nFrames()} · ${fmt(TL().total)}초 · 말 ${P.narrs.length} · 소리 ${P.sfx.length}${sc().bgm ? ' · 음악' : ''}`),
    big('download', '영상 파일 만들기', '저장하거나 친구에게 보내요', () => { if (!TL().total) { toast('먼저 촬영에서 컷을 찍어요'); return; } Player.pause(); exportVideo(); }, 'or'),
    big('save', '작품 파일', '다른 폰·태블릿으로 옮겨요', async () => { await saveProject(); const d = await DB.get(P.id).catch(() => null); d ? exportProjectFile(d) : toast('먼저 저장이 되어야 해요'); }));
}
IC.more = IC.more || '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>';
IC.expand = IC.expand || '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>';
