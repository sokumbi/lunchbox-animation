/* =========================================================
   갤러리(내 영화) · 새 영화 창 · 화면 전환 — Stop Motion Studio 방식
   - 갤러리: 왼쪽 아이콘 줄(내 영화 · 최근 삭제 · 불러오기) + 위 줄(정렬 · 그리드/목록)
   - 새 영화: 아래에서 올라오는 창 → 이름 · 포맷 · 프레임 레이트 · 품질 → 만들기
   - 카드를 누르면 카드에서 화면 가득 커지며 편집기로, 돌아올 땐 카드로 작아져요
   ========================================================= */
IC.help = '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7M12 17h.01"/>';
IC.folder = '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>';
IC.listv = '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>';
IC.gridv = '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>';
IC.chev = '<path d="M6 9l6 6 6-6"/>';
IC.chevR = '<path d="M9 6l6 6-6 6"/>';
IC.restore = '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5"/>';

/* 화면 설정은 이 기기에만 기억해요 (정렬 · 보기 방식) */
const GV = { tab: 'movies', sort: 'updated', view: 'grid' };
try { Object.assign(GV, JSON.parse(localStorage.getItem('lb.gallery') || '{}'), { tab: 'movies' }); } catch (e) { }
const gvSave = () => { try { localStorage.setItem('lb.gallery', JSON.stringify({ sort: GV.sort, view: GV.view })); } catch (e) { } };
const SORTS = [['updated', '수정한 날짜'], ['created', '만든 날짜'], ['title', '이름']];

function agoText(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return '지금'; if (s < 3600) return `${Math.floor(s / 60)}분 전`; if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}일 전`; return new Date(t).toLocaleDateString('ko-KR');
}
const workSec = d => d.scenes.reduce((a, s) => a + s.frames.slice(s.trimIn || 0, s.frames.length - (s.trimOut || 0)).reduce((x, f) => x + f.hold, 0), 0) / (d.fps || 12);
const mmss = s => { s = Math.round(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const thumbURL = d => d.thumb ? (d._turl || (d._turl = URL.createObjectURL(d.thumb))) : '';

async function openGallery(o = {}) {
  show('library');
  const root = $('#library'); root.className = 'screen gal-screen'; root.innerHTML = '';
  const up = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async e => { const f = e.target.files[0]; if (!f) return; const d = await importProjectFile(f); if (d) { toast(`“${d.title}”을(를) 불러왔어요`); openGallery(); } } });
  const rb = (ic, label, tab, onclick) => h('button', { class: 'g-rb' + (tab && GV.tab === tab ? ' on' : ''), type: 'button', 'aria-label': label, title: label, html: icon(ic), onclick: onclick || (() => { GV.tab = tab; openGallery(); }) });
  const rail = h('nav', { class: 'g-rail' }, rb('folder', '내 영화', 'movies'), rb('trash', '최근 삭제한 항목', 'trash'), h('span', { class: 'g-sp' }), rb('upload', '작품 파일 불러오기', null, () => up.click()), up);
  const { list, trash } = await loadWorks();
  const sortLabel = SORTS.find(x => x[0] === GV.sort)[1];
  const sortB = h('button', { class: 'g-sort', type: 'button', html: icon('chev') + `<span>${sortLabel}</span>`, onclick: e => ctxMenu(e.currentTarget, SORTS.map(([k, l]) => ({ label: l, ic: GV.sort === k ? 'check' : null, fn: () => { GV.sort = k; gvSave(); openGallery(); } })), { below: true }) });
  const seg = h('div', { class: 'g-seg' },
    h('button', { class: GV.view === 'grid' ? 'on' : '', type: 'button', 'aria-label': '그리드로 보기', html: icon('gridv'), onclick: () => { GV.view = 'grid'; gvSave(); openGallery(); } }),
    h('button', { class: GV.view === 'list' ? 'on' : '', type: 'button', 'aria-label': '목록으로 보기', html: icon('listv'), onclick: () => { GV.view = 'list'; gvSave(); openGallery(); } }));
  const isTrash = GV.tab === 'trash';
  const top = h('div', { class: 'g-top' }, isTrash ? h('b', { class: 'g-h' }, '최근 삭제한 항목') : sortB, h('span', { class: 'g-sp' }), seg);
  const grid = h('div', { class: 'g-grid list v-' + GV.view });
  const items = (isTrash ? trash : list).slice().sort((a, b) => GV.sort === 'title' ? (a.title || '').localeCompare(b.title || '', 'ko') : (b[GV.sort] || 0) - (a[GV.sort] || 0));
  if (!isTrash) grid.append(h('button', { class: 'g-card new', type: 'button', 'aria-label': '새 영화', onclick: () => newMovieSheet() },
    h('span', { class: 'th', html: icon('plus') }), h('span', { class: 'tt' }, h('b', {}, '새 영화'))));
  else if (!items.length) grid.append(h('p', { class: 'g-none' }, `지운 영화는 ${TRASH_DAYS}일 동안 여기 있다가 저절로 없어져요.`));
  for (const d of items) {
    const th = h('span', { class: 'th' + (d.thumb ? '' : ' empty'), html: d.thumb ? '' : icon('film') });
    if (d.thumb) th.style.backgroundImage = `url(${thumbURL(d)})`;
    const sub = isTrash ? `${Math.max(1, Math.ceil((d.trashed + TRASH_DAYS * 864e5 - Date.now()) / 864e5))}일 뒤에 없어져요` : `${agoText(d.updated || d.created)} - ${mmss(workSec(d))}`;
    const card = h('div', { class: 'g-card', role: 'button', tabindex: 0, 'data-id': d.id, 'aria-label': `${d.title || '제목 없음'} 열기` },
      th, h('span', { class: 'tt' }, h('b', {}, d.title || '제목 없음'), h('small', {}, sub)));
    const menu = () => isTrash ? trashMenu(card, d) : workMenu(card, d);
    card.onclick = () => isTrash ? menu() : openWork(d, card);
    card.onkeydown = e => { if (e.key === 'Enter') card.onclick(); };
    card.oncontextmenu = e => { e.preventDefault(); menu(); };
    longPress(card, menu);
    grid.append(card);
  }
  root.append(rail, h('div', { class: 'g-main' }, top, grid));
  if (o.focus) { const c = $(`.g-card[data-id="${o.focus}"]`, grid); if (c) c.scrollIntoView({ block: 'nearest' }); }
  return grid;
}

/* 작품 열기 — 카드에서 화면 가득 커지며 편집기로 */
async function openWork(d, card) {
  const pr = openProject(d);
  await zoomFrom(card, thumbURL(d));
  await pr; openEditor(); zoomDone();
}
/* 편집기 → 갤러리 — 화면이 작아지며 그 작품 카드 자리로 */
async function edToGallery() {
  const id = P && P.id; edClose(); await saveProject();
  const snapURL = (() => { try { return EDel.cv.toDataURL('image/jpeg', .6); } catch (e) { return ''; } })();
  P = null; TLc = null;
  const grid = await openGallery({ focus: id });
  const card = id && $(`.g-card[data-id="${id}"]`, grid);
  if (card) zoomInto(card, snapURL);
}

/* ---------- 확대 · 축소 전환 ---------- */
const ZOOM_MS = 380, ZEASE = 'cubic-bezier(.2,.85,.25,1)';
function rectBox(el) { const r = appRect(el), a = appRect($('#app')); return { left: r.left - a.left, top: r.top - a.top, width: r.width, height: r.height }; }
function zoomer(url) {
  const z = h('div', { class: 'zoomer' + (url ? '' : ' empty'), html: url ? '' : icon('film') });
  if (url) z.style.backgroundImage = `url(${url})`;
  $('#app').append(z); return z;
}
function zoomFrom(el, url) {
  const b = rectBox(el), z = zoomer(url), full = { left: 0, top: 0, width: $('#app').clientWidth, height: $('#app').clientHeight };
  ZOOM.z = z;
  const px = o => ({ left: o.left + 'px', top: o.top + 'px', width: o.width + 'px', height: o.height + 'px' });
  $('#library').classList.add('zooming');
  return z.animate([{ ...px(b), borderRadius: '12px' }, { ...px(full), borderRadius: '0px' }], { duration: ZOOM_MS, easing: ZEASE, fill: 'forwards' }).finished.catch(() => { });
}
const ZOOM = { z: null };
function zoomDone() {
  const z = ZOOM.z; ZOOM.z = null; $('#library').classList.remove('zooming'); if (!z) return;
  z.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).finished.catch(() => { }).then(() => z.remove());
}
function zoomInto(el, url) {
  const b = rectBox(el), z = zoomer(url), full = { left: 0, top: 0, width: $('#app').clientWidth, height: $('#app').clientHeight };
  const px = o => ({ left: o.left + 'px', top: o.top + 'px', width: o.width + 'px', height: o.height + 'px' });
  el.style.visibility = 'hidden';
  z.animate([{ ...px(full), borderRadius: '0px' }, { ...px(b), borderRadius: '12px' }], { duration: ZOOM_MS, easing: ZEASE, fill: 'forwards' }).finished.catch(() => { })
    .then(() => { el.style.visibility = ''; z.remove(); });
}

/* ---------- 길게 눌렀을 때 뜨는 메뉴 (흐린 바탕 + 들어 올린 카드 + 메뉴) ---------- */
function ctxMenu(anchor, items, { lift = false, below = false } = {}) {
  closeCtx();
  const app = $('#app'), b = rectBox(anchor), AW = app.clientWidth, AH = app.clientHeight;
  const bg = h('div', { class: 'cm-bg' + (lift ? ' dim' : ''), onpointerdown: e => { if (e.target === bg) closeCtx(); } });
  if (lift) {
    const ghost = anchor.cloneNode(true); ghost.classList.add('cm-lift'); ghost.removeAttribute('data-id');
    Object.assign(ghost.style, { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px' });
    bg.append(ghost);
  }
  const menu = h('div', { class: 'cm', role: 'menu' });
  for (const it of items) {
    if (it.sep) { menu.append(h('i', { class: 'cm-sep' })); continue; }
    menu.append(h('button', { class: 'cm-i' + (it.red ? ' red' : ''), type: 'button', role: 'menuitem', disabled: it.off || null, onclick: () => { closeCtx(); it.fn(); } },
      h('span', { class: 'cm-ic', html: it.ic ? icon(it.ic) : '' }), h('span', {}, it.label)));
  }
  bg.append(menu); app.append(bg);
  // 자리 잡기: 카드 오른쪽(또는 왼쪽), 화면 밖으로 나가지 않게
  const mw = menu.offsetWidth, mh = menu.offsetHeight, pad = 8;
  let x, y, ox;
  if (below || !lift) { x = clamp(b.left, pad, AW - mw - pad); y = b.top + b.height + 6; if (y + mh > AH - pad) y = Math.max(pad, b.top - mh - 6); ox = '20% 0'; }
  else {
    x = b.left + b.width + 10; ox = '0 30%';
    if (x + mw > AW - pad) { x = b.left - mw - 10; ox = '100% 30%'; }
    if (x < pad) { x = clamp(b.left, pad, AW - mw - pad); ox = '50% 0'; }
    y = clamp(b.top, pad, AH - mh - pad);
  }
  Object.assign(menu.style, { left: x + 'px', top: y + 'px', transformOrigin: ox });
  try { navigator.vibrate && navigator.vibrate(8); } catch (e) { }
  return bg;
}
function closeCtx() { const bg = $('.cm-bg'); if (!bg) return; bg.classList.add('out'); bg.style.pointerEvents = 'none'; setTimeout(() => bg.remove(), 170); }

function workMenu(card, d) {
  ctxMenu(card, [
    { label: '이름 바꾸기', ic: 'edit', fn: () => renameWork(d) },
    { label: '동영상 내보내기', ic: 'share', fn: async () => { await openProject(d); exportVideo(); } },
    { label: '작품 파일로 저장', ic: 'download', fn: () => exportProjectFile(d) },
    { label: '복제', ic: 'copy', fn: async () => { const c = { ...d, id: uid(), title: dupName(d.title), created: Date.now(), updated: Date.now() }; delete c._turl; await DB.put(c); openGallery(); } },
    { sep: true },
    { label: '삭제', ic: 'trash', red: true, fn: async () => { if (await iosAlert('영화를 지울까요?', `최근 삭제한 항목으로 옮겨요. ${TRASH_DAYS}일 동안은 되살릴 수 있어요.`, '삭제', true)) await trashWork(card, d); } }
  ], { lift: true });
}
function trashMenu(card, d) {
  ctxMenu(card, [
    { label: '되살리기', ic: 'restore', fn: async () => { delete d.trashed; delete d._turl; await DB.put(d); toast(`“${d.title}”을(를) 되살렸어요`, 1500); openGallery(); } },
    { sep: true },
    { label: '완전히 지우기', ic: 'trash', red: true, fn: async () => { if (await iosAlert('완전히 지울까요?', '완전히 지우면 다시 되살릴 수 없어요.', '지우기', true)) { await DB.del(d.id); openGallery(); } } }
  ], { lift: true });
}
function dupName(t) { return (t || '영화') + ' 복사본'; }
async function trashWork(card, d) {
  d.trashed = Date.now(); delete d._turl; await DB.put(d);
  card.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.6)', opacity: 0 }], { duration: 240, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => { }).then(() => openGallery());
}
function renameWork(d) {
  iosAlert('이름 바꾸기', '', '저장', false, d.title || '').then(async v => {
    if (typeof v !== 'string' || !v.trim()) return;
    d.title = v.trim(); d.updated = Date.now(); delete d._turl; await DB.put(d); openGallery();
  });
}

/* iOS 알림창 — 가운데 작게, 버튼 두 개. value를 주면 입력칸이 생겨요 (입력한 글을 돌려줘요) */
function iosAlert(title, text, okLabel = '확인', danger = false, value = null) {
  return new Promise(res => {
    const inp = value != null ? h('input', { class: 'al-in', value, maxlength: 40, 'aria-label': title }) : null;
    const done = v => { bg.classList.add('out'); setTimeout(() => bg.remove(), 160); res(v); };
    const ok = () => done(inp ? inp.value : true);
    const bg = h('div', { class: 'al-bg', onpointerdown: e => { if (e.target === bg) done(false); } },
      h('div', { class: 'al', role: 'alertdialog', 'aria-modal': 'true' },
        h('b', { class: 'al-t' }, title), text ? h('p', { class: 'al-p' }, text) : '', inp || '',
        h('div', { class: 'al-acts' },
          h('button', { type: 'button', onclick: () => done(false) }, '취소'),
          h('button', { class: danger ? 'red' : 'ok', type: 'button', onclick: ok }, okLabel))));
    if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
    $('#app').append(bg);
    if (inp) setTimeout(() => { inp.focus(); inp.select(); }, 60);
  });
}

/* =========================================================
   새 영화 창 — 아래에서 올라와요. 안에서 포맷 · 프레임 레이트 · 품질 화면으로 밀려 들어가요
   ========================================================= */
const NEW_QUALS = [['sd', 'SD', '가벼운 화질', '#636366'], ['hd', 'HD', '고화질', '#3a3a3c'], ['fhd', 'FHD', '풀 HD 화질', '#30a46c']];
async function newMovieSheet() {
  const { list } = await loadWorks();
  const base = '나의 스톱모션 영화';
  let name = base, n = 1; while (list.some(d => d.title === name)) name = `${base}(${n++})`;
  const st = { name, fmt: 'wide', fps: 5, q: 'hd' };
  const app = $('#app'), lib = $('#library');
  const sheet = h('div', { class: 'ns', role: 'dialog', 'aria-modal': 'true', 'aria-label': '새 영화' });
  const bg = h('div', { class: 'ns-bg', onpointerdown: e => { if (e.target === bg) close(); } }, sheet);
  app.append(bg); lib.classList.add('behind');
  requestAnimationFrame(() => bg.classList.add('in'));
  let closing = false;
  function close() {
    if (closing) return Promise.resolve(); closing = true;
    stopBall(); bg.classList.remove('in'); lib.classList.remove('behind');
    return new Promise(r => setTimeout(() => { bg.remove(); r(); }, 380));
  }
  const pages = [];
  function push(pg) {
    const prev = pages[pages.length - 1]; pages.push(pg); sheet.append(pg);
    if (prev) { pg.classList.add('from-r'); requestAnimationFrame(() => requestAnimationFrame(() => { pg.classList.remove('from-r'); prev.classList.add('to-l'); })); prev._hide = setTimeout(() => { prev.style.visibility = 'hidden'; }, 380); }
  }
  function pop() {
    const pg = pages.pop(), prev = pages[pages.length - 1]; stopBall();
    clearTimeout(prev._hide); prev.style.visibility = ''; pg.classList.add('from-r'); prev.classList.remove('to-l'); prev.refresh && prev.refresh();
    setTimeout(() => pg.remove(), 360);
  }
  const head = (left, title, right) => h('div', { class: 'ns-head' }, left || h('span'), h('b', { class: 'ns-title' }, title), right || h('span'));
  const pill = (label, fn, cls = '') => h('button', { class: 'ns-pill ' + cls, type: 'button', onclick: fn }, label);

  // 1) 첫 화면
  const main = h('div', { class: 'ns-pg' });
  const inp = h('input', { class: 'ns-name', value: st.name, maxlength: 40, 'aria-label': '영화 이름', oninput: e => { st.name = e.target.value; } });
  const clr = h('button', { class: 'ns-clr', type: 'button', 'aria-label': '이름 지우기', html: icon('x'), onclick: () => { inp.value = ''; st.name = ''; inp.focus(); } });
  const tiles = h('div', { class: 'ns-tiles' });
  main.refresh = () => {
    tiles.innerHTML = '';
    const f = fmtInfo(st.fmt), r = f.r, q = NEW_QUALS.find(x => x[0] === st.q);
    const tile = (label, inner, fn, style) => h('button', { class: 'ns-tile', type: 'button', 'aria-label': label, onclick: fn }, h('span', { class: 'ns-tb', style }, inner), h('small', {}, label));
    tiles.append(
      tile('포맷', h('span', { class: 'ns-fmt' }, h('b', {}, f.name), h('i', {}, f.sub.split(' · ')[0])), () => push(fmtPage()), { '--r': r }),
      tile('프레임 레이트', h('b', { class: 'ns-big' }, String(st.fps)), () => push(fpsPage())),
      tile('품질', h('b', { class: 'ns-big' }, q[1]), () => push(qPage())));
  };
  main.refresh();
  const make = async () => {
    const title = (st.name || '').trim() || name;
    P = newProject(title, { fmt: st.fmt, fps: st.fps, q: st.q }); setFormat(P.fmt); TLc = null;
    await saveProject();
    await close();
    const grid = await openGallery({ focus: P.id }), card = $(`.g-card[data-id="${P.id}"]`, grid);
    if (card) { card.animate([{ transform: 'scale(.7)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 260, easing: ZEASE }); await new Promise(r => setTimeout(r, 300)); await zoomFrom(card, ''); }
    openEditor(); zoomDone();
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
  main.append(head(pill('취소', close), '새 영화'),
    h('div', { class: 'ns-body' }, h('div', { class: 'ns-nrow' }, inp, clr), tiles),
    h('div', { class: 'ns-foot' }, h('button', { class: 'ns-make', type: 'button', onclick: make }, '만들기')));
  push(main);

  // 2) 포맷
  function fmtPage() {
    const pg = h('div', { class: 'ns-pg' });
    const rows = h('div', { class: 'ns-list list' }, ...FORMATS.map(f => h('button', { class: 'ns-row' + (f.id === st.fmt ? ' on' : ''), type: 'button', onclick: () => { st.fmt = f.id; pop(); } },
      h('span', { class: 'ns-ar', style: { '--r': f.r } }), h('span', { class: 'ns-rt' }, h('b', {}, f.name), h('small', {}, f.sub)), h('span', { class: 'ns-ck', html: f.id === st.fmt ? icon('check') : '' }))));
    pg.append(head(pill('', pop, 'bk'), '포맷'), rows, h('p', { class: 'ns-cap' }, '올릴 곳과 원하는 모양에 맞는 화면 비율을 골라요.'));
    $('.ns-pill.bk', pg).innerHTML = icon('back'); $('.ns-pill.bk', pg).setAttribute('aria-label', '뒤로');
    return pg;
  }
  // 3) 프레임 레이트 — 공이 튀는 미리 보기가 그 빠르기로 움직여요
  function fpsPage() {
    const pg = h('div', { class: 'ns-pg' }); let v = st.fps;
    const cv = h('canvas', { class: 'ns-prev', width: 480, height: 200 });
    const num = h('span', { class: 'ns-num' }, String(v));
    const cap = h('p', { class: 'ns-cap' });
    const setV = x => { v = x; num.textContent = String(v); cap.textContent = `영상 1초마다 사진 ${v}장이 필요해요.`; };
    const rng = h('input', { class: 'ns-rng', type: 'range', min: 1, max: 30, step: 1, value: v, 'aria-label': '1초에 사진 몇 장', oninput: e => setV(+e.target.value) });
    setV(v);
    pg.append(head(pill('취소', pop), '프레임 레이트', pill('완료', () => { st.fps = v; pop(); }, 'ok')),
      h('div', { class: 'ns-fbody' }, cv, h('div', { class: 'ns-srow' }, num, rng)), cap);
    startBall(cv, () => v);
    return pg;
  }
  // 4) 품질
  function qPage() {
    const pg = h('div', { class: 'ns-pg' });
    const rows = h('div', { class: 'ns-list list' }, ...NEW_QUALS.map(([k, b, l, c]) => h('button', { class: 'ns-row' + (k === st.q ? ' on' : ''), type: 'button', onclick: () => { st.q = k; pop(); } },
      h('span', { class: 'ns-qb', style: { background: c } }, b), h('span', { class: 'ns-rt' }, h('b', {}, l)), h('span', { class: 'ns-ck', html: k === st.q ? icon('check') : '' }))));
    pg.append(head(pill('', pop, 'bk'), '품질'), rows, h('p', { class: 'ns-cap' }, '화질이 높을수록 선명하지만 저장 공간을 더 많이 써요.'));
    $('.ns-pill.bk', pg).innerHTML = icon('back'); $('.ns-pill.bk', pg).setAttribute('aria-label', '뒤로');
    return pg;
  }
}
/* 찰흙 공 튀기기 — 1초에 v장씩만 그려서 빠르기 차이가 보여요 */
let ballRaf = 0;
function stopBall() { cancelAnimationFrame(ballRaf); ballRaf = 0; }
function startBall(cv, getV) {
  stopBall(); const c = cv.getContext('2d'), t0 = performance.now();
  const loop = now => {
    ballRaf = requestAnimationFrame(loop);
    const v = getV(), t = Math.floor((now - t0) / 1000 * v) / v, p = (t % 1.2) / 1.2;   // 1.2초에 한 번 튀어요
    const Wc = cv.width, Hc = cv.height, floor = Hc * .8;
    const g = c.createLinearGradient(0, 0, 0, Hc); g.addColorStop(0, '#c9ccd3'); g.addColorStop(.62, '#e3e4e8'); g.addColorStop(.63, '#d9d5cc'); g.addColorStop(1, '#efebe2');
    c.fillStyle = g; c.fillRect(0, 0, Wc, Hc);
    const hgt = Math.sin(p * Math.PI), y = floor - hgt * Hc * .48, sq = hgt < .12 ? 1 - (.12 - hgt) * 3.2 : 1 + hgt * .08, x = Wc * .2 + p * Wc * .6;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, floor + 6, 30 * (1.2 - hgt * .5), 6, 0, 0, 7); c.fill();
    c.fillStyle = '#4b5bc4'; c.beginPath(); c.ellipse(x, y - 22 * sq, 26 / Math.sqrt(sq), 24 * sq, 0, 0, 7); c.fill();
    c.fillStyle = '#ffffff33'; c.beginPath(); c.ellipse(x - 8, y - 30 * sq, 8, 5, -.5, 0, 7); c.fill();
  };
  ballRaf = requestAnimationFrame(loop);
}
