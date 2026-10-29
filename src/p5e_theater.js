/* =========================================================
   상영관 — 다 만든 작품을 올려서 친구들이 보고 별점을 줘요. 별점이 높을수록 순위가 올라가요.
   작품 문서(DB)에 d.show(올린 시각, 0이면 안 올림)와 d.stars(받은 별점 배열)로 저장해요.
   지금은 이 기기 안에서만 모여요. 다른 기기 친구에게는 작품 파일로 보내면 별점까지 같이 가요.
   ========================================================= */
let theaterBack = null;   // 완성 화면에서 왔으면 돌아갈 작품 id
const starAvg = d => (d.stars && d.stars.length ? d.stars.reduce((a, b) => a + b, 0) / d.stars.length : 0);
function rankWorks(list) {
  return list.filter(d => d.show).sort((a, b) => starAvg(b) - starAvg(a) || (b.stars || []).length - (a.stars || []).length || a.show - b.show);
}
function starRow(v, cls = '') {
  const el = h('span', { class: 'stars ' + cls, 'aria-label': `별점 ${v.toFixed(1)}` });
  for (let i = 1; i <= 5; i++) el.append(h('i', { class: v >= i - .25 ? 'on' : v >= i - .75 ? 'half' : '', html: icon('star') }));
  return el;
}
async function openTheater() {
  if (P && !$('#studio').hidden) { leaveStep(); await saveProject(); theaterBack = P.id; P = null; TLc = null; }
  show('library'); stopIntro();
  libTop('상영관 · 인기 순위', async () => {
    if (theaterBack) { const d = await DB.get(theaterBack).catch(() => null); theaterBack = null; if (d) { await openProject(d); openStudio('final'); return; } }
    openLibrary();
  }).append(key('작품 올리기', { ic: 'upload', cls: 'works hall', onclick: pickToShow }));
  const g = libBody('theater');
  const { list } = await loadWorks();
  const ranked = rankWorks(list);
  if (!ranked.length) {
    g.append(h('div', { class: 'th-empty' }, h('span', { html: icon('trophy') }), h('b', {}, '아직 올라온 작품이 없어요'),
      h('p', { class: 'hint' }, '작품을 다 만들고 완성 단계에서 “상영관”을 누르거나, 위의 “작품 올리기”로 올려요.')));
    return;
  }
  const box = h('div', { class: 'th-list scroll' });
  ranked.forEach((d, i) => {
    const th = h('div', { class: 'th' }); if (d.thumb) th.style.backgroundImage = `url(${URL.createObjectURL(d.thumb)})`;
    const n = (d.stars || []).length;
    box.append(h('button', { class: 'th-row' + (i < 3 && n ? ' top' + (i + 1) : ''), type: 'button', onclick: () => watchWork(d) },
      h('span', { class: 'rk' }, String(i + 1)), th,
      h('span', { class: 'th-t' }, h('b', {}, d.title || '제목 없음'), h('small', {}, storyInfo(d.storyId).title)),
      h('span', { class: 'th-s' }, starRow(starAvg(d)), h('small', {}, n ? `${starAvg(d).toFixed(1)} · ${n}명` : '아직 별점 없음')),
      h('span', { class: 'th-p', html: icon('play') })));
  });
  g.append(box);
}
/* 이 기기의 작품 중에서 골라 올리기 */
async function pickToShow() {
  const { list } = await loadWorks();
  const can = list.filter(d => !d.show && d.scenes.some(s => s.frames.length));
  modal((b, m) => {
    b.append(h('h2', {}, '어떤 작품을 올릴까요?'));
    if (!can.length) b.append(h('p', { class: 'hint' }, '올릴 수 있는 작품이 없어요. 촬영한 컷이 있는 작품만 올릴 수 있어요. 친구가 보낸 작품 파일은 “내 작품함 → 파일 불러오기”로 먼저 열어요.'));
    const box = h('div', { class: 'works' });
    for (const d of can) {
      const th = h('div', { class: 'th' }); if (d.thumb) th.style.backgroundImage = `url(${URL.createObjectURL(d.thumb)})`;
      box.append(h('div', { class: 'work-i' }, th,
        h('div', {}, h('b', { style: { fontFamily: 'var(--display)', fontWeight: 800, fontSize: '16px' } }, d.title), h('div', { class: 'hint' }, storyInfo(d.storyId).title)),
        h('button', { class: 'btn sm accent', type: 'button', onclick: async () => { d.show = Date.now(); d.stars = d.stars || []; await DB.put(d); m.close(); toast(`“${d.title}”을(를) 상영관에 올렸어요`); openTheater(); } }, '올리기')));
    }
    b.append(box, h('div', { class: 'acts' }, h('button', { class: 'btn primary', type: 'button', onclick: m.close }, '닫기')));
  }, { wide: true });
}
/* 감상 — 왼쪽 큰 화면에서 재생, 오른쪽에서 별점 주기 (한 번 볼 때 한 번) */
async function watchWork(d) {
  toast('작품을 여는 중…', 1200);
  await openProject(d);
  const cv = h('canvas', { class: 'stage', width: W, height: H });
  const playK = key('', { ic: 'play', cls: 'orange', aria: '재생' });
  let rated = false;
  const avgEl = h('div', { class: 'tw-avg' });
  const paintAvg = () => { const n = (d.stars || []).length; avgEl.innerHTML = ''; avgEl.append(starRow(starAvg(d)), h('small', {}, n ? `평균 ${starAvg(d).toFixed(1)} · ${n}명` : '첫 별점을 주세요')); };
  const give = h('div', { class: 'tw-give', role: 'group', 'aria-label': '별점 주기' });
  for (let i = 1; i <= 5; i++) give.append(h('button', { type: 'button', 'aria-label': `별 ${i}개`, html: icon('star'),
    onpointerenter: () => !rated && paintGive(i), onpointerleave: () => !rated && paintGive(0),
    onclick: async () => {
      if (rated) return; rated = true; paintGive(i);
      d.stars = [...(d.stars || []), i]; await DB.put(d); paintAvg();
      give.classList.add('done'); msg.textContent = `별 ${i}개, 고마워요!`;
    } }));
  const paintGive = n => [...give.children].forEach((b, k) => b.classList.toggle('on', k < n));
  const msg = h('div', { class: 'hint tw-msg' }, '다 보고 별을 눌러 주세요');
  const close = () => { Player.pause(); Player.onState = null; ov.remove(); P = null; TLc = null; openTheater(); };
  const ov = h('div', { class: 'tw' },
    h('div', { class: 'tw-stage' }, h('div', { class: 'monitor' }, h('div', { class: 'stage-wrap' }, cv))),
    h('div', { class: 'tw-side' },
      h('div', { class: 'tw-top' }, h('b', {}, d.title || '제목 없음'), key('', { ic: 'x', cls: 'dim', aria: '닫기', onclick: close })),
      h('small', { class: 'hint' }, storyInfo(d.storyId).title + ' · ' + fmt(TL().total).replace(/\.\d$/, '')),
      avgEl, playK,
      h('div', { class: 'tw-rate' }, h('span', { class: 'label' }, '별점 주기'), give, msg),
      h('div', { class: 'row tw-acts' },
        ib('upload', '친구에게 보내기', 'btn sm', { onclick: () => exportProjectFile(d) }),
        ib('x', '내리기', 'btn sm ghost', { onclick: async () => { if (await confirmBox('상영관에서 내릴까요?', '작품은 내 작품함에 그대로 있어요. 받은 별점도 남아 있어요.', '내리기')) { d.show = 0; await DB.put(d); close(); } } }))));
  $('#app').append(ov);
  paintAvg();
  Player.attach(cv);
  Player.onState = on => { playK.innerHTML = icon(on ? 'pause' : 'play', 'ki'); };
  playK.onclick = () => Player.toggle();
  Player.t = 0; Player.draw();
  Player.play();
}
