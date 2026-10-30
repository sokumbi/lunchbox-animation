/* =========================================================
   촬영 도우미 — 카메라 · 사진 불러오기 · 전체 보기 (화면은 p6_simple)
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
