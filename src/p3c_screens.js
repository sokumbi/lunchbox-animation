/* =========================================================
   화면 전환 · 시작
   앱을 열면 바로 갤러리(내 영화, p6c_new.js) → 편집기(p6_editor.js)
   ========================================================= */
IC.full = '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>';

const SCREENS = ['library', 'studio'];
function show(id) { for (const s of SCREENS) $('#' + s).hidden = s !== id; requestAnimationFrame(() => LCD.repaintAll()); }

function goFullscreen() {
  try {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).then(() => { try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { });
  } catch (e) { }
}

/* ---------- 시작: 바로 갤러리 ---------- */
function initApp() {
  layoutApp();
  // 처음 손댈 때 소리 엔진을 켜고, 버튼을 누를 때마다 짧은 클릭음
  document.addEventListener('pointerdown', e => {
    if (!AE.ctx) AE.init();
    const b = e.target.closest('button,.key,[role=button]');
    if (b && !b.classList.contains('shutter') && AE.ctx) AE.click(.12);
  }, true);
  openGallery();
}

/* 지운 작품은 휴지통에 30일 동안 남아요 (d.trashed = 지운 시각) */
const TRASH_DAYS = 30;
async function loadWorks() {
  let all = [];
  try { all = (await DB.all()).sort((a, b) => b.updated - a.updated); } catch (e) { }
  const old = Date.now() - TRASH_DAYS * 864e5;
  for (const d of all.filter(d => d.trashed && d.trashed < old)) { try { await DB.del(d.id); } catch (e) { } }
  return { list: all.filter(d => !d.trashed), trash: all.filter(d => d.trashed && d.trashed >= old) };
}
async function openTrash() {
  const { trash } = await loadWorks();
  modal((b, m) => {
    b.append(h('h2', {}, '휴지통'), h('p', { class: 'hint', style: { margin: 0 } }, `지운 작품은 ${TRASH_DAYS}일 동안 여기 있다가 저절로 없어져요.`));
    if (!trash.length) b.append(h('p', { class: 'hint' }, '휴지통이 비어 있어요.'));
    const box = h('div', { class: 'works' });
    for (const d of trash) {
      const left = Math.max(1, Math.ceil((d.trashed + TRASH_DAYS * 864e5 - Date.now()) / 864e5));
      const th = h('div', { class: 'th' }); if (d.thumb) th.style.backgroundImage = `url(${URL.createObjectURL(d.thumb)})`;
      box.append(h('div', { class: 'work-i' }, th,
        h('div', {}, h('b', { style: { fontFamily: 'var(--display)', fontWeight: 800, fontSize: '16px' } }, d.title), h('div', { class: 'hint' }, `${left}일 뒤에 없어져요`)),
        h('div', { class: 'row' },
          ib('trash', '', 'btn sm icon ghost', { 'aria-label': '완전히 지우기', onclick: async () => { if (await confirmBox('완전히 지울까요?', `“${d.title}”을(를) 완전히 지우면 다시 되살릴 수 없어요.`, '완전히 지우기', true)) { await DB.del(d.id); m.close(); openTrash(); } } }),
          h('button', { class: 'btn sm accent', type: 'button', onclick: async () => { delete d.trashed; await DB.put(d); toast(`“${d.title}”을(를) 되살렸어요`); m.close(); openGallery(); } }, '되살리기'))));
    }
    b.append(box, h('div', { class: 'acts' }, ib('back', '내 작품으로', 'btn', { onclick: () => { m.close(); openGallery(); } }), h('button', { class: 'btn primary', type: 'button', onclick: m.close }, '닫기')));
  }, { wide: true });
}

/* 무대 캔버스 (전체 보기 창에서 써요) */
function stageEl(extra) {
  const wrap = h('div', { class: 'stage-wrap' }); const cv = h('canvas', { class: 'stage', width: W, height: H }); wrap.append(cv); if (extra) wrap.append(...extra);
  return { wrap, cv };
}
