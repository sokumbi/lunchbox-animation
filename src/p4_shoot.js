/* =========================================================
   촬영 — 카메라 전용. 왼쪽에 컷이 쌓이고, 오른쪽에 촬영 버튼
   ========================================================= */
const Cam = {
  stream: null, video: null, devices: [], di: -1, failed: false, reason: '',
  async start() {
    if (this.stream) return true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { this.failed = true; this.reason = 'insecure'; return false; }
    try {
      const dev = this.devices[this.di];
      const v = dev ? { deviceId: { exact: dev.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: { ideal: 'environment' } };
      this.stream = await navigator.mediaDevices.getUserMedia({ video: v, audio: false });
      this.video = this.video || h('video', { playsinline: true, muted: true, autoplay: true });
      this.video.setAttribute('playsinline', ''); this.video.muted = true; this.video.srcObject = this.stream; await this.video.play().catch(() => { });
      try { this.devices = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput'); } catch (e) { }
      if (this.di < 0) { const id = this.stream.getVideoTracks()[0]?.getSettings?.().deviceId; this.di = Math.max(0, this.devices.findIndex(d => d.deviceId === id)); }
      this.failed = false; return true;
    } catch (e) { this.failed = true; this.reason = e && e.name; this.stream = null; return false; }
  },
  stop() { if (this.stream) this.stream.getTracks().forEach(t => t.stop()); this.stream = null; },
  async next() { if (this.devices.length < 2) return false; this.stop(); this.di = (this.di + 1) % this.devices.length; return this.start(); }
};

/* 폰을 세로 고정한 채 옆으로 들면 카메라 영상이 세로로 들어와요. 앱을 돌려 보여 줄 때는 영상도 같이 돌려요. */
function drawCam(ctx, v) {
  if (ROT.on && v.videoHeight > v.videoWidth) {
    ctx.save(); ctx.translate(0, H); ctx.rotate(-Math.PI / 2);
    const k = Math.max(H / v.videoWidth, W / v.videoHeight), dw = v.videoWidth * k, dh = v.videoHeight * k;
    ctx.drawImage(v, (H - dw) / 2, (W - dh) / 2, dw, dh); ctx.restore();
  } else drawCover(ctx, v);
}
/* 실시간 카메라를 못 쓰는 화면에서는 폰의 카메라 앱으로 한 장씩 찍어요 */
function pickImages({ capture = false, multiple = false } = {}) {
  return new Promise(res => {
    const inp = h('input', { type: 'file', accept: 'image/*', multiple: multiple || null, capture: capture ? 'environment' : null, style: { position: 'fixed', left: '-9999px' } });
    document.body.append(inp);
    inp.onchange = () => { res([...inp.files]); inp.remove(); };
    inp.click();
  });
}
async function fileToFrameBlob(file) {
  const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = URL.createObjectURL(file); });
  if (!img) return null;
  const off = h('canvas', { width: W, height: H }), c = off.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, W, H); drawCover(c, img);
  return new Promise(r => off.toBlob(r, 'image/jpeg', .88));
}

/* 스토리보드 스케치 — 장면마다 종이에 그린 그림을 사진으로 한 장 붙여요 ({ blob, url, img }) */
async function fileToSketch(file) {
  const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = URL.createObjectURL(file); });
  if (!img) return null;
  const k = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
  const off = h('canvas', { width: Math.round(img.naturalWidth * k), height: Math.round(img.naturalHeight * k) });
  off.getContext('2d').drawImage(img, 0, 0, off.width, off.height); URL.revokeObjectURL(img.src);
  const blob = await new Promise(r => off.toBlob(r, 'image/jpeg', .82));
  return blob ? { blob, ...loadImg(blob) } : null;
}
async function takeSketch(s, { album = false } = {}) {
  const f = (await pickImages({ capture: !album }))[0]; if (!f) return false;
  const sk = await fileToSketch(f); if (!sk) { toast('사진을 읽지 못했어요'); return false; }
  s.sketch = sk; changed(); toast(`“${s.name}” 스케치를 붙였어요`, 1400); return true;
}
/* 스케치 크게 보기 — 다시 찍기 · 앨범에서 고르기 · 떼기. 바뀌면 onChange() */
function sketchModal(s, onChange) {
  modal((b, m) => {
    const redo = async album => { if (await takeSketch(s, { album })) { m.close(); onChange && onChange(); } };
    b.append(h('h2', {}, `${s.name} · 스케치`),
      s.sketch ? h('img', { class: 'sketch-big', src: s.sketch.url, alt: `${s.name} 스케치` }) : h('p', { class: 'hint' }, '아직 붙인 스케치가 없어요'),
      h('div', { class: 'acts' },
        s.sketch ? ib('trash', '떼기', 'btn ghost', { onclick: () => { s.sketch = null; changed(); m.close(); onChange && onChange(); } }) : '',
        ib('image', '앨범에서', 'btn', { onclick: () => redo(true) }),
        ib('cam', s.sketch ? '다시 찍기' : '찍기', 'btn', { onclick: () => redo(false) }),
        h('button', { class: 'btn primary', type: 'button', onclick: m.close }, '닫기')));
  }, { wide: true });
}

STEP_MOD.shoot = (() => {
  let raf = 0, onion = true, grid = false, sel = null, insertAt = null, previewing = false, pvStart = 0;
  let cdT = null, autoOn = false, locked = false;   // 타이머 · 자동 촬영 · 카메라 고정
  let root, cv, ctx, flashEl, badge, sketchEl, cdEl, timerBtn, lockBtn, shutterEl, list, headEl, popEl, nocamEl, pvBtn, onionBtn, gridBtn, holdBtn, counterEl;
  const scene = () => { let s = P.scenes.find(s => s.id === S.curScene); if (!s) { s = P.scenes[P.scenes.length - 1]; S.curScene = s.id; } return s; };

  function mount({ main }) {
    root = main;
    // 가운데: 카메라 화면 (높이 전체) + 위에 겹치는 것들 + 아래 필름 띠
    flashEl = h('div', { class: 'flash' }); badge = h('div', { class: 'stage-badge' }); popEl = h('div', { class: 'frame-pop', hidden: true });
    nocamEl = h('div', { class: 'nocam', hidden: true });
    sketchEl = h('button', { class: 'mon-sketch', type: 'button', hidden: true, 'aria-label': '장면 스케치 크게 보기', onclick: () => sketchModal(scene(), buildStrip) });
    cdEl = h('div', { class: 'countdown', hidden: true });
    headEl = key('', { cls: 'scn', onclick: sceneSheet, aria: '장면 목록' });
    list = h('div', { class: 'list' }); counterEl = h('div', { class: 'cnt' });
    const fbar = h('div', { class: 'fbar' }, headEl, list, counterEl, key('장면 끝', { ic: 'check', cls: 'endk', onclick: endScene }));
    const mon = monitorEl([flashEl, badge, sketchEl, cdEl, nocamEl, popEl, fbar]); cv = mon.cv; ctx = cv.getContext('2d');
    const area = h('div', { class: 'cam-area' }, mon.mon, nextKey('shoot', 'pill'));
    // 왼쪽 줄: 단계 · 되돌리기 · 겹쳐보기(+진하기) · 격자
    onionBtn = key('겹쳐보기', { ic: 'onion', cls: onion ? 'on' : '', onclick: () => { onion = !onion; onionBtn.classList.toggle('on', onion); onionA.disabled = !onion; toast(onion ? '앞 컷 겹쳐 보기 켬' : '앞 컷 겹쳐 보기 끔', 1100); } });
    const onionA = h('input', { class: 'onion-a', type: 'range', min: .15, max: .8, step: .05, value: S.onionA || .42, 'aria-label': '겹쳐 보기 진하기', oninput: e => { S.onionA = +e.target.value; } });
    gridBtn = key('격자', { ic: 'grid', onclick: () => { grid = !grid; gridBtn.classList.toggle('on', grid); } });
    const left = h('div', { class: 'rail' }, navKey(), key('되돌리기', { ic: 'undo', aria: '마지막 컷 지우기', onclick: undoLast }), onionBtn, onionA, gridBtn);
    // 오른쪽 줄: 카메라 바꾸기 · 타이머 · 고정 · 큰 빨간 찰칵 · 재생 · ×N · 장면 끝
    timerBtn = key('타이머', { ic: 'timer', aria: '타이머 · 자동 촬영', onclick: timerSheet });
    lockBtn = key('고정', { ic: 'camlock', aria: '카메라 고정 (밝기·초점·색)', onclick: toggleLock });
    pvBtn = key('재생', { ic: 'play', onclick: togglePreview });
    holdBtn = key('', { cls: 'hold3', aria: '한 번에 찍는 프레임 수 바꾸기', onclick: () => { P.hold = P.hold % 4 + 1; paintHold(); changed(); toast(`한 번 누르면 ${P.hold}프레임씩 찍어요`, 1200); } });
    shutterEl = h('button', { class: 'key shutter', type: 'button', 'aria-label': '촬영', onclick: shutterPress });
    const right = h('div', { class: 'rail' }, key('카메라', { ic: 'switchCam', aria: '앞·뒤 카메라 바꾸기', onclick: switchCam }), timerBtn, lockBtn, shutterEl, pvBtn, holdBtn);
    root.append(h('div', { class: 'shoot' }, left, area, right));
    paintHold(); paintShutter(); paintTimer(); buildStrip(true);
    startCamera();
    addEventListener('keydown', onKey);
    loop();
  }
  function unmount() { stopTimer(); locked = false; cancelAnimationFrame(raf); Cam.stop(); removeEventListener('keydown', onKey); previewing = false; }
  function onKey(e) { if (e.target.closest('input,textarea,select')) return; if (e.code === 'Space' || e.code === 'VolumeUp') { e.preventDefault(); shutterPress(); } }
  function paintHold() { holdBtn.innerHTML = `<span class="ki">×${P.hold}</span><span class="kl">장씩</span>`; holdBtn.title = `한 번 누르면 ${P.hold}프레임씩 찍어요`; }
  function paintCounter() { const sc = scene(); const sec = sc.frames.reduce((a, f) => a + f.hold, 0) / P.fps; counterEl.textContent = `${sc.frames.length}컷 · ${sec.toFixed(1)}초`; }

  async function startCamera() {
    nocamEl.hidden = true;
    const ok = await Cam.start();
    if (!ok) showNoCam();
  }
  async function switchCam() {
    if (Cam.failed) { startCamera(); return; }
    if (!(await Cam.next())) toast('바꿀 수 있는 다른 카메라가 없어요');
    else { locked = false; lockBtn.classList.remove('on'); }
  }
  function showNoCam() {
    nocamEl.hidden = false; nocamEl.innerHTML = '';
    const denied = Cam.reason === 'NotAllowedError';
    nocamEl.append(h('span', { html: icon('cam') , style: { width: '40px', height: '40px', color: '#CF5D2A' } }),
      h('b', {}, denied ? '카메라 사용이 막혀 있어요' : '이 화면에서는 실시간 카메라를 켤 수 없어요'),
      h('p', {}, denied ? '주소창 옆 자물쇠(또는 설정)에서 카메라를 허용한 뒤 다시 시도를 눌러 주세요. 그동안 아래 버튼으로 폰 카메라 앱을 열어 한 컷씩 찍을 수도 있어요.'
        : '아래 버튼을 누르면 폰의 카메라 앱이 열려요. 한 장 찍을 때마다 한 컷이 쌓여요. 겹쳐 보기까지 쓰려면 앱을 https 주소로 열어 주세요.'),
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        ib('cam', '카메라 앱으로 한 컷 찍기', 'btn accent', { onclick: async () => { const f = await pickImages({ capture: true }); for (const x of f) { const b = await fileToFrameBlob(x); b && await addFrame(b); } } }),
        ib('image', '사진 여러 장 불러오기', 'btn sm', { onclick: async () => { const f = await pickImages({ multiple: true }); for (const x of f) { const b = await fileToFrameBlob(x); b && await addFrame(b); } if (f.length) toast(`사진 ${f.length}장을 넣었어요`); } }),
        ib('rotR', '다시 시도', 'btn sm ghost', { style: { color: '#fff' }, onclick: startCamera })));
  }

  /* ----- 무대 그리기 ----- */
  function loop() {
    const sc = scene();
    ctx.setTransform(1, 0, 0, 1, 0, 0); paintShadowOff();
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (previewing) {
      const fr = sc.frames, tot = fr.reduce((a, f) => a + f.hold, 0);
      if (!tot) stopPreview();
      else {
        const k = Math.floor((performance.now() - pvStart) / 1000 * P.fps) % tot; let acc = 0, f = fr[0];
        for (const x of fr) { if (k < acc + x.hold) { f = x; break; } acc += x.hold; }
        drawCover(ctx, f.img); badge.textContent = '미리보기 중';
        raf = requestAnimationFrame(loop); return;
      }
    }
    if (Cam.video && Cam.stream && Cam.video.videoWidth) drawCam(ctx, Cam.video);
    else if (sc.frames.length) { const f = sc.frames[(insertAt ?? sc.frames.length) - 1]; f && drawCover(ctx, f.img); }
    if (onion && Cam.stream) {
      const base = insertAt ?? sc.frames.length, p1 = sc.frames[base - 1], p2 = sc.frames[base - 2];
      const oa = S.onionA || .42;
      if (p2) { ctx.globalAlpha = oa * .5; drawCover(ctx, p2.img); }
      if (p1) { ctx.globalAlpha = oa; drawCover(ctx, p1.img); }
      ctx.globalAlpha = 1;
    }
    if (grid) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const x of [W / 3, W * 2 / 3]) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (const y of [H / 3, H * 2 / 3]) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke(); }
    const frames = sc.frames.reduce((a, f) => a + f.hold, 0);
    badge.textContent = `${sc.name} · ${(frames / P.fps).toFixed(1)}초` + (insertAt != null ? ` · ${insertAt}번 뒤에 끼워 찍는 중` : '');
    raf = requestAnimationFrame(loop);
  }
  function paintShadowOff() { ctx.shadowColor = 'transparent'; }
  function togglePreview() { if (previewing) stopPreview(); else { if (!scene().frames.length) { toast('먼저 몇 컷을 찍어 보세요'); return; } previewing = true; pvStart = performance.now(); pvBtn.innerHTML = icon('stop', 'ki') + '<span class="kl">멈춤</span>'; } }
  function stopPreview() { previewing = false; pvBtn.innerHTML = icon('play', 'ki') + '<span class="kl">재생</span>'; }

  /* ----- 타이머 · 자동 촬영 ----- */
  /* S.shot = { delay: 찰칵 뒤 몇 초 뒤에 찍을지, auto: 몇 초마다 계속 찍을지 } — 둘 중 하나만 써요 */
  const shot = () => S.shot || (S.shot = { delay: 0, auto: 0 });
  function paintTimer() {
    const s = shot(), t = s.auto ? s.auto + '초마다' : s.delay ? s.delay + '초' : '';
    timerBtn.innerHTML = icon('timer', 'ki') + `<span class="kl">${t || '타이머'}</span>`; timerBtn.classList.toggle('on', !!t);
  }
  function paintShutter() { shutterEl.classList.toggle('running', autoOn || !!cdT); shutterEl.innerHTML = icon(autoOn || cdT ? 'stop' : 'cam', 'ki') + `<span class="kl">${autoOn ? '멈춤' : cdT ? '취소' : '찰칵'}</span>`; }
  function timerSheet() {
    modal((b, m) => {
      const pick = (delay, auto) => { stopTimer(); Object.assign(shot(), { delay, auto }); paintTimer(); m.close(); toast(auto ? `찰칵을 누르면 ${auto}초마다 계속 찍어요. 한 번 더 누르면 멈춰요` : delay ? `찰칵을 누르고 ${delay}초 뒤에 찍어요` : '찰칵을 누르면 바로 찍어요', 2600); };
      const s = shot(), chip = (label, d, a) => h('button', { class: 'chip' + (s.delay === d && s.auto === a ? ' on' : ''), type: 'button', onclick: () => pick(d, a) }, label);
      b.append(h('h2', {}, '찰칵 방법'),
        h('p', { class: 'hint', style: { margin: 0 } }, '폰을 누를 때 흔들리면 타이머를 써 보세요. 자동은 손을 떼고 인형만 움직이면 돼요.'),
        h('span', { class: 'label' }, '타이머'), h('div', { class: 'row' }, chip('바로 찍기', 0, 0), chip('3초 뒤', 3, 0), chip('5초 뒤', 5, 0)),
        h('span', { class: 'label' }, '자동으로 계속 찍기'), h('div', { class: 'row' }, chip('2초마다', 0, 2), chip('3초마다', 0, 3), chip('5초마다', 0, 5)),
        h('div', { class: 'acts' }, h('button', { class: 'btn primary', type: 'button', onclick: m.close }, '닫기')));
    });
  }
  function shutterPress() {
    if (autoOn || cdT) { const was = autoOn; stopTimer(); if (was) toast('자동 촬영을 멈췄어요', 1200); return; }
    const s = shot();
    if ((!s.delay && !s.auto) || !Cam.stream) { capture(); return; }
    if (previewing) stopPreview();
    autoOn = !!s.auto; countdown();
  }
  function countdown() {
    let n = shot().auto || shot().delay;
    const tick = () => {
      if (n <= 0) { cdEl.hidden = true; cdT = null; paintShutter(); capture().then(() => { if (autoOn) countdown(); }); return; }
      cdEl.hidden = false; cdEl.textContent = n; cdEl.classList.toggle('soft', autoOn); beep(n === 1 ? 1320 : 880); n--;
      cdT = setTimeout(tick, 1000); paintShutter();
    };
    tick();
  }
  function stopTimer() { clearTimeout(cdT); cdT = null; autoOn = false; if (cdEl) cdEl.hidden = true; if (shutterEl) paintShutter(); }
  function beep(f) { AE.init(); const c = AE.ctx; if (!c) return; const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.12, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .12); o.connect(g).connect(AE.buses.ui); o.start(); o.stop(c.currentTime + .14); }

  /* ----- 카메라 고정 — 컷마다 밝기·초점·색이 바뀌어 깜빡이지 않게 지금 값으로 묶어요 (되는 기기만) ----- */
  async function toggleLock() {
    const tr = Cam.stream && Cam.stream.getVideoTracks()[0];
    if (!tr || !tr.getCapabilities) { toast('카메라가 켜져 있을 때 쓸 수 있어요'); return; }
    const cap = tr.getCapabilities(), cur = tr.getSettings(), want = !locked, adv = {};
    for (const [mode, val] of [['exposureMode', ['exposureTime', 'iso']], ['focusMode', ['focusDistance']], ['whiteBalanceMode', ['colorTemperature']]]) {
      const modes = cap[mode] || [];
      if (!want) { if (modes.includes('continuous')) adv[mode] = 'continuous'; continue; }
      const vals = val.filter(k => cur[k] != null && cap[k]);
      if (modes.includes('manual') && vals.length) { adv[mode] = 'manual'; for (const k of vals) adv[k] = cur[k]; }
      else if (modes.includes('single-shot')) adv[mode] = 'single-shot';
      else if (modes.includes('manual')) adv[mode] = 'manual';
    }
    if (!Object.keys(adv).length) { toast(want ? '이 기기 카메라는 고정 기능이 없어요. 불빛이 바뀌지 않는 곳에서 찍어 주세요' : '카메라 고정을 풀었어요', 3200); locked = false; lockBtn.classList.remove('on'); return; }
    try { await tr.applyConstraints({ advanced: [adv] }); locked = want; lockBtn.classList.toggle('on', locked); toast(locked ? '카메라를 고정했어요. 밝기·초점이 이제 안 바뀌어요' : '카메라 고정을 풀었어요', 2200); }
    catch (e) { toast('카메라를 고정하지 못했어요'); }
  }

  /* ----- 촬영 ----- */
  async function capture() {
    if (previewing) stopPreview();
    if (!Cam.stream || !Cam.video || !Cam.video.videoWidth) {
      const f = await pickImages({ capture: true }); for (const x of f) { const b = await fileToFrameBlob(x); b && await addFrame(b); } return;
    }
    const off = h('canvas', { width: W, height: H }), c = off.getContext('2d');
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H); drawCam(c, Cam.video);
    AE.init(); AE.click(); flashEl.classList.remove('go'); void flashEl.offsetWidth; flashEl.classList.add('go');
    try { navigator.vibrate && navigator.vibrate(15); } catch (e) { }
    await addFrame(await new Promise(r => off.toBlob(r, 'image/jpeg', .88)));
  }
  async function addFrame(blob) {
    const sc = scene(); const f = { id: uid(), hold: P.hold, blob, ...loadImg(blob) };
    if (insertAt != null) { sc.frames.splice(insertAt, 0, f); insertAt++; if (insertAt >= sc.frames.length) insertAt = null; }
    else sc.frames.push(f);
    sel = null; changed(); buildStrip(insertAt == null);
  }
  function undoLast() {
    const sc = scene(); if (!sc.frames.length) return;
    if (insertAt != null && insertAt > 0) { sc.frames.splice(insertAt - 1, 1); insertAt--; } else sc.frames.pop();
    sel = null; changed(); buildStrip(); toast('마지막 컷을 지웠어요', 1200);
  }

  /* ----- 왼쪽 컷 줄 ----- */
  function buildStrip(scrollEnd) {
    const sc = scene(), fr = sc.frames.reduce((a, f) => a + f.hold, 0);
    headEl.innerHTML = `<span class="kl">${sc.name.replace(/</g, '&lt;')}</span><small>▾</small>`;
    list.innerHTML = '';
    if (!sc.frames.length) list.append(h('div', { class: 'strip-empty' }, '빨간 찰칵을 누르면 여기에 컷이 쌓여요'));
    sc.frames.forEach((f, i) => {
      if (insertAt === i) list.append(h('span', { class: 'ins-mark' }));
      list.append(h('button', { class: 'fr' + (sel === i ? ' sel' : '') + (i === sc.frames.length - 1 ? ' last' : ''), type: 'button', 'aria-label': `${i + 1}번 컷`, onclick: () => { sel = sel === i ? null : i; buildStrip(); } },
        h('img', { src: f.url, alt: '' }), h('b', {}, String(i + 1).padStart(3, '0')), h('em', {}, '×' + f.hold)));
    });
    if (scrollEnd) requestAnimationFrame(() => list.scrollLeft = list.scrollWidth);
    sketchEl.hidden = !sc.sketch; if (sc.sketch) sketchEl.style.backgroundImage = `url(${sc.sketch.url})`;
    paintCounter(); buildPop();
  }
  function buildPop() {
    const sc = scene(); popEl.innerHTML = '';
    if (sel == null || !sc.frames[sel]) { popEl.hidden = insertAt == null; if (insertAt != null) popEl.append(h('b', { style: { fontSize: '13px' } }, `${insertAt}번 컷 뒤에 끼워 찍는 중`), ib('next', '맨 끝으로', 'btn sm', { onclick: () => { insertAt = null; buildStrip(true); } })); return; }
    const f = sc.frames[sel]; popEl.hidden = false;
    popEl.append(h('b', { style: { fontSize: '13px' } }, `${sel + 1}번 컷`),
      ib('rewind', '여기부터 다시 찍기', 'btn sm accent', { onclick: async () => { if (!await confirmBox('여기부터 다시 찍을까요?', `${sel + 1}번 컷부터 끝까지 ${sc.frames.length - sel}개 컷이 지워지고, 그 자리부터 이어서 찍어요.`, '지우고 다시 찍기', true)) return; sc.frames.splice(sel); insertAt = null; sel = null; changed(); buildStrip(true); } }),
      ib('insert', '뒤에 끼워 찍기', 'btn sm', { onclick: () => { insertAt = sel + 1; if (insertAt >= sc.frames.length) insertAt = null; sel = null; buildStrip(); } }),
      ib('copy', '복사', 'btn sm', { 'aria-label': '이 컷을 바로 뒤에 하나 더', onclick: () => { sc.frames.splice(sel + 1, 0, { ...f, id: uid() }); sel++; changed(); buildStrip(); toast('컷을 하나 더 넣었어요', 1100); } }),
      sel < sc.frames.length - 1 ? ib('pingpong', '거꾸로 이어 붙이기', 'btn sm', { 'aria-label': '여기부터 끝까지를 거꾸로 이어 붙이기', onclick: () => {
        const back = sc.frames.slice(sel, -1).reverse().map(x => ({ ...x, id: uid() })); sc.frames.push(...back); sel = null; insertAt = null; changed(); buildStrip(true);
        toast(`컷 ${back.length}개를 거꾸로 붙였어요. 갔다가 돌아와요`, 1800); } }) : '',
      ib('trash', '', 'btn sm icon', { 'aria-label': '이 컷 지우기', onclick: () => { sc.frames.splice(sel, 1); if (insertAt != null && insertAt > sel) insertAt--; sel = null; changed(); buildStrip(); } }),
      h('div', { class: 'seg', 'aria-label': '이 컷을 보여 줄 프레임 수' }, ...[1, 2, 3, 4, 6].map(n => h('button', { type: 'button', class: f.hold === n ? 'on' : '', onclick: () => { f.hold = n; changed(); buildStrip(); } }, '×' + n))),
      ib('x', '', 'btn sm icon ghost', { 'aria-label': '닫기', onclick: () => { sel = null; buildStrip(); } }));
  }

  /* ----- 장면 ----- */
  async function endScene() {
    const sc = scene();
    if (!sc.frames.length) { toast('아직 찍은 컷이 없어요'); return; }
    insertAt = null; sel = null; await saveProject();
    modal((b, m) => {
      const used = P.scenes.map(s => s.name);
      const pool = storyInfo(P.storyId).scenes.filter(n => !used.includes(n));
      let nextName = P.scenes[P.scenes.indexOf(sc) + 1]?.name || pool[0] || `${P.scenes.length + 1}장면`;
      const chips = h('div', { class: 'row' });
      const paintChips = () => { chips.innerHTML = ''; for (const n of [...new Set([nextName, ...pool])].slice(0, 6)) chips.append(h('button', { class: 'chip' + (n === nextName ? ' on' : ''), type: 'button', onclick: () => { nextName = n; paintChips(); } }, n)); };
      paintChips();
      b.append(h('h2', {}, `“${sc.name}” 저장했어요!`),
        h('p', { class: 'hint', style: { margin: 0 } }, `컷 ${sc.frames.length}개 · ${(sc.frames.reduce((a, f) => a + f.hold, 0) / P.fps).toFixed(1)}초`),
        h('span', { class: 'label' }, '다음에 찍을 장면'), chips,
        h('div', { class: 'endacts' },
          h('button', { class: 'btn accent big', type: 'button', onclick: () => { m.close(); goScene(nextName); }, html: icon('cam') + '<span>다음 장면 찍기</span>' }),
          h('div', { class: 'row nowrap' },
            h('button', { class: 'btn grow', type: 'button', onclick: () => { m.close(); nextStep('shoot'); }, html: '<span>촬영 끝 → 대사 녹음</span>' }),
            h('button', { class: 'btn grow', type: 'button', onclick: () => { m.close(); playAll(); }, html: icon('film') + '<span>전체 보기</span>' }))));
    });
  }
  function goScene(name) {
    let s = P.scenes.find(x => x.name === name && !x.frames.length);
    if (!s) { s = newScene(name); P.scenes.push(s); }
    S.curScene = s.id; insertAt = null; sel = null; changed(); buildStrip(true); toast(`“${s.name}” 촬영을 시작해요`);
  }
  function sceneSheet() {
    modal((b, m) => {
      const listBox = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '8px' } });
      P.scenes.forEach((s, i) => {
        const fr = s.frames.reduce((a, f) => a + f.hold, 0);
        listBox.append(h('div', { class: 'scene' + (s.id === S.curScene ? ' cur' : '') },
          h('span', { class: 'th', style: { backgroundImage: s.frames[0] ? `url(${s.frames[0].url})` : '' } }),
          h('div', {}, h('b', {}, `${i + 1}. ${s.name}`), h('small', {}, s.frames.length ? `컷 ${s.frames.length} · ${(fr / P.fps).toFixed(1)}초` : '아직 안 찍었어요')),
          h('div', { class: 'acts' },
            s.id === S.curScene ? h('span', { class: 'chip', style: { color: 'var(--gold)', borderColor: 'var(--gold)' } }, '촬영 중') :
              ib('cam', s.frames.length ? '다시 촬영' : '촬영', 'btn sm', { onclick: () => { S.curScene = s.id; insertAt = null; sel = null; m.close(); buildStrip(true); } }),
            ib('edit', '', 'btn sm icon', { 'aria-label': '이름 바꾸기', onclick: () => { m.close(); renameScene(s); } }),
            P.scenes.length > 1 ? ib('trash', '', 'btn sm icon ghost', { 'aria-label': '장면 지우기', onclick: () => { m.close(); deleteScene(s); } }) : '')));
      });
      b.append(h('div', { class: 'panel-title' }, h('h2', {}, '장면 목록'), h('span', { class: 'hint' }, `${P.scenes.length}개 · ${fmt(TL().total)}`)), listBox,
        h('div', { class: 'acts' }, ib('film', '전체 영상 보기', 'btn', { onclick: () => { m.close(); playAll(); } }), ib('plus', '새 장면', 'btn', { onclick: () => { m.close(); newScenePrompt(); } }), h('button', { class: 'btn primary', type: 'button', onclick: m.close }, '닫기')));
    }, { wide: true });
  }
  function newScenePrompt() {
    modal((b, m) => {
      const used = P.scenes.map(s => s.name); const nn = storyInfo(P.storyId).scenes.find(n => !used.includes(n)) || `${P.scenes.length + 1}장면`;
      const ni = h('input', { id: 'newSceneName', value: nn, maxlength: 30 });
      b.append(h('h2', {}, '새 장면'), h('label', { class: 'field' }, h('span', { class: 'label' }, '장면 이름'), ni), storyInfo(P.storyId).scenes.length ? sceneNameChips(ni) : '',
        h('div', { class: 'acts' }, h('button', { class: 'btn', type: 'button', onclick: m.close }, '취소'), h('button', { class: 'btn accent', type: 'button', onclick: () => { m.close(); const s = newScene(ni.value.trim() || nn); P.scenes.push(s); S.curScene = s.id; changed(); buildStrip(true); } }, '만들고 촬영하기')));
    });
  }
  function renameScene(s) {
    modal((b, m) => {
      const ni = h('input', { id: 'renameScene', value: s.name, maxlength: 30 });
      b.append(h('h2', {}, '장면 이름 바꾸기'), h('label', { class: 'field' }, h('span', { class: 'label' }, '장면 이름'), ni),
        h('div', { class: 'acts' }, h('button', { class: 'btn', type: 'button', onclick: m.close }, '취소'), h('button', { class: 'btn primary', type: 'button', onclick: () => { s.name = ni.value.trim() || s.name; changed(); m.close(); buildStrip(); } }, '바꾸기')));
    });
  }
  async function deleteScene(s) {
    if (!await confirmBox('장면을 지울까요?', `“${s.name}” 장면과 그 안의 효과·효과음·대사가 함께 지워져요.`, '지우기', true)) return;
    P.scenes = P.scenes.filter(x => x !== s);
    for (const k of ['fx', 'sfx', 'voices', 'narrs']) P[k] = P[k].filter(it => it.sid !== s.id);
    if (S.curScene === s.id) S.curScene = P.scenes[P.scenes.length - 1].id;
    changed(); buildStrip(true);
  }
  return { mount, unmount, layout: 'shoot' };
})();

/* 전체 영상 보기 (어느 단계에서나) */
function playAll() {
  if (!TL().total) { toast('아직 찍은 장면이 없어요'); return; }
  const prev = { canvas: Player.canvas, opts: Player.opts, onTick: Player.onTick };
  modal((b, m) => {
    const st = stageEl(); const t = h('span', { class: 'time' });
    const pb = ib('pause', '멈춤', 'btn sm primary', { onclick: () => Player.toggle() });
    st.wrap.style.width = 'min(100%, calc((100dvh - 150px) * 16 / 9))'; st.wrap.style.margin = '0 auto';
    b.append(h('div', { class: 'panel-title' }, h('h2', {}, P.title), h('span', { class: 'hint' }, `장면 ${P.scenes.length}개 · ${fmt(TL().total)}`)), st.wrap,
      h('div', { class: 'row', style: { justifyContent: 'center' } }, ib('rewind', '', 'btn sm icon', { 'aria-label': '처음으로', onclick: () => Player.seek(0) }), pb, t, h('div', { class: 'spacer' }), h('button', { class: 'btn sm', type: 'button', onclick: m.close }, '닫기')));
    Player.attach(st.cv, { onTick: tt => { t.textContent = fmt(tt) + ' / ' + fmt(TL().total); pb.innerHTML = icon(Player.playing ? 'pause' : 'play') + `<span>${Player.playing ? '멈춤' : '재생'}</span>`; } });
    Player.t = 0; Player.play();
    m.onclose = () => { Player.pause(); if (prev.canvas && document.body.contains(prev.canvas)) Player.attach(prev.canvas, { ...prev.opts, onTick: prev.onTick }); else Player.attach(null); };
  }, { wide: true });
}
