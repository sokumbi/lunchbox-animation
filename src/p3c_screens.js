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
    setTimeout(() => { openGallery(); $('#splash').classList.remove('open'); }, 560);
  };
  $('#splash').addEventListener('click', go);
  // 버튼을 누를 때마다 짧은 클릭음
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('button,.key,[role=button],.cas.on');
    if (b && !b.classList.contains('shutter') && AE.ctx) AE.click(.12);
  }, true);
}

/* ---------- 3. 이야기 고르기 ----------
   갈래(전래동화 · 전국 팔도 민담 · 나만의 이야기) → 전래동화 카드 / 팔도 지도 / 바로 촬영.
   view: 'home' | 'tales' | 'map' — 상영관(p5e_theater)도 같은 화면을 써요 */
function libTop(title, back) {
  const top = $('#libTop'); top.innerHTML = '';
  if (back !== false) top.append(key('', { ic: 'back', cls: 'home', aria: '뒤로', onclick: back || openGallery }));
  top.append(
    h('div', { class: 'brand' }, h('i', { html: icon('film') }), BRAND.app),
    LCD.make(title));
  return top;
}
function libBody(view) { $('#library').classList.toggle('dark', view === 'gallery'); const g = $('#taleGrid'); g.innerHTML = ''; g.className = 'well tale-grid v-' + view; return g; }
function openLibrary(view = 'home') {
  show('library'); stopIntro();
  if (view === 'tales') return openTales();
  if (view === 'map') return openMap();
  libTop('어떤 이야기로 만들까요?', openGallery);
  const g = libBody('home');
  for (const k of STORY_KINDS) {
    const el = h('button', { class: 'kind', type: 'button', 'data-kind': k.id, onclick: () => k.id === 'own' ? startOwnStory() : openLibrary(k.id) },
      h('span', { class: 'kart', html: icon(k.ic) }),
      h('b', {}, k.name), h('span', { class: 'ks' }, k.sub));
    el.style.setProperty('--kc', k.c); g.append(el);
  }
}
function openTales() {
  libTop('전래동화', () => openLibrary());
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
  libTop('전국 팔도 민담', () => openLibrary());
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
  openEditor('story');
}
/* 나만의 이야기 — 바로 촬영 (제목·시나리오는 나중에 써도 돼요) */
function startOwnStory() {
  AE.init();
  P = newProject('나만의 이야기', '1장면', 'new'); P.scriptMode = 'new'; P.script = []; TLc = null; scheduleSave();
  openEditor();
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

/* ---------- 4. 원작 영상 ---------- */
let introReturn = null;
function startIntro() {
  show('intro'); stopIntro();
  const done = () => { stopIntro(); $$('video', $('#introFrame')).forEach(v => { v.pause(); v.remove(); }); if (introReturn && P) { introReturn = null; openEditor('story'); } else setupProject(); };
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
function setupProject() {
  // 제목·첫 장면은 기본값으로 바로 촬영부터 (제목·장면은 이야기 판에서 바꿀 수 있어요)
  P = newProject('나의 별주부전', ORIGINAL_SCENES[0], 'byeoljubu'); P.done.script = true; TLc = null;
  openEditor(); scheduleSave();
}

/* 무대 캔버스 (전체 보기 창에서 써요) */
function stageEl(extra) {
  const wrap = h('div', { class: 'stage-wrap' }); const cv = h('canvas', { class: 'stage', width: W, height: H }); wrap.append(cv); if (extra) wrap.append(...extra);
  return { wrap, cv };
}
