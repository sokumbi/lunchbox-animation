async function saveFile(blob, filename) {
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      const dl = await window.claude.use('downloads');
      if (dl) { await dl.save({ filename, data: blob }); toast('영상 파일을 저장했어요'); return true; }
    }
  } catch (e) { if (e && e.code === 'declined') { toast('저장을 취소했어요'); return false; } }
  try { const a = h('a', { href: URL.createObjectURL(blob), download: filename }); document.body.append(a); a.click(); a.remove(); toast('영상 파일을 내려받았어요'); return true; }
  catch (e) { toast('이 화면에서는 파일로 저장할 수 없어요'); return false; }
}
async function exportVideo() {
  if (!TL().total) return;
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { toast('이 브라우저는 영상 파일 만들기를 지원하지 않아요. 크롬에서 열어 주세요.'); return; }
  const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  const mime = types.find(t => MediaRecorder.isTypeSupported(t)); if (!mime) { toast('이 브라우저는 영상 파일 만들기를 지원하지 않아요'); return; }
  const ext = mime.includes('mp4') ? 'mp4' : 'webm';
  AE.init(); await Player.preload();
  const prev = { canvas: Player.canvas, opts: Player.opts, onTick: Player.onTick };
  const cv = h('canvas', { width: 1280, height: 720 });
  const stream = cv.captureStream(30); const dest = AE.ctx.createMediaStreamDestination(); AE.master.connect(dest);
  dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
  const mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5e6 }); const chunks = []; mr.ondataavailable = e => e.data.size && chunks.push(e.data);
  let cancelled = false;
  modal((b, m) => {
    const bar = h('div', { style: { height: '10px', borderRadius: '99px', background: 'var(--night)', overflow: 'hidden' } }, h('div', { id: 'expBar', style: { height: '100%', width: '0%', background: 'var(--jade)' } }));
    const prevBox = h('div', { class: 'stage-wrap', style: { maxWidth: '100%' } }, cv);
    cv.style.width = '100%'; cv.style.height = '100%'; cv.style.display = 'block';
    const txt = h('p', { class: 'hint', style: { margin: 0 } }, '영상 파일을 만드는 중이에요…');
    const acts = h('div', { class: 'acts' }, h('button', { class: 'btn', onclick: () => { cancelled = true; Player.pause(); try { mr.stop(); } catch (e) { } m.close(); } }, '그만두기'));
    b.append(h('h2', {}, '영상 파일 만들기'), prevBox, bar, txt, acts);
    const restore = () => { try { AE.master.disconnect(dest); } catch (e) { } if (prev.canvas && document.body.contains(prev.canvas)) Player.attach(prev.canvas, { ...prev.opts, onTick: prev.onTick }); };
    mr.onstop = () => {
      restore(); if (cancelled) return;
      const blob = new Blob(chunks, { type: mime.split(';')[0] });
      const fname = (P.title || '나의 별주부전').replace(/[\\/:*?"<>|]/g, '') + '.' + ext;
      prevBox.innerHTML = ''; const v = h('video', { src: URL.createObjectURL(blob), controls: true, playsinline: true, style: { width: '100%', height: '100%', display: 'block' } }); prevBox.append(v);
      bar.remove(); txt.textContent = `완성! ${fname} (${(blob.size / 1048576).toFixed(1)}MB)`;
      acts.innerHTML = ''; acts.append(h('button', { class: 'btn', onclick: m.close }, '닫기'), ib('download', '파일로 저장', 'btn primary', { onclick: () => saveFile(blob, fname) }));
    };
    Player.attach(cv, { onTick: t => { const el = $('#expBar'); if (el) el.style.width = (t / TL().total * 100) + '%'; } });
    Player.t = 0; Player.onEnd = () => setTimeout(() => { try { mr.stop(); } catch (e) { } }, 250);
    mr.start(200); Player.play();
  }, { close: false, wide: true });
}

/* =========================================================
   시작!
   ========================================================= */
initSplash();
