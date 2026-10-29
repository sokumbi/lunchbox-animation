/* =========================================================
   공통: 모니터 + 왼쪽 재생 키 + 아래 색깔 타임라인
   ========================================================= */
function transportEl() {
  const time = h('div', { class: 'time' }, '0:00');
  const play = key('', { ic: 'play', cls: 'orange play', aria: '재생', onclick: () => Player.toggle() });
  const jump = d => {
    const rs = TL().ranges.filter(r => r.t1 > r.t0); if (!rs.length) return;
    const t = Player.t; let i = rs.findIndex(r => t >= r.t0 && t < r.t1); if (i < 0) i = rs.length - 1;
    if (d < 0) Player.seek(t - rs[i].t0 > .4 ? rs[i].t0 : rs[Math.max(0, i - 1)].t0);
    else Player.seek(i + 1 < rs.length ? rs[i + 1].t0 + .001 : TL().total);
  };
  const box = h('div', { class: 'transport well' }, play,
    key('', { ic: 'rew', aria: '앞 장면으로', onclick: () => jump(-1) }), key('', { ic: 'ff', aria: '다음 장면으로', onclick: () => jump(1) }), time);
  let last = null;
  return { box, update(t) { time.textContent = fmt(t).replace(/\.\d$/, '') + ' / ' + fmt(TL().total).replace(/\.\d$/, ''); const p = Player.playing; if (p !== last) { last = p; play.innerHTML = icon(p ? 'pause' : 'play', 'ki'); play.setAttribute('aria-label', p ? '멈춤' : '재생'); } } };
}
function mountPlayerStage({ L, M, tlw }, { tracks = [], sceneDim = false, overlay = [], onTick, onScene } = {}) {
  const mon = monitorEl(overlay);
  M.append(mon.mon);
  const tp = transportEl(); L.append(tp.box);
  const tl = new Timeline(tlw, { tracks, sceneDim, onScene });
  Player.attach(mon.cv, { onTick: t => { tl.update(t); tp.update(t); onTick && onTick(t); } });
  Player.onState = () => { tl.update(Player.t); tp.update(Player.t); };
  return { st: mon, tl };
}
function sceneAt(t) { const r = TL().ranges.find(r => r.t1 > r.t0 && t >= r.t0 && t < r.t1) || TL().ranges.filter(r => r.t1 > r.t0).pop(); return r ? r.sc : P.scenes[0]; }
const sfxLen = s => { const p = AE.sfx[s.snd]; return p && p.__buf ? p.__buf.duration : .6; };
const FX_IC = { sparkle: 'sparkle', bubbles: 'bubbles', hearts: 'hearts', boom: 'boom', speed: 'speed', puff: 'puff', excl: 'excl', quest: 'quest', sweat: 'drop', light: 'light', rain: 'rain', snow: 'snow', dizzy: 'dizzy', text: 'text' };
const SFX_IC = { pop: 'pop', boing: 'spring', boom: 'boom', swoosh: 'wind', ding: 'bell', sparkle: 'sparkle', drop: 'drop', bubbles: 'bubbles', splash: 'splash', wave: 'wave', steps: 'foot', drum: 'drum', gong: 'gong', fail: 'sad' };
const TC = { fx: '#8A63C9', voice: '#3E7CB1', sfx: '#CF5D2A', bgm: '#4E9A63', narr: '#2F9C9A' };
const TRACK = {
  fx: (o = {}) => ({ key: 'fx', label: '효과', color: TC.fx, items: () => P.fx, len: e => e.dur, text: e => FX.find(f => f.id === e.type).name, ...o }),
  sfx: (o = {}) => ({ key: 'sfx', label: '효과음', color: TC.sfx, icon: 'speaker', items: () => P.sfx, len: s => Math.max(sfxLen(s), .8), text: s => SFX.find(x => x.id === s.snd).name, ...o }),
  voice: (o = {}) => ({ key: 'voice', label: '대사', color: TC.voice, items: () => P.voices, len: v => v.dur || 1, text: v => (v.who ? v.who + ' ' : '') + (v.text || '녹음'), ...o }),
  narr: (o = {}) => ({ key: 'narr', label: '내레이션', color: TC.narr, icon: 'mic', items: () => P.narrs, len: v => v.dur || 1, text: () => '내레이션', ...o }),
  bgm: (o = {}) => ({ key: 'bgm', label: '음악', color: TC.bgm, ...o })
};
/* 한 번 누르면 미리 보기·듣기, 한 번 더 누르면 넣기 */
function fxKey(name, ic, color, preview, insert, sub) {
  const k = h('button', { class: 'key fxk', type: 'button', style: { '--kc': color } },
    h('span', { class: 'dot', html: icon(ic) }), h('span', { class: 'kl' }, name), sub ? h('small', {}, sub) : '');
  k.style.setProperty('--kc', color);
  k.addEventListener('click', () => {
    if (k.__dragged) { k.__dragged = false; return; }
    if (k.classList.contains('armed')) { insert(); return; }
    $$('.fxk.armed').forEach(x => x.classList.remove('armed')); k.classList.add('armed'); preview();
  });
  return k;
}

/* ---------- 장면 다듬기 (자르기 키) ---------- */
function trimModal(after) {
  modal((b, m) => {
    const build = () => {
      b.innerHTML = '';
      const s = sceneAt(Player.t), i = P.scenes.indexOf(s);
      const len = s.frames.length, kept = Math.max(0, len - s.trimIn - s.trimOut);
      const kf = s.frames.slice(s.trimIn, len - s.trimOut).reduce((a, f) => a + f.hold, 0);
      const f = s.frames[s.trimIn];
      const refresh = () => { changed(); Player.seek(Player.t); after && after(); build(); };
      // 앞을 자르거나 되살리면 그 장면의 소리·효과도 같이 당겨요 (그림과 소리가 어긋나지 않게)
      const shiftItems = sec => { for (const k of ['fx', 'sfx', 'voices', 'narrs']) for (const it of P[k]) if (it.sid === s.id) it.off = Math.max(0, it.off - sec); };
      const setIn = v => { const old = s.trimIn; if (v > old) shiftItems(s.frames.slice(old, v).reduce((a, f) => a + f.hold, 0) / P.fps); else shiftItems(-s.frames.slice(v, old).reduce((a, f) => a + f.hold, 0) / P.fps); s.trimIn = v; };
      const setFps = n => { const k = P.fps / n; for (const key of ['fx', 'sfx', 'voices', 'narrs']) for (const it of P[key]) it.off *= k; P.fps = n; };
      const stepper = (label, val, max, set) => h('div', { class: 'step-n' }, h('span', { class: 'label' }, label),
        h('button', { class: 'btn sm icon', type: 'button', 'aria-label': label + ' 자르기 줄이기', disabled: val <= 0 || null, onclick: () => { set(val - 1); refresh(); } }, '−'), h('b', {}, val),
        h('button', { class: 'btn sm icon', type: 'button', 'aria-label': label + ' 자르기 늘리기', disabled: val >= max || null, onclick: () => { set(val + 1); refresh(); } }, '+'));
      const jump = d => { const n = P.scenes[clamp(i + d, 0, P.scenes.length - 1)]; const r = TL().map[n.id]; if (r && r.t1 > r.t0) Player.seek(r.t0 + .001); build(); };
      b.append(h('div', { class: 'panel-title' }, h('h2', {}, '장면 다듬기'), h('span', { class: 'hint' }, '지금 보고 있는 장면을 고쳐요')),
        h('div', { class: 'trimbox' },
          h('div', { class: 'row nowrap' }, ib('back', '', 'btn sm icon', { 'aria-label': '앞 장면', disabled: i === 0, onclick: () => jump(-1) }),
            h('div', { class: 'scur grow' }, h('div', { class: 'th', style: { backgroundImage: f ? `url(${f.url})` : '' } }), h('div', { style: { minWidth: 0 } }, h('b', {}, `${i + 1}. ${s.name}`), h('span', { class: 'hint' }, `컷 ${kept}/${len} · ${(kf / P.fps).toFixed(1)}초`))),
            ib('next', '', 'btn sm icon', { 'aria-label': '다음 장면', disabled: i === P.scenes.length - 1, onclick: () => jump(1) })),
          h('div', { class: 'row' }, h('span', { html: icon('scissors'), style: { width: '20px', color: 'var(--orange)', display: 'inline-flex' } }),
            stepper('앞에서 자르기', s.trimIn, Math.max(0, len - s.trimOut - 1), setIn),
            stepper('뒤에서 자르기', s.trimOut, Math.max(0, len - s.trimIn - 1), v => s.trimOut = v)),
          h('div', { class: 'row' },
            ib('up', '앞으로', 'btn sm', { disabled: i === 0, onclick: () => { [P.scenes[i - 1], P.scenes[i]] = [P.scenes[i], P.scenes[i - 1]]; refresh(); } }),
            ib('down', '뒤로', 'btn sm', { disabled: i === P.scenes.length - 1, onclick: () => { [P.scenes[i + 1], P.scenes[i]] = [P.scenes[i], P.scenes[i + 1]]; refresh(); } }),
            ib('pingpong', '거꾸로', 'btn sm', { 'aria-label': '장면을 거꾸로 돌리기', onclick: () => { s.frames.reverse(); [s.trimIn, s.trimOut] = [s.trimOut, s.trimIn]; refresh(); toast('장면을 거꾸로 돌렸어요', 1200); } }),
            ib('copy', '복제', 'btn sm', { onclick: () => { const c = { ...newScene(s.name + ' (복사)'), frames: s.frames.map(f => ({ ...f, id: uid() })), trimIn: s.trimIn, trimOut: s.trimOut, bgm: s.bgm }; P.scenes.splice(i + 1, 0, c); refresh(); } }),
            P.scenes.length > 1 ? ib('trash', '지우기', 'btn sm', { onclick: async () => { if (!await confirmBox('장면을 지울까요?', `“${s.name}” 장면과 그 안의 효과·소리가 함께 지워져요.`, '지우기', true)) return; P.scenes.splice(i, 1); for (const k of ['fx', 'sfx', 'voices', 'narrs']) P[k] = P[k].filter(it => it.sid !== s.id); refresh(); } }) : '',
            ib('cam', '다시 촬영', 'btn sm accent', { onclick: () => { m.close(); S.curScene = s.id; goStep('shoot'); } })),
          h('h3', { class: 'setting-h' }, '영상 전체 설정'),
          h('div', { class: 'row nowrap' }, h('span', { class: 'label', style: { whiteSpace: 'nowrap' } }, '빠르기 (1초에 몇 장)'),
            h('div', { class: 'seg' }, ...[6, 8, 12, 15, 24].map(n => h('button', { type: 'button', class: P.fps === n ? 'on' : '', onclick: () => { setFps(n); refresh(); } }, n + '')))),
          h('div', { class: 'row' },
            h('label', { class: 'toggle', style: { fontSize: '13px' } }, h('input', { type: 'checkbox', checked: P.fade, onchange: e => { P.fade = e.target.checked; changed(); Player.draw(); } }), '장면 바뀔 때 부드럽게'),
            h('label', { class: 'toggle', style: { fontSize: '13px' } }, h('input', { type: 'checkbox', checked: P.subs, onchange: e => { P.subs = e.target.checked; changed(); Player.draw(); } }), '대사 자막'))),
        h('div', { class: 'acts' }, h('button', { class: 'btn primary', type: 'button', onclick: m.close }, '다 했어요')));
    };
    build();
  }, { wide: true });
}
/* 타임라인에서 장면을 누르면: 여기서 나누기 · 다듬기 · 다시 찍기 · 지우기 */
function sceneMenu(sc, t, after) {
  const r = TL().map[sc.id]; if (!r) return;
  modal((b, m) => {
    const seg = segAt(t); const idx = seg && seg.sc === sc ? seg.idx : sc.trimIn;
    const split = () => {
      if (idx <= sc.trimIn) { toast('장면 맨 앞이라 나눌 수 없어요'); return; }
      const cutT = sc.frames.slice(sc.trimIn, idx).reduce((a, f) => a + f.hold, 0) / P.fps;
      const nb = { ...newScene(sc.name + ' 2'), frames: sc.frames.slice(idx), trimOut: sc.trimOut, bgm: sc.bgm };
      sc.frames = sc.frames.slice(0, idx); sc.trimOut = 0;
      for (const k of ['fx', 'sfx', 'voices', 'narrs']) for (const it of P[k]) if (it.sid === sc.id && it.off >= cutT) { it.sid = nb.id; it.off -= cutT; }
      P.scenes.splice(P.scenes.indexOf(sc) + 1, 0, nb); changed(); m.close(); after && after(); toast('장면을 둘로 나눴어요');
    };
    b.append(h('h2', {}, `${P.scenes.indexOf(sc) + 1}. ${sc.name}`), h('p', { class: 'hint', style: { margin: 0 } }, '이 장면으로 무엇을 할까요?'),
      h('div', { class: 'menu-grid' },
        h('button', { class: 'btn', type: 'button', onclick: split, html: icon('scissors') + '<span>여기서 나누기</span>' }),
        h('button', { class: 'btn', type: 'button', onclick: () => { m.close(); trimModal(after); }, html: icon('edit') + '<span>앞뒤 다듬기</span>' }),
        h('button', { class: 'btn accent', type: 'button', onclick: () => { m.close(); S.curScene = sc.id; goStep('shoot'); }, html: icon('cam') + '<span>다시 찍기</span>' }),
        P.scenes.length > 1 ? h('button', { class: 'btn', type: 'button', onclick: async () => { m.close(); if (!await confirmBox('장면을 지울까요?', `“${sc.name}” 장면과 그 안의 효과·소리가 함께 지워져요. 되돌리기로 살릴 수 있어요.`, '지우기', true)) return; P.scenes = P.scenes.filter(x => x !== sc); for (const k of ['fx', 'sfx', 'voices', 'narrs']) P[k] = P[k].filter(it => it.sid !== sc.id); changed(); after && after(); }, html: icon('trash') + '<span>지우기</span>' }) : ''),
      h('div', { class: 'acts' }, h('button', { class: 'btn primary', type: 'button', onclick: m.close }, '닫기')));
  });
}
/* 오른쪽 줄 도구 키 — 도구 판(sheet)이 열려 있으면 켜진 모양 */
function railTool(label, ic, onclick, cls = '') { return key(label, { ic, cls: 'rt ' + cls, onclick }); }
function paintRail(RR, on) { for (const k of RR.querySelectorAll('.rt')) k.classList.toggle('on', k.dataset.tab === on); }
function cutKey(ui) { return key('자르기', { ic: 'scissors', onclick: () => trimModal(() => ui && ui.tl.render()) }); }

/* =========================================================
   편집 (영상) — 왼쪽: 완성 · 사운드 · 재생 / 오른쪽: 영상 효과 / 아래: 타임라인 + 자르기
   ========================================================= */
STEP_MOD.edit = (() => {
  let ui, bar, M, sheet, RR;
  const SEL = () => S.sel && S.sel.kind === 'fx' ? P.fx.find(e => e.id === S.sel.id) : null;
  function mount(r) {
    M = r.M;
    r.L.append(key('사운드', { ic: 'back', aria: '사운드로 돌아가기', onclick: () => goStep('sound') }));
    if (needFrames(r.M)) { r.L.append(transportEl().box); return; }
    sheet = r.sheet; RR = r.RR;
    const fxBtn = railTool('효과', 'sparkle', () => sheet.isOpen ? sheet.close() : sheet.open()); fxBtn.dataset.tab = 'fx';
    sheet.onToggle = o => paintRail(RR, o ? 'fx' : null);
    bar = h('div', { class: 'sel-bar', hidden: true });
    ui = mountPlayerStage(r, { tracks: [TRACK.fx({ onSelect: () => { buildBar(); Player.draw(); } }), TRACK.voice()], onTick: drawSel, onScene: (sc, t) => sceneMenu(sc, t, () => goStep('edit')) });
    setupStagePointer(ui.st.cv);
    const grid = h('div', { class: 'kgrid' });
    for (const f of FX) { const k = fxKey(f.name, FX_IC[f.id] || 'sparkle', TC.fx, () => previewFx(f.id), () => addFx(f.id, .5, .45)); paletteDrag(k, f, ui.st.cv); grid.append(k); }
    r.R.append(h('div', { class: 'rhead' }, h('h3', {}, '영상 효과'), h('span', { class: 'hint' }, '한 번: 미리 보기 · 두 번: 넣기')), grid, bar);
    RR.append(fxBtn, cutKey(ui));
    sheet.open(); buildBar();
  }
  let pvRaf = 0;
  function previewFx(type) {
    cancelAnimationFrame(pvRaf); Player.pause(); const t0 = performance.now(), D = 1.8;
    const loop = () => {
      const lt = (performance.now() - t0) / 1000; Player.draw();
      if (lt > D || !Player.ctx) return;
      drawFx(Player.ctx, { id: 'pv' + type, type, x: .5, y: .45, s: 1, dur: D, text: type === 'text' ? '앗!' : type === 'boom' ? '쾅!' : undefined }, lt);
      pvRaf = requestAnimationFrame(loop);
    };
    loop();
  }
  function addFx(type, x, y) {
    const full = FULLSCREEN_FX[type];
    const e = { id: uid(), type, x: full ? .5 : x, y: full ? .5 : y, s: 1, dur: full ? 4 : 2, text: type === 'text' ? '앗!' : type === 'boom' ? '쾅!' : undefined };
    setAbs(e, Player.t); P.fx.push(e); S.sel = { kind: 'fx', id: e.id }; changed(); ui.tl.render(); buildBar(); Player.draw();
  }
  function paletteDrag(it, f, stage) {
    it.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      const p0 = appPt(e), a = appRect($('#app')); let ghost = null;
      const mv = ev => { const p = appPt(ev); if (!ghost && Math.hypot(p.x - p0.x, p.y - p0.y) > 8) { ghost = h('div', { class: 'key fxk', style: { position: 'absolute', zIndex: 999, pointerEvents: 'none', width: '64px', height: '56px', transform: 'translate(-50%,-50%)', '--kc': TC.fx }, html: `<span class="dot">${icon(FX_IC[f.id])}</span>` }); ghost.style.setProperty('--kc', TC.fx); $('#app').append(ghost); }
        if (ghost) { ghost.style.left = p.x - a.left + 'px'; ghost.style.top = p.y - a.top + 'px'; } };
      const up = ev => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up);
        if (ghost) { it.__dragged = true; ghost.remove(); const r = appRect(stage), p = appPt(ev); if (p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom) addFx(f.id, (p.x - r.left) / r.width, (p.y - r.top) / r.height); else toast('영상 화면 위에 놓아 주세요'); } };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    });
  }
  function setupStagePointer(cv) {
    let drag = null;
    const rel = e => { const r = appRect(cv), p = appPt(e); return { x: (p.x - r.left) / r.width, y: (p.y - r.top) / r.height }; };
    cv.addEventListener('pointerdown', e => {
      const p = rel(e), t = Player.t; let hit = null, best = 1e9;
      for (const fx of P.fx) { const et = absT(fx); if (et == null || t < et || t > et + fx.dur) continue; const d = Math.hypot((p.x - fx.x) * W, (p.y - fx.y) * H); if (d < 110 * fx.s && d < best) { best = d; hit = fx; } }
      S.sel = hit ? { kind: 'fx', id: hit.id } : null; buildBar(); ui.tl.render(); Player.draw();
      if (hit) { Player.pause(); cv.setPointerCapture(e.pointerId); drag = { fx: hit, dx: p.x - hit.x, dy: p.y - hit.y }; }
    });
    cv.addEventListener('pointermove', e => { if (!drag) return; const p = rel(e); drag.fx.x = clamp(p.x - drag.dx, 0, 1); drag.fx.y = clamp(p.y - drag.dy, 0, 1); Player.draw(); });
    const up = () => { if (drag) { drag = null; changed(); } }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }
  function drawSel() {
    const e = SEL(); if (!e || !Player.ctx) return; const et = absT(e); if (et == null || Player.t < et || Player.t > et + e.dur) return;
    const c = Player.ctx; c.save(); c.setLineDash([10, 8]); c.lineWidth = 3; c.strokeStyle = TC.fx; c.beginPath(); c.arc(e.x * W, e.y * H, 90 * e.s, 0, 7); c.stroke(); c.restore();
  }
  function buildBar() {
    if (!bar) return; bar.innerHTML = ''; const e = SEL(); bar.hidden = !e; if (!e) return; if (sheet && !sheet.isOpen) sheet.open();
    bar.append(h('b', {}, FX.find(f => f.id === e.type).name),
      h('span', { class: 'label' }, '크기'), h('input', { type: 'range', min: .4, max: 2.5, step: .05, value: e.s, 'aria-label': '크기', oninput: ev => { e.s = +ev.target.value; Player.draw(); }, onchange: changed }),
      h('span', { class: 'label' }, '시간'), h('input', { type: 'range', min: .5, max: 8, step: .1, value: e.dur, 'aria-label': '보이는 시간', oninput: ev => { e.dur = +ev.target.value; Player.draw(); }, onchange: () => { changed(); ui.tl.render(); } }),
      (e.type === 'text' || e.type === 'boom') ? h('input', { class: 'txt', value: e.text || '', maxlength: 12, 'aria-label': '글자', oninput: ev => { e.text = ev.target.value; Player.draw(); }, onchange: changed }) : '',
      ib('next', '', 'btn sm icon', { 'aria-label': '지금 시간으로 옮기기', onclick: () => { setAbs(e, Player.t); changed(); ui.tl.render(); Player.draw(); } }),
      ib('copy', '', 'btn sm icon', { 'aria-label': '복사', onclick: () => { const c = { ...e, id: uid() }; setAbs(c, absT(e) + e.dur); P.fx.push(c); S.sel = { kind: 'fx', id: c.id }; changed(); ui.tl.render(); buildBar(); } }),
      ib('trash', '', 'btn sm icon', { 'aria-label': '지우기', onclick: () => { P.fx = P.fx.filter(x => x !== e); S.sel = null; changed(); ui.tl.render(); buildBar(); Player.draw(); } }),
      ib('x', '', 'btn sm icon ghost', { 'aria-label': '닫기', onclick: () => { S.sel = null; buildBar(); ui.tl.render(); Player.draw(); } }));
  }
  return { mount, unmount() { } };
})();

/* =========================================================
   사운드 — 오른쪽이 효과음 / 배경음악 / 나레이션 키로 바뀌어요 (완성 키는 숨겨요)
   ========================================================= */
STEP_MOD.sound = (() => {
  let ui, R, bar, guide, rec = null, recBtn, M, sheet, RR;
  const SEL = () => S.sel && S.sel.kind === 'sfx' ? P.sfx.find(x => x.id === S.sel.id) : S.sel && S.sel.kind === 'narr' ? P.narrs.find(x => x.id === S.sel.id) : null;
  function mount(r) {
    R = r.R; M = r.M;
    r.L.append(key('대사 녹음', { ic: 'back', aria: '대사 녹음으로 돌아가기', onclick: () => goStep('voice') }));
    if (needFrames(r.M)) { r.L.append(transportEl().box); return; }
    sheet = r.sheet; RR = r.RR;
    // 오른쪽 줄: 효과음 · 배경음악 · 내레이션 — 누르면 그 도구 판이 열려요 (열린 걸 또 누르면 닫혀요)
    for (const [k, l, ic] of [['sfx', '효과음', 'speaker'], ['bgm', '배경음악', 'music'], ['narr', '내레이션', 'mic']]) {
      const b = railTool(l, ic, () => { if (sheet.isOpen && S.soundTab === k) { sheet.close(); return; } if (S.soundTab !== k) S.sel = null; S.soundTab = k; AE.stopPreview(); build(); buildBar(); ui.tl.render(); sheet.open(); }); b.dataset.tab = k; RR.append(b);
    }
    sheet.onToggle = o => paintRail(RR, o ? S.soundTab : null);
    AE.init(); Promise.all(SFX.map(s => AE.getSfx(s.id))).then(() => ui && ui.tl.render());
    bar = h('div', { class: 'sel-bar', hidden: true }); guide = h('div', { class: 'guide', hidden: true });
    ui = mountPlayerStage(r, { overlay: [guide], sceneDim: true, onScene: (sc, t) => sceneMenu(sc, t, () => goStep('sound')), tracks: [TRACK.sfx({ onSelect: buildBar }), TRACK.bgm({ onSelect: () => { S.soundTab = 'bgm'; build(); sheet.open(); } }), TRACK.narr({ onSelect: buildBar })],
      onTick: t => { if (S.soundTab === 'bgm') { const sc = sceneAt(t); if (sc && sc.id !== curBgmScene) build(); } } });
    RR.append(h('div', { class: 'gap' }), cutKey(ui));
    S.soundTab = S.soundTab || 'sfx';
    build(); sheet.open(); buildBar();
  }
  let curBgmScene = null;
  function unmount() { if (rec && rec.active) rec.stop(); Mic.release(); AE.stopPreview(); }
  function build() {
    R.innerHTML = '';
    const tabs = [['sfx', '효과음'], ['bgm', '배경음악'], ['narr', '내레이션']];
    R.append(h('div', { class: 'rhead' }, h('h3', {}, tabs.find(t => t[0] === S.soundTab)[1])));
    if (sheet && sheet.isOpen) paintRail(RR, S.soundTab);
    if (S.soundTab === 'sfx') {
      const grid = h('div', { class: 'kgrid' });
      for (const s of SFX) { const k = fxKey(s.name, SFX_IC[s.id] || 'speaker', TC.sfx, () => { AE.init(); AE.playPreview('sfx', s.id); }, () => addSfx(s.id)); k.title = s.desc; grid.append(k); }
      R.append(h('div', { class: 'hint tiphint' }, '한 번: 들어 보기 · 두 번: 지금 시간에 넣기'), grid);
    } else if (S.soundTab === 'bgm') {
      const sc = sceneAt(Player.t); curBgmScene = sc.id; const i = P.scenes.indexOf(sc);
      const pick = id => { sc.bgm = id; changed(); ui.tl.render(); build(); if (id) AE.playPreview('bgm', id); else AE.stopPreview(); };
      const jump = d => { const n = P.scenes[clamp(i + d, 0, P.scenes.length - 1)]; const rr = TL().map[n.id]; if (rr) Player.seek(rr.t0 + .001); build(); };
      R.append(h('div', { class: 'scnav' }, key('', { ic: 'back', aria: '앞 장면', onclick: () => jump(-1) }), h('b', {}, `${i + 1}. ${sc.name}`), key('', { ic: 'next', aria: '다음 장면', onclick: () => jump(1) }),
        key('', { ic: 'copy', aria: '이 음악을 모든 장면에', title: '이 음악을 모든 장면에', onclick: () => { P.scenes.forEach(s => s.bgm = sc.bgm); changed(); ui.tl.render(); toast('모든 장면에 같은 음악을 넣었어요', 1500); } })),
        h('div', { class: 'kgrid c2' }, h('button', { class: 'sbtn' + (!sc.bgm ? ' on' : ''), type: 'button', onclick: () => pick(null) }, '음악 없음'),
          ...BGM.map(b => h('button', { class: 'sbtn' + (sc.bgm === b.id ? ' on' : ''), type: 'button', onclick: () => pick(b.id) }, b.name, h('small', {}, b.desc)))));
    } else {
      recBtn = key(rec && rec.active ? '녹음 멈추기' : '내레이션 녹음', { ic: rec && rec.active ? 'stop' : 'mic', cls: 'orange wide', onclick: toggleRec });
      const slider = (k, label) => h('label', { class: 'mini' }, label, h('input', { type: 'range', min: 0, max: 1.5, step: .05, value: P.mix[k], oninput: e => { P.mix[k] = +e.target.value; applyMix(); }, onchange: changed }));
      R.append(h('textarea', { class: 'input', rows: 2, placeholder: '읽을 글을 써 두면 녹음할 때 화면에 보여 줘요', style: { fontSize: '13px', resize: 'none', flex: 'none', height: '44px', padding: '6px 9px' }, oninput: e => { P.narrText = e.target.value; }, onchange: changed }, P.narrText || ''),
        h('div', { class: 'minirow' }, recBtn, key('파일', { ic: 'upload', cls: 'wide', onclick: () => uploadAudio('narrs', null, () => { ui.tl.render(); build(); }, Mic.failed) })),
        h('div', { class: 'mix' }, slider('bgm', '음악'), slider('sfx', '효과음'), slider('voice', '대사'), slider('narr', '내레이션'),
          h('label', { class: 'toggle', style: { fontSize: '11.5px', gap: '6px' } }, h('input', { type: 'checkbox', checked: P.duck, onchange: e => { P.duck = e.target.checked; changed(); } }), '말할 때 음악 작게')));
    }
    if (bar) R.append(bar);
  }
  function addSfx(id) {
    const s = { id: uid(), snd: id, vol: 1 }; setAbs(s, Player.t); P.sfx.push(s);
    if (!Player.playing) AE.playPreview('sfx', id); else AE.getSfx(id).then(b => { const n = AE.ctx.createBufferSource(); n.buffer = b; n.connect(AE.buses.sfx); n.start(); });
    S.sel = { kind: 'sfx', id: s.id }; changed(); ui.tl.render(); buildBar();
  }
  function buildBar() {
    if (!bar) return; bar.innerHTML = ''; const it = SEL(); bar.hidden = !it; if (!it) return;
    if (sheet && !sheet.isOpen) { S.soundTab = S.sel.kind === 'narr' ? 'narr' : 'sfx'; build(); sheet.open(); bar.hidden = false; }
    if (S.sel.kind === 'sfx') {
      const s = it;
      bar.append(h('b', {}, SFX.find(x => x.id === s.snd).name),
        h('span', { class: 'label' }, '크기'), h('input', { type: 'range', min: 0, max: 1.5, step: .05, value: s.vol, 'aria-label': '소리 크기', onchange: e => { s.vol = +e.target.value; changed(); AE.playPreview('sfx', s.snd); } }),
        ib('speaker', '', 'btn sm icon', { 'aria-label': '듣기', onclick: () => AE.playPreview('sfx', s.snd) }),
        ib('next', '', 'btn sm icon', { 'aria-label': '지금 시간으로 옮기기', onclick: () => { setAbs(s, Player.t); changed(); ui.tl.render(); } }),
        ib('trash', '', 'btn sm icon', { 'aria-label': '지우기', onclick: () => { P.sfx = P.sfx.filter(x => x !== s); S.sel = null; changed(); ui.tl.render(); buildBar(); } }),
        ib('x', '', 'btn sm icon ghost', { 'aria-label': '닫기', onclick: () => { S.sel = null; buildBar(); ui.tl.render(); } }));
    } else {
      const n = it;
      bar.append(h('b', {}, `내레이션 ${n.dur.toFixed(1)}초`),
        ib('speaker', '듣기', 'btn sm', { onclick: () => { Player.seek(absT(n)); Player.play({ until: absT(n) + n.dur + .2 }); } }),
        ib('trash', '지우기', 'btn sm', { onclick: () => { P.narrs = P.narrs.filter(x => x !== n); S.sel = null; changed(); ui.tl.render(); buildBar(); } }),
        ib('x', '', 'btn sm icon ghost', { 'aria-label': '닫기', onclick: () => { S.sel = null; buildBar(); ui.tl.render(); } }));
    }
  }
  function setState(s) {
    if (s === 'rec' && P.narrText) { guide.hidden = false; guide.innerHTML = ''; guide.append(h('small', {}, '내레이션'), P.narrText); }
    else if (s !== 'rec') guide.hidden = true;
    if (S.soundTab === 'narr') build();
  }
  async function toggleRec() {
    if (rec && rec.active) { rec.stop(); return; }
    rec = recordFlow({ kind: 'narrs', wrap: ui.st.wrap, line: null, onState: setState, onDone: c => { S.sel = { kind: 'narr', id: c.id }; ui.tl.render(); build(); buildBar(); toast('내레이션을 넣었어요'); } });
    await rec.start();
  }
  return { mount, unmount };
})();

/* =========================================================
   대사 녹음
   ========================================================= */
STEP_MOD.voice = (() => {
  /* 대사 녹음 — 대사는 화면 위 자막, 왼쪽 줄: 앞·뒤 대사 · 재생 / 오른쪽 줄: 듣기 · 큰 빨간 마이크 · 지우기 · 파일 · 고치기 */
  let ui, R, cur = null, rec = null, guide, recBtn, sheet, pill, prevK, nextK, listenK, delK, micWarned = false;
  const lines = () => P.script || [];
  const voiceOf = l => l && P.voices.find(v => v.lineId === l.id);
  function mount(r) {
    R = r.R; sheet = r.sheet;
    if (needFrames(r.M)) { r.L.append(transportEl().box); return; }
    guide = h('div', { class: 'guide', hidden: true }); pill = h('div', { class: 'stage-pill' });
    prevK = key('앞 대사', { ic: 'back', onclick: () => go(-1) }); nextK = key('뒤 대사', { ic: 'next', onclick: () => go(1) });
    r.L.append(prevK, nextK);
    ui = mountPlayerStage(r, { overlay: [guide, pill], tracks: [TRACK.voice({ onSelect: v => { const l = lines().find(l => l.id === v.lineId); if (l) { cur = l; build(); } } })] });
    recBtn = key('녹음', { ic: 'mic', cls: 'rec', onclick: toggleRec });
    listenK = key('듣기', { ic: 'speaker', onclick: () => { const v = voiceOf(cur); if (v) { Player.seek(absT(v)); Player.play({ until: absT(v) + v.dur + .2 }); } else toast('아직 녹음하지 않았어요'); } });
    delK = key('지우기', { ic: 'trash', onclick: () => { const v = voiceOf(cur); if (!v) return; P.voices = P.voices.filter(x => x !== v); changed(); ui.tl.render(); build(); } });
    r.RR.append(listenK, h('div', { class: 'gap' }), recBtn, h('div', { class: 'gap' }),
      key('파일', { ic: 'upload', onclick: () => cur && uploadAudio('voices', cur, () => { ui.tl.render(); build(); }, Mic.failed) }),
      key('고치기', { ic: 'edit', onclick: () => goStep('script') }));
    if (!(P.script && P.script.length) && P.storyId === 'byeoljubu' && !P.scriptMode) choose(); else build();
  }
  function unmount() { if (rec && rec.active) rec.stop(); Mic.release(); }
  function choose() {
    modal((b, m) => {
      b.append(h('h2', {}, '어떤 대사로 녹음할까요?'),
        h('div', { class: 'choice' },
          h('button', { type: 'button', onclick: () => { P.scriptMode = 'original'; P.script = originalScript(); changed(); m.close(); build(); } }, h('b', {}, '원작 대사 쓰기'), h('span', {}, '별주부전 원작 대사 12줄로 녹음해요.')),
          h('button', { type: 'button', onclick: () => { P.scriptMode = 'new'; P.script = P.script || []; changed(); m.close(); goStep('script'); } }, h('b', {}, '새로 쓰기'), h('span', {}, '시나리오 단계에서 대사를 직접 쓰거나 파일로 불러와요.'))));
    }, { close: false });
  }
  function showGuide() { if (!cur) { guide.hidden = true; return; } guide.hidden = false; guide.innerHTML = ''; guide.append(h('small', {}, cur.who), cur.text); }
  function go(d) {
    const ls = lines(), i = ls.indexOf(cur); cur = ls[clamp(i + d, 0, ls.length - 1)]; if (!cur) return;
    const vv = voiceOf(cur); if (vv) Player.seek(absT(vv)); else { const s2 = P.scenes.find(s => s.id === cur.scene); const rr = s2 && TL().map[s2.id]; rr && Player.seek(rr.t0); }
    build();
  }
  function build() {
    const ls = lines();
    if (!cur || !ls.includes(cur)) cur = ls.find(l => !voiceOf(l)) || ls[0] || null;
    showGuide();
    if (!cur) {
      pill.textContent = '녹음할 대사가 없어요';
      R.innerHTML = ''; R.append(h('div', { class: 'rhead' }, h('h3', {}, '대사 녹음')), h('p', { class: 'hint', style: { margin: 0 } }, '녹음할 대사가 아직 없어요. 시나리오 단계에서 대사 가이드를 먼저 써 주세요.'), key('시나리오로 가기', { ic: 'book', cls: 'orange row', onclick: () => goStep('script') }));
      sheet.el.classList.add('auto'); sheet.open();
      for (const k of [prevK, nextK, listenK, delK, recBtn]) k.disabled = true;
      return;
    }
    sheet.close();
    const i = ls.indexOf(cur), v = voiceOf(cur), sc = P.scenes.find(s => s.id === cur.scene), done = ls.filter(l => voiceOf(l)).length;
    pill.textContent = `대사 ${i + 1} / ${ls.length} · ${cur.who || '?'}${sc ? ' · ' + sc.name : ''} · ${v ? '녹음됨 ✓' : `녹음 ${done}/${ls.length}`}`;
    const on = rec && rec.active;
    prevK.disabled = i === 0 || on; nextK.disabled = i === ls.length - 1 || on; listenK.disabled = !v || on; delK.disabled = !v || on; recBtn.disabled = false;
    recBtn.innerHTML = icon(on ? 'stop' : 'mic', 'ki') + `<span class="kl">${on ? '멈추기' : v ? '다시 녹음' : '녹음'}</span>`;
    recBtn.classList.toggle('recording', !!on);
    if (Mic.failed && !micWarned) { micWarned = true; toast('마이크를 바로 쓸 수 없어요. 오른쪽 “파일” 키로 폰 녹음 앱을 쓰거나 녹음 파일을 넣어 주세요', 4200, true); }
  }
  function setState(s) { if (s === 'rec' || s === 'idle' || s === 'fail') build(); }
  async function toggleRec() {
    if (rec && rec.active) { rec.stop(); return; }
    if (!cur) return;
    rec = recordFlow({ kind: 'voices', wrap: ui.st.wrap, line: cur, onState: setState, onDone: () => { ui.tl.render(); const lines = P.script || []; const i = lines.indexOf(cur); const nx = lines.slice(i + 1).find(l => !P.voices.some(v => v.lineId === l.id)); if (nx) { cur = nx; build(); toast('녹음했어요! 다음 대사로 넘어갔어요', 1600); } else { build(); pulseNext('대사를 다 녹음했어요! 화면 오른쪽 위 주황색 “다음”을 눌러 사운드로 가요'); } } });
    recBtn.disabled = true; await rec.start(); if (recBtn) recBtn.disabled = false;
  }
  return { mount, unmount };
})();

/* =========================================================
   완성 · 저장
   ========================================================= */
STEP_MOD.final = (() => {
  function mount(r) {
    r.L.append(key('편집', { ic: 'back', aria: '편집으로 돌아가기', onclick: () => goStep('edit') }));
    if (needFrames(r.M)) { r.L.append(transportEl().box); return; }
    const ui = mountPlayerStage(r, { tracks: [TRACK.fx(), TRACK.voice(), TRACK.sfx()], onScene: (sc, t) => sceneMenu(sc, t, () => goStep('final')) });
    const frames = P.scenes.reduce((a, s) => a + s.frames.length, 0);
    const bgmN = new Set(P.scenes.map(s => s.bgm).filter(Boolean)).size;
    const stat = (n, l, step) => h('button', { class: 'key', type: 'button', onclick: () => goStep(step), title: '고치러 가기' }, h('b', {}, n), h('span', {}, l));
    r.R.append(h('div', { class: 'rhead' }, h('h3', {}, '완성!'), h('span', { class: 'hint' }, fmt(TL().total).replace(/\.\d$/, '') + ' 영상')),
      h('input', { class: 'input', value: P.title, maxlength: 40, 'aria-label': '영상 제목', style: { flex: 'none', padding: '7px 10px' }, oninput: e => { P.title = e.target.value; changed(); } }),
      h('div', { class: 'check' },
        stat(P.scenes.length, '장면', 'shoot'), stat(frames, '컷', 'shoot'), stat(P.voices.length, '대사', 'voice'), stat(P.sfx.length, '효과음', 'sound'),
        stat(bgmN, '음악', 'sound'), stat(P.narrs.length, '내레이션', 'sound'), stat(P.fx.length, '효과', 'edit'), stat(P.fps, '빠르기', 'edit')),
      h('div', { class: 'hint' }, '숫자를 누르면 그 단계로 고치러 가요.'));
    const sheet = r.sheet, sum = railTool('한눈에', 'grid', () => sheet.isOpen ? sheet.close() : sheet.open()); sum.dataset.tab = 'sum';
    sheet.onToggle = o => paintRail(r.RR, o ? 'sum' : null);
    r.RR.append(key('영상 파일', { ic: 'download', cls: 'orange', onclick: exportVideo }), sum,
      key('처음부터', { ic: 'play', onclick: () => { sheet.close(); Player.seek(0); Player.play(); } }),
      key('작품함', { ic: 'save', onclick: async () => { P.done.final = true; const ok = await saveProject(); toast(ok ? '내 작품함에 저장했어요' : '이 화면에서는 작품함 저장이 안 돼요. 영상 파일로 저장해 주세요.'); } }));
    sheet.open();
  }
  return { mount, unmount() { } };
})();
