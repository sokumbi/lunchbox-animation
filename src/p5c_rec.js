/* =========================================================
   녹음 도우미 (대사·나레이션)
   ========================================================= */
const Mic = {
  stream: null, failed: false,
  async get() { if (this.stream) return this.stream; this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); return this.stream; },
  release() { if (this.stream) this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
};
function startRecorder(stream) {
  const mr = new MediaRecorder(stream), chunks = [];
  mr.ondataavailable = e => e.data.size && chunks.push(e.data); mr.start(100);
  return { stop: () => new Promise(res => { mr.onstop = () => res(new Blob(chunks, { type: mr.mimeType || 'audio/webm' })); mr.stop(); }) };
}
function recordFlow({ kind, wrap, guide, line, onState, onDone }) {
  const R = { active: false };
  R.start = async () => {
    let stream;
    try { stream = await Mic.get(); } catch (e) { Mic.failed = true; toast('마이크를 쓸 수 없어요. 아래 “녹음 파일 불러오기”를 써 보세요.', 3600); onState && onState('fail'); return; }
    AE.init();
    const old = line ? P[kind].find(v => v.lineId === line.id) : null;
    if (old) Player.seek(absT(old));
    if (Player.t >= TL().total - .05) Player.seek(0);
    const cnt = h('div', { class: 'count' }); wrap.append(cnt);
    for (const n of [3, 2, 1]) { cnt.textContent = n; await new Promise(r => setTimeout(r, 650)); }
    cnt.remove();
    const startT = Player.t, rec = startRecorder(stream);
    R.active = true; onState && onState('rec');
    const finish = async () => {
      if (!R.active) return; R.active = false; Player.pause();
      const blob = await rec.stop(); onState && onState('idle');
      try {
        const buf = await decodeBlob(blob);
        const clip = { id: uid(), lineId: line ? line.id : null, who: line ? line.who : '', text: line ? line.text : '', blob, buf, dur: buf.duration };
        setAbs(clip, startT); if (old) P[kind] = P[kind].filter(v => v !== old); P[kind].push(clip); changed(); onDone && onDone(clip);
      } catch (e) { toast('녹음한 소리를 읽지 못했어요. 다시 해 볼까요?'); }
    };
    R.stop = finish;
    Player.onEnd = finish;
    await Player.play({ exclude: old ? old.id : null });
  };
  R.stop = () => { };
  return R;
}
function uploadAudio(kind, line, after, capture = false) {
  const inp = h('input', { type: 'file', accept: 'audio/*', capture: capture ? 'user' : null });
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    try { const buf = await decodeBlob(f); const clip = { id: uid(), lineId: line ? line.id : null, who: line ? line.who : '', text: line ? line.text : '', blob: f, buf, dur: buf.duration };
      if (line) P[kind] = P[kind].filter(v => v.lineId !== line.id);
      setAbs(clip, Player.t); P[kind].push(clip); changed(); toast('소리 파일을 넣었어요'); after && after(clip); }
    catch (e) { toast('이 소리 파일은 열 수 없어요'); }
  };
  inp.click();
}

/* =========================================================
   4단계 — 대사 녹음
   ========================================================= */
function parseScript(text) {
  const out = [];
  for (let raw of text.split(/\r?\n/)) {
    const l = raw.trim(); if (!l || /^#/.test(l)) continue;
    let m = l.match(/^([^:：,\t]{1,12})\s*[:：\t,]\s*(.+)$/);
    if (m) out.push({ id: uid(), who: m[1].replace(/^["“]|["”]$/g, '').trim(), text: m[2].replace(/^["“]|["”]$/g, '').trim(), scene: null });
    else out.push({ id: uid(), who: '해설', text: l, scene: null });
  }
  return out;
}
function originalScript() { return ORIGINAL_SCRIPT.map(l => ({ id: uid(), who: l.who, text: l.text, scene: P.scenes[l.scene] ? P.scenes[l.scene].id : null })); }
