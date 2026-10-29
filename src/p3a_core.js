/* =========================================================
   프로젝트 · 타임라인 계산 · 재생기
   ========================================================= */
let P = null;                 // 지금 만드는 작품
let TLc = null;               // 타임라인 계산 캐시
const S = { step: 'shoot', sel: null, curScene: null, sub: { sound: 'sfx', edit: 'edit' } };

function newScene(name, desc = '') { return { id: uid(), name: name || '새 장면', desc, frames: [], trimIn: 0, trimOut: 0, bgm: null, stage: null }; }
function newProject(title, sceneName, storyId = 'byeoljubu') {
  return { id: uid(), storyId, synopsis: '', title, created: Date.now(), updated: Date.now(), fps: 12, hold: 3,
    scenes: [newScene(sceneName)], fx: [], sfx: [], voices: [], narrs: [], script: null, scriptMode: null, narrText: '',
    mix: { bgm: .5, sfx: .9, voice: 1, narr: 1 }, duck: true, fade: true, subs: true, done: {} };
}
function changed() { TLc = null; if (P) { P.updated = Date.now(); histPush(); scheduleSave(); } }
/* ---------- 되돌리기 (모든 작업 화면 공통) ---------- */
const HIST = { p: null, stack: [], t: 0, max: 40 };
function snap() {
  return { scenes: P.scenes.map(s => ({ ...s, frames: s.frames.map(f => ({ ...f })) })), fx: P.fx.map(e => ({ ...e })), sfx: P.sfx.map(e => ({ ...e })),
    voices: P.voices.map(e => ({ ...e })), narrs: P.narrs.map(e => ({ ...e })), script: P.script ? P.script.map(l => ({ ...l })) : null,
    fps: P.fps, hold: P.hold, title: P.title, fade: P.fade, subs: P.subs, duck: P.duck, mix: { ...P.mix }, synopsis: P.synopsis };
}
function histInit() { if (P && HIST.p !== P) { HIST.p = P; HIST.stack = [snap()]; HIST.t = 0; } }
function histPush() {
  histInit(); const now = Date.now();
  if (now - HIST.t < 450 && HIST.stack.length > 1) HIST.stack[HIST.stack.length - 1] = snap(); else HIST.stack.push(snap());
  HIST.t = now; if (HIST.stack.length > HIST.max) HIST.stack.shift();
}
function undo() {
  histInit();
  if (HIST.stack.length < 2) { toast('더 되돌릴 게 없어요', 1300); return; }
  HIST.stack.pop(); const st = HIST.stack[HIST.stack.length - 1];
  const keep = P; const c = { ...st, scenes: st.scenes.map(s => ({ ...s, frames: s.frames.map(f => ({ ...f })) })), fx: st.fx.map(e => ({ ...e })), sfx: st.sfx.map(e => ({ ...e })),
    voices: st.voices.map(e => ({ ...e })), narrs: st.narrs.map(e => ({ ...e })), script: st.script ? st.script.map(l => ({ ...l })) : null, mix: { ...st.mix } };
  Object.assign(keep, c); TLc = null; HIST.t = 0; P.updated = Date.now(); scheduleSave(); S.sel = null;
  if (!P.scenes.find(s => s.id === S.curScene)) S.curScene = P.scenes[P.scenes.length - 1].id;
  goStep(S.step); toast('되돌렸어요', 1100);
}
function TL() {
  if (TLc) return TLc;
  const seq = [], ranges = [], map = {}; let t = 0;
  for (const sc of P.scenes) {
    const t0 = t, end = sc.frames.length - sc.trimOut;
    for (let i = sc.trimIn; i < end; i++) { const f = sc.frames[i], d = f.hold / P.fps; seq.push({ sc, f, t0: t, t1: t + d, idx: i }); t += d; }
    const r = { sc, t0, t1: t }; ranges.push(r); map[sc.id] = r;
  }
  return TLc = { seq, ranges, map, total: t };
}
function absT(it) { const r = TL().map[it.sid]; return r ? r.t0 + it.off : null; }
function setAbs(it, t) {
  const tl = TL(); t = clamp(t, 0, Math.max(0, tl.total - .05));
  let r = tl.ranges.find(r => t >= r.t0 && t < r.t1 && r.t1 > r.t0) || tl.ranges.filter(r => r.t1 > r.t0).pop() || tl.ranges[0];
  if (!r) return; it.sid = r.sc.id; it.off = t - r.t0;
}
function segAt(t) {
  const s = TL().seq; let lo = 0, hi = s.length - 1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (t < s[m].t0) hi = m - 1; else if (t >= s[m].t1) lo = m + 1; else return s[m]; }
  return s.length ? (t >= s[s.length - 1].t1 ? s[s.length - 1] : s[0]) : null;
}
function drawCover(ctx, img, w = W, h = H) {
  if (!img) return;
  const iw = img.videoWidth || img.naturalWidth || img.width, ih = img.videoHeight || img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const k = Math.max(w / iw, h / ih), dw = iw * k, dh = ih * k;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
function wrapText(ctx, text, maxW) {
  const out = []; let line = '';
  for (const ch of text) { const test = line + ch; if (ctx.measureText(test).width > maxW && line) { out.push(line); line = ch.trimStart(); } else line = test; }
  if (line) out.push(line); return out;
}
function renderAt(ctx, t, o = {}) {
  const tl = TL();
  ctx.save(); paperShadow(ctx, false);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const seg = segAt(t);
  if (seg) drawCover(ctx, seg.f.img);
  else { ctx.fillStyle = '#9ba7d2'; ctx.font = '28px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('아직 촬영한 장면이 없어요', W / 2, H / 2); }
  if (P.fade && tl.total > 0 && o.playing) {
    let a = 0; const F = .3;
    for (const r of tl.ranges) { if (r.t1 <= r.t0) continue; if (t >= r.t0 && t < r.t0 + F) a = Math.max(a, 1 - (t - r.t0) / F); if (t > r.t1 - F && t <= r.t1) a = Math.max(a, 1 - (r.t1 - t) / F); }
    if (a > 0) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, 0, W, H); }
  }
  if (o.fx !== false) for (const e of P.fx) { const et = absT(e); if (et != null && t >= et && t <= et + e.dur) drawFx(ctx, e, o.playing ? t - et : Math.max(t - et, Math.min(.45, e.dur / 2))); }
  if (o.subs !== false && P.subs) {
    const v = P.voices.find(v => { const vt = absT(v); return v.text && vt != null && t >= vt && t <= vt + Math.max(v.dur || 0, 1.2); });
    if (v) {
      ctx.font = '30px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lines = wrapText(ctx, (v.who ? v.who + ': ' : '') + v.text, W * .8), lh = 38, bh = lines.length * lh + 20;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.beginPath(); ctx.roundRect(W * .08, H - 24 - bh, W * .84, bh, 14); ctx.fill();
      ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H - 24 - bh + 10 + lh / 2 + i * lh));
    }
  }
  ctx.restore();
}

const Player = {
  t: 0, playing: false, ctx: null, canvas: null, opts: {}, onTick: null, onEnd: null, nodes: [], raf: 0, until: null, exclude: null,
  attach(canvas, opts = {}) { this.pause(); this.canvas = canvas; this.ctx = canvas ? canvas.getContext('2d') : null; this.opts = opts; this.onTick = opts.onTick || null; this.onEnd = null; this.t = clamp(this.t, 0, TL().total); this.draw(); },
  draw() { if (this.ctx) { const k = this.canvas.width / W; this.ctx.setTransform(k, 0, 0, k, 0, 0); renderAt(this.ctx, this.t, { ...this.opts, playing: this.playing }); } this.onTick && this.onTick(this.t); },
  seek(t) { const was = this.playing; if (was) this.pause(); this.t = clamp(t, 0, TL().total); this.draw(); if (was) this.play(); },
  async play(o = {}) {
    const c = AE.init(); if (!c) return;
    if (this.t >= TL().total - .02) this.t = 0;
    this.until = o.until ?? null; this.exclude = o.exclude || null; this.muteVoices = !!o.muteVoices;
    await this.preload();
    this.stopAudio(); applyMix();
    const t0 = this.t, at = c.currentTime + .06;
    this.schedule(t0, at);
    this.playing = true; this.startT = t0; this.startCtx = at;
    cancelAnimationFrame(this.raf);
    const loop = () => {
      if (!this.playing) return;
      this.t = this.startT + Math.max(0, AE.ctx.currentTime - this.startCtx);
      const end = this.until ?? TL().total;
      if (this.t >= end) { this.t = Math.min(end, TL().total); this.pause(); this.draw(); this.onEnd && this.onEnd(); return; }
      this.draw(); this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    this.onState && this.onState(true);
  },
  pause() { if (!this.playing) { this.stopAudio(); return; } this.playing = false; cancelAnimationFrame(this.raf); this.stopAudio(); this.onState && this.onState(false); },
  toggle() { this.playing ? this.pause() : this.play(); },
  async preload() {
    const ids = new Set(P.sfx.map(s => s.snd)); await Promise.all([...ids].map(id => AE.getSfx(id)));
    const b = new Set(P.scenes.map(s => s.bgm).filter(Boolean)); await Promise.all([...b].map(id => AE.getBgm(id)));
  },
  stopAudio() {
    for (const n of this.nodes) { try { n.stop(); } catch (e) { } try { n.disconnect(); } catch (e) { } }
    this.nodes = [];
    if (AE.ctx) { const g = AE.duck.gain; g.cancelScheduledValues(0); g.setValueAtTime(1, AE.ctx.currentTime); }
  },
  startBuf(buf, bus, absStart, t0, at, gain = 1, until = Infinity) {
    const c = AE.ctx, len = Math.min(buf.duration, until - absStart);
    if (absStart + len <= t0 || len <= 0) return;
    const s = c.createBufferSource(); s.buffer = buf; let node = s;
    if (gain !== 1) { const g = c.createGain(); g.gain.value = gain; s.connect(g); node = g; this.nodes.push(g); }
    node.connect(bus);
    if (absStart >= t0) s.start(at + absStart - t0, 0, len); else s.start(at, t0 - absStart, len - (t0 - absStart));
    this.nodes.push(s);
  },
  schedule(t0, at) {
    const c = AE.ctx, tl = TL(), endT = this.until ?? tl.total;
    for (const s of P.sfx) { const st = absT(s), b = AE.sfx[s.snd]; if (st == null || !b || !b.__buf) continue; this.startBuf(b.__buf, AE.buses.sfx, st, t0, at, s.vol ?? 1, endT); }
    const voices = this.muteVoices ? [] : P.voices; const narrs = P.narrs;
    for (const v of voices) { if (!v.buf || v.id === this.exclude) continue; const st = absT(v); if (st != null) this.startBuf(v.buf, AE.buses.voice, st, t0, at, 1, endT); }
    for (const v of narrs) { if (!v.buf || v.id === this.exclude) continue; const st = absT(v); if (st != null) this.startBuf(v.buf, AE.buses.narr, st, t0, at, 1, endT); }
    // 배경음악: 같은 음악이 이어지는 장면은 하나로 묶어요
    const segs = [];
    for (const r of tl.ranges) { if (!r.sc.bgm || r.t1 <= r.t0) continue; const last = segs[segs.length - 1]; if (last && last.id === r.sc.bgm && Math.abs(last.b - r.t0) < 1e-6) last.b = r.t1; else segs.push({ id: r.sc.bgm, a: r.t0, b: r.t1 }); }
    for (const sg of segs) {
      const p = AE.bgm[sg.id]; const buf = p && p.__buf; if (!buf) continue;
      const b = Math.min(sg.b, endT); if (b <= t0) continue;
      const s = c.createBufferSource(); s.buffer = buf; s.loop = true; const g = c.createGain();
      s.connect(g).connect(AE.duck);
      const startAt = at + Math.max(0, sg.a - t0), off = Math.max(0, t0 - sg.a) % buf.duration, stopAt = at + (b - t0);
      const fi = Math.max(0, sg.a - t0) > 0 ? .5 : .15;
      g.gain.setValueAtTime(0, startAt); g.gain.linearRampToValueAtTime(1, startAt + fi);
      g.gain.setValueAtTime(1, Math.max(startAt + fi, stopAt - .6)); g.gain.linearRampToValueAtTime(0, stopAt);
      s.start(startAt, off); s.stop(stopAt + .05); this.nodes.push(s, g);
    }
    if (P.duck) {
      const dg = AE.duck.gain; dg.setValueAtTime(1, at);
      for (const v of [...voices, ...narrs]) { if (!v.buf) continue; const st = absT(v); if (st == null) continue; const a = st - t0, b = a + v.buf.duration; if (b < 0) continue;
        const A = at + Math.max(0, a); dg.setValueAtTime(1, Math.max(at, A - .25)); dg.linearRampToValueAtTime(.3, A); dg.setValueAtTime(.3, at + b); dg.linearRampToValueAtTime(1, at + b + .4); }
    }
  }
};
// 렌더된 오디오 버퍼를 프로미스에 붙여 두면 스케줄할 때 바로 꺼내 쓸 수 있어요
// (getSfx/getBgm는 async라 부를 때마다 새 프로미스가 나와요. 그래서 캐시에 있는 프로미스(AE.sfx[id]/AE.bgm[id])에 붙여야 재생할 때 찾을 수 있어요)
for (const [k, cache] of [['getSfx', 'sfx'], ['getBgm', 'bgm']]) { const orig = AE[k].bind(AE); AE[k] = async id => { const b = await orig(id); const p = AE[cache][id]; if (p) p.__buf = b; return b; }; }
function applyMix() { if (!AE.ctx || !P) return; for (const k of ['bgm', 'sfx', 'voice', 'narr']) AE.buses[k].gain.value = P.mix[k]; }

/* =========================================================
   저장 (자동 저장 + 작품함)
   ========================================================= */
let saveT = null;
function scheduleSave() { clearTimeout(saveT); const el = $('#savedState'); if (el) el.textContent = '저장 중…'; saveT = setTimeout(saveProject, 1200); }
function projectDump() {
  return {
    id: P.id, title: P.title, storyId: P.storyId, created: P.created, updated: P.updated, fps: P.fps, hold: P.hold,
    synopsis: P.synopsis || '', lastStep: P.lastStep || 'shoot', scriptMode: P.scriptMode, script: P.script, narrText: P.narrText, mix: P.mix, duck: P.duck, fade: P.fade, subs: P.subs, done: P.done, show: P.show || 0, stars: P.stars || [],
    fx: P.fx, sfx: P.sfx,
    scenes: P.scenes.map(s => ({ id: s.id, name: s.name, desc: s.desc || '', trimIn: s.trimIn, trimOut: s.trimOut, bgm: s.bgm, stage: s.stage, sketch: s.sketch ? s.sketch.blob : null, frames: s.frames.map(f => ({ id: f.id, hold: f.hold, blob: f.blob })) })),
    voices: P.voices.map(v => ({ ...v, buf: undefined })), narrs: P.narrs.map(v => ({ ...v, buf: undefined })),
    thumb: (P.scenes.find(s => s.frames.length) || { frames: [] }).frames[0]?.blob || null
  };
}
async function saveProject() {
  if (!P) return false;
  const dump = projectDump();
  try { await DB.put(dump); const el = $('#savedState'); if (el) el.textContent = '자동 저장됨 ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }); return true; }
  catch (e) { const el = $('#savedState'); if (el) el.textContent = '이 화면에서는 자동 저장이 안 돼요'; return false; }
}
/* 작품 파일 — 작품 하나를 파일 하나(.lunchbox.json)로. 사진·소리는 글자(base64)로 바꿔 넣어요. 다른 기기로 옮기거나 백업할 때 써요 */
const FILE_KIND = 'lunchbox-animation';
async function packBlobs(o) {
  if (o instanceof Blob) return { __blob: o.type, data: await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1] || ''); fr.readAsDataURL(o); }) };
  if (Array.isArray(o)) { const out = []; for (const x of o) out.push(await packBlobs(x)); return out; }
  if (o && typeof o === 'object') { const out = {}; for (const k in o) if (o[k] !== undefined) out[k] = await packBlobs(o[k]); return out; }
  return o;
}
function unpackBlobs(o) {
  if (Array.isArray(o)) return o.map(unpackBlobs);
  if (o && typeof o === 'object') {
    if ('__blob' in o) { const b = atob(o.data), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new Blob([u], { type: o.__blob }); }
    const out = {}; for (const k in o) out[k] = unpackBlobs(o[k]); return out;
  }
  return o;
}
/* d: DB에 저장된 모양. 파일을 다 만든 뒤 창에서 "보내기/저장"을 눌러요 (폰은 누르는 순간에만 공유 창이 열려요) */
async function exportProjectFile(d) {
  toast('작품 파일을 만드는 중…', 1500);
  const { trashed, ...rest } = d;
  const blob = new Blob([JSON.stringify({ kind: FILE_KIND, v: 1, saved: Date.now(), project: await packBlobs(rest) })], { type: 'application/json' });
  const fname = (d.title || '나의 작품').replace(/[\\/:*?"<>|]/g, '') + '.lunchbox.json';
  const file = new File([blob], fname, { type: 'application/json' });
  const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
  modal((b, m) => b.append(h('h2', {}, '작품 파일이 준비됐어요'),
    h('p', { class: 'hint', style: { margin: 0 } }, `${fname} (${(blob.size / 1048576).toFixed(1)}MB) · 다른 기기의 런치박스에서 “내 작품함 → 파일 불러오기”로 열 수 있어요.`),
    h('div', { class: 'acts' }, h('button', { class: 'btn', type: 'button', onclick: m.close }, '닫기'),
      canShare ? ib('upload', '보내기', 'btn', { onclick: () => navigator.share({ files: [file], title: d.title }).catch(() => { }) }) : '',
      ib('download', '파일로 저장', 'btn primary', { onclick: () => { saveFile(blob, fname, '작품 파일'); m.close(); } }))));
}
async function importProjectFile(file) {
  let o = null; try { o = JSON.parse(await file.text()); } catch (e) { }
  if (!o || o.kind !== FILE_KIND || !o.project || !Array.isArray(o.project.scenes)) { toast('런치박스 작품 파일이 아니에요'); return null; }
  const d = unpackBlobs(o.project); delete d.trashed;
  const all = await DB.all().catch(() => []);
  if (all.some(x => x.id === d.id)) { d.id = uid(); d.title = (d.title || '작품') + ' (가져옴)'; }
  d.updated = Date.now(); await DB.put(d); return d;
}

function loadImg(blob) { const url = URL.createObjectURL(blob); const img = new Image(); img.src = url; return { url, img }; }
async function decodeBlob(blob) { AE.init(); const ab = await blob.arrayBuffer(); return await new Promise((res, rej) => AE.ctx.decodeAudioData(ab, res, rej)); }
async function openProject(d) {
  const p = { ...d };
  p.scenes = d.scenes.map(s => ({ ...s, sketch: s.sketch ? { blob: s.sketch, ...loadImg(s.sketch) } : null, frames: s.frames.map(f => ({ ...f, ...loadImg(f.blob) })) }));
  p.voices = []; p.narrs = [];
  for (const k of ['voices', 'narrs']) for (const v of d[k] || []) { try { p[k].push({ ...v, buf: await decodeBlob(v.blob) }); } catch (e) { } }
  delete p.thumb; P = p; TLc = null; return p;
}

