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
for (const k of ['getSfx', 'getBgm']) { const orig = AE[k].bind(AE); AE[k] = async id => { const p = orig(id); const b = await p; p.__buf = b; return b; }; }
function applyMix() { if (!AE.ctx || !P) return; for (const k of ['bgm', 'sfx', 'voice', 'narr']) AE.buses[k].gain.value = P.mix[k]; }

/* =========================================================
   타임라인 UI — 트랙마다 색이 있어요 (효과 보라 · 대사 파랑 · 효과음 주황 · 배경음악 초록 · 나레이션 청록)
   ========================================================= */
class Timeline {
  constructor(host, o) {
    this.host = host; this.o = o; this.build();
    if (window.ResizeObserver) { this.ro = new ResizeObserver(() => { const w = this.scroll.clientWidth; if (w && w !== this.lastW) this.render(); }); this.ro.observe(host); }
  }
  build() {
    this.host.innerHTML = '';
    this.scroll = h('div', { class: 'tl' }); this.inner = h('div', { class: 'tl-inner' }); this.scroll.append(this.inner);
    this.host.append(this.scroll); this.render();
  }
  render() {
    const tl = TL(), total = Math.max(tl.total, 1), cw = this.scroll.clientWidth || 600; this.lastW = cw;
    const X0 = this.X0 = Math.round(clamp(cw * .11, 68, 100));
    const pps = this.pps = Math.max(18, (cw - X0 - 10) / total);
    const width = Math.max(X0 + total * pps + 10, cw);
    this.inner.innerHTML = ''; this.inner.style.width = width + 'px'; this.inner.style.setProperty('--x0', X0 + 'px');
    const ruler = h('div', { class: 'tl-ruler' });
    const stepS = pps > 120 ? .5 : pps > 50 ? 1 : pps > 22 ? 2 : 5;
    const every = Math.max(1, Math.ceil(34 / (pps * stepS)));
    for (let k = 0, s = 0; s <= total + 1e-6; k++, s = k * stepS) { ruler.append(h('i', { style: { left: X0 + s * pps + 'px' } })); if (k % every === 0) ruler.append(h('span', { style: { left: X0 + s * pps + 'px' } }, fmt(s).replace(/\.0$/, ''))); }
    const seekFrom = e => { const r = appRect(this.inner); Player.seek((appPt(e).x - r.left - X0) / pps); };
    ruler.addEventListener('pointerdown', e => { seekFrom(e); const mv = ev => seekFrom(ev); const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); });
    this.inner.append(ruler);
    const row = (label, color, dim) => { const r = h('div', { class: 'tl-track' + (dim ? ' dim' : ''), style: { '--tc': color } }, h('span', { class: 'tl-lab' }, label)); r.style.setProperty('--tc', color); return r; };
    // 영상(장면) 줄
    const st = row('영상', '#3A3734', this.o.sceneDim);
    for (const r of tl.ranges) {
      if (r.t1 <= r.t0) continue;
      const f = r.sc.frames[r.sc.trimIn];
      st.append(h('div', { class: 'tl-scene', style: { left: X0 + r.t0 * pps + 'px', width: Math.max(4, (r.t1 - r.t0) * pps - 2) + 'px', backgroundImage: f ? `url(${f.url})` : '' }, title: r.sc.name, onclick: e => { const rr = appRect(this.inner); const t = clamp((appPt(e).x - rr.left - X0) / pps, r.t0, r.t1 - .001); Player.seek(t); this.o.onScene && this.o.onScene(r.sc, t); } }, h('span', {}, r.sc.name)));
    }
    this.inner.append(st);
    for (const tr of this.o.tracks || []) {
      const rw = row(tr.label, tr.color, tr.dim);
      rw.addEventListener('pointerdown', e => { if (e.target === rw || e.target.classList.contains('tl-lab')) seekFrom(e); });
      if (tr.key === 'bgm') {
        for (const r of tl.ranges) {
          if (r.t1 <= r.t0 || !r.sc.bgm) continue; const b = BGM.find(x => x.id === r.sc.bgm);
          rw.append(h('div', { class: 'tl-item', style: { left: X0 + r.t0 * pps + 'px', width: Math.max(10, (r.t1 - r.t0) * pps - 2) + 'px', background: tr.color, cursor: 'pointer' }, onclick: () => { Player.seek(r.t0 + .001); tr.onSelect && tr.onSelect(r.sc); }, html: icon('music') + `<span>${b ? b.name : ''}</span>` }));
        }
      } else for (const it of tr.items()) {
        const t = absT(it); if (t == null) continue;
        const len = tr.len(it);
        const el = h('div', { class: 'tl-item' + (S.sel && S.sel.id === it.id ? ' sel' : ''), style: { left: X0 + t * pps + 'px', width: Math.max(18, len * pps) + 'px', background: tr.color }, html: (tr.icon ? icon(tr.icon) : '') + `<span>${tr.text(it)}</span>` });
        this.dragItem(el, it, tr);
        rw.append(el);
      }
      this.inner.append(rw);
    }
    this.head = h('div', { class: 'tl-head' }); this.inner.append(this.head);
    this.update(Player.t);
  }
  dragItem(el, it, tr) {
    el.addEventListener('pointerdown', e => {
      e.stopPropagation(); el.setPointerCapture(e.pointerId);
      const x0 = appPt(e).x, t0 = absT(it); let moved = false;
      S.sel = { kind: tr.key, id: it.id }; $$('.tl-item.sel', this.inner).forEach(x => x.classList.remove('sel')); el.classList.add('sel');
      tr.onSelect && tr.onSelect(it);
      const mv = ev => { const dx = appPt(ev).x - x0; if (Math.abs(dx) > 3) moved = true; if (!moved) return; const nt = Math.max(0, t0 + dx / this.pps); el.style.left = this.X0 + nt * this.pps + 'px'; it.__nt = nt; };
      const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        if (moved && it.__nt != null) { setAbs(it, it.__nt); delete it.__nt; changed(); tr.onMove && tr.onMove(it); this.render(); } else { Player.seek(t0); } };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
  }
  update(t) {
    if (!this.head) return; const x = this.X0 + t * this.pps; this.head.style.left = x + 'px';
    const sc = this.scroll; if (Player.playing && (x < sc.scrollLeft + this.X0 || x > sc.scrollLeft + sc.clientWidth - 30)) sc.scrollLeft = x - this.X0 - 40;
  }
}

/* =========================================================
   저장 (자동 저장 + 작품함)
   ========================================================= */
let saveT = null;
function scheduleSave() { clearTimeout(saveT); const el = $('#savedState'); if (el) el.textContent = '저장 중…'; saveT = setTimeout(saveProject, 1200); }
async function saveProject() {
  if (!P) return false;
  const dump = {
    id: P.id, title: P.title, storyId: P.storyId, created: P.created, updated: P.updated, fps: P.fps, hold: P.hold,
    synopsis: P.synopsis || '', lastStep: P.lastStep || 'shoot', scriptMode: P.scriptMode, script: P.script, narrText: P.narrText, mix: P.mix, duck: P.duck, fade: P.fade, subs: P.subs, done: P.done,
    fx: P.fx, sfx: P.sfx,
    scenes: P.scenes.map(s => ({ id: s.id, name: s.name, desc: s.desc || '', trimIn: s.trimIn, trimOut: s.trimOut, bgm: s.bgm, stage: s.stage, frames: s.frames.map(f => ({ id: f.id, hold: f.hold, blob: f.blob })) })),
    voices: P.voices.map(v => ({ ...v, buf: undefined })), narrs: P.narrs.map(v => ({ ...v, buf: undefined })),
    thumb: (P.scenes.find(s => s.frames.length) || { frames: [] }).frames[0]?.blob || null
  };
  try { await DB.put(dump); const el = $('#savedState'); if (el) el.textContent = '자동 저장됨 ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }); return true; }
  catch (e) { const el = $('#savedState'); if (el) el.textContent = '이 화면에서는 자동 저장이 안 돼요'; return false; }
}
function loadImg(blob) { const url = URL.createObjectURL(blob); const img = new Image(); img.src = url; return { url, img }; }
async function decodeBlob(blob) { AE.init(); const ab = await blob.arrayBuffer(); return await new Promise((res, rej) => AE.ctx.decodeAudioData(ab, res, rej)); }
async function openProject(d) {
  const p = { ...d };
  p.scenes = d.scenes.map(s => ({ ...s, frames: s.frames.map(f => ({ ...f, ...loadImg(f.blob) })) }));
  p.voices = []; p.narrs = [];
  for (const k of ['voices', 'narrs']) for (const v of d[k] || []) { try { p[k].push({ ...v, buf: await decodeBlob(v.blob) }); } catch (e) { } }
  delete p.thumb; P = p; TLc = null; return p;
}

