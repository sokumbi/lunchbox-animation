/* =========================================================
   더하기: 제목 카드 · 엔딩 크레딧 페이지(openCard) · 전래동화(스토리 보기 애니메이션) · 처음 한 번 설명 레이어(hintOnce)
   ========================================================= */
const CARD_DUR = 2.5, CREDIT_DUR = 4;
/* 글씨체 — 구글 폰트(p1_head). 인터넷이 없으면 기본 글꼴로 나와요 */
const FONTS = [
  { id: 'jua', name: '둥글둥글', ff: 'Jua' },
  { id: 'black', name: '아주 굵게', ff: '"Black Han Sans"' },
  { id: 'pen', name: '손글씨', ff: '"Nanum Pen Script"', k: 1.35 },
  { id: 'gaegu', name: '귀여운', ff: 'Gaegu', w: 700, k: 1.15 },
  { id: 'serif', name: '명조', ff: '"Noto Serif KR"', w: 700, k: .92 },
  { id: 'dohyeon', name: '또박또박', ff: '"Do Hyeon"' }
];
const fontOf = id => FONTS.find(f => f.id === id) || FONTS[0];
const fontCSS = (id, px) => { const f = fontOf(id); return `${f.w || 400} ${Math.round(px * (f.k || 1))}px ${f.ff}, "Apple SD Gothic Neo", sans-serif`; };
let fontsLoaded = false;
async function fontsReady() { if (fontsLoaded || !document.fonts) return; try { await Promise.all(FONTS.map(f => document.fonts.load(`${f.w || 400} 40px ${f.ff}`))); } catch (e) { } fontsLoaded = true; }
/* 샘플 디자인 — 전부 캔버스로 그려요 (외부 그림 없음). ink: 글자색 */
const DESIGNS = [
  { id: 'sunset', name: '노을', ink: '#fff' },
  { id: 'night', name: '밤하늘', ink: '#fff' },
  { id: 'meadow', name: '풀밭', ink: '#fff' },
  { id: 'paper', name: '종이', ink: '#3b2a1a' },
  { id: 'stage', name: '무대', ink: '#ffe9a8' },
  { id: 'film', name: '필름', ink: '#fff' }
];
const designOf = id => DESIGNS.find(d => d.id === id) || DESIGNS[0];
function drawDesign(ctx, id, t = 0) {
  const g = (a, b) => { const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
  ctx.save();
  if (id === 'sunset') {
    ctx.fillStyle = g('#ff9a5c', '#c0397a'); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(W * .72, H * .62 + Math.sin(t * 2) * 4, H * .17, 0, 7); ctx.fill();
    ctx.fillStyle = '#6b2252'; ctx.beginPath(); ctx.moveTo(0, H * .8); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, H * .78 + Math.sin(x / 90 + 1) * 18); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  } else if (id === 'night') {
    ctx.fillStyle = g('#0b1a3a', '#1d2f6b'); ctx.fillRect(0, 0, W, H);
    const rnd = seeded ? seeded('night') : Math.random;
    for (let i = 0; i < 70; i++) { const x = rnd() * W, y = rnd() * H * .85, r = 1 + rnd() * 2.2, tw = .55 + .45 * Math.sin(t * 3 + i); ctx.globalAlpha = tw; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(W * .82, H * .22, H * .09, 0, 7); ctx.fill();
    ctx.fillStyle = '#0b1a3a'; ctx.beginPath(); ctx.arc(W * .82 - H * .04, H * .2, H * .08, 0, 7); ctx.fill();
  } else if (id === 'meadow') {
    ctx.fillStyle = g('#6ec6ff', '#cdeeff'); ctx.fillRect(0, 0, W, H * .7);
    ctx.fillStyle = '#fff'; for (const [x, y, s] of [[.2, .22, 1], [.6, .14, .8], [.85, .3, .6]]) { const cx = (x + t * .01) % 1.2 * W, cy = y * H, r = H * .07 * s; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.arc(cx + r, cy + r * .3, r * .8, 0, 7); ctx.arc(cx - r, cy + r * .3, r * .7, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#5db25a'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * .68); ctx.quadraticCurveTo(W * .3, H * .52, W * .55, H * .66); ctx.quadraticCurveTo(W * .8, H * .78, W, H * .62); ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = '#3f9a45'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * .82); ctx.quadraticCurveTo(W * .5, H * .7, W, H * .84); ctx.lineTo(W, H); ctx.fill();
  } else if (id === 'paper') {
    ctx.fillStyle = '#f6edd9'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#e4d6b8'; ctx.lineWidth = 1; for (let y = 70; y < H; y += 46) { ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke(); }
    ctx.fillStyle = '#d9b36a99'; for (const [x, y, a] of [[60, 40, -.5], [W - 60, 40, .5]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillRect(-46, -14, 92, 28); ctx.restore(); }
  } else if (id === 'stage') {
    ctx.fillStyle = '#2a0b0b'; ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 48) { const gr = ctx.createLinearGradient(x, 0, x + 48, 0); gr.addColorStop(0, '#a3121e'); gr.addColorStop(.5, '#d93a3a'); gr.addColorStop(1, '#8c0f1a'); ctx.fillStyle = gr; ctx.fillRect(x, 0, 48, H); }
    const sp = ctx.createRadialGradient(W / 2, H * .45, 20, W / 2, H * .45, W * .55); sp.addColorStop(0, 'rgba(255,240,180,.55)'); sp.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = sp; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#5b2a0a'; ctx.fillRect(0, H * .9, W, H * .1);
  } else {
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2e2e2e'; ctx.fillRect(0, H * .1, W, H * .8);
    ctx.fillStyle = '#eee'; const off = (t * 60) % 56; for (let x = -56 + off; x < W; x += 56) { ctx.fillRect(x, H * .025, 30, H * .05); ctx.fillRect(x, H * .925, 30, H * .05); }
  }
  ctx.restore();
}
/* 글자를 가운데에, 길면 줄 바꿈. style: 디자인의 글자색 + 그림자 */
function drawCardText(ctx, text, fontId, px, cy, ink, maxW = W * .84) {
  ctx.font = fontCSS(fontId, px); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lines = text.split('\n').flatMap(l => wrapText(ctx, l, maxW)), lh = px * 1.25, y0 = cy - (lines.length - 1) * lh / 2;
  ctx.shadowColor = ink === '#fff' || ink === '#ffe9a8' ? 'rgba(0,0,0,.45)' : 'rgba(0,0,0,0)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
  ctx.fillStyle = ink; lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * lh));
  ctx.shadowColor = 'transparent'; return lines.length;
}
function drawTitleCard(ctx, card, title, p = 0) {
  const d = designOf(card && card.design), k = 1 + p * .05;
  ctx.save(); drawDesign(ctx, d.id, p * CARD_DUR);
  ctx.translate(W / 2, H / 2); ctx.scale(k, k); ctx.translate(-W / 2, -H / 2);
  ctx.globalAlpha = Math.min(1, p * 4);
  drawCardText(ctx, title || '제목', card && card.font, 84, H * .5, d.ink);
  ctx.restore();
}
function drawCredits(ctx, cr, p = 0) {
  const d = designOf(cr && cr.design), text = (cr && cr.text || '').trim();
  ctx.save(); drawDesign(ctx, d.id, p * CREDIT_DUR);
  ctx.font = fontCSS(cr && cr.font, 52); const lines = text.split('\n').flatMap(l => wrapText(ctx, l, W * .84)), lh = 52 * 1.4, total = lines.length * lh;
  const y = H + 30 - p * (H + total + 60);   // 아래에서 위로 흘러요
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = d.ink;
  ctx.shadowColor = d.ink === '#3b2a1a' ? 'transparent' : 'rgba(0,0,0,.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, y + i * lh + lh / 2));
  ctx.restore();
}

/* ---------- 제목 카드 · 엔딩 크레딧 페이지 ---------- */
function openCard(kind) {
  closeScreen(); show('studio'); V.screen = 'card'; S.step = 'card'; histInit();
  const isT = kind === 'title', body = $('#stBody'); body.innerHTML = '';
  const st = isT ? P.card : P.credits;
  const cv = h('canvas', { class: 'stage', width: W, height: H });
  const stage = h('div', { class: 'dc-mon' }, cv);
  const inp = isT
    ? h('input', { class: 'input cp-in', value: P.title, maxlength: 24, placeholder: '작품 제목', 'aria-label': '작품 제목', oninput: e => { P.title = e.target.value; changed(); paintTiles(); } })
    : h('textarea', { class: 'input cp-in', rows: 3, maxlength: 200, placeholder: '만든 사람\n이름을 써요', 'aria-label': '엔딩 크레딧 글', oninput: e => { st.text = e.target.value; changed(); } });
  if (!isT) inp.value = st.text || '';
  const left = h('div', { class: 'dc-l rail' }, rb('back', isT ? '내 작품' : '꾸미기', isT ? toGallery : openDeco));
  const pane = h('div', { class: 'dc-pane list' });
  const go = h('button', { class: 'sh-done cp-go', type: 'button', html: icon(isT ? 'cam' : 'share') + `<span>${isT ? '다 골랐어요' : '다 썼어요'}<b>${isT ? '촬영 ›' : '내보내기 ›'}</b></span>`, onclick: async () => { await saveProject(); if (isT) openShoot(); else { V.tool = 'share'; openDeco(); } } });
  body.append(h('div', { class: 'dc cp' }, left, h('div', { class: 'dc-c' }, stage, h('div', { class: 'cp-row' }, h('span', { class: 'cp-lab' }, isT ? '제목' : '크레딧'), inp)), h('div', { class: 'dc-r' }, pane, go)));
  EL = { cv, ctx: cv.getContext('2d'), pane, tiles: [] };
  const minis = [];
  const paintTiles = () => { for (const m of minis) m(); };
  const sec = (title) => h('p', { class: 'dc-tip cp-sec' }, title);
  const dTiles = h('div', { class: 'tiles cp-tiles' });
  const pick = (id) => { if (id === null) st.on = false; else { st.design = id; if (isT) st.on = true; } changed(); [...dTiles.children].forEach(b => b.classList.toggle('on', b.dataset.id === String(id))); };
  const mini = (id) => {
    const c = h('canvas', { width: 192, height: 108 }); const paint = () => { const x = c.getContext('2d'); x.setTransform(192 / W, 0, 0, 108 / H, 0, 0); if (id === null) { x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.fillStyle = '#8e8e93'; x.font = '60px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('✕', W / 2, H / 2); } else { drawDesign(x, id, 0); drawCardText(x, isT ? (P.title || '제목') : '만든 사람', st.font, 84, H / 2, designOf(id).ink); } };
    minis.push(paint); paint(); return c;
  };
  const dtile = (id, name) => { const b = h('button', { class: 'cp-tile' + ((id === null ? isT && !st.on : (st.design === id && (!isT || st.on))) ? ' on' : ''), type: 'button', 'data-id': String(id), 'aria-label': name, onclick: () => pick(id) }, mini(id), h('span', {}, name)); return b; };
  if (isT) dTiles.append(dtile(null, '제목 없이'));
  for (const d of DESIGNS) dTiles.append(dtile(d.id, d.name));
  const fTiles = h('div', { class: 'tiles cp-tiles' });
  for (const f of FONTS) fTiles.append(h('button', { class: 'cp-font' + (st.font === f.id ? ' on' : ''), type: 'button', 'aria-label': f.name, style: { font: fontCSS(f.id, 20) }, onclick: e => { st.font = f.id; changed(); [...fTiles.children].forEach(b => b.classList.toggle('on', b === e.currentTarget)); paintTiles(); } }, f.name));
  pane.append(sec(isT ? '디자인을 골라요' : '배경을 골라요'), dTiles, sec('글씨체를 골라요'), fTiles);
  fontsReady().then(paintTiles);
  // 미리 보기: 제목은 살짝 커지고, 크레딧은 아래에서 위로 흘러요
  const t0 = performance.now(), dur = isT ? CARD_DUR : CREDIT_DUR;
  const loop = () => {
    if (V.screen !== 'card') return; V.raf = requestAnimationFrame(loop);
    const p = ((performance.now() - t0) / 1000 % (dur + .8)) / dur, ctx = EL.ctx; ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (isT) { if (st.on) drawTitleCard(ctx, st, P.title, Math.min(1, p)); else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#8e8e93'; ctx.font = '30px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('제목 카드 없이 바로 시작해요', W / 2, H / 2); } }
    else { if ((st.text || '').trim()) drawCredits(ctx, st, Math.min(1, p)); else { drawDesign(ctx, st.design, 0); ctx.fillStyle = designOf(st.design).ink; ctx.globalAlpha = .6; ctx.font = '30px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('아래에 만든 사람 이름을 써요', W / 2, H / 2); ctx.globalAlpha = 1; } }
  };
  cancelAnimationFrame(V.raf); loop();
  hintOnce(kind, isT ? '제목 카드' : '엔딩 크레딧', isT
    ? [['edit', '아래 칸에 작품 제목을 써요'], ['image', '오른쪽에서 디자인과 글씨체를 골라요'], ['cam', '다 골랐으면 촬영으로 가요']]
    : [['edit', '만든 사람 이름을 한 줄씩 써요'], ['image', '배경과 글씨체를 골라요'], ['share', '다 썼으면 내보내기로 가요']]);
}

/* ---------- 처음 한 번 설명 레이어: 그 화면을 처음 열 때만, 아무 데나 누르면 사라져요 ---------- */
function hintOnce(key, title, lines) {
  const k = 'lb_hint_' + key; try { if (localStorage.getItem(k)) return; } catch (e) { }
  const el = h('div', { class: 'hint', role: 'dialog' }, h('div', { class: 'hint-card' }, h('b', {}, title), ...lines.map(([ic, tx]) => h('div', { class: 'hint-l' }, h('i', { html: icon(ic) }), h('span', {}, tx))), h('small', {}, '아무 데나 누르면 시작해요')));
  el.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); try { localStorage.setItem(k, '1'); } catch (x) { } fadeRemove(el); }, { capture: true });
  $('#app').append(el);
}

/* ---------- 전래동화 5편: 스토리 보기(애니메이션) ---------- */
const TALES = [
  { id: 'byeoljubu', title: '별주부전', sub: '자라와 꾀 많은 토끼', e: '🐢', c: '#2bb59b', bgm: 'sea', scenes: [
    { d: 5, bg: 'palace', cap: '깊은 바닷속 용궁, 용왕님이 큰 병에 걸렸어요.', a: [['🐉', .5, .55, .5, .55, 1.5, 'bob'], ['💦', .62, .3, .62, .25, .6, 'bob'], ['🐠', -.1, .3, 1.1, .35, .6]] },
    { d: 5, bg: 'palace', cap: '문어 의원이 말했어요. “토끼의 간을 먹어야 나으실 수 있어요.”', a: [['🐉', .3, .55, .3, .55, 1.3, 'bob'], ['🐙', 1.1, .55, .68, .55, 1.1, 'bob'], ['🐰', .68, .22, .68, .18, .5, 'pop']] },
    { d: 5, bg: 'sea', cap: '충성스러운 자라 별주부가 토끼를 찾아 육지로 떠났어요.', a: [['🐢', -.1, .75, .8, .25, 1.1], ['🫧', .2, .6, .9, .15, .5]] },
    { d: 5.5, bg: 'shore', cap: '“용궁에 가면 벼슬도 주고 맛있는 것도 많아요!” 자라는 토끼를 꾀었어요.', a: [['🐢', .3, .66, .3, .66, 1, 'bob'], ['🐰', 1.1, .62, .62, .62, 1.1, 'hop'], ['💕', .62, .3, .62, .22, .6, 'pop']] },
    { d: 5, bg: 'sea', cap: '토끼는 자라 등에 올라타고 바닷속 용궁으로 내려갔어요.', a: [['🐢', .15, .2, .75, .65, 1.1], ['🐰', .15, .08, .75, .53, .8]] },
    { d: 5.5, bg: 'palace', cap: '“간은 깨끗이 씻어 육지에 두고 왔는데요!” 꾀 많은 토끼가 말했어요.', a: [['🐉', .3, .55, .3, .55, 1.3, 'bob'], ['🐰', .68, .6, .68, .6, 1, 'bob'], ['💡', .68, .28, .68, .22, .6, 'pop']] },
    { d: 5, bg: 'shore', cap: '육지로 돌아온 토끼는 깡충깡충 숲으로 달아났어요. 끝!', a: [['🐢', .2, .7, .2, .7, 1, 'bob'], ['🐰', .35, .6, 1.1, .5, 1, 'hop'], ['💨', .3, .62, .9, .55, .6]] }
  ] },
  { id: 'heungbu', title: '흥부와 놀부', sub: '제비 다리와 박씨', e: '🐦', c: '#f5b81c', bgm: 'happy', scenes: [
    { d: 5, bg: 'village', cap: '욕심쟁이 형 놀부는 착한 동생 흥부를 집에서 쫓아냈어요.', a: [['😠', .3, .6, .3, .6, 1.2, 'bob'], ['😢', .6, .62, 1.05, .62, 1.1], ['👶', .72, .68, 1.15, .68, .6]] },
    { d: 5, bg: 'village', cap: '봄날, 흥부는 다리를 다친 제비를 정성껏 고쳐 주었어요.', a: [['🙂', .4, .62, .4, .62, 1.2, 'bob'], ['🐦', .62, .4, .62, .4, .8, 'bob'], ['🩹', .66, .52, .66, .48, .5, 'pop']] },
    { d: 5, bg: 'sky', cap: '이듬해 제비가 박씨 하나를 물고 돌아왔어요.', a: [['🐦', -.1, .3, .55, .45, 1], ['🌱', .55, .55, .55, .55, .7, 'pop']] },
    { d: 5.5, bg: 'village', cap: '박이 주렁주렁! 톱으로 켜자 금은보화가 쏟아져 나왔어요.', a: [['🍈', .5, .4, .5, .4, 1.6, 'bob'], ['💰', .3, .7, .25, .62, .8, 'pop'], ['💎', .7, .7, .75, .62, .8, 'pop'], ['🤩', .5, .72, .5, .72, 1]] },
    { d: 5, bg: 'village', cap: '샘이 난 놀부는 일부러 제비 다리를 부러뜨리고 고쳐 주었어요.', a: [['😈', .4, .62, .4, .62, 1.2, 'bob'], ['🐦', .62, .45, .62, .45, .8, 'shake']] },
    { d: 5.5, bg: 'night', cap: '놀부의 박에서는 도깨비들이 튀어나와 혼을 내 주었어요.', a: [['🍈', .5, .4, .5, .4, 1.5, 'shake'], ['👹', .3, .62, .25, .55, 1, 'pop'], ['👺', .7, .62, .75, .55, 1, 'pop'], ['😱', .5, .78, .5, .78, .9]] },
    { d: 5, bg: 'village', cap: '놀부는 잘못을 뉘우쳤고, 형제는 사이좋게 살았어요. 끝!', a: [['🙂', .4, .62, .4, .62, 1.1, 'bob'], ['😊', .6, .62, .6, .62, 1.1, 'bob'], ['💕', .5, .35, .5, .28, .7, 'pop']] }
  ] },
  { id: 'haenim', title: '해님 달님', sub: '오누이와 호랑이', e: '🐯', c: '#e8523f', bgm: 'tension', scenes: [
    { d: 5, bg: 'mountain', cap: '떡을 팔고 돌아오는 엄마 앞에 호랑이가 나타났어요.', a: [['👩', .3, .64, .3, .64, 1.1], ['🐯', 1.1, .64, .62, .64, 1.3], ['🍡', .34, .5, .34, .5, .5]] },
    { d: 5, bg: 'mountain', cap: '“떡 하나 주면 안 잡아먹지!” 호랑이는 떡을 다 먹어 버렸어요.', a: [['🐯', .55, .62, .55, .62, 1.4, 'bob'], ['🍡', .3, .5, .55, .55, .5], ['😨', .25, .66, .25, .66, 1]] },
    { d: 5, bg: 'house', cap: '호랑이는 엄마인 척하며 오누이네 집 문을 두드렸어요.', a: [['🐯', .32, .62, .32, .62, 1.3, 'shake'], ['👧', .68, .62, .68, .62, .9], ['👦', .8, .64, .8, .64, .8], ['❓', .72, .35, .72, .3, .6, 'pop']] },
    { d: 5, bg: 'forest', cap: '오누이는 뒷마당 나무 위로 올라가 도망쳤어요.', a: [['🌳', .5, .5, .5, .5, 2.4], ['👧', .46, .72, .46, .3, .8], ['👦', .56, .76, .56, .36, .7], ['🐯', .2, .72, .3, .72, 1.2, 'bob']] },
    { d: 5.5, bg: 'sky', cap: '“하느님, 저희를 살려 주세요!” 하늘에서 튼튼한 동아줄이 내려왔어요.', a: [['🪢', .5, -.2, .5, .45, 1.6], ['👧', .44, .8, .44, .3, .8], ['👦', .56, .82, .56, .36, .7], ['✨', .5, .2, .5, .15, .8, 'pop']] },
    { d: 5, bg: 'night', cap: '호랑이는 썩은 줄을 타다 떨어지고 말았어요.', a: [['🪢', .5, 0, .5, .3, 1.2], ['🐯', .5, .3, .5, 1.1, 1.3, 'spin']] },
    { d: 5.5, bg: 'sky', cap: '오누이는 하늘로 올라가 해님과 달님이 되었어요. 끝!', a: [['☀️', .3, .3, .3, .3, 1.6, 'bob'], ['🌙', .7, .3, .7, .3, 1.5, 'bob'], ['👧', .3, .62, .3, .62, .8], ['👦', .7, .62, .7, .62, .8]] }
  ] },
  { id: 'geumdokki', title: '금도끼 은도끼', sub: '정직한 나무꾼', e: '🪓', c: '#5aa8ea', bgm: 'journey', scenes: [
    { d: 5, bg: 'forest', cap: '나무꾼이 나무를 베다가 그만 도끼를 연못에 빠뜨렸어요.', a: [['🧑', .3, .6, .3, .6, 1.1, 'bob'], ['🪓', .4, .45, .62, .72, .7, 'spin'], ['💦', .62, .72, .62, .68, .6, 'pop']] },
    { d: 5, bg: 'pond', cap: '연못에서 산신령이 금도끼를 들고 나타났어요. “이 도끼가 네 것이냐?”', a: [['🧓', .6, .5, .6, .45, 1.4, 'bob'], ['🪙', .72, .35, .72, .3, .7, 'pop'], ['🧑', .25, .62, .25, .62, 1]] },
    { d: 5, bg: 'pond', cap: '“아니요.” 은도끼도 “아니요.” 나무꾼은 정직하게 대답했어요.', a: [['🧓', .6, .5, .6, .45, 1.4, 'bob'], ['🥈', .72, .35, .72, .3, .7, 'pop'], ['🧑', .25, .62, .25, .62, 1, 'shake']] },
    { d: 5, bg: 'pond', cap: '“이 낡은 쇠도끼가 제 것이에요!” 산신령은 세 도끼를 모두 주었어요.', a: [['🧓', .6, .5, .6, .45, 1.4, 'bob'], ['🪓', .72, .35, .35, .45, .7], ['🧑', .25, .62, .25, .62, 1], ['🎁', .3, .4, .3, .35, .7, 'pop']] },
    { d: 5, bg: 'forest', cap: '이 소문을 들은 욕심쟁이는 일부러 도끼를 연못에 던졌어요.', a: [['😏', .3, .6, .3, .6, 1.1], ['🪓', .4, .4, .7, .72, .7, 'spin'], ['💦', .7, .72, .7, .68, .6, 'pop']] },
    { d: 5.5, bg: 'pond', cap: '“금도끼가 제 것이에요!” 거짓말에 산신령은 도끼를 모두 가져가 버렸어요. 끝!', a: [['🧓', .6, .5, .6, .45, 1.4, 'shake'], ['🪙', .72, .35, .9, -.2, .7], ['😭', .25, .62, .25, .62, 1.1]] }
  ] },
  { id: 'kongjwi', title: '콩쥐 팥쥐', sub: '두꺼비가 도와준 콩쥐', e: '🐸', c: '#a27be8', bgm: 'worry', scenes: [
    { d: 5, bg: 'house', cap: '새어머니와 팥쥐는 착한 콩쥐에게 힘든 일만 시켰어요.', a: [['👩', .25, .6, .25, .6, 1.1], ['😤', .42, .64, .42, .64, .9], ['👧', .72, .64, .72, .64, 1, 'bob'], ['🧹', .8, .62, .8, .62, .6]] },
    { d: 5, bg: 'house', cap: '“이 독에 물을 가득 채워라!” 그런데 독 바닥에 구멍이 나 있었어요.', a: [['🏺', .5, .62, .5, .62, 1.6], ['💧', .5, .3, .5, .55, .6], ['😟', .22, .62, .22, .62, 1]] },
    { d: 5, bg: 'house', cap: '두꺼비가 나타나 구멍을 몸으로 막아 주었어요.', a: [['🏺', .5, .62, .5, .62, 1.6], ['🐸', -.1, .75, .5, .78, .9, 'hop'], ['😊', .22, .62, .22, .62, 1]] },
    { d: 5, bg: 'meadow', cap: '밭은 황소가 갈아 주고, 벼는 참새 떼가 다 찧어 주었어요.', a: [['🐂', -.1, .62, .4, .62, 1.3], ['🐦', .6, .3, .8, .25, .6, 'bob'], ['🐦', .75, .4, .9, .32, .5, 'bob'], ['🌾', .7, .62, .7, .62, 1]] },
    { d: 5.5, bg: 'village', cap: '잔치에 가던 콩쥐는 꽃신 한 짝을 개울에 떨어뜨렸어요.', a: [['👧', .3, .6, .55, .6, 1], ['👠', .5, .62, .72, .78, .6, 'spin'], ['💦', .72, .78, .72, .74, .5, 'pop']] },
    { d: 5.5, bg: 'palaceK', cap: '꽃신의 주인을 찾던 원님은 콩쥐를 만나 행복하게 살았어요. 끝!', a: [['🤴', .38, .62, .38, .62, 1.2, 'bob'], ['👧', .62, .62, .62, .62, 1.1, 'bob'], ['👠', .5, .8, .5, .8, .6], ['💕', .5, .35, .5, .28, .8, 'pop']] }
  ] }
];
IC.skip = IC.skip || '<path d="M5 5l9 7-9 7zM17 5v14"/>';
function drawTaleBg(ctx, bg, t) {
  const g = (a, b, y0 = 0, y1 = H) => { const gr = ctx.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
  const ground = (c1, y = .72) => { ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * y); ctx.quadraticCurveTo(W * .5, H * (y - .08), W, H * y); ctx.lineTo(W, H); ctx.fill(); };
  const sky = (a, b) => { ctx.fillStyle = g(a, b); ctx.fillRect(0, 0, W, H); };
  const sun = (x, y, c, r = H * .09) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  const waves = (y, c, amp = 10) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, y); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin(x / 60 + t * 2) * amp); ctx.lineTo(W, H); ctx.fill(); };
  const tree = (x, y, s = 1) => { ctx.font = `${H * .22 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('🌳', x, y); };
  if (bg === 'palace') { sky('#0a3a6a', '#0f6b8f'); for (let i = 0; i < 8; i++) { const x = (i * 137 + t * 25) % W, y = H - (t * 40 + i * 70) % H; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x, y, 4 + i % 3 * 2, 0, 7); ctx.fill(); } ctx.fillStyle = '#d9a44a'; ctx.fillRect(W * .1, H * .25, W * .8, H * .55); ctx.fillStyle = '#8a2b2b'; ctx.fillRect(W * .05, H * .18, W * .9, H * .1); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(W * .02, H * .18); ctx.lineTo(W / 2, H * .04); ctx.lineTo(W * .98, H * .18); ctx.fill(); ctx.fillStyle = '#0f6b8f'; ctx.fillRect(0, H * .8, W, H * .2); }
  else if (bg === 'sea') { sky('#1b74c5', '#0b3d7a'); for (let i = 0; i < 10; i++) { const x = (i * 97 + t * 20) % W, y = H - (t * 50 + i * 80) % H; ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.arc(x, y, 3 + i % 3 * 2, 0, 7); ctx.fill(); } ground('#2f6b4f', .86); ctx.font = `${H * .16}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('🪸', W * .2, H * .95); ctx.fillText('🌿', W * .8, H * .95); }
  else if (bg === 'shore') { sky('#8fd3ff', '#dff3ff'); sun(W * .8, H * .2, '#ffe08a'); ground('#e9d59a', .66); waves(H * .74, '#4aa3df', 8); }
  else if (bg === 'village') { sky('#9ad6ff', '#e6f6ff'); sun(W * .85, H * .18, '#ffe08a'); ground('#86c46b', .68); ctx.font = `${H * .28}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('🏡', W * .18, H * .78); tree(W * .9, H * .8, .9); }
  else if (bg === 'house') { ctx.fillStyle = '#5b3a1e'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#f0e2c2'; ctx.fillRect(W * .06, H * .08, W * .88, H * .62); ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 8; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(W * .06 + W * .88 * i / 4, H * .08); ctx.lineTo(W * .06 + W * .88 * i / 4, H * .7); ctx.stroke(); } ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, H * .7, W, H * .3); }
  else if (bg === 'forest') { sky('#5fb36a', '#2f7a3b'); tree(W * .15, H * .8, 1.2); tree(W * .85, H * .82, 1.1); tree(W * .5, H * .6, .7); ground('#2b6a33', .8); }
  else if (bg === 'mountain') { sky('#ffd27f', '#ffb36b'); sun(W * .2, H * .2, '#fff1b0'); ctx.fillStyle = '#5c7f5a'; ctx.beginPath(); ctx.moveTo(0, H * .7); ctx.lineTo(W * .3, H * .3); ctx.lineTo(W * .55, H * .62); ctx.lineTo(W * .75, H * .38); ctx.lineTo(W, H * .7); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill(); ground('#3f6b3f', .76); }
  else if (bg === 'sky') { sky('#6ec6ff', '#d8f1ff'); for (const [x, y] of [[.2, .25], [.65, .15], [.85, .4]]) { const cx = (x + t * .02) % 1.2 * W, cy = y * H, r = H * .07; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.arc(cx + r, cy + r * .3, r * .8, 0, 7); ctx.arc(cx - r, cy + r * .3, r * .7, 0, 7); ctx.fill(); } ground('#86c46b', .86); }
  else if (bg === 'night') { sky('#0b1a3a', '#1d2f6b'); const rnd = seeded('tale'); for (let i = 0; i < 50; i++) { const x = rnd() * W, y = rnd() * H * .7; ctx.globalAlpha = .5 + .5 * Math.sin(t * 3 + i); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 1.5 + rnd() * 2, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; sun(W * .8, H * .2, '#fff6c8', H * .07); ground('#15321c', .78); }
  else if (bg === 'pond') { sky('#7fc8a9', '#cfeedd'); tree(W * .12, H * .62, .9); tree(W * .88, H * .6, .9); ground('#4f8f4a', .62); ctx.fillStyle = '#3f8fd1'; ctx.beginPath(); ctx.ellipse(W * .62, H * .85, W * .34, H * .14, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.ellipse(W * .62, H * .85, W * .1 * i + (t * 20 % 40), H * .04 * i + (t * 8 % 16), 0, 0, 7); ctx.stroke(); } }
  else if (bg === 'meadow') { sky('#8fd3ff', '#eaf8ff'); sun(W * .15, H * .18, '#ffe08a'); ground('#9bcf5f', .6); ground('#6fae45', .78); }
  else if (bg === 'palaceK') { sky('#f6e6c8', '#f3d9a8'); ctx.fillStyle = '#7a3b2e'; ctx.fillRect(W * .08, H * .3, W * .84, H * .45); ctx.fillStyle = '#2f5d8a'; ctx.beginPath(); ctx.moveTo(W * .02, H * .3); ctx.lineTo(W / 2, H * .1); ctx.lineTo(W * .98, H * .3); ctx.fill(); ctx.fillStyle = '#c9b48a'; ctx.fillRect(0, H * .75, W, H * .25); }
  else { sky('#333', '#111'); }
}
function drawTaleScene(ctx, sc, t) {
  drawTaleBg(ctx, sc.bg, t); const p = clamp(t / sc.d, 0, 1), e = p < .5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
  for (const [em, x0, y0, x1, y1, s, mo] of sc.a) {
    let x = (x0 + (x1 - x0) * e) * W, y = (y0 + (y1 - y0) * e) * H, rot = 0, sc2 = 1;
    if (mo === 'bob') y += Math.sin(t * 3) * 8; if (mo === 'hop') y -= Math.abs(Math.sin(t * 6)) * 30; if (mo === 'shake') x += Math.sin(t * 25) * 6; if (mo === 'spin') rot = t * 4; if (mo === 'pop') sc2 = Math.min(1, t * 2.5) * (1 + Math.sin(t * 4) * .06);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc2, sc2); if (x1 < x0) ctx.scale(-1, 1);
    ctx.font = `${H * .22 * s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(em, 0, 0); ctx.restore();
  }
  // 자막
  ctx.font = '600 30px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lines = wrapText(ctx, sc.cap, W * .86), lh = 40, bh = lines.length * lh + 22;
  ctx.fillStyle = 'rgba(0,0,0,.62)'; ctx.beginPath(); ctx.roundRect(W * .05, H - 18 - bh, W * .9, bh, 14); ctx.fill();
  ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H - 18 - bh + 11 + lh / 2 + i * lh));
}
/* 스토리 보기: 전체 화면 · 건너뛰기 · 누르면 멈춤/계속 */
function playTale(tale) {
  AE.init(); const cv = h('canvas', { class: 'tale-cv', width: W, height: H }), ctx = cv.getContext('2d');
  const cap = h('div', { class: 'tale-top' }, h('b', {}, tale.e + ' ' + tale.title), h('span', { class: 'tale-n' }, ''));
  const skip = h('button', { class: 'tale-skip', type: 'button', 'aria-label': '건너뛰기', html: icon('skip') + '<span>건너뛰기</span>' });
  const pauseB = h('div', { class: 'tale-pause', hidden: true, html: icon('play') });
  const end = h('div', { class: 'tale-end', hidden: true }, h('b', {}, '끝'), h('div', {}, h('button', { class: 'btn', type: 'button', onclick: () => start() }, '다시 보기'), h('button', { class: 'btn or', type: 'button', onclick: () => close() }, '닫기')));
  const bg = h('div', { class: 'tale-bg' }, cap, h('div', { class: 'tale-mon' }, cv, pauseB, end), skip);
  let i = 0, t0 = 0, paused = false, pausedAt = 0, raf = 0, done = false;
  const total = tale.scenes.reduce((a, s) => a + s.d, 0);
  const music = async () => { try { const b = await AE.getBgm(tale.bgm); if (!bg.isConnected) return; AE.stopPreview(); const s = AE.ctx.createBufferSource(); s.buffer = b; s.loop = true; const g = AE.ctx.createGain(); g.gain.value = .5; s.connect(g).connect(AE.buses.ui); s.start(); AE.preview = s; } catch (e) { } };
  const start = () => { end.hidden = true; done = false; paused = false; i = 0; t0 = performance.now(); music(); cancelAnimationFrame(raf); loop(); };
  const loop = () => {
    if (!bg.isConnected) return; raf = requestAnimationFrame(loop);
    if (paused || done) return;
    let t = (performance.now() - t0) / 1000, k = 0; while (k < tale.scenes.length && t >= tale.scenes[k].d) { t -= tale.scenes[k].d; k++; }
    if (k >= tale.scenes.length) { done = true; end.hidden = false; AE.stopPreview(); return; }
    i = k; ctx.setTransform(1, 0, 0, 1, 0, 0); drawTaleScene(ctx, tale.scenes[k], t); cap.lastChild.textContent = `${k + 1} / ${tale.scenes.length}`;
  };
  const close = () => { cancelAnimationFrame(raf); AE.stopPreview(); fadeRemove(bg); };
  skip.onclick = close;
  cv.onclick = () => { if (done) return; paused = !paused; pauseB.hidden = !paused; if (paused) pausedAt = performance.now(); else t0 += performance.now() - pausedAt; if (paused) AE.stopPreview(); else music(); };
  $('#app').append(bg); start();
}
/* 전래동화 카드를 누르면: 스토리 보기 · 스토리 만들기(준비 중) */
function taleSheet(tale) {
  const done = () => { bg.classList.add('out'); setTimeout(() => bg.remove(), 160); };
  const bg = h('div', { class: 'al-bg', onpointerdown: e => { if (e.target === bg) done(); } },
    h('div', { class: 'al tale-al', role: 'dialog', 'aria-modal': 'true' }, h('span', { class: 'tale-e', style: { background: tale.c } }, tale.e), h('b', { class: 'al-t' }, tale.title), h('p', { class: 'al-p' }, tale.sub),
      h('button', { class: 'tale-b or', type: 'button', html: icon('play') + '<span>스토리 보기</span>', onclick: () => { done(); playTale(tale); } }),
      h('button', { class: 'tale-b', type: 'button', disabled: true, html: icon('cam') + '<span>스토리 만들기<small>준비 중이에요</small></span>' }),
      h('button', { class: 'tale-x', type: 'button', 'aria-label': '닫기', html: icon('x'), onclick: done })));
  $('#app').append(bg);
}
function taleGrid(grid) {
  for (const t of TALES) {
    const card = h('button', { class: 'g-card tale', type: 'button', 'aria-label': t.title, onclick: () => taleSheet(t) },
      h('span', { class: 'th', style: { background: `linear-gradient(135deg, ${t.c}, #000000aa)` } }, h('span', { class: 'tale-big' }, t.e)), h('span', { class: 'tt' }, h('b', {}, t.title), h('small', {}, t.sub)));
    card.style.setProperty('--i', grid.children.length); grid.append(card);
  }
}
