/* =========================================================
   편집기 공통 도우미: 효과·효과음 키, 장면 자르기 창
   ========================================================= */
function sceneAt(t) { const r = TL().ranges.find(r => r.t1 > r.t0 && t >= r.t0 && t < r.t1) || TL().ranges.filter(r => r.t1 > r.t0).pop(); return r ? r.sc : P.scenes[0]; }
const sfxLen = s => { const p = AE.sfx[s.snd]; return p && p.__buf ? p.__buf.duration : .6; };
const FX_IC = { sparkle: 'sparkle', bubbles: 'bubbles', hearts: 'hearts', boom: 'boom', speed: 'speed', puff: 'puff', excl: 'excl', quest: 'quest', sweat: 'drop', light: 'light', rain: 'rain', snow: 'snow', dizzy: 'dizzy', text: 'text' };
const SFX_IC = { pop: 'pop', boing: 'spring', boom: 'boom', swoosh: 'wind', ding: 'bell', sparkle: 'sparkle', drop: 'drop', bubbles: 'bubbles', splash: 'splash', wave: 'wave', steps: 'foot', drum: 'drum', gong: 'gong', fail: 'sad' };
const TC = { fx: '#8A63C9', voice: '#3E7CB1', sfx: '#CF5D2A', bgm: '#4E9A63', narr: '#2F9C9A' };
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
