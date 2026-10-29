/* =========================================================
   화면 흐름 (런치박스)
   닫힌 런치박스 → 제작 과정(터치하면 하나씩) → 시나리오 확대 → 이야기 고르기
   → 별주부전 원작 영상 → 제작 과정 → 촬영
   ========================================================= */
IC.full = '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>';
/* 원작 애니메이션 영상 파일이 준비되면 여기에 경로를 넣어 주세요 (예: 'byeoljubu.mp4').
   비어 있으면 앱 안의 컷아웃 애니메이션을 대신 보여 줘요. */
const INTRO_VIDEO = '';

const SCREENS = ['splash', 'process', 'library', 'intro', 'studio'];
function show(id) { for (const s of SCREENS) $('#' + s).hidden = s !== id; requestAnimationFrame(() => LCD.repaintAll()); }

function goFullscreen() {
  try {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).then(() => { try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { });
  } catch (e) { }
}

/* ---------- 1. 닫힌 런치박스 ---------- */
function initSplash() {
  layoutApp();
  $('#splashArt').innerHTML = `<img class="lbox-img" src="${SPLASH_IMG}" alt="아르떼노바 런치박스">`;
  $('#splash').style.background = SPLASH_BG;
  $('#splashName').textContent = BRAND.app;
  let gone = false;
  const go = () => {
    if (gone) return; gone = true; AE.init(); goFullscreen(); AE.click(.2);
    $('#splash').classList.add('open');
    setTimeout(() => { showProcess('home'); $('#splash').classList.remove('open'); }, 560);
  };
  $('#splash').addEventListener('click', go);
  // 버튼을 누를 때마다 짧은 클릭음
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('button,.key,[role=button],.cas.on');
    if (b && !b.classList.contains('shutter') && AE.ctx) AE.click(.12);
  }, true);
}

/* ---------- 2. 제작 과정 ---------- */
const PROC = [
  { id: 'script', name: '시나리오', ic: 'book' },
  { id: 'shoot', name: '촬영', ic: 'cam' },
  { id: 'voice', name: '대사 녹음', ic: 'mic' },
  { id: 'sound', name: '사운드', ic: 'music' },
  { id: 'edit', name: '편집', ic: 'scissors' }
];
function showProcess(mode) {
  show('process');
  const box = $('#process'); box.innerHTML = '';
  const tray = h('div', { class: 'tray' }); box.append(tray);
  const nav = mode === 'nav';
  const next = nav ? S.step : mode === 'byeoljubu' ? 'shoot' : 'script';
  const done = nav ? P.done : mode === 'byeoljubu' ? { script: true } : {};
  const title = mode === 'home' ? '애니메이션은 이렇게 만들어요' : mode === 'byeoljubu' ? '이제 직접 찍어 볼까요?' : mode === 'new' ? '먼저 시나리오를 써요' : (P.title || '나의 애니메이션');
  const top = h('div', { class: 'proc-top' });
  if (nav) top.append(key('목록', { ic: 'home', cls: 'dim', onclick: async e => { e.stopPropagation(); if (await confirmBox('이야기 목록으로 갈까요?', '작품은 자동으로 저장돼요. 내 작품함에서 다시 열 수 있어요.', '목록으로')) { leaveStep(); await saveProject(); P = null; openLibrary(); } } }));
  top.append(LCD.make(title));
  if (nav) top.append(key('돌아가기', { ic: 'back', onclick: e => { e.stopPropagation(); goStep(S.step); show('studio'); } }));
  const row = h('div', { class: 'proc' });
  const items = PROC.map((p, i) => {
    const el = h('button', { class: 'key proc-item' + (done[p.id] ? ' done' : '') + (nav && p.id === S.step ? ' cur' : ''), type: 'button', 'data-id': p.id },
      h('span', { class: 'no' }, String(i + 1).padStart(2, '0')), h('span', { html: icon(p.ic, 'ki') }), h('b', {}, p.name));
    row.append(h('div', { class: 'well proc-slot' }, el)); return el;
  });
  const touch = h('div', { class: 'proc-touch' }, mode === 'home' ? '화면을 터치해 보세요' : '');
  row.append(touch);
  row.style.position = 'relative';
  tray.append(top, row);
  let revealed = false, busy = false;
  const reveal = (fast) => {
    revealed = true; touch.remove();
    items.forEach((el, i) => setTimeout(() => { el.classList.add('show'); AE.ctx && AE.click(.08); }, (fast ? 90 : 320) * i));
    setTimeout(() => {
      const n = items.find(el => el.dataset.id === next) || items[0];
      if (!nav) { n.classList.add('next'); n.append(h('span', { class: 'badge' }, '눌러서 시작')); }
    }, (fast ? 90 : 320) * items.length + 80);
  };
  if (mode !== 'home') setTimeout(() => reveal(true), 120);
  tray.onclick = e => {
    if (busy) return;
    if (!revealed) { reveal(false); return; }
    const hit = e.target.closest('.proc-item');
    if (nav) { if (!hit) return; goStep(hit.dataset.id); show('studio'); return; }
    const pick = mode === 'home' ? 'script' : (hit ? hit.dataset.id : next);
    const el = items.find(x => x.dataset.id === pick);
    busy = true;
    growFrom(el, PROC.find(p => p.id === pick).name, ov => {
      if (mode === 'home') { openLibrary(); dropOverlay(ov); }
      else if (mode === 'new') { openStudio(pick); dropOverlay(ov); }
      else setupProject(pick, ov);
    });
  };
}
function growFrom(el, label, cb) {
  const r = appRect(el), a = appRect($('#app'));
  const ov = h('div', { class: 'grow-overlay', style: { left: r.left - a.left + 'px', top: r.top - a.top + 'px', width: r.width + 'px', height: r.height + 'px' } }, h('b', {}, label));
  $('#app').append(ov); void ov.offsetWidth;
  Object.assign(ov.style, { left: '0px', top: '0px', width: '100%', height: '100%', borderRadius: '0px' }); ov.classList.add('full');
  setTimeout(() => cb(ov), 620);
}
function dropOverlay(ov) { if (!ov) return; ov.style.transition = 'opacity .35s'; ov.style.opacity = '0'; setTimeout(() => ov.remove(), 380); }

/* ---------- 3. 이야기 고르기 ----------
   갈래(전래동화 · 전국 팔도 민담 · 나만의 이야기) → 전래동화 카드 / 팔도 지도 / 바로 촬영.
   view: 'home' | 'tales' | 'map' — 상영관(p5e_theater)도 같은 화면을 써요 */
function libTop(title, back) {
  const top = $('#libTop'); top.innerHTML = '';
  top.append(back ? key('', { ic: 'back', cls: 'home', aria: '뒤로', onclick: back }) : key('', { ic: 'home', cls: 'home', aria: '처음으로', onclick: () => showProcess('home') }),
    h('div', { class: 'brand' }, h('i', { html: icon('film') }), BRAND.app),
    LCD.make(title));
  return top;
}
function libBody(view) { const g = $('#taleGrid'); g.innerHTML = ''; g.className = 'well tale-grid v-' + view; return g; }
function openLibrary(view = 'home') {
  show('library'); stopIntro();
  if (view === 'tales') return openTales();
  if (view === 'map') return openMap();
  libTop('어떤 이야기로 만들까요?').append(
    key('내 작품함', { ic: 'film', cls: 'works', onclick: openWorks }),
    key('상영관', { ic: 'trophy', cls: 'works hall', onclick: () => openTheater() }));
  const g = libBody('home');
  for (const k of STORY_KINDS) {
    const el = h('button', { class: 'kind', type: 'button', 'data-kind': k.id, onclick: () => k.id === 'own' ? startOwnStory() : openLibrary(k.id) },
      h('span', { class: 'kart', html: icon(k.ic) }),
      h('b', {}, k.name), h('span', { class: 'ks' }, k.sub));
    el.style.setProperty('--kc', k.c); g.append(el);
  }
}
function openTales() {
  libTop('전래동화', () => openLibrary()).append(key('내 작품함', { ic: 'film', cls: 'works', onclick: openWorks }));
  const g = libBody('tales');
  // 이야기 카드 — 별주부전만 켜짐, 같은 크기의 그림 카드
  TALES.forEach(t => {
    const el = h(t.on ? 'button' : 'div', { class: 'cas' + (t.on ? ' on' : ''), type: t.on ? 'button' : null, 'aria-disabled': t.on ? null : 'true', title: t.on ? t.sub : '준비 중' },
      h('span', { class: 'art', html: icon('book') }), h('span', { class: 'bd', html: t.on ? '시작' : icon('lock') + '준비 중' }), h('span', { class: 'tt' }, t.title));
    el.style.setProperty('--art', `radial-gradient(circle at 75% 25%, ${t.c}, color-mix(in srgb, ${t.c} 55%, #1E1C1A))`);
    if (t.on) el.onclick = () => { AE.init(); startIntro(); };
    g.append(el);
  });
}
/* 팔도 지도 — 깜빡이는 곳(장소)을 누르면 오른쪽에 그곳 민담이 나와요 */
function openMap() {
  libTop('전국 팔도 민담', () => openLibrary()).append(key('내 작품함', { ic: 'film', cls: 'works', onclick: openWorks }));
  const g = libBody('map');
  const places = [];
  for (const l of LEGENDS) { let p = places.find(p => p.name === l.place); if (!p) places.push(p = { name: l.place, at: l.at, p: l.p, items: [] }); p.items.push(l); }
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let svg = '<svg viewBox="0 0 640 1000" class="kmap" role="img" aria-label="한반도 팔도 지도">';
  for (const v of PALDO) svg += `<path class="do" data-do="${v.id}" d="${v.d}" fill="${v.c}"/>`;
  for (const v of PALDO) { const [x, y] = mapXY(v.at); svg += `<text class="do-n" x="${x.toFixed(0)}" y="${y.toFixed(0)}">${v.name}</text>`; }
  for (const m of MAP_MARKS) { const [x, y] = mapXY(m.at); svg += (m.dot ? `<circle class="isle" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="4"/>` : '') + `<text class="isle-n" x="${x.toFixed(0)}" y="${(y + (m.dot ? 22 : -14)).toFixed(0)}">${m.name}</text>`; }
  places.forEach((p, i) => {
    const [x, y] = mapXY(p.at);
    svg += `<g class="pin" data-i="${i}" role="button" tabindex="0" aria-label="${esc(p.name)}" transform="translate(${x.toFixed(0)} ${y.toFixed(0)})" style="--d:${(i * .23 % 1.6).toFixed(2)}s">` +
      `<circle class="hit" r="30"/><circle class="ring" r="13"/><circle class="dot" r="11"/><text class="pin-n" y="-20">${esc(p.name)}</text></g>`;
  });
  svg += '</svg>';
  const mapEl = h('div', { class: 'map-wrap', html: svg });
  const side = h('div', { class: 'map-side' });
  g.append(mapEl, side);
  const svgEl = $('svg', mapEl);
  const pick = (i, which = 0) => {
    const p = places[i], d = PALDO.find(v => v.id === p.p), l = p.items[which];
    $$('.pin', svgEl).forEach(el => el.classList.toggle('sel', +el.dataset.i === i));
    $$('.do', svgEl).forEach(el => el.classList.toggle('dim', el.dataset.do !== p.p));
    side.innerHTML = '';
    side.append(h('div', { class: 'ms-head' }, h('span', { class: 'do-chip', style: { background: d.c } }, d.name), h('b', {}, p.name)));
    if (p.items.length > 1) side.append(h('div', { class: 'row ms-tabs' }, ...p.items.map((it, j) => h('button', { class: 'chip' + (j === which ? ' on' : ''), type: 'button', onclick: () => pick(i, j) }, it.title))));
    side.append(
      h('div', { class: 'ms-body scroll' },
        h('h3', {}, l.title), h('div', { class: 'ms-sub' }, l.sub),
        h('p', {}, l.syn),
        h('div', { class: 'ms-sc' }, h('span', { class: 'label' }, `장면 ${l.scenes.length}개`), ...l.scenes.map((n, k) => h('span', { class: 'chip' }, `${k + 1}. ${n}`)))),
      key('이 이야기로 만들기', { ic: 'next', cls: 'orange row ms-go', onclick: () => startLegend(l) }));
  };
  const intro = () => {
    side.innerHTML = '';
    side.append(h('div', { class: 'ms-body scroll ms-intro' },
      h('h3', {}, '우리 고장 옛이야기'),
      h('p', {}, '지도에서 반짝반짝 깜빡이는 곳을 눌러 보세요. 그 고장에 내려오는 이야기가 나와요.'),
      h('div', { class: 'ms-sc' }, ...places.map((p, i) => h('button', { class: 'chip', type: 'button', onclick: () => pick(i) }, p.name)))));
  };
  svgEl.addEventListener('click', e => { const pin = e.target.closest('.pin'); if (pin) pick(+pin.dataset.i); });
  svgEl.addEventListener('keydown', e => { const pin = e.target.closest('.pin'); if (pin && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(+pin.dataset.i); } });
  intro();
}
/* 민담으로 시작 — 줄거리·장면을 미리 넣고 시나리오부터 */
function startLegend(l) {
  AE.init();
  P = newProject('나의 ' + l.title, l.scenes[0], l.id);
  for (const n of l.scenes.slice(1)) P.scenes.push(newScene(n));
  P.synopsis = l.syn; P.scriptMode = 'new'; P.script = []; TLc = null; scheduleSave();
  openStudio('script');
}
/* 나만의 이야기 — 바로 촬영 (제목·시나리오는 나중에 써도 돼요) */
function startOwnStory() {
  AE.init();
  P = newProject('나만의 이야기', '1장면', 'new'); P.scriptMode = 'new'; P.script = []; TLc = null; scheduleSave();
  openStudio('shoot');
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
async function openWorks() {
  const { list, trash } = await loadWorks();
  modal((b, m) => {
    const up = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async e => { const f = e.target.files[0]; if (!f) return; const d = await importProjectFile(f); if (d) { toast(`“${d.title}”을(를) 불러왔어요`); m.close(); openWorks(); } } });
    b.append(h('div', { class: 'panel-title' }, h('h2', {}, '내 작품함'),
      h('div', { class: 'row' }, up, ib('upload', '파일 불러오기', 'btn sm', { onclick: () => up.click() }),
        ib('trash', `휴지통${trash.length ? ' ' + trash.length : ''}`, 'btn sm ghost', { onclick: () => { m.close(); openTrash(); } }))));
    if (!list.length) b.append(h('p', { class: 'hint' }, '아직 저장된 작품이 없어요. 작품은 이 기기의 브라우저에 저장돼요. 다른 기기에서 만든 작품 파일은 “파일 불러오기”로 열어요.'));
    const box = h('div', { class: 'works' });
    for (const d of list) {
      const th = h('div', { class: 'th' }); if (d.thumb) th.style.backgroundImage = `url(${URL.createObjectURL(d.thumb)})`;
      const frames = d.scenes.reduce((a, s) => a + s.frames.length, 0);
      box.append(h('div', { class: 'work-i' }, th,
        h('div', {}, h('b', { style: { fontFamily: 'var(--display)', fontWeight: 800, fontSize: '16px' } }, d.title), h('div', { class: 'hint' }, `${storyInfo(d.storyId).title} · 장면 ${d.scenes.length}개 · 컷 ${frames}개`)),
        h('div', { class: 'row' },
          ib('trash', '', 'btn sm icon ghost', { 'aria-label': '작품 지우기', onclick: async () => { if (await confirmBox('작품을 휴지통에 넣을까요?', `“${d.title}”은(는) 휴지통에 ${TRASH_DAYS}일 동안 있어요. 그동안은 되살릴 수 있어요.`, '휴지통에 넣기', true)) { d.trashed = Date.now(); await DB.put(d); m.close(); openWorks(); toast('휴지통에 넣었어요'); } } }),
          ib('download', '', 'btn sm icon', { 'aria-label': '작품 파일로 저장', title: '작품 파일로 저장 (백업 · 다른 기기로 옮기기)', onclick: () => exportProjectFile(d) }),
          h('button', { class: 'btn sm accent', type: 'button', onclick: async () => { m.close(); toast('작품을 여는 중…'); await openProject(d); openStudio(d.lastStep || 'shoot'); } }, '이어서 만들기'))));
    }
    b.append(box, h('div', { class: 'acts' }, h('button', { class: 'btn', type: 'button', onclick: m.close }, '닫기')));
  }, { wide: true });
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
          h('button', { class: 'btn sm accent', type: 'button', onclick: async () => { delete d.trashed; await DB.put(d); toast(`“${d.title}”을(를) 되살렸어요`); m.close(); openWorks(); } }, '되살리기'))));
    }
    b.append(box, h('div', { class: 'acts' }, ib('back', '작품함으로', 'btn', { onclick: () => { m.close(); openWorks(); } }), h('button', { class: 'btn primary', type: 'button', onclick: m.close }, '닫기')));
  }, { wide: true });
}

/* ---------- 4. 원작 영상 ---------- */
let introReturn = null;
function startIntro() {
  show('intro'); stopIntro();
  const done = () => { stopIntro(); $$('video', $('#introFrame')).forEach(v => { v.pause(); v.remove(); }); if (introReturn && P) { const st = introReturn; introReturn = null; openStudio(st); } else showProcess('byeoljubu'); };
  $('#introSkip').innerHTML = '<span>건너뛰기</span>' + icon('next');
  $('#introSkip').onclick = done;
  const frame = $('#introFrame'), vb = $('#introVoice');
  $$('video', frame).forEach(v => v.remove());
  if (INTRO_VIDEO) {
    $('#introCanvas').hidden = true; $('#introCap').textContent = ''; vb.hidden = true;
    const v = h('video', { src: INTRO_VIDEO, playsinline: true, autoplay: true });
    v.onended = done; v.onerror = () => { v.remove(); $('#introCanvas').hidden = false; vb.hidden = false; playCutoutIntro(done); };
    v.ontimeupdate = () => { $('#introBar').style.width = (v.currentTime / (v.duration || 1) * 100) + '%'; };
    frame.prepend(v); v.play().catch(() => { });
    return;
  }
  $('#introCanvas').hidden = false; vb.hidden = false;
  playCutoutIntro(done);
}
function playCutoutIntro(done) {
  const c = $('#introCanvas'), ctx = c.getContext('2d'), total = INTRO.reduce((a, s) => a + s.d, 0);
  const vb = $('#introVoice');
  const paintVoice = () => vb.innerHTML = icon(introVoice ? 'speaker' : 'mute') + `<span>${introVoice ? '읽어 주기 켬' : '읽어 주기 끔'}</span>`;
  paintVoice(); vb.onclick = () => { introVoice = !introVoice; paintVoice(); if (!introVoice) try { speechSynthesis.cancel(); } catch (e) { } else if (introCut >= 0) speak(INTRO[introCut].cap); };
  introCut = -1; const t0 = performance.now();
  const loop = () => {
    const t = (performance.now() - t0) / 1000;
    if (t >= total) { done(); return; }
    let acc = 0, i = 0; while (i < INTRO.length - 1 && t >= acc + INTRO[i].d) acc += INTRO[i++].d;
    const lt = t - acc, sc = INTRO[i];
    if (i !== introCut) { introCut = i; $('#introCap').textContent = sc.cap; speak(sc.cap); }
    ctx.setTransform(c.width / W, 0, 0, c.height / H, 0, 0);
    sc.draw(ctx, lt);
    const fa = Math.max(0, 1 - lt / .4, 1 - (sc.d - lt) / .4);
    if (fa > 0) { ctx.fillStyle = `rgba(0,0,0,${fa})`; ctx.fillRect(0, 0, W, H); }
    $('#introBar').style.width = (t / total * 100) + '%';
    introRaf = requestAnimationFrame(loop);
  };
  introRaf = requestAnimationFrame(loop);
}

/* ---------- 장면 이름 고르기 (이야기에 장면 목록이 있을 때) ---------- */
function sceneNameChips(input) {
  return h('div', { class: 'row' }, ...storyInfo(P.storyId).scenes.map((n, i) => h('button', { class: 'chip', type: 'button', onclick: () => { input.value = n; input.focus(); } }, `${i + 1}. ${n}`)));
}
function setupProject(step, ov) {
  // 제목·첫 장면은 기본값으로 바로 시작해요 (제목은 시나리오·완성 화면에서 바꿀 수 있어요)
  P = newProject('나의 별주부전', ORIGINAL_SCENES[0], 'byeoljubu'); P.done.script = true; TLc = null;
  openStudio(step || 'shoot'); dropOverlay(ov); scheduleSave();
}

/* =========================================================
   스튜디오 틀 — 트레이 안에 [왼쪽 키 | 모니터 | 오른쪽 도구] + 아래 타임라인
   ========================================================= */
const STEPS = [
  { id: 'script', name: '시나리오' },
  { id: 'shoot', name: '촬영' },
  { id: 'voice', name: '대사 녹음' },
  { id: 'sound', name: '사운드' },
  { id: 'edit', name: '편집' },
  { id: 'final', name: '완성' }
];
const STEP_MOD = {};
let curMod = null;
function openStudio(step) { show('studio'); stopIntro(); goStep(step); }
function renderRail() { }
function undoKey() { return key('', { ic: 'undo', cls: 'navkey dim undo', aria: '되돌리기', title: '되돌리기', onclick: undo }); }
function navKey(extraCls = '') { return key('단계', { ic: 'menu', cls: 'navkey row dim ' + extraCls, aria: '다른 단계로 가기', onclick: stepMenu }); }
/* 단계 키 — 어느 화면에서든 한 번 눌러 단계 6개 중 하나로 바로 가요 */
const STEP_IC = { script: 'book', shoot: 'cam', voice: 'mic', sound: 'music', edit: 'scissors', final: 'sparkle' };
function stepMenu() {
  modal((b, m) => {
    const grid = h('div', { class: 'step-menu' });
    STEPS.forEach((s, i) => grid.append(h('button', { class: 'key step-go' + (s.id === S.step ? ' cur' : '') + (P && P.done[s.id] ? ' done' : ''), type: 'button',
      onclick: () => { m.close(); if (s.id !== S.step) goStep(s.id); } },
      h('span', { class: 'no' }, String(i + 1).padStart(2, '0')), h('span', { html: icon(STEP_IC[s.id], 'ki') }), h('b', {}, s.name), s.id === S.step ? h('small', {}, '지금') : '')));
    b.append(h('h2', {}, '어느 단계로 갈까요?'), grid,
      h('div', { class: 'acts' },
        ib('home', '이야기 목록', 'btn ghost', { onclick: async () => { m.close(); if (await confirmBox('이야기 목록으로 갈까요?', '작품은 자동으로 저장돼요. 내 작품함에서 다시 열 수 있어요.', '목록으로')) { leaveStep(); await saveProject(); P = null; openLibrary(); } } }),
        P ? ib('download', '작품 파일로 저장', 'btn ghost', { onclick: async () => { m.close(); await saveProject(); const d = await DB.get(P.id).catch(() => null); d ? exportProjectFile(d) : toast('먼저 저장이 되어야 해요'); } }) : '',
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', type: 'button', onclick: m.close }, '닫기')));
  }, { wide: true });
}
function leaveStep() { Player.pause(); AE.stopPreview(); if (curMod && curMod.unmount) curMod.unmount(); curMod = null; }
function goStep(id) {
  leaveStep(); S.step = id; S.sel = null;
  if ($('#studio').hidden) show('studio');
  if (P) { histInit(); if (P.lastStep !== id && id !== 'final') { P.lastStep = id; scheduleSave(); } }
  stepGuide(id);
  const body = $('#stBody'); body.innerHTML = '';
  curMod = STEP_MOD[id];
  const layout = curMod.layout || 'std';
  if (layout === 'shoot') { curMod.mount({ main: body }); return; }
  if (layout === 'doc') { const main = h('div', { class: 'doc' }); body.append(main); curMod.mount({ main }); return; }
  // 왼쪽 줄(단계·되돌리기·재생) | 가운데 화면(+다음 알약, 도구 판) | 오른쪽 줄(도구) / 아래 타임라인
  const L = h('div', { class: 'L' }, h('div', { class: 'navrow' }, navKey(), undoKey())), M = h('div', { class: 'M' }, nextKey(id, 'pill')), RR = h('div', { class: 'RR' });
  const R = h('div', { class: 'R' }), sheetEl = h('div', { class: 'sheet', hidden: true }, h('button', { class: 'shx', type: 'button', 'aria-label': '도구 판 닫기', html: icon('x'), onclick: () => sheet.close() }), R);
  const sheet = { el: sheetEl, open() { sheetEl.hidden = false; sheet.onToggle && sheet.onToggle(true); }, close() { sheetEl.hidden = true; sheet.onToggle && sheet.onToggle(false); }, get isOpen() { return !sheetEl.hidden; } };
  M.append(sheetEl);
  const tlw = h('div', { class: 'tlw well' }), B = h('div', { class: 'B' }, tlw);
  body.append(h('div', { class: 'lay' }, L, M, RR, B));
  curMod.mount({ L, M, R, RR, B, tlw, sheet });
}
const STEP_ORDER = ['script', 'shoot', 'voice', 'sound', 'edit', 'final'];
/* 화면마다 한 번, 무엇을 하면 되는지 짧게 알려 줘요 */
const GUIDE = {
  script: '장면을 나누고 대사를 써요. 다 되면 오른쪽 위 주황색 “다음”!',
  shoot: '빨간 찰칵을 누를 때마다 한 컷씩 찍혀요. 다 찍으면 오른쪽 위 주황색 “다음”!',
  voice: '빨간 마이크를 누르면 3·2·1 뒤에 녹음돼요. 다 하면 오른쪽 위 주황색 “다음”!',
  sound: '소리 키를 한 번 누르면 들어 보고, 한 번 더 누르면 들어가요. 다 하면 오른쪽 위 “다음”!',
  edit: '효과 키를 한 번 누르면 미리 보고, 한 번 더 누르면 들어가요. 다 하면 오른쪽 위 “다음”!',
  final: '제목을 확인하고 저장해요'
};
const guided = {};
function stepGuide(id) { if (guided[id] || !GUIDE[id]) return; guided[id] = true; setTimeout(() => { if (S.step === id) toast(GUIDE[id], 4200, true); }, 500); }
function nextTarget() { const i = STEP_ORDER.indexOf(S.step); const n = STEP_ORDER[i + 1]; return n ? { id: n, label: STEPS.find(s => s.id === n).name } : null; }
function nextStep(cur) { const t = nextTarget(); if (!t) return; P.done[cur] = true; changed(); goStep(t.id); }
function stageEl(extra) {
  const wrap = h('div', { class: 'stage-wrap' }); const cv = h('canvas', { class: 'stage', width: W, height: H }); wrap.append(cv); if (extra) wrap.append(...extra);
  return { wrap, cv };
}
function monitorEl(extra) { const st = stageEl(extra); const mon = h('div', { class: 'monitor' }, st.wrap); return { mon, ...st }; }
function needFrames(M) {
  if (TL().total > 0) return false;
  const st = monitorEl([h('div', { class: 'empty-mon' }, h('b', {}, '먼저 장면을 촬영해 주세요'), key('촬영하러 가기', { ic: 'cam', cls: 'orange row', onclick: () => goStep('shoot') }))]);
  st.cv.getContext('2d').fillRect(0, 0, W, H);
  M.append(st.mon);
  return true;
}
/* 다음 단계 키 — 모든 단계에서 같은 모양·같은 자리(왼쪽 위 단계 키 바로 아래, 촬영은 필름 아래, 시나리오는 오른쪽 위) */
function nextKey(cur, extraCls = '') {
  const t = nextTarget(); if (!t) return '';
  return key('', { cls: 'orange big nextkey ' + extraCls, aria: `다음 단계: ${t.label}`, onclick: () => nextStep(cur),
    html: `<span class="nk-a"><span class="kl">다음</span>${icon('next', 'ki')}</span><small class="nk-b">${t.label}</small>` });
}
/* 할 일을 다 했을 때 다음 키를 반짝여서 알려 줘요 */
function pulseNext(msg) { const el = $('.nextkey'); if (!el) return; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); if (msg) toast(msg, 3200, true); }
function nextButton() { return null; }
function nextBtn() { return document.createComment('next'); }
