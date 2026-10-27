/* =========================================================
   시나리오 (줄거리 · 장면 나누기 · 대사 가이드) — 한 화면, 목록만 안에서 넘겨 봐요
   ========================================================= */
const ORIGINAL_SYNOPSIS = '용왕님이 병에 걸려 토끼의 간이 필요해요. 자라(별주부)가 육지에서 토끼를 꾀어 용궁으로 데려오지만, 토끼는 “간을 육지에 두고 왔다”고 속이고 달아나요.';
STEP_MOD.script = (() => {
  let main;
  function mount(r) { main = r.main; render(); }
  function render(focusLast) {
    main.innerHTML = '';
    const orig = P.storyId === 'byeoljubu';
    const top = h('div', { class: 'row nowrap', style: { gridColumn: '1 / -1' } }, navKey(), undoKey(),
      h('span', { class: 'label', style: { whiteSpace: 'nowrap' } }, '영상 제목'),
      h('input', { class: 'input grow', value: P.title, maxlength: 40, style: { maxWidth: '320px', padding: '7px 10px' }, oninput: e => { P.title = e.target.value; changed(); } }),
      h('div', { class: 'spacer' }),
      orig ? key('원작 보기', { ic: 'play', cls: 'row', onclick: () => { leaveStep(); introReturn = 'script'; startIntro(); } }) : '',
      key('촬영하러 가기', { ic: 'next', cls: 'orange row', onclick: () => nextStep('script') }));
    // 왼쪽: 줄거리 + 장면
    const scenes = h('div', { class: 'scroll' });
    P.scenes.forEach((s, i) => scenes.append(h('div', { class: 'sc-card', style: { padding: '6px' } },
      h('span', { class: 'n', style: { paddingTop: '4px' } }, i + 1),
      h('div', { class: 'f' },
        h('input', { class: 'input', value: s.name, maxlength: 30, 'aria-label': `${i + 1}번 장면 이름`, oninput: e => { s.name = e.target.value; changed(); } }),
        h('input', { class: 'input', value: s.desc || '', placeholder: '이 장면에서 무슨 일이 일어나나요?', 'aria-label': `${i + 1}번 장면 설명`, style: { fontSize: '13px' }, oninput: e => { s.desc = e.target.value; changed(); } })),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
        ib('up', '', 'btn sm icon ghost', { 'aria-label': '위로', disabled: i === 0, onclick: () => { [P.scenes[i - 1], P.scenes[i]] = [P.scenes[i], P.scenes[i - 1]]; changed(); render(); } }),
        P.scenes.length > 1 ? ib('trash', '', 'btn sm icon ghost', { 'aria-label': '장면 지우기', onclick: async () => { if (s.frames.length && !await confirmBox('장면을 지울까요?', `“${s.name}”에 찍은 컷 ${s.frames.length}개도 함께 지워져요.`, '지우기', true)) return; P.scenes.splice(i, 1); for (const k of ['fx', 'sfx', 'voices', 'narrs']) P[k] = P[k].filter(it => it.sid !== s.id); changed(); render(); } }) : ''))));
    const left = h('div', { class: 'col well' },
      h('h3', {}, '줄거리'),
      orig ? h('div', { class: 'card', style: { fontSize: '12.5px', lineHeight: 1.55, padding: '8px 10px' } }, ORIGINAL_SYNOPSIS)
        : h('textarea', { class: 'input', rows: 2, placeholder: '누가, 어디서, 무슨 일이 생기고, 어떻게 끝나나요?', style: { fontSize: '13.5px', resize: 'none' }, oninput: e => { P.synopsis = e.target.value; changed(); } }, P.synopsis || ''),
      h('div', { class: 'panel-title' }, h('h3', {}, `장면 ${P.scenes.length}개`),
        h('div', { class: 'row' }, orig && P.scenes.length < ORIGINAL_SCENES.length ? ib('book', '원작 장면', 'btn sm', { onclick: () => { for (const n of ORIGINAL_SCENES) if (!P.scenes.some(s => s.name === n)) P.scenes.push(newScene(n)); changed(); render(); } }) : '',
          ib('plus', '장면', 'btn sm', { onclick: () => { P.scenes.push(newScene(`${P.scenes.length + 1}장면`)); changed(); render(true); } }))),
      scenes);
    // 오른쪽: 대사 가이드
    P.script = P.script || [];
    const up = h('input', { type: 'file', accept: '.txt,.csv,.md,.text,text/plain', hidden: true, onchange: async e => { const f = e.target.files[0]; if (!f) return; const parsed = parseScript(await f.text()); P.script.push(...parsed); if (!P.scriptMode) P.scriptMode = 'new'; changed(); render(); toast(`대사 ${parsed.length}줄을 불러왔어요`); } });
    const dl = h('datalist', { id: 'whoList2' }, ...Object.keys(CHAR_COLORS).map(k => h('option', { value: k })));
    const lines = h('div', { class: 'scroll' });
    if (!P.script.length) lines.append(h('div', { class: 'card hint' }, orig ? '“원작 대사”를 누르면 별주부전 대사 12줄이 들어와요. 미리 써 둔 파일(.txt, .csv)은 한 줄에 “인물: 대사”로 쓰면 그대로 불러와요.' : '“＋ 대사”를 눌러 첫 대사를 써 보세요. 미리 써 둔 파일(.txt, .csv)은 한 줄에 “인물: 대사”로 쓰면 그대로 불러와요.'));
    P.script.forEach((r, i) => lines.append(h('div', { class: 'script-row' },
      h('input', { class: 'input', value: r.who, list: 'whoList2', placeholder: '누가', 'aria-label': `${i + 1}번 대사 인물`, oninput: e => { r.who = e.target.value; changed(); } }),
      h('input', { class: 'input', value: r.text, placeholder: '무슨 말을 할까요?', 'aria-label': `${i + 1}번 대사 내용`, oninput: e => { r.text = e.target.value; changed(); } }),
      h('select', { class: 'input', 'aria-label': `${i + 1}번 대사 장면`, onchange: e => { r.scene = e.target.value || null; changed(); } }, h('option', { value: '' }, '장면'), ...P.scenes.map(s => h('option', { value: s.id, selected: r.scene === s.id }, s.name))),
      ib('trash', '', 'btn sm icon ghost', { 'aria-label': '대사 지우기', onclick: () => { P.script.splice(i, 1); changed(); render(); } }))));
    const right = h('div', { class: 'col well' },
      h('div', { class: 'panel-title' }, h('h3', {}, `대사 ${P.script.length}줄`),
        h('div', { class: 'row' },
          ib('upload', '', 'btn sm icon', { 'aria-label': '대사 파일 불러오기', title: '대사 파일 불러오기 (.txt, .csv)', onclick: () => up.click() }),
          orig ? ib('book', '원작', 'btn sm', { onclick: () => { P.script.push(...originalScript()); P.scriptMode = P.scriptMode || 'original'; changed(); render(); } }) : '',
          ib('plus', '대사', 'btn sm', { onclick: () => { P.script.push({ id: uid(), who: P.script.length ? P.script[P.script.length - 1].who : '', text: '', scene: P.scenes[0].id }); if (!P.scriptMode) P.scriptMode = 'new'; changed(); render(true); } }), up, dl)),
      lines);
    main.append(top, left, right);
    if (focusLast) requestAnimationFrame(() => { for (const box of [scenes, lines]) box.scrollTop = box.scrollHeight; const inp = $$('.script-row input:nth-child(2)', main).pop(); inp && !inp.value && inp.focus(); });
  }
  return { mount, unmount() { }, layout: 'doc' };
})();
