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
function scriptEditor(onSave) {
  const rows = (P.script || []).map(l => ({ ...l }));
  modal((b, m) => {
    const list = h('div', { class: 'script-table' });
    const dl = h('datalist', { id: 'whoList' }, ...Object.keys(CHAR_COLORS).map(k => h('option', { value: k })));
    const draw = () => {
      list.innerHTML = '';
      if (!rows.length) list.append(h('p', { class: 'hint' }, '아직 대사가 없어요. “＋ 대사 한 줄”을 누르거나, 미리 써 둔 대사 파일을 불러오세요.'));
      rows.forEach((r, i) => list.append(h('div', { class: 'script-row' },
        h('input', { class: 'input', value: r.who, list: 'whoList', placeholder: '누가', 'aria-label': `${i + 1}번 대사 인물`, oninput: e => r.who = e.target.value }),
        h('textarea', { class: 'input', rows: 2, placeholder: '무슨 말을 할까요?', 'aria-label': `${i + 1}번 대사 내용`, oninput: e => r.text = e.target.value }, r.text),
        h('select', { class: 'input', 'aria-label': `${i + 1}번 대사 장면`, onchange: e => r.scene = e.target.value || null }, h('option', { value: '' }, '장면 선택'), ...P.scenes.map(s => h('option', { value: s.id, selected: r.scene === s.id }, s.name))),
        h('div', { class: 'row nowrap' },
          ib('up', '', 'btn sm icon ghost', { 'aria-label': '위로', onclick: () => { if (i) { [rows[i - 1], rows[i]] = [rows[i], rows[i - 1]]; draw(); } } }),
          ib('trash', '', 'btn sm icon ghost', { 'aria-label': '지우기', onclick: () => { rows.splice(i, 1); draw(); } })))));
    };
    const up = h('input', { type: 'file', accept: '.txt,.csv,.md,.text,text/plain', hidden: true, onchange: async e => { const f = e.target.files[0]; if (!f) return; const parsed = parseScript(await f.text()); rows.push(...parsed); draw(); toast(`대사 ${parsed.length}줄을 불러왔어요`); } });
    b.append(h('h2', {}, '대사 가이드 쓰기'),
      h('p', { class: 'hint', style: { margin: 0 } }, '녹음할 때 화면에 나오는 대사 대본이에요. 미리 써 둔 파일(.txt, .csv)이 있으면 불러올 수 있어요. 한 줄에 “인물: 대사” 모양으로 쓰면 인물과 대사가 나뉘어 들어가요.'),
      h('div', { class: 'row' }, ib('upload', '대사 파일 불러오기', 'btn sm', { onclick: () => up.click() }), ib('book', '원작 대사 넣기', 'btn sm', { onclick: () => { rows.push(...originalScript()); draw(); } }), up, dl),
      list,
      h('div', { class: 'row' }, ib('plus', '대사 한 줄', 'btn sm', { onclick: () => { rows.push({ id: uid(), who: rows.length ? rows[rows.length - 1].who : '토끼', text: '', scene: P.scenes[0].id }); draw(); setTimeout(() => { const t = $$('textarea', list).pop(); t && t.focus(); }, 30); } })),
      h('div', { class: 'acts' }, h('button', { class: 'btn', onclick: m.close }, '닫기'), h('button', { class: 'btn primary', onclick: () => { P.script = rows.filter(r => r.text.trim()); changed(); m.close(); onSave && onSave(); } }, '대사 가이드 저장')));
    draw();
  }, { wide: true, close: false });
}
