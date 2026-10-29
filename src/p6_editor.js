/* =========================================================
   편집기 — Stop Motion Studio 화면 짜임새를 그대로 따라요 (2026-10-29)
   · 편집 화면: 검은 바탕, 왼쪽 선 아이콘(뒤로·소리·더하기·이야기·설정) | 가운데 그림(아래 ◀▶·크게 보기) | 오른쪽(촬영·되돌리기·완성·재생)
     아래 필름: 컷 썸네일, 고른 컷은 테두리 + "23 / 159", 소리·효과가 시작하는 컷에 작은 표시
   · 촬영 화면(카메라 버튼): 카메라가 화면 가득, 왼쪽 반투명 막대(겹쳐보기·진하기·격자·고정),
     오른쪽(뒤로·찍는 방식·큰 빨간 찰칵·재생·카메라 설정), 위 가운데 "010 / 010"
   · 도구는 아래에서 뜨는 판: 왼쪽 ✕(취소) · 가운데 아이콘 탭 · 오른쪽 ✓(넣기), 아래에 고를 것들
   ========================================================= */
IC.share = '<path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/>';
IC.more = '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>';
IC.gear = '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>';
IC.sliders = '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>';
IC.prevf = '<path d="M7 5v14M18 5l-8 7 8 7z" fill="currentColor"/>';
IC.nextf = '<path d="M17 5v14M6 5l8 7-8 7z" fill="currentColor"/>';
IC.expand = '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>';
IC.check2 = '<path d="M5 12.5l4.5 4.5L19 7"/>';
IC.narr = '<rect x="5" y="3" width="6" height="11" rx="3"/><path d="M2 11a6 6 0 0 0 12 0M8 17v3M16 8h5M16 12h5M16 16h3"/>';
const ED = { open: false, cap: false, sel: null, sheet: null, tab: 'voice', pend: null, onion: true, grid: false, locked: false, raf: 0, cdT: null, autoOn: false, line: null, rec: null, fxSel: null, popOpen: false, pv: false, msel: null, paint: null, progT: 0 };
let EDel = {};
const edScene = () => { let s = P.scenes.find(s => s.id === S.curScene); if (!s) { s = P.scenes[P.scenes.length - 1]; S.curScene = s.id; } return s; };
const shotSet = () => S.shot || (S.shot = { delay: 0, auto: 0 });
const edFrames = () => P.scenes.reduce((a, s) => a + s.frames.length, 0);
function frameT(sc, i) {
  const r = TL().map[sc.id]; if (!r) return 0;
  const a = sc.trimIn, b = sc.frames.length - sc.trimOut;
  if (i < a || i >= b) return r.t0;
  return r.t0 + sc.frames.slice(a, i).reduce((s, f) => s + f.hold, 0) / P.fps;
}
function selFrame() { const s = ED.sel && P.scenes.find(x => x.id === ED.sel.sid); return s && s.frames[ED.sel.i] ? { s, f: s.frames[ED.sel.i], i: ED.sel.i } : null; }
function selNo() { if (!ED.sel) return 0; let n = 0; for (const x of P.scenes) { if (x.id === ED.sel.sid) return n + ED.sel.i + 1; n += x.frames.length; } return 0; }
/* 고른 컷이 없으면 맨 끝 컷 */
function edFixSel() {
  if (selFrame()) return;
  const sc = edScene();
  if (sc.frames.length) ED.sel = { sid: sc.id, i: sc.frames.length - 1 };
  else { const s = [...P.scenes].reverse().find(s => s.frames.length); ED.sel = s && sc.frames.length ? { sid: s.id, i: s.frames.length - 1 } : null; }
}
function edSetSel(sid, i) { ED.sel = { sid, i }; S.curScene = sid; const sf = selFrame(); if (sf) Player.t = frameT(sf.s, i); }

/* ---------- 열기 · 닫기 ---------- */
function openEditor(first) {
  show('studio');
  Object.assign(ED, { open: true, cap: false, sel: null, sheet: null, pend: null, fxSel: null, popOpen: false, msel: null, paint: null });
  S.sel = null; S.step = 'view'; histInit();   // undo()가 goStep(S.step)으로 화면만 새로 그려요
  const body = $('#stBody'); body.innerHTML = '';
  const cv = h('canvas', { class: 'stage', width: W, height: H });
  const sub = h('div', { class: 'guide', hidden: true }), empty = h('div', { class: 'ed-empty', hidden: true });
  const mon = h('div', { class: 'stage-wrap ed-mon' }, cv, sub, empty,
    h('div', { class: 'ed-step' },
      h('button', { type: 'button', 'aria-label': '앞 컷', html: icon('prevf'), onclick: () => edStep(-1) }),
      h('button', { type: 'button', 'aria-label': '뒤 컷', html: icon('nextf'), onclick: () => edStep(1) })),
    h('button', { class: 'ed-full', type: 'button', 'aria-label': '크게 보기', html: icon('expand'), onclick: () => { if (TL().total) playAll(); } }));
  const ib2 = (ic, label, onclick, cls = '') => h('button', { class: 'ei ' + cls, type: 'button', 'aria-label': label, title: label, onclick, html: icon(ic) });
  const playB = ib2('play', '재생', edTogglePlay);
  const left = h('div', { class: 'ed-rl' },
    ib2('back', '내 작품', edToGallery), ib2('mic', '소리', () => edSheet('sound')), ib2('plus', '더하기', e => edAddMenu(e.currentTarget)),
    ib2('help', '도움말', edHelp), ib2('gear', '설정', edSettings));
  const right = h('div', { class: 'ed-rr' },
    ib2('cam', '촬영', edCapOpen, 'cam'), ib2('undo', '되돌리기', undo), ib2('share', '완성', edFinish), playB);
  const label = h('div', { class: 'ed-label', hidden: true });
  const stage = h('div', { class: 'ed-stage' }, mon, label);
  const film = h('div', { class: 'ef' }), strip = h('div', { class: 'ed-strip list' }, film);
  const pop = h('div', { class: 'ed-pop', hidden: true });
  const root = h('div', { class: 'ed' }, left, stage, right, strip, pop);
  body.append(root);
  EDel = { root, cv, ctx: cv.getContext('2d'), sub, empty, mon, playB, stage, label, film, strip, pop };
  Player.attach(cv, { onTick: edTick, loop: true });
  strip.addEventListener('scroll', edStripScroll, { passive: true });
  Player.onState = on => { EDel.playB.innerHTML = icon(on ? 'pause' : 'play'); EDel.playB.classList.toggle('on', on); if (!on) edAfterPlay(); };
  edFixSel(); if (ED.sel) edSetSel(ED.sel.sid, ED.sel.i);
  edStrip(true);
  addEventListener('keydown', edKey);
  cancelAnimationFrame(ED.raf); edLoop();
  if (first === 'sound' || first === 'fx') edSheet(first);
  else if (!edFrames()) edCapOpen();
}
function edClose() {
  if (!ED.open) return;
  edCapClose(true); ED.open = false; Player.pause(); Player.onState = null; Player.attach(null); AE.stopPreview();
  if (ED.rec && ED.rec.active) ED.rec.stop(); Mic.release();
  cancelAnimationFrame(ED.raf); removeEventListener('keydown', edKey);
}
/* 예전 코드가 부르는 이름들 — 모두 편집기로 이어 줘요 */
function leaveStep() { edClose(); }
function openStudio(step) { if (!ED.open) openEditor(); goStep(step); }
function goStep(id) {
  if (!P) return;
  if (!ED.open) { openEditor(); return; }
  TLc = null; edFixSel(); edStrip();
  if (id === 'final') edFinish();
  else if (id === 'voice' || id === 'sound') { if (id === 'voice') ED.tab = 'voice'; if (ED.sheet !== 'sound') edSheet('sound'); }
  else if (id === 'edit') { if (ED.sheet !== 'fx') edSheet('fx'); }
  else if (id === 'shoot' && !ED.cap && !ED.sheet) edCapOpen();
}
function edKey(e) { if (e.target.closest('input,textarea,select')) return; if (ED.cap && (e.code === 'Space' || e.code === 'VolumeUp')) { e.preventDefault(); edShutter(); } else if (!ED.cap && e.code === 'ArrowLeft') edStep(-1); else if (!ED.cap && e.code === 'ArrowRight') edStep(1); }

/* ---------- 편집 화면 그리기 ---------- */
function edLoop() {
  if (!ED.open) return;
  ED.raf = requestAnimationFrame(edLoop);
  if (ED.cap) { edCapDraw(); return; }
  if (Player.playing) return;              // 재생·녹음 중에는 Player가 그려요
  if (ED.paint) { EDel.ctx.setTransform(1, 0, 0, 1, 0, 0); ED.paint(EDel.ctx); return; }   // 판에서 미리 보기 (컷 편집·제목 카드)
  const ctx = EDel.ctx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.shadowColor = 'transparent';
  const sf = selFrame();
  EDel.empty.hidden = !!sf;
  if (!sf) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); if (!EDel.empty.innerHTML) EDel.empty.innerHTML = icon('cam') + '<b>오른쪽 카메라 버튼을 눌러 첫 컷을 찍어요</b>'; return; }
  const trimmed = sf.i < sf.s.trimIn || sf.i >= sf.s.frames.length - sf.s.trimOut;
  if (trimmed) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); drawCover(ctx, sf.f.img); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = '30px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('잘라 낸 컷이에요', W / 2, H / 2); return; }
  renderAt(ctx, Player.t, {});
  if (ED.pv) return;
  const e = ED.fxSel && P.fx.find(x => x.id === ED.fxSel);
  if (e) { const et = absT(e); if (et != null && Player.t >= et && Player.t <= et + e.dur) { ctx.save(); ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(e.x * W, e.y * H, 90 * e.s, 0, 7); ctx.stroke(); ctx.restore(); } }
}

/* ---------- 필름 ---------- */
function edStrip(center) {
  if (!ED.open) return;
  const film = EDel.film; film.innerHTML = '';
  const total = edFrames(), multi = P.scenes.length > 1; let n = 0;
  // 소리·효과가 시작하는 컷 표시
  const mark = {};
  const put = (it, kind) => { const t = absT(it); if (t == null) return; const seg = segAt(t + .0001); if (seg) (mark[seg.f.id] = mark[seg.f.id] || new Set()).add(kind); };
  if (TL().total) { for (const v of P.voices) put(v, 'snd'); for (const v of P.narrs) put(v, 'snd'); for (const s of P.sfx) put(s, 'snd'); for (const e of P.fx) put(e, 'fx'); }
  P.scenes.forEach((s, k) => {
    if (multi || !s.frames.length) film.append(h('button', { class: 'ef-scn' + (s.id === S.curScene ? ' cur' : ''), type: 'button', 'aria-label': `${k + 1}번 장면 ${s.name}`, title: s.name, onclick: () => edSceneMenu(s) }, h('b', {}, String(k + 1)), s.bgm ? h('i', { html: icon('music') }) : ''));
    s.frames.forEach((f, i) => {
      n++;
      const trimmed = i < s.trimIn || i >= s.frames.length - s.trimOut;
      const sel = ED.sel && ED.sel.sid === s.id && ED.sel.i === i, m = mark[f.id];
      film.append(h('button', { class: 'ef-fr' + (sel ? ' sel' : '') + (trimmed ? ' cut' : '') + (inMsel(s, i) ? ' msel' : ''), type: 'button', 'data-fid': f.id, 'aria-label': `${n}번 컷`, onclick: () => edPick(s, i) },
        h('img', { src: f.url, alt: '' }),
        sel ? h('span', { class: 'cnt' }, `${n} / ${total}`) : '',
        m ? h('span', { class: 'mk', html: [...m].map(k => icon(k === 'fx' ? 'sparkle' : 'music')).join('') }) : '',
        f.hold !== P.hold ? h('em', { title: `${f.hold}번 보여 줘요` }, String(f.hold)) : ''));
    });
  });
  if (!total) film.append(h('div', { class: 'ef-none' }, '찍은 컷이 여기에 쌓여요'));
  requestAnimationFrame(() => { const el = $('.ef-fr.sel', film); if (el && center !== false) edScrollTo(el); });
  edPopPaint();
}
function edPick(s, i) {
  if (Player.playing) Player.pause();
  const same = ED.sel && ED.sel.sid === s.id && ED.sel.i === i;
  if (ED.msel && !same) { if (ED.msel.sid === s.id) ED.msel.b = i; else ED.msel = { sid: s.id, a: i, b: i }; }
  edSetSel(s.id, i); ED.popOpen = same ? !ED.popOpen : true;   // 다른 컷을 누르면 가운데로 오면서 메뉴가 떠요
  if (ED.sheet) edSheetRefresh(); edStrip(same ? false : true);
}
function edStep(d) {
  const all = []; for (const s of P.scenes) s.frames.forEach((f, i) => all.push([s, i]));
  if (!all.length) return;
  let k = all.findIndex(([s, i]) => ED.sel && s.id === ED.sel.sid && i === ED.sel.i); k = clamp((k < 0 ? all.length - 1 : k) + d, 0, all.length - 1);
  ED.popOpen = false; edSetSel(all[k][0].id, all[k][1]); if (ED.sheet) edSheetRefresh(); edStrip();
}
/* 필름을 손가락으로 밀면 가운데(주황 테두리)에 온 컷이 골라져요 */
function edScrollTo(el) { const st = EDel.strip; ED.progT = performance.now(); st.scrollLeft = el.offsetLeft - st.clientWidth / 2 + el.offsetWidth / 2; }
function edStripScroll() {
  if (performance.now() - ED.progT < 250 || Player.playing || ED.sheet) return;
  cancelAnimationFrame(ED.scrRaf);
  ED.scrRaf = requestAnimationFrame(() => {
    const st = EDel.strip, mid = st.scrollLeft + st.clientWidth / 2; let best = null, bd = 1e9;
    for (const el of $$('.ef-fr', EDel.film)) { const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = el; } }
    if (!best || best.classList.contains('sel')) return;
    let hit = null; for (const s of P.scenes) { const i = s.frames.findIndex(f => f.id === best.dataset.fid); if (i >= 0) { hit = [s, i]; break; } }
    if (!hit) return;
    edSetSel(hit[0].id, hit[1]);
    const old = $('.ef-fr.sel', EDel.film); if (old) { old.classList.remove('sel'); const c = $('.cnt', old); c && c.remove(); }
    best.classList.add('sel'); best.append(h('span', { class: 'cnt' }, `${selNo()} / ${edFrames()}`));
    if (ED.popOpen) { ED.popOpen = false; edPopPaint(); }
  });
}
/* 시간 t에 있는 컷을 골라요 */
function edSelectAt(t) { const seg = segAt(t); if (!seg) return false; ED.sel = { sid: seg.sc.id, i: seg.idx }; S.curScene = seg.sc.id; Player.t = clamp(t, 0, TL().total); ED.popOpen = false; edStrip(); return true; }

/* 컷을 누르면 뜨는 메뉴 — Stop Motion Studio처럼 아이콘 그리드 (p6b_sms.js의 edPopGrid) */
function edPopPaint() {
  const pop = EDel.pop; pop.innerHTML = '';
  if (!selFrame() || !ED.popOpen || ED.sheet) { pop.hidden = true; return; }
  edPopGrid(pop); pop.hidden = false;
}
function edSplit(s, i) {
  const cutT = s.frames.slice(s.trimIn, i).reduce((a, f) => a + f.hold, 0) / P.fps;
  const nb = { ...newScene(s.name + ' 2'), frames: s.frames.slice(i), trimOut: s.trimOut, bgm: s.bgm };
  s.frames = s.frames.slice(0, i); s.trimOut = 0;
  for (const k of ['fx', 'sfx', 'voices', 'narrs']) for (const it of P[k]) if (it.sid === s.id && it.off >= cutT) { it.sid = nb.id; it.off -= cutT; }
  P.scenes.splice(P.scenes.indexOf(s) + 1, 0, nb); changed(); ED.popOpen = false; edSetSel(nb.id, 0); edStrip(); toast('장면을 둘로 나눴어요');
}

/* ---------- 장면 ---------- */
function edSceneMenu(s) {
  const i = P.scenes.indexOf(s);
  modal((b, m) => {
    const ni = h('input', { class: 'input', value: s.name, maxlength: 30, 'aria-label': '장면 이름', oninput: e => { s.name = e.target.value; changed(); } });
    const go = fn => () => { m.close(); fn(); };
    b.append(h('h2', {}, `${i + 1}번 장면`), ni,
      h('div', { class: 'menu-grid' },
        h('button', { class: 'btn accent', type: 'button', onclick: go(() => { S.curScene = s.id; ED.sel = s.frames.length ? { sid: s.id, i: s.frames.length - 1 } : null; edCapOpen(); }), html: icon('cam') + '<span>이 장면 이어 찍기</span>' }),
        h('button', { class: 'btn', type: 'button', onclick: go(() => { const r = TL().map[s.id]; if (r && r.t1 > r.t0) { Player.seek(r.t0 + .001); edSelectAt(r.t0 + .001); } trimModal(() => edStrip()); }), html: icon('scissors') + '<span>앞뒤 자르기 · 빠르기</span>' }),
        h('button', { class: 'btn', type: 'button', onclick: go(() => sketchModal(s, edStrip)), html: icon('image') + '<span>스케치</span>' }),
        h('button', { class: 'btn', type: 'button', disabled: i === 0 || null, onclick: go(() => { [P.scenes[i - 1], P.scenes[i]] = [P.scenes[i], P.scenes[i - 1]]; changed(); edStrip(); }), html: icon('back') + '<span>앞으로</span>' }),
        h('button', { class: 'btn', type: 'button', onclick: go(() => { s.frames.reverse(); [s.trimIn, s.trimOut] = [s.trimOut, s.trimIn]; changed(); edStrip(); toast('장면을 거꾸로 돌렸어요', 1200); }), html: icon('pingpong') + '<span>거꾸로</span>' }),
        P.scenes.length > 1 ? h('button', { class: 'btn', type: 'button', onclick: go(async () => { if (!await confirmBox('장면을 지울까요?', `“${s.name}” 장면과 그 안의 컷·효과·소리가 함께 지워져요. 되돌리기로 살릴 수 있어요.`, '지우기', true)) return; P.scenes = P.scenes.filter(x => x !== s); for (const k of ['fx', 'sfx', 'voices', 'narrs']) P[k] = P[k].filter(it => it.sid !== s.id); if (S.curScene === s.id) S.curScene = P.scenes[P.scenes.length - 1].id; ED.sel = null; changed(); edFixSel(); if (ED.sel) edSetSel(ED.sel.sid, ED.sel.i); edStrip(); }), html: icon('trash') + '<span>지우기</span>' }) : ''),
      h('div', { class: 'acts' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { m.close(); edStrip(); } }, '닫기')));
  });
}
function edNewScene() {
  modal((b, m) => {
    const nn = `${P.scenes.length + 1}장면`;
    const ni = h('input', { id: 'newSceneName', value: nn, maxlength: 30 });
    const make = () => { m.close(); const s = newScene(ni.value.trim() || nn); P.scenes.push(s); S.curScene = s.id; ED.sel = null; changed(); edStrip(); edCapOpen(); toast(`“${s.name}” 촬영을 시작해요`, 1400); };
    ni.addEventListener('keydown', e => { if (e.key === 'Enter') make(); });
    b.append(h('h2', {}, '새 장면'), h('label', { class: 'field' }, h('span', { class: 'label' }, '장면 이름'), ni),
      h('div', { class: 'acts' }, h('button', { class: 'btn', type: 'button', onclick: m.close }, '취소'), h('button', { class: 'btn accent', type: 'button', onclick: make }, '만들고 찍기')));
  });
}
/* 더하기(+) 메뉴: 이미지 · 비디오 · 오디오 · 제목 카드 · 제작진 · 효과 · 새 장면 · 스케치 */
function edAddMenu(anchor) {
  const old = $('.ed-menu'); if (old) { old.remove(); return; }
  const it = (ic, label, fn) => h('button', { type: 'button', onclick: () => { menu.remove(); fn(); }, html: icon(ic) + `<span>${label}</span>` });
  const menu = h('div', { class: 'ed-menu' },
    it('image', '이미지 추가', edImport),
    it('video', '비디오', edImportVideo),
    it('music', '오디오', () => { ED.tab = 'sfx'; edSheet('sound'); }),
    it('titlecard', '제목 카드', () => edCard('title')),
    it('credits', '제작진', () => edCard('credits')),
    it('sparkle', '효과 넣기', () => edSheet('fx')),
    it('plus', '새 장면', edNewScene),
    it('book', '장면 스케치', () => sketchModal(edScene(), edStrip)));
  EDel.root.append(menu);
  const r = appRect(anchor), br = appRect(EDel.root);
  menu.style.left = (r.right - br.left + 6) + 'px'; menu.style.top = clamp(r.top - br.top - 10, 6, br.height - menu.offsetHeight - 6) + 'px';
  setTimeout(() => { const away = e => { if (!menu.contains(e.target)) { menu.remove(); removeEventListener('pointerdown', away, true); } }; addEventListener('pointerdown', away, true); }, 0);
}
async function edImport() { const f = await pickImages({ multiple: true }); for (const x of f) { const b = await fileToFrameBlob(x); b && await edAddFrame(b); } if (f.length) { toast(`사진 ${f.length}장을 넣었어요`); if (!ED.cap) edStrip(); } }

/* ---------- 재생 ---------- */
function edTogglePlay() {
  if (Player.playing) { Player.pause(); return; }
  if (!TL().total) { toast('먼저 몇 컷을 찍어 보세요'); return; }
  const sf = selFrame(); if (!sf || (sf.s === P.scenes[P.scenes.length - 1] && sf.i === sf.s.frames.length - 1)) Player.t = 0;
  ED.popOpen = false; edPopPaint(); Player.play();
}
function edTick(t) {
  if (!ED.open || !Player.playing) return;
  const seg = segAt(t); if (!seg) return;
  const el = $(`.ef-fr[data-fid="${seg.f.id}"]`, EDel.film);
  const prev = $('.ef-fr.play', EDel.film); if (prev !== el) { prev && prev.classList.remove('play'); if (el) { el.classList.add('play'); edScrollTo(el); } }
}
function edAfterPlay() {
  if (!ED.open) return;
  const prev = $('.ef-fr.play', EDel.film); prev && prev.classList.remove('play');
  if (ED.rec && ED.rec.active) return;
  edSelectAt(Math.min(Player.t, TL().total - .001)); if (ED.sheet) edSheetRefresh();
}

/* =========================================================
   촬영 화면 — 카메라가 화면 가득
   ========================================================= */
function edCapOpen() {
  if (!ED.open) return;
  if (Player.playing) Player.pause();
  if (ED.sheet) edSheetClose();
  ED.cap = true; ED.popOpen = false; edPopPaint();
  const cv = h('canvas', { class: 'stage', width: W, height: H });
  const flash = h('div', { class: 'flash' }), cd = h('div', { class: 'countdown', hidden: true }), nocam = h('div', { class: 'nocam', hidden: true });
  const sketch = h('button', { class: 'mon-sketch', type: 'button', hidden: true, 'aria-label': '장면 스케치 크게 보기', onclick: () => sketchModal(edScene(), edCapPaint) });
  const counter = h('div', { class: 'cp-cnt' });
  const tb = (ic, label, onclick, cls = '') => h('button', { class: 'ci ' + cls, type: 'button', 'aria-label': label, title: label, onclick, html: icon(ic) });
  const onionB = tb('onion', '겹쳐보기', () => { ED.onion = !ED.onion; onionB.classList.toggle('on', ED.onion); }, ED.onion ? 'on' : '');
  const gridB = tb('grid', '격자', () => { ED.grid = !ED.grid; gridB.classList.toggle('on', ED.grid); }, ED.grid ? 'on' : '');
  const lockB = tb('camlock', '밝기·초점 고정', async () => { await edLock(!ED.locked); lockB.classList.toggle('on', ED.locked); }, ED.locked ? 'on' : '');
  const slider = h('input', { class: 'cp-sl', type: 'range', min: .15, max: .8, step: .05, value: S.onionA || .42, 'aria-label': '겹쳐 보기 진하기', oninput: e => { S.onionA = +e.target.value; } });
  const leftBar = h('div', { class: 'cp-bar' }, onionB, slider, gridB, lockB);
  const mode = h('button', { class: 'cp-mode', type: 'button', 'aria-label': '찍는 방식', onclick: () => edCamSet() });
  const shutter = h('button', { class: 'cp-shut', type: 'button', 'aria-label': '촬영', onclick: edShutter }, h('span', { class: 'in' }));
  const pvB = tb('play', '찍은 것 보기', edCapPreview, 'dark');
  const right = h('div', { class: 'cp-r' }, tb('back', '편집으로', () => edCapClose(), 'dark'), mode, shutter, pvB, tb('sliders', '카메라 설정', edCamSet, 'dark'));
  const wrap = h('div', { class: 'cp-mon' }, cv, flash, cd, nocam, sketch);
  const cap = h('div', { class: 'cp' }, wrap, leftBar, right, counter);
  EDel.root.append(cap); EDel.root.classList.add('capturing');
  Object.assign(EDel, { cap, ccv: cv, cctx: cv.getContext('2d'), flash, cd, nocam, sketch, counter, shutter, mode, pvB });
  edCapPaint(); edShutterPaint();
  edCamStart();
}
function edCapClose(silent) {
  if (!ED.cap) return;
  edStopTimer(); ED.cap = false; ED.pv = false; Cam.stop(); ED.locked = false;
  if (EDel.cap) EDel.cap.remove(); if (EDel.root) EDel.root.classList.remove('capturing');
  if (!silent && ED.open) { edFixSel(); if (ED.sel) edSetSel(ED.sel.sid, ED.sel.i); edStrip(); }
}
/* 찍으면 들어갈 자리: 고른 컷 바로 뒤 (없으면 지금 장면 끝) */
function capSpot() { const sf = selFrame(); if (sf) return { s: sf.s, at: sf.i + 1 }; const s = edScene(); return { s, at: s.frames.length }; }
function edCapPaint() {
  if (!ED.cap) return;
  const sp = capSpot();
  let before = 0; for (const x of P.scenes) { if (x === sp.s) break; before += x.frames.length; }
  EDel.counter.textContent = `${String(before + sp.at).padStart(3, '0')} / ${String(edFrames()).padStart(3, '0')}`;
  const s = shotSet(); EDel.mode.textContent = `×${P.hold}` + (s.auto ? ` · ${s.auto}초마다` : s.delay ? ` · ${s.delay}초` : '');
  const sk = sp.s.sketch; EDel.sketch.hidden = !sk; if (sk) EDel.sketch.style.backgroundImage = `url(${sk.url})`;
}
async function edCamStart() {
  EDel.nocam.hidden = true;
  const ok = await Cam.start();
  if (!ok && ED.cap) edNoCam();
}
function edNoCam() {
  const n = EDel.nocam; n.hidden = false; n.innerHTML = '';
  const denied = Cam.reason === 'NotAllowedError';
  n.append(h('span', { html: icon('cam'), style: { width: '40px', height: '40px', color: '#CF5D2A' } }),
    h('b', {}, denied ? '카메라 사용이 막혀 있어요' : '이 화면에서는 실시간 카메라를 켤 수 없어요'),
    h('p', {}, denied ? '주소창 옆 자물쇠(또는 설정)에서 카메라를 허용한 뒤 다시 시도를 눌러 주세요. 그동안 빨간 찰칵을 누르면 폰 카메라 앱으로 한 컷씩 찍어요.'
      : '빨간 찰칵을 누르면 폰의 카메라 앱이 열려요. 한 장 찍을 때마다 한 컷이 쌓여요.'),
    h('div', { class: 'row', style: { justifyContent: 'center' } },
      ib('image', '사진 여러 장 불러오기', 'btn sm', { onclick: edImport }),
      ib('rotR', '다시 시도', 'btn sm ghost', { style: { color: '#fff' }, onclick: edCamStart })));
}
function edCapDraw() {
  const ctx = EDel.cctx; if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const sp = capSpot();
  if (ED.pv) {
    const fr = sp.s.frames, tot = fr.reduce((a, f) => a + f.hold, 0);
    if (tot) { const k = Math.floor((performance.now() - ED.pvT) / 1000 * P.fps) % tot; let acc = 0, f = fr[0]; for (const x of fr) { if (k < acc + x.hold) { f = x; break; } acc += x.hold; } drawCover(ctx, f.img); return; }
    ED.pv = false;
  }
  if (Cam.video && Cam.stream && Cam.video.videoWidth) drawCam(ctx, Cam.video);
  else if (sp.s.frames[sp.at - 1]) drawCover(ctx, sp.s.frames[sp.at - 1].img);
  if (ED.onion && Cam.stream) {
    const oa = S.onionA || .42, p1 = sp.s.frames[sp.at - 1], p2 = sp.s.frames[sp.at - 2];
    if (p2) { ctx.globalAlpha = oa * .5; drawCover(ctx, p2.img); }
    if (p1) { ctx.globalAlpha = oa; drawCover(ctx, p1.img); }
    ctx.globalAlpha = 1;
  }
  if (ED.grid) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const x of [W / 3, W * 2 / 3]) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (const y of [H / 3, H * 2 / 3]) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke(); }
}
function edCapPreview() { if (!capSpot().s.frames.length) { toast('먼저 몇 컷을 찍어 보세요'); return; } ED.pv = !ED.pv; ED.pvT = performance.now(); EDel.pvB.innerHTML = icon(ED.pv ? 'stop' : 'play'); }
function edShutterPaint() { const sh = EDel.shutter; if (!sh || !ED.cap) return; const run = ED.autoOn || !!ED.cdT; sh.classList.toggle('run', run); sh.setAttribute('aria-label', ED.autoOn ? '자동 촬영 멈추기' : ED.cdT ? '타이머 취소' : '촬영'); }
function edShutter() {
  if (!ED.cap) { edCapOpen(); return; }
  if (ED.autoOn || ED.cdT) { const was = ED.autoOn; edStopTimer(); if (was) toast('자동 촬영을 멈췄어요', 1200); return; }
  if (ED.pv) edCapPreview();
  const s = shotSet();
  if ((!s.delay && !s.auto) || !Cam.stream) { edCapture(); return; }
  ED.autoOn = !!s.auto; edCountdown();
}
function edCountdown() {
  let n = shotSet().auto || shotSet().delay;
  const tick = () => {
    if (!ED.cap) return;
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
  const sp = capSpot(), f = { id: uid(), hold: P.hold, blob, ...loadImg(blob) };
  insFrames(sp.s, sp.at, [f]); ED.sel = { sid: sp.s.id, i: sp.at }; S.curScene = sp.s.id;
  changed(); edCapPaint(); if (!ED.cap) { edSetSel(sp.s.id, sp.at); edStrip(); }
}
/* 카메라 설정 말풍선 (촬영 화면 오른쪽 아래) */
function edCamSet() {
  const old = $('.ed-cpop'); if (old) { old.remove(); return; }
  const box = h('div', { class: 'ed-cpop' });
  const seg = (vals, cur, set) => h('div', { class: 'seg' }, ...vals.map(([v, l]) => h('button', { type: 'button', class: cur() === v ? 'on' : '', onclick: e => { set(v); [...e.target.parentElement.children].forEach(b => b.classList.toggle('on', b === e.target)); edCapPaint(); } }, l)));
  const row = (label, ctl) => h('div', { class: 'cp-row' }, h('span', {}, label), ctl);
  const timerVal = () => { const s = shotSet(); return s.auto ? 'a' + s.auto : 'd' + s.delay; };
  box.append(
    row('카메라', h('button', { class: 'btn sm', type: 'button', onclick: async () => { if (Cam.failed) { edCamStart(); return; } if (!(await Cam.next())) toast('바꿀 수 있는 다른 카메라가 없어요'); else ED.locked = false; }, html: icon('switchCam') + '<span>앞·뒤 바꾸기</span>' })),
    row('한 번에 찍기', seg([[1, '1컷'], [2, '2'], [3, '3'], [4, '4']], () => P.hold, v => { P.hold = v; changed(); })),
    row('타이머', seg([['d0', '끔'], ['d3', '3초'], ['d5', '5초'], ['a2', '2초마다'], ['a3', '3초마다']], timerVal, v => { edStopTimer(); const n = +v.slice(1); Object.assign(shotSet(), v[0] === 'a' ? { delay: 0, auto: n } : { delay: n, auto: 0 }); })),
    row('사진 불러오기', ib('image', '앨범', 'btn sm', { onclick: () => { box.remove(); edImport(); } })));
  EDel.cap.append(box);
  setTimeout(() => { const away = e => { if (!box.contains(e.target) && !e.target.closest('.cp-mode,[aria-label="카메라 설정"]')) { box.remove(); removeEventListener('pointerdown', away, true); } }; addEventListener('pointerdown', away, true); }, 0);
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

/* =========================================================
   아래에서 뜨는 도구 판 — ✕ 취소 · 가운데 아이콘 탭 · ✓ 넣기
   ========================================================= */
const SHEET_TABS = {
  sound: [['voice', 'mic', '대사'], ['sfx', 'speaker', '효과음'], ['bgm', 'music', '배경음악'], ['narr', 'narr', '내레이션'], ['mix', 'sliders', '소리 크기']],
  fx: [['fx', 'sparkle', '효과']]
};
function edSheet(kind) {
  if (!ED.open) return;
  if (ED.cap) edCapClose();
  if (!TL().total) { toast('먼저 몇 컷을 찍어 주세요. 소리와 효과는 찍은 컷 위에 넣어요', 2600); return; }
  if (ED.sheet === kind) { edSheetClose(); return; }
  edSheetClose(true);
  edFixSel(); if (ED.sel) edSetSel(ED.sel.sid, ED.sel.i);
  ED.sheet = kind; ED.pend = null; ED.popOpen = false; edPopPaint();
  if (kind === 'fx') ED.tab = 'fx'; else if (!SHEET_TABS.sound.some(t => t[0] === ED.tab)) ED.tab = 'voice';
  const el = h('div', { class: 'bs' });
  EDel.root.append(el); EDel.sheetEl = el; EDel.root.classList.add('has-sheet');
  edSheetRefresh();
  if (kind === 'fx') edFxDrag(true);
}
function edSheetClose(quiet) {
  if (ED.sheetCancel) { const f = ED.sheetCancel; ED.sheetCancel = null; f(); }
  ED.paint = null; EDel.sheetRender = null;
  if (ED.rec && ED.rec.active) ED.rec.stop();
  AE.stopPreview(); ED.pv = false;
  if (EDel.sheetEl) EDel.sheetEl.remove(); EDel.sheetEl = null;
  if (EDel.root) EDel.root.classList.remove('has-sheet');
  if (EDel.label) EDel.label.hidden = true;
  if (EDel.sub) EDel.sub.hidden = true;
  ED.sheet = null; ED.pend = null; ED.fxSel = null; S.sel = null; edFxDrag(false);
  if (!quiet && ED.open) edStrip(false);
}
function edSheetRefresh() {
  const el = EDel.sheetEl; if (!el || ED.sheet === 'custom') return;
  el.innerHTML = '';
  const tabs = SHEET_TABS[ED.sheet];
  const cur = tabs.find(t => t[0] === ED.tab) || tabs[0];
  EDel.label.hidden = false; EDel.label.textContent = cur[2];
  const head = h('div', { class: 'bs-head' },
    h('button', { class: 'bs-x', type: 'button', 'aria-label': '취소', html: icon('x'), onclick: () => edSheetClose() }),
    h('div', { class: 'bs-tabs' }, ...tabs.map(([k, ic, l]) => h('button', { type: 'button', class: k === ED.tab ? 'on' : '', 'aria-label': l, title: l, html: icon(ic), onclick: () => { if (ED.rec && ED.rec.active) ED.rec.stop(); AE.stopPreview(); ED.tab = k; ED.pend = null; S.sel = null; edSheetRefresh(); } }))),
    h('button', { class: 'bs-ok', type: 'button', 'aria-label': '넣기', html: icon('check2'), onclick: edSheetOk }));
  const row = h('div', { class: 'bs-row list' }), foot = h('div', { class: 'bs-foot' });
  el.append(head, row, foot);
  ({ voice: bsVoice, sfx: bsSfx, bgm: bsBgm, narr: bsNarr, mix: bsMix, fx: bsFx })[cur[0]](row, foot);
}
/* ✓: 고른 것을 지금 컷에 넣고 닫아요 */
function edSheetOk() {
  const p = ED.pend;
  if (p && p.kind === 'sfx') { const s = { id: uid(), snd: p.id, vol: 1 }; setAbs(s, Player.t); P.sfx.push(s); changed(); toast(`${SFX.find(x => x.id === p.id).name} 효과음을 넣었어요`, 1300); }
  else if (p && p.kind === 'bgm') { const sc = sceneAt(Player.t); sc.bgm = p.id; changed(); toast(p.id ? `“${sc.name}”에 음악을 넣었어요` : '음악을 뺐어요', 1300); }
  else if (p && p.kind === 'fx') { const full = FULLSCREEN_FX[p.id]; const e = { id: uid(), type: p.id, x: .5, y: full ? .5 : .45, s: 1, dur: full ? 4 : 2, text: p.id === 'text' ? '앗!' : p.id === 'boom' ? '쾅!' : undefined }; setAbs(e, Player.t); P.fx.push(e); changed(); toast(`${FX.find(f => f.id === p.id).name} 효과를 넣었어요`, 1300); }
  edSheetClose();
}
const tile = (ic, label, sub, on, onclick, color) => { const t = h('button', { class: 'bt' + (on ? ' on' : ''), type: 'button', 'aria-label': label, onclick }, h('span', { class: 'ti', html: icon(ic) }), h('b', {}, label), sub ? h('small', {}, sub) : ''); if (color) t.style.setProperty('--tc', color); return t; };
/* 지금 컷에 들어 있는 것 (지우기) */
function hereChips(foot, list, name, del) {
  const t = Player.t, here = list.filter(it => { const at = absT(it); return at != null && Math.abs(at - t) < .5 / P.fps + .001 || (at != null && t >= at && t < at + (it.dur || .5)); });
  for (const it of here) foot.append(h('span', { class: 'bs-chip' }, name(it), h('button', { type: 'button', 'aria-label': '지우기', html: icon('x'), onclick: () => { del(it); changed(); edSheetRefresh(); } })));
}
function bsSfx(row, foot) {
  AE.init(); Promise.all(SFX.map(s => AE.getSfx(s.id))).catch(() => { });
  for (const s of SFX) row.append(tile(SFX_IC[s.id] || 'speaker', s.name, '', ED.pend && ED.pend.id === s.id, () => { ED.pend = { kind: 'sfx', id: s.id }; AE.playPreview('sfx', s.id); edSheetRefresh(); }, TC.sfx));
  foot.append(h('span', { class: 'bs-tip' }, ED.pend ? '✓를 누르면 지금 컷에 넣어요' : '눌러서 들어 보고 ✓로 넣어요'));
  hereChips(foot, P.sfx, s => SFX.find(x => x.id === s.snd).name, s => { P.sfx = P.sfx.filter(x => x !== s); });
}
function bsBgm(row, foot) {
  const sc = sceneAt(Player.t), cur = ED.pend && ED.pend.kind === 'bgm' ? ED.pend.id : sc.bgm;
  row.append(tile('mute', '음악 없음', '', !cur, () => { ED.pend = { kind: 'bgm', id: null }; AE.stopPreview(); edSheetRefresh(); }, TC.bgm));
  for (const b of BGM) row.append(tile('music', b.name, b.desc, cur === b.id, () => { ED.pend = { kind: 'bgm', id: b.id }; AE.playPreview('bgm', b.id); edSheetRefresh(); }, TC.bgm));
  foot.append(h('span', { class: 'bs-tip' }, `${P.scenes.indexOf(sc) + 1}. ${sc.name}의 음악`),
    h('button', { class: 'bs-btn', type: 'button', onclick: () => { const id = cur || null; P.scenes.forEach(s => s.bgm = id); changed(); toast('모든 장면에 같은 음악을 넣었어요', 1500); edSheetClose(); } }, '모든 장면에'));
}
function bsFx(row, foot) {
  let pvRaf = 0;
  for (const f of FX) row.append(tile(FX_IC[f.id] || 'sparkle', f.name, '', ED.pend && ED.pend.id === f.id, () => {
    ED.pend = { kind: 'fx', id: f.id }; edSheetRefresh();
    cancelAnimationFrame(pvRaf); ED.pv = true; const t0 = performance.now(), D = 1.8;
    const loop = () => { const lt = (performance.now() - t0) / 1000; if (lt > D || ED.sheet !== 'fx') { ED.pv = false; return; } Player.draw(); drawFx(EDel.ctx, { id: 'pv' + f.id, type: f.id, x: .5, y: .45, s: 1, dur: D, text: f.id === 'text' ? '앗!' : f.id === 'boom' ? '쾅!' : undefined }, lt); pvRaf = requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }, TC.fx));
  const e = ED.fxSel && P.fx.find(x => x.id === ED.fxSel);
  if (e) {
    foot.append(h('b', { class: 'bs-tip' }, FX.find(f => f.id === e.type).name),
      h('label', { class: 'bs-sl' }, '크기', h('input', { type: 'range', min: .4, max: 2.5, step: .05, value: e.s, oninput: ev => { e.s = +ev.target.value; }, onchange: changed })),
      h('label', { class: 'bs-sl' }, '시간', h('input', { type: 'range', min: .5, max: 8, step: .1, value: e.dur, oninput: ev => { e.dur = +ev.target.value; }, onchange: changed })),
      (e.type === 'text' || e.type === 'boom') ? h('input', { class: 'bs-in', value: e.text || '', maxlength: 12, 'aria-label': '글자', oninput: ev => { e.text = ev.target.value; }, onchange: changed }) : '',
      h('button', { class: 'bs-btn red', type: 'button', onclick: () => { P.fx = P.fx.filter(x => x !== e); ED.fxSel = null; changed(); edSheetRefresh(); } }, '지우기'));
  } else {
    foot.append(h('span', { class: 'bs-tip' }, ED.pend ? '✓를 누르면 지금 컷에 넣어요' : '눌러서 미리 보고 ✓로 넣어요 · 넣은 효과는 화면에서 눌러 옮겨요'));
    hereChips(foot, P.fx, x => FX.find(f => f.id === x.type).name, x => { P.fx = P.fx.filter(y => y !== x); });
  }
}
function edFxDrag(on) {
  const cv = EDel.cv; if (!cv) return;
  if (!on) { cv.onpointerdown = cv.onpointermove = cv.onpointerup = cv.onpointercancel = null; return; }
  let drag = null;
  const rel = e => { const r = appRect(cv), p = appPt(e); return { x: (p.x - r.left) / r.width, y: (p.y - r.top) / r.height }; };
  cv.onpointerdown = e => {
    if (ED.sheet !== 'fx') return;
    const p = rel(e), t = Player.t; let hit = null, best = 1e9;
    for (const fx of P.fx) { const et = absT(fx); if (et == null || t < et || t > et + fx.dur) continue; const d = Math.hypot((p.x - fx.x) * W, (p.y - fx.y) * H); if (d < 110 * fx.s && d < best) { best = d; hit = fx; } }
    ED.fxSel = hit ? hit.id : null; edSheetRefresh();
    if (hit) { cv.setPointerCapture(e.pointerId); drag = { fx: hit, dx: p.x - hit.x, dy: p.y - hit.y }; }
  };
  cv.onpointermove = e => { if (!drag) return; const p = rel(e); drag.fx.x = clamp(p.x - drag.dx, 0, 1); drag.fx.y = clamp(p.y - drag.dy, 0, 1); };
  cv.onpointerup = cv.onpointercancel = () => { if (drag) { drag = null; changed(); } };
}
function bsVoice(row, foot) {
  const ls = P.script || [], voiceOf = l => P.voices.find(v => v.lineId === l.id), on = ED.rec && ED.rec.active;
  if (!ls.length) {
    // 대사가 없으면 여기서 바로 한 줄 써요 (누가 · 무슨 말)
    const who = h('input', { class: 'bs-in who', placeholder: '누가', maxlength: 12, 'aria-label': '말하는 사람' });
    const txt = h('input', { class: 'bs-in', placeholder: '무슨 말을 할까요?', maxlength: 80, 'aria-label': '대사' });
    const add = () => { if (!txt.value.trim()) { txt.focus(); return; } P.script = [{ id: uid(), who: who.value.trim(), text: txt.value.trim(), scene: edScene().id }]; P.scriptMode = 'new'; changed(); edSheetRefresh(); };
    txt.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
    row.append(h('div', { class: 'bs-none' }, '녹음할 대사를 먼저 써요'), who, txt);
    foot.append(h('button', { class: 'bs-btn or', type: 'button', onclick: add }, '대사 넣기'));
    return;
  }
  if (!ED.line || !ls.includes(ED.line)) ED.line = ls.find(l => !voiceOf(l)) || ls[0];
  ls.forEach((l, i) => { const v = voiceOf(l);
    const t = h('button', { class: 'bt line' + (l === ED.line ? ' on' : '') + (v ? ' ok' : ''), type: 'button', disabled: on || null, 'aria-label': `${i + 1}번 대사 ${l.who}`, onclick: () => { ED.line = l; if (v) edSelectAt(absT(v)); else { const s2 = P.scenes.find(s => s.id === l.scene); const rr = s2 && TL().map[s2.id]; if (rr && rr.t1 > rr.t0) edSelectAt(rr.t0 + .001); } edSheetRefresh(); } },
      h('span', { class: 'ln' }, v ? '✓' : String(i + 1)), h('b', {}, l.who || '?'), h('small', {}, l.text || '(빈 대사)'));
    row.append(t); });
  requestAnimationFrame(() => { const o = $('.bt.on', row); if (o) row.scrollLeft = o.offsetLeft - 20; });
  const v = voiceOf(ED.line);
  foot.append(
    h('button', { class: 'bs-rec' + (on ? ' run' : ''), type: 'button', 'aria-label': on ? '녹음 멈추기' : v ? '다시 녹음' : '녹음', onclick: recVoice, html: icon(on ? 'stop' : 'mic') + `<span>${on ? '멈추기' : v ? '다시 녹음' : '녹음'}</span>` }),
    h('button', { class: 'bs-btn', type: 'button', disabled: !v || on || null, onclick: () => { Player.seek(absT(v)); Player.play({ until: absT(v) + v.dur + .2 }); } }, '듣기'),
    h('button', { class: 'bs-btn', type: 'button', disabled: on || null, onclick: () => uploadAudio('voices', ED.line, () => edSheetRefresh(), Mic.failed) }, '파일'),
    v ? h('button', { class: 'bs-btn red', type: 'button', disabled: on || null, onclick: () => { P.voices = P.voices.filter(x => x !== v); changed(); edSheetRefresh(); } }, '지우기') : '',
    h('span', { class: 'bs-tip' }, on ? '말하고 나서 멈추기를 눌러요' : '지금 컷부터 영상이 흐르며 녹음돼요'));
  async function recVoice() {
    if (ED.rec && ED.rec.active) { ED.rec.stop(); return; }
    const line = ED.line;
    ED.rec = recordFlow({ kind: 'voices', wrap: EDel.mon, line, onState: recState, onDone: () => {
      const nx = ls.slice(ls.indexOf(line) + 1).find(l => !P.voices.some(v => v.lineId === l.id));
      if (nx) { ED.line = nx; toast('녹음했어요! 다음 대사로 넘어갔어요', 1600); } else toast('대사를 다 녹음했어요! 이제 효과음·배경음악을 넣거나 오른쪽 완성을 눌러요', 3600, true);
      edSelectAt(Math.min(Player.t, TL().total - .001)); edSheetRefresh(); } });
    await ED.rec.start();
  }
}
function recState(s) {
  if (s === 'rec') { const l = ED.tab === 'voice' ? ED.line : null; const txt = l ? l.text : P.narrText; if (txt) { EDel.sub.hidden = false; EDel.sub.innerHTML = ''; EDel.sub.append(h('small', {}, l ? l.who : '내레이션'), txt); } }
  else EDel.sub.hidden = true;
  edSheetRefresh();
}
function bsNarr(row, foot) {
  const on = ED.rec && ED.rec.active;
  row.append(h('textarea', { class: 'bs-ta', rows: 2, placeholder: '읽을 글을 써 두면 녹음할 때 화면에 보여 줘요', 'aria-label': '내레이션 글', oninput: e => { P.narrText = e.target.value; }, onchange: changed }, P.narrText || ''));
  foot.append(
    h('button', { class: 'bs-rec' + (on ? ' run' : ''), type: 'button', 'aria-label': on ? '녹음 멈추기' : '내레이션 녹음', html: icon(on ? 'stop' : 'mic') + `<span>${on ? '멈추기' : '녹음'}</span>`, onclick: async () => {
      if (ED.rec && ED.rec.active) { ED.rec.stop(); return; }
      ED.rec = recordFlow({ kind: 'narrs', wrap: EDel.mon, line: null, onState: recState, onDone: () => { edSelectAt(Math.min(Player.t, TL().total - .001)); edSheetRefresh(); toast('내레이션을 넣었어요'); } });
      await ED.rec.start(); } }),
    h('button', { class: 'bs-btn', type: 'button', disabled: on || null, onclick: () => uploadAudio('narrs', null, () => edSheetRefresh(), Mic.failed) }, '파일'));
  hereChips(foot, P.narrs, n => `내레이션 ${n.dur.toFixed(1)}초`, n => { P.narrs = P.narrs.filter(x => x !== n); });
}
function bsMix(row) {
  const sl = (k, label) => h('label', { class: 'bs-sl v' }, label, h('input', { type: 'range', min: 0, max: 1.5, step: .05, value: P.mix[k], 'aria-label': label + ' 크기', oninput: e => { P.mix[k] = +e.target.value; applyMix(); }, onchange: changed }));
  row.append(sl('bgm', '음악'), sl('sfx', '효과음'), sl('voice', '대사'), sl('narr', '내레이션'),
    h('label', { class: 'toggle bs-tg' }, h('input', { type: 'checkbox', checked: P.duck, onchange: e => { P.duck = e.target.checked; changed(); } }), '말할 때 음악 작게'));
}

/* ---------- 도움말(?) — 아이콘이 무엇을 하는지 ---------- */
function edHelp() {
  if (ED.sheet) edSheetClose();
  const rows = [['cam', '촬영', '카메라 화면을 열어 한 컷씩 찍어요. 찍은 컷은 고른 컷 바로 뒤에 들어가요.'], ['play', '재생', '지금까지 만든 영화를 틀어 봐요.'],
    ['mic', '소리', '대사 녹음 · 효과음 · 배경음악 · 내레이션을 넣어요.'], ['plus', '더하기', '사진 · 비디오 · 오디오 · 제목 카드 · 효과 · 새 장면'],
    ['gear', '설정', '빠르기 · 페이드 · 전경 · 효과 · 품질'], ['undo', '되돌리기', '방금 한 일을 취소해요.'], ['share', '완성', '영상 파일로 저장하거나 보내요.']];
  modal((b, m) => {
    b.classList.add('wide');
    b.append(h('h2', {}, '이렇게 만들어요'),
      h('div', { class: 'help-l' }, ...rows.map(([ic, t, d]) => h('div', { class: 'help-r' }, h('i', { html: icon(ic) }), h('b', {}, t), h('span', {}, d)))),
      h('p', { class: 'hint' }, '아래 필름에서 컷을 누르면 복사 · 붙여넣기 · 거꾸로 · 지우기 같은 메뉴가 나와요.'),
      h('div', { class: 'acts' }, h('button', { class: 'btn primary', type: 'button', onclick: m.close }, '알겠어요')));
  });
}

/* ---------- 설정(⚙): 아래 판 — 속도 · 페이드 · 전경 · 효과 · 품질 · 재생 · 기타 (p6b_sms.js) ---------- */
function edSettings() { smsSettings(); }

/* ---------- 완성: 처음부터 보기 · 영상 파일 · 작품 파일 ---------- */
function edFinish() {
  if (Player.playing) Player.pause();
  if (ED.sheet) edSheetClose();
  if (!TL().total) { toast('먼저 몇 컷을 찍어 보세요'); return; }
  modal((b, m) => {
    const big = (ic, label, sub, onclick, cls = '') => h('button', { class: 'fin-b ' + cls, type: 'button', onclick, html: `${icon(ic)}<b>${label}</b><small>${sub}</small>` });
    b.append(h('div', { class: 'fin-head' }, h('h2', {}, '완성!'),
        h('input', { class: 'input', value: P.title, maxlength: 40, 'aria-label': '영상 제목', oninput: e => { P.title = e.target.value; changed(); } }),
        h('button', { class: 'pn-x', type: 'button', 'aria-label': '닫기', html: icon('x'), onclick: m.close })),
      h('p', { class: 'hint', style: { margin: 0 } }, `장면 ${P.scenes.length} · 컷 ${edFrames()} · ${fmt(TL().total).replace(/\.\d$/, '')} · 대사 ${P.voices.length} · 효과음 ${P.sfx.length} · 효과 ${P.fx.length}`),
      h('div', { class: 'fin-grid' },
        big('play', '처음부터 보기', '크게 틀어 봐요', () => { m.close(); playAll(); }),
        big('download', '영상 파일', 'mp4로 저장 · 보내기', () => { m.close(); exportVideo(); }, 'or'),
        big('save', '작품 파일', '백업 · 다른 기기로', async () => { m.close(); await saveProject(); const d = await DB.get(P.id).catch(() => null); d ? exportProjectFile(d) : toast('먼저 저장이 되어야 해요'); })));
  }, { wide: true });
}
