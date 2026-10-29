/* =========================================================
   한 화면 편집기 (Stop Motion Studio 방식, 2026-10-29)
   갤러리 → 편집기 한 장. 가운데 카메라/컷 · 왼쪽 둥근 버튼(갤러리·재생·이야기·소리·효과·되돌리기)
   · 오른쪽 카메라 설정·찰칵·겹쳐보기 · 아래 필름(장면 칸막이 + 컷 + 빨간 "지금 카메라" 칸 + 소리 색 줄)
   · 왼쪽 버튼을 누르면 오른쪽에서 판이 나와요. 위 주황 "완성"에서 영상 저장·상영관.
   ========================================================= */
IC.share = '<path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/>';
IC.more = '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>';
const ED = { open: false, live: true, sel: null, insertAt: null, panel: null, tab: 'voice', onion: true, grid: false, locked: false, raf: 0, cdT: null, autoOn: false, line: null, rec: null, fxSel: null };
let EDel = {};
const edScene = () => { let s = P.scenes.find(s => s.id === S.curScene); if (!s) { s = P.scenes[P.scenes.length - 1]; S.curScene = s.id; } return s; };
const shotSet = () => S.shot || (S.shot = { delay: 0, auto: 0 });

/* 컷 하나의 시간 (잘라 낸 컷이면 그 장면 처음) */
function frameT(sc, i) {
  const r = TL().map[sc.id]; if (!r) return 0;
  const a = sc.trimIn, b = sc.frames.length - sc.trimOut;
  if (i < a || i >= b) return r.t0;
  return r.t0 + sc.frames.slice(a, i).reduce((s, f) => s + f.hold, 0) / P.fps;
}

/* ---------- 열기 · 닫기 ---------- */
function openEditor(firstPanel) {
  show('studio'); stopIntro();
  ED.open = true; ED.live = true; ED.sel = null; ED.insertAt = null; ED.panel = null; ED.fxSel = null; S.sel = null; S.step = 'shoot';
  histInit();
  const body = $('#stBody'); body.innerHTML = '';
  const cv = h('canvas', { class: 'stage', width: W, height: H });
  const flash = h('div', { class: 'flash' }), cd = h('div', { class: 'countdown', hidden: true }), nocam = h('div', { class: 'nocam', hidden: true });
  const sub = h('div', { class: 'guide', hidden: true }), sketch = h('button', { class: 'mon-sketch', type: 'button', hidden: true, 'aria-label': '장면 스케치 크게 보기', onclick: () => sketchModal(edScene(), edStrip) });
  const mon = h('div', { class: 'stage-wrap ed-mon' }, cv, flash, cd, nocam, sub, sketch);
  const fb = (ic, label, onclick, cls = '') => h('button', { class: 'efb ' + cls, type: 'button', 'aria-label': label, onclick }, h('span', { class: 'c', html: icon(ic) }), h('small', {}, label));
  const playB = fb('play', '재생', edTogglePlay, 'play');
  const left = h('div', { class: 'ed-l' },
    h('div', { class: 'ed-top' }, fb('back', '내 작품', edToGallery, 'big'), fb('undo', '되돌리기', undo)), playB,
    fb('book', '이야기', () => edPanel('story')), fb('music', '소리', () => edPanel('sound')), fb('sparkle', '효과', () => edPanel('fx')));
  const shutter = h('button', { class: 'ed-shut', type: 'button', 'aria-label': '촬영', onclick: edShutter }, h('span', { class: 'in' }));
  const camB = fb('cam', '카메라', edCamPop), onionB = fb('onion', '겹쳐보기', () => { ED.onion = !ED.onion; onionB.classList.toggle('on', ED.onion); toast(ED.onion ? '앞 컷 겹쳐 보기 켬' : '앞 컷 겹쳐 보기 끔', 1000); }, ED.onion ? 'on' : '');
  const right = h('div', { class: 'ed-r' }, camB, shutter, onionB);
  const pill = h('div', { class: 'ed-pill' });
  const done = h('button', { class: 'ed-done', type: 'button', onclick: edFinish, html: icon('share') + '<span>완성</span>' });
  const stage = h('div', { class: 'ed-stage' }, mon, left, right, pill, done);
  const panel = h('div', { class: 'ed-panel', hidden: true });
  const film = h('div', { class: 'ef' }), strip = h('div', { class: 'ed-strip list' }, film);
  const pop = h('div', { class: 'ed-pop', hidden: true });
  body.append(h('div', { class: 'ed' }, h('div', { class: 'ed-main' }, stage, panel), strip, pop));
  EDel = { cv, ctx: cv.getContext('2d'), flash, cd, nocam, sub, sketch, mon, playB, shutter, camB, onionB, pill, stage, panel, film, strip, pop, right };
  Player.attach(cv, { onTick: edTick });
  Player.onState = on => { EDel.playB.querySelector('.c').innerHTML = icon(on ? 'pause' : 'play'); EDel.playB.classList.toggle('on', on); if (!on) edAfterPlay(); };
  edStrip(true); edShutterPaint();
  edCamStart();
  addEventListener('keydown', edKey);
  cancelAnimationFrame(ED.raf); edLoop();
  if (firstPanel) edPanel(firstPanel);
  if (!edGuided) { edGuided = true; setTimeout(() => ED.open && toast('빨간 찰칵을 누를 때마다 한 컷씩 찍혀요. 아래 필름에 쌓여요', 3600, true), 600); }
}
let edGuided = false;
function edClose() {
  if (!ED.open) return;
  ED.open = false; edStopTimer(); Player.pause(); Player.onState = null; Player.attach(null); AE.stopPreview();
  if (ED.rec && ED.rec.active) ED.rec.stop(); Mic.release();
  cancelAnimationFrame(ED.raf); Cam.stop(); ED.locked = false; removeEventListener('keydown', edKey);
}
/* 예전 코드가 부르는 이름들 — 모두 편집기로 이어 줘요 */
function leaveStep() { edClose(); }
function openStudio(step) { if (!ED.open) openEditor(); goStep(step); }
const STEP_PANEL = { script: 'story', voice: 'sound', sound: 'sound', edit: 'fx' };
function goStep(id) {
  if (!P) return;
  if (!ED.open) { openEditor(); }
  else { TLc = null; edStrip(); }
  if (id === 'final') { edFinish(); return; }
  if (id === 'voice') ED.tab = 'voice';
  const want = STEP_PANEL[id] || (id === 'shoot' ? null : ED.panel);
  if (id === 'shoot' && ED.panel) { edPanel(null); edGoLive(); }
  else if (want) edPanel(want, true);
}
async function edToGallery() { edClose(); await saveProject(); P = null; TLc = null; openGallery(); }
function edKey(e) { if (e.target.closest('input,textarea,select')) return; if (e.code === 'Space' || e.code === 'VolumeUp') { e.preventDefault(); edShutter(); } }

/* ---------- 카메라 ---------- */
async function edCamStart() {
  EDel.nocam.hidden = true;
  const ok = await Cam.start();
  if (!ok && ED.open) edNoCam();
}
function edNoCam() {
  const n = EDel.nocam; n.hidden = !ED.live; n.innerHTML = '';
  const denied = Cam.reason === 'NotAllowedError';
  n.append(h('span', { html: icon('cam'), style: { width: '40px', height: '40px', color: '#CF5D2A' } }),
    h('b', {}, denied ? '카메라 사용이 막혀 있어요' : '이 화면에서는 실시간 카메라를 켤 수 없어요'),
    h('p', {}, denied ? '주소창 옆 자물쇠(또는 설정)에서 카메라를 허용한 뒤 다시 시도를 눌러 주세요. 그동안 빨간 찰칵을 누르면 폰 카메라 앱으로 한 컷씩 찍어요.'
      : '빨간 찰칵을 누르면 폰의 카메라 앱이 열려요. 한 장 찍을 때마다 한 컷이 쌓여요.'),
    h('div', { class: 'row', style: { justifyContent: 'center' } },
      ib('image', '사진 여러 장 불러오기', 'btn sm', { onclick: edImport }),
      ib('rotR', '다시 시도', 'btn sm ghost', { style: { color: '#fff' }, onclick: edCamStart })));
}
async function edImport() { const f = await pickImages({ multiple: true }); for (const x of f) { const b = await fileToFrameBlob(x); b && await edAddFrame(b); } if (f.length) toast(`사진 ${f.length}장을 넣었어요`); }

/* ---------- 그리기 ---------- */
function edLoop() {
  if (!ED.open) return;
  ED.raf = requestAnimationFrame(edLoop);
  if (Player.playing) return;              // 재생·녹음 중에는 Player가 그려요
  const ctx = EDel.ctx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (ED.live) {
    const sc = edScene(), base = ED.insertAt ?? sc.frames.length;
    if (Cam.video && Cam.stream && Cam.video.videoWidth) drawCam(ctx, Cam.video);
    else if (sc.frames[base - 1]) drawCover(ctx, sc.frames[base - 1].img);
    if (ED.onion && Cam.stream) {
      const oa = S.onionA || .42, p1 = sc.frames[base - 1], p2 = sc.frames[base - 2];
      if (p2) { ctx.globalAlpha = oa * .5; drawCover(ctx, p2.img); }
      if (p1) { ctx.globalAlpha = oa; drawCover(ctx, p1.img); }
      ctx.globalAlpha = 1;
    }
    if (ED.grid) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const x of [W / 3, W * 2 / 3]) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (const y of [H / 3, H * 2 / 3]) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke(); }
    return;
  }
  const s = ED.sel && P.scenes.find(x => x.id === ED.sel.sid), f = s && s.frames[ED.sel.i];
  if (!f) { edGoLive(); return; }
  const trimmed = ED.sel.i < s.trimIn || ED.sel.i >= s.frames.length - s.trimOut;
  if (trimmed) { drawCover(ctx, f.img); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = '30px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('잘라 낸 컷이에요', W / 2, H / 2); return; }
  renderAt(ctx, Player.t, {});
  const e = ED.fxSel && P.fx.find(x => x.id === ED.fxSel);
  if (e) { const et = absT(e); if (et != null && Player.t >= et && Player.t <= et + e.dur) { ctx.save(); ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeStyle = TC.fx; ctx.beginPath(); ctx.arc(e.x * W, e.y * H, 90 * e.s, 0, 7); ctx.stroke(); ctx.restore(); } }
}

/* ---------- 필름 ---------- */
function edStrip(scrollToLive) {
  if (!ED.open) return;
  const film = EDel.film; film.innerHTML = '';
  const cur = edScene(); let n = 0;
  const liveCell = () => h('button', { class: 'ef-live' + (ED.live ? ' on' : ''), type: 'button', 'aria-label': '지금 카메라', onclick: () => { edGoLive(); } , html: icon('cam') });
  P.scenes.forEach((s, k) => {
    film.append(h('button', { class: 'ef-scn' + (s.id === cur.id ? ' cur' : ''), type: 'button', 'aria-label': `${k + 1}번 장면 ${s.name}`, onclick: () => edSceneMenu(s) },
      h('b', {}, String(k + 1)), h('span', {}, s.name)));
    s.frames.forEach((f, i) => {
      if (s.id === cur.id && ED.insertAt === i) film.append(liveCell());
      n++;
      const trimmed = i < s.trimIn || i >= s.frames.length - s.trimOut;
      const sel = ED.sel && ED.sel.sid === s.id && ED.sel.i === i;
      film.append(h('button', { class: 'ef-fr' + (sel ? ' sel' : '') + (trimmed ? ' cut' : ''), type: 'button', 'data-fid': f.id, 'aria-label': `${n}번 컷`, onclick: () => edPick(s, i) },
        h('img', { src: f.url, alt: '' }), h('i', {}, String(n)), f.hold !== P.hold ? h('em', {}, '×' + f.hold) : ''));
    });
    if (s.id === cur.id && (ED.insertAt == null || ED.insertAt >= s.frames.length)) film.append(liveCell());
  });
  film.append(h('button', { class: 'ef-add', type: 'button', onclick: edNewScene, html: icon('plus') + '<span>장면</span>' }));
  film.append(h('div', { class: 'ef-trk' }));
  requestAnimationFrame(() => { edTracks(); if (scrollToLive) { const l = $('.ef-live', film); if (l) EDel.strip.scrollLeft = l.offsetLeft - EDel.strip.clientWidth + l.offsetWidth * 3; } });
  edPill(); edPopPaint();
  const sk = ED.live ? cur.sketch : null; EDel.sketch.hidden = !sk; if (sk) EDel.sketch.style.backgroundImage = `url(${sk.url})`;
  EDel.nocam.hidden = !(ED.live && Cam.failed);
}
/* 필름 아래 색 줄: 초록 배경음악 · 파랑 대사 · 청록 내레이션 · 주황 효과음 · 보라 효과 */
function edTracks() {
  const film = EDel.film, trk = $('.ef-trk', film); if (!trk) return; trk.innerHTML = '';
  const tl = TL(); if (!tl.total) return;
  const els = {}; for (const el of $$('.ef-fr', film)) els[el.dataset.fid] = el;
  const xAt = t => {
    const seg = segAt(t); if (!seg) return 0; const el = els[seg.f.id]; if (!el) return 0;
    if (t >= tl.total) return el.offsetLeft + el.offsetWidth;
    return el.offsetLeft + clamp((t - seg.t0) / (seg.t1 - seg.t0), 0, 1) * el.offsetWidth;
  };
  const bar = (t0, t1, row, c, label, onclick, on) => {
    const x0 = xAt(t0), x1 = Math.max(x0 + 8, xAt(Math.min(t1, tl.total)));
    trk.append(h('button', { class: 'tb' + (on ? ' on' : ''), type: 'button', 'aria-label': label, title: label, style: { left: x0 + 'px', width: (x1 - x0) + 'px', top: row * 6.5 + 'px', background: c }, onclick }));
  };
  for (const r of tl.ranges) if (r.sc.bgm && r.t1 > r.t0) bar(r.t0, r.t1, 0, TC.bgm, '배경음악 ' + (BGM.find(b => b.id === r.sc.bgm) || {}).name, () => { Player.seek(r.t0 + .001); edSelectAt(r.t0 + .001); ED.tab = 'bgm'; edPanel('sound', true); });
  for (const v of P.voices) { const t = absT(v); if (t != null) bar(t, t + (v.dur || 1), 1, TC.voice, '대사 ' + (v.who || ''), () => { edSelectAt(t); ED.tab = 'voice'; ED.line = (P.script || []).find(l => l.id === v.lineId) || ED.line; edPanel('sound', true); }); }
  for (const v of P.narrs) { const t = absT(v); if (t != null) bar(t, t + (v.dur || 1), 1, TC.narr, '내레이션', () => { edSelectAt(t); S.sel = { kind: 'narr', id: v.id }; ED.tab = 'narr'; edPanel('sound', true); }, S.sel && S.sel.id === v.id); }
  for (const s of P.sfx) { const t = absT(s); if (t != null) bar(t, t + Math.max(sfxLen(s), .5), 2, TC.sfx, '효과음 ' + SFX.find(x => x.id === s.snd).name, () => { edSelectAt(t); S.sel = { kind: 'sfx', id: s.id }; ED.tab = 'sfx'; edPanel('sound', true); }, S.sel && S.sel.id === s.id); }
  for (const e of P.fx) { const t = absT(e); if (t != null) bar(t, t + e.dur, 3, TC.fx, '효과 ' + FX.find(f => f.id === e.type).name, () => { edSelectAt(t); ED.fxSel = e.id; edPanel('fx', true); }, ED.fxSel === e.id); }
}
function edPill() {
  const sc = edScene(), tl = TL();
  if (ED.live) { const sec = sc.frames.reduce((a, f) => a + f.hold, 0) / P.fps; EDel.pill.innerHTML = ''; EDel.pill.append(h('span', {}, `${P.scenes.indexOf(sc) + 1} · ${sc.name}`), h('i', {}, `컷 ${sc.frames.length} · ${sec.toFixed(1)}초`)); }
  else { const s = P.scenes.find(x => x.id === ED.sel.sid); let n = 0; for (const x of P.scenes) { if (x === s) break; n += x.frames.length; } EDel.pill.innerHTML = ''; EDel.pill.append(h('span', {}, `컷 ${n + ED.sel.i + 1} / ${P.scenes.reduce((a, x) => a + x.frames.length, 0)}`), h('i', {}, fmt(Player.t).replace(/\.\d$/, '') + ' / ' + fmt(tl.total).replace(/\.\d$/, ''))); }
}
function edPick(s, i) {
  if (Player.playing) Player.pause();
  const same = ED.sel && ED.sel.sid === s.id && ED.sel.i === i && !ED.live;
  ED.live = false; ED.sel = { sid: s.id, i }; ED.popOpen = same ? !ED.popOpen : !ED.panel;
  Player.t = frameT(s, i); edStrip();
}
/* 시간 t에 있는 컷을 골라요 (판을 열 때 · 소리 줄을 누를 때) */
function edSelectAt(t) {
  const seg = segAt(t); if (!seg) return false;
  ED.live = false; ED.sel = { sid: seg.sc.id, i: seg.idx }; ED.popOpen = false; Player.t = clamp(t, 0, TL().total); edStrip(); return true;
}
function edGoLive() { if (Player.playing) Player.pause(); ED.live = true; ED.sel = null; ED.popOpen = false; edStrip(true); }

/* 컷을 누르면 바로 위에 뜨는 말풍선 메뉴 */
function edPopPaint() {
  const pop = EDel.pop; pop.innerHTML = '';
  if (ED.live || !ED.sel || !ED.popOpen) { pop.hidden = true; return; }
  const s = P.scenes.find(x => x.id === ED.sel.sid), i = ED.sel.i, f = s && s.frames[i]; if (!f) { pop.hidden = true; return; }
  const it = (ic, label, fn, cls = '') => h('button', { class: cls, type: 'button', onclick: fn, html: icon(ic) + `<span>${label}</span>` });
  pop.append(
    it('copy', '복사', () => { s.frames.splice(i + 1, 0, { ...f, id: uid() }); ED.sel.i++; changed(); edStrip(); toast('컷을 하나 더 넣었어요', 1000); }),
    i < s.frames.length - 1 ? it('pingpong', '거꾸로', () => { const back = s.frames.slice(i, -1).reverse().map(x => ({ ...x, id: uid() })); s.frames.push(...back); changed(); edStrip(); toast(`컷 ${back.length}개를 거꾸로 붙였어요. 갔다가 돌아와요`, 1800); }) : '',
    it('timer', '×' + f.hold, () => { f.hold = f.hold % 6 + 1; changed(); edStrip(); }),
    i > 0 ? it('scissors', '장면 나누기', () => edSplit(s, i)) : '',
    it('cam', '여기에 찍기', () => { S.curScene = s.id; ED.insertAt = i + 1 >= s.frames.length ? null : i + 1; edGoLive(); toast(`${i + 1}번째 컷 뒤에 끼워 찍어요`, 1500); }),
    it('trash', '지우기', () => { s.frames.splice(i, 1); if (s.trimIn > i) s.trimIn--; if (ED.insertAt != null && S.curScene === s.id && ED.insertAt > i) ED.insertAt--; changed(); if (!s.frames[i]) { if (s.frames[i - 1]) ED.sel.i = i - 1; else { edGoLive(); return; } } Player.t = frameT(s, ED.sel.i); edStrip(); }, 'red'));
  pop.hidden = false;
  requestAnimationFrame(() => {
    const el = $(`.ef-fr[data-fid="${f.id}"]`, EDel.film); if (!el) return;
    const er = appRect(el), br = appRect($('#stBody')), pw = pop.offsetWidth;
    pop.style.left = clamp(er.left - br.left + er.width / 2 - pw / 2, 6, br.width - pw - 6) + 'px';
    pop.style.setProperty('--ax', clamp(er.left - br.left + er.width / 2 - parseFloat(pop.style.left), 14, pw - 14) + 'px');
  });
}
function edSplit(s, i) {
  const cutT = s.frames.slice(s.trimIn, i).reduce((a, f) => a + f.hold, 0) / P.fps;
  const nb = { ...newScene(s.name + ' 2'), frames: s.frames.slice(i), trimOut: s.trimOut, bgm: s.bgm };
  s.frames = s.frames.slice(0, i); s.trimOut = 0;
  for (const k of ['fx', 'sfx', 'voices', 'narrs']) for (const it of P[k]) if (it.sid === s.id && it.off >= cutT) { it.sid = nb.id; it.off -= cutT; }
  P.scenes.splice(P.scenes.indexOf(s) + 1, 0, nb); ED.sel = { sid: nb.id, i: 0 }; changed(); edStrip(); toast('장면을 둘로 나눴어요');
}

/* ---------- 장면 칸막이 메뉴 ---------- */
function edSceneMenu(s) {
  const i = P.scenes.indexOf(s);
  modal((b, m) => {
    const ni = h('input', { class: 'input', value: s.name, maxlength: 30, 'aria-label': '장면 이름', oninput: e => { s.name = e.target.value; changed(); } });
    const go = fn => () => { m.close(); fn(); };
    b.append(h('h2', {}, `${i + 1}번 장면`), ni,
      h('div', { class: 'menu-grid' },
        h('button', { class: 'btn accent', type: 'button', onclick: go(() => { S.curScene = s.id; ED.insertAt = null; edGoLive(); toast(`“${s.name}”에 이어서 찍어요`, 1300); }), html: icon('cam') + '<span>이 장면 이어 찍기</span>' }),
        h('button', { class: 'btn', type: 'button', onclick: go(() => { const r = TL().map[s.id]; if (r && r.t1 > r.t0) { Player.seek(r.t0 + .001); edSelectAt(r.t0 + .001); } trimModal(() => edStrip()); }), html: icon('scissors') + '<span>앞뒤 자르기 · 빠르기</span>' }),
        h('button', { class: 'btn', type: 'button', onclick: go(() => sketchModal(s, edStrip)), html: icon('image') + '<span>스케치</span>' }),
        h('button', { class: 'btn', type: 'button', disabled: i === 0 || null, onclick: go(() => { [P.scenes[i - 1], P.scenes[i]] = [P.scenes[i], P.scenes[i - 1]]; changed(); edStrip(); }), html: icon('back') + '<span>앞으로</span>' }),
        h('button', { class: 'btn', type: 'button', onclick: go(() => { s.frames.reverse(); [s.trimIn, s.trimOut] = [s.trimOut, s.trimIn]; changed(); edStrip(); toast('장면을 거꾸로 돌렸어요', 1200); }), html: icon('pingpong') + '<span>거꾸로</span>' }),
        P.scenes.length > 1 ? h('button', { class: 'btn', type: 'button', onclick: go(async () => { if (!await confirmBox('장면을 지울까요?', `“${s.name}” 장면과 그 안의 컷·효과·소리가 함께 지워져요. 되돌리기로 살릴 수 있어요.`, '지우기', true)) return; P.scenes = P.scenes.filter(x => x !== s); for (const k of ['fx', 'sfx', 'voices', 'narrs']) P[k] = P[k].filter(it => it.sid !== s.id); if (S.curScene === s.id) S.curScene = P.scenes[P.scenes.length - 1].id; changed(); edGoLive(); }), html: icon('trash') + '<span>지우기</span>' }) : ''),
      h('div', { class: 'acts' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { m.close(); edStrip(); } }, '닫기')));
  });
}
function edNewScene() {
  modal((b, m) => {
    const used = P.scenes.map(s => s.name), nn = storyInfo(P.storyId).scenes.find(n => !used.includes(n)) || `${P.scenes.length + 1}장면`;
    const ni = h('input', { id: 'newSceneName', value: nn, maxlength: 30 });
    const make = () => { m.close(); const s = newScene(ni.value.trim() || nn); P.scenes.push(s); S.curScene = s.id; ED.insertAt = null; changed(); edGoLive(); toast(`“${s.name}” 촬영을 시작해요`, 1400); };
    ni.addEventListener('keydown', e => { if (e.key === 'Enter') make(); });
    b.append(h('h2', {}, '새 장면'), h('label', { class: 'field' }, h('span', { class: 'label' }, '장면 이름'), ni), storyInfo(P.storyId).scenes.length ? sceneNameChips(ni) : '',
      h('div', { class: 'acts' }, h('button', { class: 'btn', type: 'button', onclick: m.close }, '취소'), h('button', { class: 'btn accent', type: 'button', onclick: make }, '만들고 찍기')));
  });
}

/* ---------- 찍기 ---------- */
function edShutterPaint() { const sh = EDel.shutter; if (!sh) return; const run = ED.autoOn || !!ED.cdT; sh.classList.toggle('run', run); sh.setAttribute('aria-label', ED.autoOn ? '자동 촬영 멈추기' : ED.cdT ? '타이머 취소' : '촬영'); }
function edShutter() {
  if (ED.autoOn || ED.cdT) { const was = ED.autoOn; edStopTimer(); if (was) toast('자동 촬영을 멈췄어요', 1200); return; }
  if (Player.playing) Player.pause();
  if (!ED.live) edGoLive();
  if (ED.panel) edPanel(null);
  const s = shotSet();
  if ((!s.delay && !s.auto) || !Cam.stream) { edCapture(); return; }
  ED.autoOn = !!s.auto; edCountdown();
}
function edCountdown() {
  let n = shotSet().auto || shotSet().delay;
  const tick = () => {
    if (!ED.open) return;
    if (n <= 0) { EDel.cd.hidden = true; ED.cdT = null; edShutterPaint(); edCapture().then(() => { if (ED.autoOn) edCountdown(); }); return; }
    EDel.cd.hidden = false; EDel.cd.textContent = n; EDel.cd.classList.toggle('soft', ED.autoOn); edBeep(n === 1 ? 1320 : 880); n--;
    ED.cdT = setTimeout(tick, 1000); edShutterPaint();
  };
  tick();
}
function edStopTimer() { clearTimeout(ED.cdT); ED.cdT = null; ED.autoOn = false; if (EDel.cd) EDel.cd.hidden = true; edShutterPaint(); }
function edBeep(f) { AE.init(); const c = AE.ctx; if (!c) return; const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.12, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .12); o.connect(g).connect(AE.buses.ui); o.start(); o.stop(c.currentTime + .14); }
async function edCapture() {
  if (!Cam.stream || !Cam.video || !Cam.video.videoWidth) { const f = await pickImages({ capture: true }); for (const x of f) { const b = await fileToFrameBlob(x); b && await edAddFrame(b); } return; }
  const off = h('canvas', { width: W, height: H }), c = off.getContext('2d');
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H); drawCam(c, Cam.video);
  AE.init(); AE.click(); EDel.flash.classList.remove('go'); void EDel.flash.offsetWidth; EDel.flash.classList.add('go');
  try { navigator.vibrate && navigator.vibrate(15); } catch (e) { }
  await edAddFrame(await new Promise(r => off.toBlob(r, 'image/jpeg', .88)));
}
async function edAddFrame(blob) {
  const sc = edScene(), f = { id: uid(), hold: P.hold, blob, ...loadImg(blob) };
  if (ED.insertAt != null) { sc.frames.splice(ED.insertAt, 0, f); ED.insertAt++; if (ED.insertAt >= sc.frames.length) ED.insertAt = null; }
  else sc.frames.push(f);
  changed(); edStrip(true);
}

/* ---------- 카메라 설정 말풍선 ---------- */
function edCamPop() {
  const old = $('.ed-cpop'); if (old) { old.remove(); EDel.camB.classList.remove('on'); return; }
  const box = h('div', { class: 'ed-cpop' });
  const seg = (vals, cur, set) => h('div', { class: 'seg' }, ...vals.map(([v, l]) => h('button', { type: 'button', class: cur() === v ? 'on' : '', onclick: e => { set(v); [...e.target.parentElement.children].forEach(b => b.classList.toggle('on', b === e.target)); } }, l)));
  const tog = (on, set, label) => h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: on, 'aria-label': label, onchange: e => set(e.target.checked) }));
  const row = (label, ctl) => h('div', { class: 'cp-row' }, h('span', {}, label), ctl);
  const timerVal = () => { const s = shotSet(); return s.auto ? 'a' + s.auto : 'd' + s.delay; };
  box.append(
    row('카메라', h('button', { class: 'btn sm', type: 'button', onclick: async () => { if (Cam.failed) { edCamStart(); return; } if (!(await Cam.next())) toast('바꿀 수 있는 다른 카메라가 없어요'); else ED.locked = false; }, html: icon('switchCam') + '<span>앞·뒤 바꾸기</span>' })),
    row('한 번에 찍기', seg([[1, '1컷'], [2, '2'], [3, '3'], [4, '4']], () => P.hold, v => { P.hold = v; changed(); })),
    row('타이머', seg([['d0', '끔'], ['d3', '3초'], ['d5', '5초'], ['a2', '2초마다'], ['a3', '3초마다']], timerVal, v => { edStopTimer(); const n = +v.slice(1); Object.assign(shotSet(), v[0] === 'a' ? { delay: 0, auto: n } : { delay: n, auto: 0 }); })),
    row('겹쳐보기 진하기', h('input', { type: 'range', min: .15, max: .8, step: .05, value: S.onionA || .42, 'aria-label': '겹쳐 보기 진하기', oninput: e => { S.onionA = +e.target.value; } })),
    row('격자', tog(ED.grid, v => ED.grid = v, '격자')),
    row('밝기·초점 고정', tog(ED.locked, v => edLock(v), '카메라 고정')),
    row('사진 불러오기', ib('image', '앨범', 'btn sm', { onclick: () => { box.remove(); edImport(); } })));
  EDel.stage.append(box); EDel.camB.classList.add('on');
  setTimeout(() => { const away = e => { if (!box.contains(e.target) && !EDel.camB.contains(e.target)) { box.remove(); EDel.camB.classList.remove('on'); removeEventListener('pointerdown', away, true); } }; addEventListener('pointerdown', away, true); }, 0);
}
/* 카메라 고정 — 컷마다 밝기·초점·색이 바뀌어 깜빡이지 않게 지금 값으로 묶어요 (되는 기기만) */
async function edLock(want) {
  const tr = Cam.stream && Cam.stream.getVideoTracks()[0];
  if (!tr || !tr.getCapabilities) { toast('카메라가 켜져 있을 때 쓸 수 있어요'); return; }
  const cap = tr.getCapabilities(), cur = tr.getSettings(), adv = {};
  for (const [mode, val] of [['exposureMode', ['exposureTime', 'iso']], ['focusMode', ['focusDistance']], ['whiteBalanceMode', ['colorTemperature']]]) {
    const modes = cap[mode] || [];
    if (!want) { if (modes.includes('continuous')) adv[mode] = 'continuous'; continue; }
    const vals = val.filter(k => cur[k] != null && cap[k]);
    if (modes.includes('manual') && vals.length) { adv[mode] = 'manual'; for (const k of vals) adv[k] = cur[k]; }
    else if (modes.includes('single-shot')) adv[mode] = 'single-shot';
    else if (modes.includes('manual')) adv[mode] = 'manual';
  }
  if (!Object.keys(adv).length) { ED.locked = false; toast(want ? '이 기기 카메라는 고정 기능이 없어요. 불빛이 바뀌지 않는 곳에서 찍어 주세요' : '카메라 고정을 풀었어요', 3200); return; }
  try { await tr.applyConstraints({ advanced: [adv] }); ED.locked = want; toast(want ? '카메라를 고정했어요. 밝기·초점이 이제 안 바뀌어요' : '카메라 고정을 풀었어요', 2200); }
  catch (e) { toast('카메라를 고정하지 못했어요'); }
}

/* ---------- 재생 ---------- */
function edTogglePlay() {
  if (Player.playing) { Player.pause(); return; }
  if (!TL().total) { toast('먼저 몇 컷을 찍어 보세요'); return; }
  if (ED.live) Player.t = 0;
  ED.popOpen = false; edPopPaint();
  Player.play();
}
function edTick(t) {
  if (!ED.open || !Player.playing) return;
  const seg = segAt(t); if (!seg) return;
  const el = $(`.ef-fr[data-fid="${seg.f.id}"]`, EDel.film);
  const prev = $('.ef-fr.play', EDel.film); if (prev !== el) { prev && prev.classList.remove('play'); if (el) { el.classList.add('play'); const st = EDel.strip; if (el.offsetLeft < st.scrollLeft || el.offsetLeft + el.offsetWidth > st.scrollLeft + st.clientWidth) st.scrollLeft = el.offsetLeft - 40; } }
}
function edAfterPlay() {
  if (!ED.open) return;
  const prev = $('.ef-fr.play', EDel.film); prev && prev.classList.remove('play');
  if (ED.rec && ED.rec.active) return;
  edSelectAt(Math.min(Player.t, TL().total - .001));
}

/* ---------- 오른쪽 판 ---------- */
function edPanel(name, keep) {
  if (!ED.open) return;
  if (!keep && ED.panel === name) name = null;
  if (ED.rec && ED.rec.active) ED.rec.stop();
  AE.stopPreview();
  ED.panel = name; S.step = name === 'story' ? 'script' : name === 'sound' ? 'sound' : name === 'fx' ? 'edit' : 'shoot';
  const p = EDel.panel; p.innerHTML = ''; p.hidden = !name; p.className = 'ed-panel' + (name ? ' p-' + name : '');
  $$('.ed-l .efb').forEach(b => b.classList.toggle('on', !!name && b.getAttribute('aria-label') === { story: '이야기', sound: '소리', fx: '효과' }[name]));
  EDel.right.hidden = !!name; $('.ed').classList.toggle('has-panel', !!name); $('.ed-cpop') && $('.ed-cpop').remove();
  if (!name) { ED.fxSel = null; S.sel = null; EDel.sub.hidden = true; edStrip(); return; }
  if (name !== 'story' && ED.live) { if (!edSelectAt(Math.max(0, TL().total - .001))) { /* 아직 컷이 없어요 */ } }
  p.append(h('div', { class: 'pn-head' }, h('h3', {}, { story: '이야기', sound: '소리', fx: '효과' }[name]), h('button', { class: 'pn-x', type: 'button', 'aria-label': '판 닫기', html: icon('x'), onclick: () => edPanel(null) })));
  const body = h('div', { class: 'pn-body' }); p.append(body);
  if (name === 'story') { body.classList.add('scroll'); edStoryPanel(body); }
  else if (!TL().total) body.append(h('div', { class: 'pn-empty' }, h('b', {}, '먼저 몇 컷을 찍어 주세요'), h('p', { class: 'hint' }, '소리와 효과는 찍은 컷 위에 넣어요.'), ib('cam', '찍으러 가기', 'btn accent', { onclick: () => { edPanel(null); edGoLive(); } })));
  else if (name === 'sound') edSoundPanel(body);
  else edFxPanel(body);
  edStrip();
}

/* 이야기(시나리오): 줄거리 · 장면 · 대사 */
function edStoryPanel(R) {
  const orig = P.storyId === 'byeoljubu', info = storyInfo(P.storyId);
  const render = () => {
    R.innerHTML = '';
    const top = h('div', { class: 'row nowrap' }, h('span', { class: 'label' }, '제목'),
      h('input', { class: 'input grow', value: P.title, maxlength: 40, 'aria-label': '영상 제목', oninput: e => { P.title = e.target.value; changed(); } }),
      orig ? ib('play', '원작 보기', 'btn sm', { onclick: () => { edClose(); introReturn = 'script'; startIntro(); } }) : '');
    const syn = orig ? h('div', { class: 'card pn-syn' }, ORIGINAL_SYNOPSIS)
      : h('textarea', { class: 'input', rows: 3, placeholder: '누가, 어디서, 무슨 일이 생기고, 어떻게 끝나나요?', 'aria-label': '줄거리', oninput: e => { P.synopsis = e.target.value; changed(); } }, P.synopsis || '');
    const scenes = h('div', { class: 'pn-items' });
    P.scenes.forEach((s, i) => scenes.append(h('div', { class: 'sc-card' },
      h('span', { class: 'n' }, i + 1),
      h('button', { class: 'sk-slot' + (s.sketch ? ' has' : ''), type: 'button', style: s.sketch ? { backgroundImage: `url(${s.sketch.url})` } : {}, 'aria-label': s.sketch ? `${i + 1}번 장면 스케치 보기` : `${i + 1}번 장면 스케치 사진 찍기`,
        onclick: async () => { if (s.sketch) sketchModal(s, render); else if (await takeSketch(s)) render(); }, html: s.sketch ? '' : icon('cam') + '<span>스케치</span>' }),
      h('div', { class: 'f' },
        h('input', { class: 'input', value: s.name, maxlength: 30, 'aria-label': `${i + 1}번 장면 이름`, oninput: e => { s.name = e.target.value; changed(); } }),
        h('input', { class: 'input', value: s.desc || '', placeholder: '이 장면에서 무슨 일이 일어나나요?', 'aria-label': `${i + 1}번 장면 설명`, oninput: e => { s.desc = e.target.value; changed(); } })),
      ib('cam', '', 'btn sm icon', { 'aria-label': `${i + 1}번 장면 찍기`, onclick: () => { S.curScene = s.id; ED.insertAt = null; edPanel(null); edGoLive(); } }))));
    P.script = P.script || [];
    const lines = h('div', { class: 'pn-items' });
    const up = h('input', { type: 'file', accept: '.txt,.csv,.md,.text,text/plain', hidden: true, onchange: async e => { const f = e.target.files[0]; if (!f) return; const parsed = parseScript(await f.text()); P.script.push(...parsed); P.scriptMode = P.scriptMode || 'new'; changed(); render(); toast(`대사 ${parsed.length}줄을 불러왔어요`); } });
    if (!P.script.length) lines.append(h('div', { class: 'hint' }, orig ? '“원작 대사”를 누르면 별주부전 대사 12줄이 들어와요.' : '“＋ 대사”를 눌러 녹음할 대사를 써요. 파일(.txt)은 한 줄에 “인물: 대사”로 써요.'));
    P.script.forEach((r, i) => lines.append(h('div', { class: 'script-row' },
      h('input', { class: 'input', value: r.who, list: 'whoList3', placeholder: '누가', 'aria-label': `${i + 1}번 대사 인물`, oninput: e => { r.who = e.target.value; changed(); } }),
      h('input', { class: 'input', value: r.text, placeholder: '무슨 말을 할까요?', 'aria-label': `${i + 1}번 대사 내용`, oninput: e => { r.text = e.target.value; changed(); } }),
      h('select', { class: 'input', 'aria-label': `${i + 1}번 대사 장면`, onchange: e => { r.scene = e.target.value || null; changed(); } }, h('option', { value: '' }, '장면'), ...P.scenes.map(s => h('option', { value: s.id, selected: r.scene === s.id }, s.name))),
      ib('trash', '', 'btn sm icon ghost', { 'aria-label': '대사 지우기', onclick: () => { P.script.splice(i, 1); changed(); render(); } }))));
    R.append(top,
      h('div', { class: 'pn-cols' },
        h('div', { class: 'pn-col' }, h('h4', {}, '줄거리'), syn,
          h('div', { class: 'pn-sub' }, h('h4', {}, `장면 ${P.scenes.length}개`),
            orig && P.scenes.length < ORIGINAL_SCENES.length ? ib('book', '원작 장면', 'btn sm', { onclick: () => { for (const n of ORIGINAL_SCENES) if (!P.scenes.some(s => s.name === n)) P.scenes.push(newScene(n)); changed(); render(); edStrip(); } }) : '',
            ib('plus', '장면', 'btn sm', { onclick: () => { P.scenes.push(newScene(info.scenes.find(n => !P.scenes.some(s => s.name === n)) || `${P.scenes.length + 1}장면`)); changed(); render(); edStrip(); } })),
          scenes),
        h('div', { class: 'pn-col' },
          h('div', { class: 'pn-sub' }, h('h4', {}, `대사 ${P.script.length}줄`),
            ib('upload', '', 'btn sm icon', { 'aria-label': '대사 파일 불러오기', onclick: () => up.click() }),
            orig ? ib('book', '원작 대사', 'btn sm', { onclick: () => { P.script.push(...originalScript()); P.scriptMode = P.scriptMode || 'original'; changed(); render(); } }) : '',
            ib('plus', '대사', 'btn sm', { onclick: () => { P.script.push({ id: uid(), who: P.script.length ? P.script[P.script.length - 1].who : '', text: '', scene: edScene().id }); P.scriptMode = P.scriptMode || 'new'; changed(); render(); const ins = $$('.script-row input:nth-child(2)', R).pop(); ins && ins.focus(); } }), up,
            h('datalist', { id: 'whoList3' }, ...Object.keys(CHAR_COLORS).map(k => h('option', { value: k })))),
          lines)));
  };
  render();
}

/* 소리: 대사 · 효과음 · 배경음악 · 내레이션 */
function edSoundPanel(R) {
  const tabs = [['voice', '대사'], ['sfx', '효과음'], ['bgm', '배경음악'], ['narr', '내레이션']];
  const tabEl = h('div', { class: 'seg pn-tabs' }), box = h('div', { class: 'pn-tab' }), bar = h('div', { class: 'sel-bar', hidden: true });
  R.append(tabEl, box, bar);
  AE.init(); Promise.all(SFX.map(s => AE.getSfx(s.id))).then(() => ED.open && edTracks());
  const paintTabs = () => { tabEl.innerHTML = ''; for (const [k, l] of tabs) tabEl.append(h('button', { type: 'button', class: ED.tab === k ? 'on' : '', onclick: () => { if (ED.rec && ED.rec.active) ED.rec.stop(); AE.stopPreview(); ED.tab = k; S.sel = null; build(); } }, l)); };
  const SEL = () => S.sel && S.sel.kind === 'sfx' ? P.sfx.find(x => x.id === S.sel.id) : S.sel && S.sel.kind === 'narr' ? P.narrs.find(x => x.id === S.sel.id) : null;
  const refresh = () => { TLc = null; edTracks(); edPill(); };
  function buildBar() {
    bar.innerHTML = ''; const it = SEL(); bar.hidden = !it; if (!it) return;
    const close = ib('x', '', 'btn sm icon ghost', { 'aria-label': '닫기', onclick: () => { S.sel = null; buildBar(); edTracks(); } });
    if (S.sel.kind === 'sfx') bar.append(h('b', {}, SFX.find(x => x.id === it.snd).name),
      h('input', { type: 'range', min: 0, max: 1.5, step: .05, value: it.vol, 'aria-label': '소리 크기', onchange: e => { it.vol = +e.target.value; changed(); AE.playPreview('sfx', it.snd); } }),
      ib('next', '', 'btn sm icon', { 'aria-label': '지금 컷으로 옮기기', onclick: () => { setAbs(it, Player.t); changed(); refresh(); } }),
      ib('trash', '', 'btn sm icon', { 'aria-label': '지우기', onclick: () => { P.sfx = P.sfx.filter(x => x !== it); S.sel = null; changed(); refresh(); buildBar(); } }), close);
    else bar.append(h('b', {}, `내레이션 ${it.dur.toFixed(1)}초`),
      ib('speaker', '', 'btn sm icon', { 'aria-label': '듣기', onclick: () => { Player.seek(absT(it)); Player.play({ until: absT(it) + it.dur + .2 }); } }),
      ib('trash', '', 'btn sm icon', { 'aria-label': '지우기', onclick: () => { P.narrs = P.narrs.filter(x => x !== it); S.sel = null; changed(); refresh(); buildBar(); } }), close);
  }
  const recState = s => { if (s === 'rec') { const l = ED.tab === 'voice' ? ED.line : null; const txt = l ? l.text : P.narrText; if (txt) { EDel.sub.hidden = false; EDel.sub.innerHTML = ''; EDel.sub.append(h('small', {}, l ? l.who : '내레이션'), txt); } } else EDel.sub.hidden = true; build(); };
  function build() {
    paintTabs(); box.innerHTML = ''; buildBar();
    const on = ED.rec && ED.rec.active;
    if (ED.tab === 'voice') {
      const ls = P.script || [], voiceOf = l => P.voices.find(v => v.lineId === l.id);
      if (!ls.length) {
        box.append(h('div', { class: 'pn-empty' }, h('b', {}, '녹음할 대사가 없어요'), h('p', { class: 'hint' }, '이야기 판에서 대사를 먼저 써요.'),
          h('div', { class: 'row' }, P.storyId === 'byeoljubu' ? ib('book', '원작 대사 넣기', 'btn sm accent', { onclick: () => { P.script = originalScript(); P.scriptMode = 'original'; changed(); build(); } }) : '',
            ib('book', '대사 쓰기', 'btn sm', { onclick: () => edPanel('story') }))));
        return;
      }
      if (!ED.line || !ls.includes(ED.line)) ED.line = ls.find(l => !voiceOf(l)) || ls[0];
      const list = h('div', { class: 'pn-list' });
      ls.forEach((l, i) => { const v = voiceOf(l);
        list.append(h('button', { class: 'vl' + (l === ED.line ? ' on' : '') + (v ? ' ok' : ''), type: 'button', disabled: on || null, onclick: () => { ED.line = l; if (v) edSelectAt(absT(v)); else { const s2 = P.scenes.find(s => s.id === l.scene); const rr = s2 && TL().map[s2.id]; if (rr && rr.t1 > rr.t0) edSelectAt(rr.t0 + .001); } build(); } },
          h('span', { class: 'd', html: v ? icon('check') : String(i + 1) }), h('span', { class: 't' }, h('b', {}, l.who || '?'), h('small', {}, l.text || '(빈 대사)')), v ? h('em', {}, v.dur.toFixed(1) + '초') : '')); });
      const v = voiceOf(ED.line);
      box.append(list, h('div', { class: 'pn-rec' },
        ib('speaker', '', 'btn icon', { 'aria-label': '듣기', disabled: !v || on || null, onclick: () => { Player.seek(absT(v)); Player.play({ until: absT(v) + v.dur + .2 }); } }),
        h('button', { class: 'mic' + (on ? ' run' : ''), type: 'button', 'aria-label': on ? '녹음 멈추기' : v ? '다시 녹음' : '녹음', onclick: () => recVoice(), html: icon(on ? 'stop' : 'mic') }),
        ib('upload', '', 'btn icon', { 'aria-label': '녹음 파일 넣기', disabled: on || null, onclick: () => uploadAudio('voices', ED.line, () => { refresh(); build(); }, Mic.failed) })),
        h('div', { class: 'hint pn-tip' }, on ? '말하고 나서 빨간 버튼을 눌러 멈춰요' : '지금 컷부터 영상이 흐르며 녹음돼요 · 3, 2, 1 뒤에 말해요'));
    } else if (ED.tab === 'sfx') {
      const grid = h('div', { class: 'kgrid' });
      for (const s of SFX) { const k = fxKey(s.name, SFX_IC[s.id] || 'speaker', TC.sfx, () => { AE.init(); AE.playPreview('sfx', s.id); }, () => addSfx(s.id)); k.title = s.desc; grid.append(k); }
      box.append(h('div', { class: 'hint pn-tip' }, '한 번: 들어 보기 · 두 번: 지금 컷에 넣기'), grid);
    } else if (ED.tab === 'bgm') {
      const sc = sceneAt(Player.t), i = P.scenes.indexOf(sc);
      const pick = id => { sc.bgm = id; changed(); refresh(); build(); if (id) AE.playPreview('bgm', id); else AE.stopPreview(); };
      box.append(h('div', { class: 'pn-sub' }, h('h4', {}, `${i + 1}. ${sc.name}`), ib('copy', '모든 장면에', 'btn sm', { onclick: () => { P.scenes.forEach(s => s.bgm = sc.bgm); changed(); refresh(); toast('모든 장면에 같은 음악을 넣었어요', 1500); } })),
        h('div', { class: 'kgrid c2' }, h('button', { class: 'sbtn' + (!sc.bgm ? ' on' : ''), type: 'button', onclick: () => pick(null) }, '음악 없음'),
          ...BGM.map(b => h('button', { class: 'sbtn' + (sc.bgm === b.id ? ' on' : ''), type: 'button', onclick: () => pick(b.id) }, b.name, h('small', {}, b.desc)))),
        h('div', { class: 'hint pn-tip' }, '아래 필름에서 다른 장면의 컷을 누르면 그 장면 음악을 골라요'));
    } else {
      const slider = (k, label) => h('label', { class: 'mini' }, label, h('input', { type: 'range', min: 0, max: 1.5, step: .05, value: P.mix[k], oninput: e => { P.mix[k] = +e.target.value; applyMix(); }, onchange: changed }));
      box.append(h('textarea', { class: 'input', rows: 2, placeholder: '읽을 글을 써 두면 녹음할 때 화면에 보여 줘요', 'aria-label': '내레이션 글', oninput: e => { P.narrText = e.target.value; }, onchange: changed }, P.narrText || ''),
        h('div', { class: 'pn-rec' }, h('button', { class: 'mic' + (on ? ' run' : ''), type: 'button', 'aria-label': on ? '녹음 멈추기' : '내레이션 녹음', onclick: recNarr, html: icon(on ? 'stop' : 'mic') }),
          ib('upload', '', 'btn icon', { 'aria-label': '녹음 파일 넣기', disabled: on || null, onclick: () => uploadAudio('narrs', null, () => { refresh(); build(); }, Mic.failed) })),
        h('h4', {}, '소리 크기'),
        h('div', { class: 'mix' }, slider('bgm', '음악'), slider('sfx', '효과음'), slider('voice', '대사'), slider('narr', '내레이션'),
          h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: P.duck, onchange: e => { P.duck = e.target.checked; changed(); } }), '말할 때 음악 작게')));
    }
  }
  function addSfx(id) {
    const s = { id: uid(), snd: id, vol: 1 }; setAbs(s, Player.t); P.sfx.push(s); AE.playPreview('sfx', id);
    S.sel = { kind: 'sfx', id: s.id }; changed(); refresh(); buildBar();
  }
  async function recVoice() {
    if (ED.rec && ED.rec.active) { ED.rec.stop(); return; }
    const line = ED.line; if (!line) return;
    ED.rec = recordFlow({ kind: 'voices', wrap: EDel.mon, line, onState: recState, onDone: () => {
      refresh(); const ls = P.script || []; const nx = ls.slice(ls.indexOf(line) + 1).find(l => !P.voices.some(v => v.lineId === l.id));
      if (nx) { ED.line = nx; toast('녹음했어요! 다음 대사로 넘어갔어요', 1600); } else toast('대사를 다 녹음했어요! 이제 효과음·배경음악을 넣거나 위의 “완성”을 눌러요', 3600, true);
      edSelectAt(Math.min(Player.t, TL().total - .001)); build(); } });
    await ED.rec.start();
  }
  async function recNarr() {
    if (ED.rec && ED.rec.active) { ED.rec.stop(); return; }
    ED.rec = recordFlow({ kind: 'narrs', wrap: EDel.mon, line: null, onState: recState, onDone: c => { S.sel = { kind: 'narr', id: c.id }; refresh(); edSelectAt(Math.min(Player.t, TL().total - .001)); build(); toast('내레이션을 넣었어요'); } });
    await ED.rec.start();
  }
  build();
}

/* 효과: 한 번 누르면 미리 보기, 한 번 더 누르면 지금 컷에 넣기. 넣은 효과는 화면에서 끌어 옮겨요 */
function edFxPanel(R) {
  const bar = h('div', { class: 'sel-bar', hidden: true }), grid = h('div', { class: 'kgrid' });
  let pvRaf = 0;
  const SEL = () => ED.fxSel && P.fx.find(e => e.id === ED.fxSel);
  const refresh = () => { TLc = null; edTracks(); };
  const preview = type => {
    cancelAnimationFrame(pvRaf); const t0 = performance.now(), D = 1.8;
    const loop = () => { const lt = (performance.now() - t0) / 1000; if (lt > D || !ED.open || ED.panel !== 'fx') return; drawFx(EDel.ctx, { id: 'pv' + type, type, x: .5, y: .45, s: 1, dur: D, text: type === 'text' ? '앗!' : type === 'boom' ? '쾅!' : undefined }, lt); pvRaf = requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  };
  const add = type => {
    const full = FULLSCREEN_FX[type];
    const e = { id: uid(), type, x: .5, y: .45, s: 1, dur: full ? 4 : 2, text: type === 'text' ? '앗!' : type === 'boom' ? '쾅!' : undefined };
    if (full) e.y = .5;
    setAbs(e, Player.t); P.fx.push(e); ED.fxSel = e.id; changed(); refresh(); buildBar();
  };
  function buildBar() {
    bar.innerHTML = ''; const e = SEL(); bar.hidden = !e; if (!e) return;
    bar.append(h('b', {}, FX.find(f => f.id === e.type).name),
      h('span', { class: 'label' }, '크기'), h('input', { type: 'range', min: .4, max: 2.5, step: .05, value: e.s, 'aria-label': '크기', oninput: ev => { e.s = +ev.target.value; }, onchange: changed }),
      h('span', { class: 'label' }, '시간'), h('input', { type: 'range', min: .5, max: 8, step: .1, value: e.dur, 'aria-label': '보이는 시간', oninput: ev => { e.dur = +ev.target.value; }, onchange: () => { changed(); refresh(); } }),
      (e.type === 'text' || e.type === 'boom') ? h('input', { class: 'txt', value: e.text || '', maxlength: 12, 'aria-label': '글자', oninput: ev => { e.text = ev.target.value; }, onchange: changed }) : '',
      ib('next', '', 'btn sm icon', { 'aria-label': '지금 컷으로 옮기기', onclick: () => { setAbs(e, Player.t); changed(); refresh(); } }),
      ib('trash', '', 'btn sm icon', { 'aria-label': '지우기', onclick: () => { P.fx = P.fx.filter(x => x !== e); ED.fxSel = null; changed(); refresh(); buildBar(); } }),
      ib('x', '', 'btn sm icon ghost', { 'aria-label': '닫기', onclick: () => { ED.fxSel = null; buildBar(); refresh(); } }));
  }
  for (const f of FX) grid.append(fxKey(f.name, FX_IC[f.id] || 'sparkle', TC.fx, () => preview(f.id), () => add(f.id)));
  R.append(h('div', { class: 'hint pn-tip' }, '한 번: 미리 보기 · 두 번: 지금 컷에 넣기 · 넣은 효과는 화면에서 끌어 옮겨요'), grid, bar);
  buildBar();
  // 화면에서 효과 고르기·끌기
  const cv = EDel.cv; let drag = null;
  const rel = e => { const r = appRect(cv), p = appPt(e); return { x: (p.x - r.left) / r.width, y: (p.y - r.top) / r.height }; };
  cv.onpointerdown = e => {
    if (ED.panel !== 'fx' || ED.live) return;
    const p = rel(e), t = Player.t; let hit = null, best = 1e9;
    for (const fx of P.fx) { const et = absT(fx); if (et == null || t < et || t > et + fx.dur) continue; const d = Math.hypot((p.x - fx.x) * W, (p.y - fx.y) * H); if (d < 110 * fx.s && d < best) { best = d; hit = fx; } }
    ED.fxSel = hit ? hit.id : null; buildBar(); edTracks();
    if (hit) { cv.setPointerCapture(e.pointerId); drag = { fx: hit, dx: p.x - hit.x, dy: p.y - hit.y }; }
  };
  cv.onpointermove = e => { if (!drag) return; const p = rel(e); drag.fx.x = clamp(p.x - drag.dx, 0, 1); drag.fx.y = clamp(p.y - drag.dy, 0, 1); };
  cv.onpointerup = cv.onpointercancel = () => { if (drag) { drag = null; changed(); } };
}

/* ---------- 완성 창: 제목 · 빠르기 · 영상 파일 · 상영관 ---------- */
function edFinish() {
  if (Player.playing) Player.pause();
  if (!TL().total) { toast('먼저 몇 컷을 찍어 보세요'); return; }
  const frames = P.scenes.reduce((a, s) => a + s.frames.length, 0);
  modal((b, m) => {
    const setFps = n => { const k = P.fps / n; for (const key of ['fx', 'sfx', 'voices', 'narrs']) for (const it of P[key]) it.off *= k; P.fps = n; changed(); edStrip(); info.textContent = stats(); };
    const stats = () => `장면 ${P.scenes.length} · 컷 ${frames} · ${fmt(TL().total).replace(/\.\d$/, '')} · 대사 ${P.voices.length} · 효과음 ${P.sfx.length} · 효과 ${P.fx.length}`;
    const info = h('p', { class: 'hint', style: { margin: 0 } }, stats());
    const big = (ic, label, sub, onclick, cls = '') => h('button', { class: 'fin-b ' + cls, type: 'button', onclick, html: `${icon(ic)}<b>${label}</b><small>${sub}</small>` });
    b.append(h('div', { class: 'fin-head' }, h('h2', {}, '완성!'),
        h('input', { class: 'input', value: P.title, maxlength: 40, 'aria-label': '영상 제목', oninput: e => { P.title = e.target.value; changed(); } }),
        h('button', { class: 'pn-x', type: 'button', 'aria-label': '닫기', html: icon('x'), onclick: m.close })), info,
      h('div', { class: 'fin-grid' },
        big('play', '처음부터 보기', '크게 틀어 봐요', () => { m.close(); playAll(); }),
        big('download', '영상 파일', 'mp4로 저장 · 보내기', () => { m.close(); exportVideo(); }, 'or'),
        big('trophy', '상영관에 올리기', '친구들의 별점 받기', async () => { m.close(); const first = !P.show; P.done.final = true; P.show = P.show || Date.now(); P.stars = P.stars || []; changed(); await openTheater(); toast(first ? '상영관에 올렸어요! 친구들에게 별점을 받아 보세요' : '상영관이에요', 3000, true); }),
        big('save', '작품 파일', '백업 · 다른 기기로', async () => { m.close(); await saveProject(); const d = await DB.get(P.id).catch(() => null); d ? exportProjectFile(d) : toast('먼저 저장이 되어야 해요'); })),
      h('div', { class: 'row fin-set' }, h('span', { class: 'label', style: { whiteSpace: 'nowrap' } }, '빠르기'),
        h('div', { class: 'seg' }, ...[6, 8, 12, 15, 24].map(n => h('button', { type: 'button', class: P.fps === n ? 'on' : '', onclick: e => { setFps(n); [...e.target.parentElement.children].forEach(x => x.classList.toggle('on', x === e.target)); } }, n + ''))),
        h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: P.fade, onchange: e => { P.fade = e.target.checked; changed(); } }), '부드럽게'),
        h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: P.subs, onchange: e => { P.subs = e.target.checked; changed(); } }), '자막')));
  }, { wide: true });
}

/* =========================================================
   갤러리 — 첫 화면. 새 작품 + 내가 만든 작품 카드
   ========================================================= */
async function openGallery() {
  show('library'); stopIntro();
  const up = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async e => { const f = e.target.files[0]; if (!f) return; const d = await importProjectFile(f); if (d) { toast(`“${d.title}”을(를) 불러왔어요`); openGallery(); } } });
  libTop('내 작품', false).append(up,
    key('', { ic: 'upload', cls: 'works', aria: '작품 파일 불러오기', title: '작품 파일 불러오기', onclick: () => up.click() }),
    key('', { ic: 'trash', cls: 'works', aria: '휴지통', title: '휴지통', onclick: openTrash }),
    key('상영관', { ic: 'trophy', cls: 'works hall', onclick: () => openTheater() }));
  const g = libBody('gallery');
  const grid = h('div', { class: 'gal scroll' });
  grid.append(h('button', { class: 'gcard new', type: 'button', onclick: () => openLibrary(), html: `<span class="pl">${icon('plus')}</span><b>새 작품</b>` }));
  g.append(grid);
  const { list } = await loadWorks();
  for (const d of list) {
    const sec = d.scenes.reduce((a, s) => a + s.frames.slice(s.trimIn || 0, s.frames.length - (s.trimOut || 0)).reduce((x, f) => x + f.hold, 0), 0) / (d.fps || 12);
    const th = h('span', { class: 'th' }, h('em', {}, fmt(sec).replace(/\.\d$/, '')));
    if (d.thumb) th.style.backgroundImage = `url(${URL.createObjectURL(d.thumb)})`;
    const more = h('button', { class: 'gmore', type: 'button', 'aria-label': `${d.title} 메뉴`, html: icon('more'), onclick: e => { e.stopPropagation(); workMenu(d); } });
    grid.append(h('div', { class: 'gcard', role: 'button', tabindex: 0, 'aria-label': `${d.title} 열기`, onclick: async () => { toast('작품을 여는 중…', 1200); await openProject(d); openEditor(); } },
      th, h('span', { class: 'tt' }, h('b', {}, d.title || '제목 없음'), h('small', {}, storyInfo(d.storyId).title + (d.show ? ' · 상영 중' : ''))), more));
  }
}
function workMenu(d) {
  modal((b, m) => {
    b.append(h('h2', {}, d.title || '제목 없음'),
      h('div', { class: 'menu-grid' },
        h('button', { class: 'btn accent', type: 'button', onclick: async () => { m.close(); await openProject(d); openEditor(); }, html: icon('edit') + '<span>이어서 만들기</span>' }),
        h('button', { class: 'btn', type: 'button', onclick: async () => { m.close(); const c = { ...d, id: uid(), title: (d.title || '작품') + ' 복사', created: Date.now(), updated: Date.now(), show: 0, stars: [] }; await DB.put(c); toast('작품을 복사했어요'); openGallery(); }, html: icon('copy') + '<span>복사하기</span>' }),
        h('button', { class: 'btn', type: 'button', onclick: () => { m.close(); exportProjectFile(d); }, html: icon('download') + '<span>작품 파일로 저장</span>' }),
        h('button', { class: 'btn', type: 'button', onclick: async () => { m.close(); if (await confirmBox('작품을 휴지통에 넣을까요?', `“${d.title}”은(는) 휴지통에 ${TRASH_DAYS}일 동안 있어요. 그동안은 되살릴 수 있어요.`, '휴지통에 넣기', true)) { d.trashed = Date.now(); await DB.put(d); openGallery(); toast('휴지통에 넣었어요'); } }, html: icon('trash') + '<span>지우기</span>' })),
      h('div', { class: 'acts' }, h('button', { class: 'btn primary', type: 'button', onclick: m.close }, '닫기')));
  });
}
