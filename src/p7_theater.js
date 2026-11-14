/* =========================================================
   온라인 상영관 (2026-11-14) — 모두가 보는 공간. 좋아요 · 순위(새 작품 / 이번 주 / 전체) · 신고
   서버: Supabase(docs/theater.sql). THEATER.url·key 가 비어 있으면 "준비 중"이에요.
   주소에 ?theater=mock 을 붙이면 기기 안 가짜 서버로 돌아가요(점검·시연용, 새로 고치면 사라져요).
   안전: 아이는 기기마다 익명 사용자, 실명 대신 별명, 올릴 때마다 보호자 확인, 관리자가 승인해야 공개,
        신고 3번이면 저절로 숨김. 관리자 화면은 주소에 ?admin 을 붙여 열어요.
   ========================================================= */
const THEATER = { url: '', key: '' };   // Supabase › Project Settings › API 의 Project URL · anon public key
const TH = { sort: 'new', liked: new Set(), likedLoaded: false };
const TH_LONG = 854, TH_BPS = 1.2e6;     // 올리는 영상 크기(긴 변)·비트레이트: 30초 ≈ 5MB
IC.heart = IC.heart || '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>';
IC.flag = IC.flag || '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>';
IC.theater = IC.theater || '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M10 8.5v5l4-2.5z"/><path d="M8 21h8"/>';
const thMock = () => /[?&]theater=mock/.test(location.search);
const thReady = () => thMock() || !!(THEATER.url && THEATER.key);

/* ---------- Supabase (REST만 써요, 라이브러리 없음) ---------- */
function sbMake(store) {
  const K = 'lb_th_' + store;
  let s = null; try { s = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { }
  const keep = v => { s = v; try { v ? localStorage.setItem(K, JSON.stringify(v)) : localStorage.removeItem(K); } catch (e) { } };
  const base = () => THEATER.url.replace(/\/+$/, '');
  async function call(path, { method = 'GET', body, headers = {}, auth = 'opt' } = {}) {
    const tok = auth ? await token(auth === 'need') : null;
    const blob = body instanceof Blob;
    const r = await fetch(base() + path, { method, headers: { apikey: THEATER.key, Authorization: 'Bearer ' + (tok || THEATER.key), ...(body && !blob ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: blob ? body : body ? JSON.stringify(body) : undefined });
    const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) { }
    if (!r.ok) { const e = new Error((j && (j.message || j.msg || j.error_description || j.error)) || ('HTTP ' + r.status)); e.status = r.status; throw e; }
    return j;
  }
  async function authCall(path, body) {
    const j = await call('/auth/v1/' + path, { method: 'POST', body, auth: false });
    return { at: j.access_token, rt: j.refresh_token, exp: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), uid: j.user && j.user.id };
  }
  async function token(make) {
    if (s && s.exp * 1000 > Date.now() + 60e3) return s.at;
    if (s && s.rt) { try { keep(await authCall('token?grant_type=refresh_token', { refresh_token: s.rt })); return s.at; } catch (e) { keep(null); } }
    if (!make || store === 'admin') return null;
    keep(await authCall('signup', {}));   // 익명 사용자(이메일 없음)
    return s.at;
  }
  const sign = async paths => {
    if (!paths.length) return {};
    const r = await call('/storage/v1/object/sign/films', { method: 'POST', body: { expiresIn: 3600, paths } });
    const o = {}; for (const x of r || []) if (x.signedURL) o[x.path] = base() + '/storage/v1' + x.signedURL; return o;
  };
  const shape = (f, u) => ({ ...f, posterURL: u[f.poster] || '', created: Date.parse(f.created_at) || Date.now() });
  const withPosters = async list => { const u = await sign(list.map(f => f.poster)).catch(() => ({})); return list.map(f => shape(f, u)); };
  return {
    signedIn: () => !!s,
    async list(sort) { return withPosters(await call('/rest/v1/rpc/theater_list', { method: 'POST', body: { sort, lim: 60 } }) || []); },
    async videoURL(f) { return (await sign([f.video]))[f.video] || ''; },
    async myLikes() { if (!s) return new Set(); return new Set((await call('/rest/v1/likes?select=film') || []).map(x => x.film)); },
    async like(id, on) {
      if (on) { try { await call('/rest/v1/likes', { method: 'POST', body: { film: id }, auth: 'need', headers: { Prefer: 'return=minimal' } }); } catch (e) { if (e.status !== 409) throw e; } }
      else await call(`/rest/v1/likes?film=eq.${id}&uid=eq.${s.uid}`, { method: 'DELETE', auth: 'need' });
    },
    async report(id, reason) { try { await call('/rest/v1/reports', { method: 'POST', body: { film: id, reason }, auth: 'need', headers: { Prefer: 'return=minimal' } }); } catch (e) { if (e.status !== 409) throw e; } },
    async mine() { if (!s) return []; return withPosters(await call(`/rest/v1/films?select=*&owner=eq.${s.uid}&order=created_at.desc`) || []); },
    async upload({ title, nick, secs, video, poster, ext }) {
      await token(true);
      const id = crypto.randomUUID(), vp = `${s.uid}/${id}.${ext}`, pp = `${s.uid}/${id}.jpg`;
      await call('/storage/v1/object/films/' + vp, { method: 'POST', body: video, auth: 'need', headers: { 'Content-Type': video.type, 'x-upsert': 'false' } });
      await call('/storage/v1/object/films/' + pp, { method: 'POST', body: poster, auth: 'need', headers: { 'Content-Type': 'image/jpeg', 'x-upsert': 'false' } });
      try { await call('/rest/v1/films', { method: 'POST', auth: 'need', headers: { Prefer: 'return=minimal' }, body: { id, title, nick, secs, video: vp, poster: pp, parent_ok: true } }); }
      catch (e) { await call('/storage/v1/object/films', { method: 'DELETE', body: { prefixes: [vp, pp] }, auth: 'need' }).catch(() => { }); throw e; }
    },
    async remove(f) {
      await call(`/rest/v1/films?id=eq.${f.id}`, { method: 'DELETE', auth: 'need' });
      await call('/storage/v1/object/films', { method: 'DELETE', body: { prefixes: [f.video, f.poster] }, auth: 'need' }).catch(() => { });
    },
    // 관리자
    async login(email, password) { keep(await authCall('token?grant_type=password', { email, password })); if (!(await call('/rest/v1/admins?select=uid') || []).length) { keep(null); throw new Error('관리자로 등록되지 않은 계정이에요'); } },
    logout() { keep(null); },
    async queue(st) { return withPosters(await call(`/rest/v1/films?select=*&status=in.(${st})&order=created_at.asc&limit=100`) || []); },
    async setStatus(id, status) { await call(`/rest/v1/films?id=eq.${id}`, { method: 'PATCH', body: { status }, headers: { Prefer: 'return=minimal' } }); },
  };
}

/* ---------- 가짜 서버(?theater=mock) ---------- */
function mockPoster(bg, emoji) {
  const c = h('canvas', { width: 320, height: 180 }), g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 320, 180); g.font = '90px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emoji, 160, 95);
  return c.toDataURL('image/jpeg', .8);
}
function mockMake() {
  const M = window.__thm || (window.__thm = { uid: 'me', likes: new Set(), films: [
    ['토끼의 모험', '깡총이', '#E9A23B', '🐰', 12, 4], ['우주 고양이', '별빛', '#3B5BA9', '🐱', 8, 9], ['공룡 대소동', '쿵쿵', '#4E9A63', '🦖', 15, 2], ['눈사람 친구', '하얀눈', '#7FB3D5', '⛄', 6, 6], ['로봇 청소부', '삐삐', '#8E6FB0', '🤖', 10, 1],
  ].map(([title, nick, bg, em, secs, likes], i) => ({ id: 'm' + i, owner: 'x', title, nick, secs, likes, week: Math.max(0, likes - (i % 3) * 2), status: 'approved', reports: 0, created: Date.now() - i * 36e5 * 7, posterURL: mockPoster(bg, em), video: null })) });
  const pub = () => M.films.filter(f => f.status === 'approved');
  const wait = v => new Promise(r => setTimeout(() => r(v), 120));
  return {
    signedIn: () => true,
    list: sort => wait([...pub()].sort((a, b) => sort === 'week' ? b.week - a.week : sort === 'all' ? b.likes - a.likes : b.created - a.created)),
    videoURL: async f => f.video || '',
    myLikes: async () => new Set(M.likes),
    async like(id, on) { const f = M.films.find(x => x.id === id); if (!f || on === M.likes.has(id)) return; on ? M.likes.add(id) : M.likes.delete(id); f.likes += on ? 1 : -1; f.week += on ? 1 : -1; },
    async report(id) { const f = M.films.find(x => x.id === id); if (f && ++f.reports >= 3) f.status = 'hidden'; },
    mine: async () => M.films.filter(f => f.owner === M.uid),
    async upload({ title, nick, secs, video, poster }) { await wait(); M.films.unshift({ id: 'u' + Date.now(), owner: M.uid, title, nick, secs, likes: 0, week: 0, status: 'pending', reports: 0, created: Date.now(), posterURL: URL.createObjectURL(poster), video: URL.createObjectURL(video) }); },
    async remove(f) { M.films = M.films.filter(x => x.id !== f.id); },
    async login() { }, logout() { },
    queue: async st => M.films.filter(f => st.split(',').includes(f.status)),
    async setStatus(id, status) { const f = M.films.find(x => x.id === id); if (f) { f.status = status; if (status === 'approved') { f.created = Date.now(); f.reports = 0; } } },
  };
}
let TH_API = null, TH_ADMIN = null;
const thApi = () => TH_API || (TH_API = thMock() ? mockMake() : sbMake('kid'));
const thAdminApi = () => TH_ADMIN || (TH_ADMIN = thMock() ? mockMake() : sbMake('admin'));
const thErr = e => /daily_limit/.test(e && e.message) ? '오늘은 5편까지 올릴 수 있어요. 내일 또 올려요' : /anonymous/i.test(e && e.message) ? '상영관 서버 설정이 아직 안 끝났어요(익명 로그인)' : '인터넷 연결을 확인하고 다시 해 봐요';

/* ---------- 상영관 화면 (내 작품 화면의 탭) ---------- */
const TH_SORTS = [['new', '새 작품'], ['week', '이번 주 인기'], ['all', '전체 인기'], ['mine', '내가 올린']];
function theaterMain() {
  const grid = h('div', { class: 'g-grid list' });
  const seg = h('div', { class: 'th-seg', role: 'tablist' }, ...TH_SORTS.map(([id, label]) => h('button', { class: TH.sort === id ? 'on' : '', type: 'button', role: 'tab', 'aria-selected': TH.sort === id, onclick: () => { TH.sort = id; $$('.th-seg button').forEach(b => b.classList.toggle('on', b.textContent === label)); theaterFill(grid); } }, label)));
  const main = h('div', { class: 'g-main' }, h('div', { class: 'g-top th-top' }, h('b', { class: 'g-h' }, '상영관'), seg), grid);
  theaterFill(grid);
  return main;
}
async function theaterFill(grid) {
  const my = ++TH.req; grid.innerHTML = '';
  if (!thReady()) { grid.append(h('p', { class: 'g-none' }, '상영관은 준비 중이에요. 곧 친구들의 작품을 볼 수 있어요!')); return; }
  grid.append(h('p', { class: 'g-none' }, '불러오는 중…'));
  const api = thApi(), mine = TH.sort === 'mine';
  let list;
  try {
    list = mine ? await api.mine() : await api.list(TH.sort);
    if (!TH.likedLoaded) { TH.liked = await api.myLikes().catch(() => new Set()); TH.likedLoaded = true; }
  } catch (e) { if (my === TH.req) { grid.innerHTML = ''; grid.append(h('p', { class: 'g-none' }, '상영관을 못 불러왔어요. 인터넷 연결을 확인해 봐요.')); } return; }
  if (my !== TH.req) return;
  grid.innerHTML = '';
  if (!list.length) { grid.append(h('p', { class: 'g-none' }, mine ? '아직 올린 작품이 없어요. 꾸미기 › 내보내기에서 "상영관에 올리기"를 눌러요.' : '아직 상영 중인 작품이 없어요. 첫 번째로 올려 봐요!')); return; }
  const ranked = TH.sort === 'week' || TH.sort === 'all';
  list.forEach((f, i) => {
    const th = h('span', { class: 'th' + (f.posterURL ? '' : ' empty'), html: f.posterURL ? '' : icon('film') });
    if (f.posterURL) th.style.backgroundImage = `url("${f.posterURL}")`;
    if (ranked && (TH.sort === 'week' ? f.week : f.likes) > 0) th.append(h('i', { class: 'th-rank r' + Math.min(i + 1, 4) }, String(i + 1)));
    const st = { pending: '어른이 확인하고 있어요', hidden: '신고가 들어와 잠시 숨겼어요', rejected: '상영관에 올릴 수 없어요' }[f.status];
    const sub = mine && st ? st : `${f.nick} · ♥ ${TH.sort === 'week' ? f.week : f.likes}`;
    const card = h('div', { class: 'g-card th-card' + (mine && f.status !== 'approved' ? ' wait' : ''), role: 'button', tabindex: 0, 'data-id': f.id, 'aria-label': `${f.title} 보기` }, th, h('span', { class: 'tt' }, h('b', {}, f.title), h('small', {}, sub)),
      mine ? h('button', { class: 'g-more', type: 'button', 'aria-label': '메뉴', html: icon('more'), onclick: e => { e.stopPropagation(); menu(); } }) : '');
    const menu = () => ctxMenu(card, [{ label: '상영관에서 내리기', ic: 'trash', red: true, fn: async () => { if (!(await iosAlert('상영관에서 내릴까요?', '올린 영상이 지워져요. 내 작품에는 그대로 있어요.', '내리기', true))) return; try { await thApi().remove(f); toast('상영관에서 내렸어요'); theaterFill(grid); } catch (e) { toast(thErr(e)); } } }], { lift: true });
    card.onclick = () => theaterPlay(f, list, grid);
    card.onkeydown = e => { if (e.key === 'Enter') card.onclick(); };
    if (mine) { card.oncontextmenu = e => { e.preventDefault(); menu(); }; longPress(card, menu); }
    card.style.setProperty('--i', Math.min(i, 14));
    grid.append(card);
  });
}
TH.req = 0;

/* ---------- 작품 보기: 영상 + 좋아요 + 신고 ---------- */
async function theaterPlay(f, list, grid) {
  const mine = f.status && f.status !== 'approved';
  const vid = h('video', { class: 'thp-v', playsinline: true, controls: true, autoplay: true, poster: f.posterURL || '' });
  vid.setAttribute('playsinline', ''); vid.setAttribute('webkit-playsinline', '');
  const n = h('b', {}, String(f.likes));
  const like = h('button', { class: 'thp-like' + (TH.liked.has(f.id) ? ' on' : ''), type: 'button', 'aria-label': '좋아요', disabled: mine }, h('span', { html: icon('heart') }), n);
  like.onclick = async () => {
    const on = !TH.liked.has(f.id);
    on ? TH.liked.add(f.id) : TH.liked.delete(f.id); f.likes += on ? 1 : -1; if (f.week != null) f.week += on ? 1 : -1;
    like.classList.toggle('on', on); n.textContent = f.likes;
    if (on) { like.classList.remove('pop'); void like.offsetWidth; like.classList.add('pop'); try { navigator.vibrate && navigator.vibrate(12); } catch (e) { } }
    try { await thApi().like(f.id, on); } catch (e) { on ? TH.liked.delete(f.id) : TH.liked.add(f.id); f.likes -= on ? 1 : -1; like.classList.toggle('on', !on); n.textContent = f.likes; toast(thErr(e)); }
  };
  const rep = h('button', { class: 'thp-rep', type: 'button', 'aria-label': '신고', html: icon('flag') + '<span>신고</span>', disabled: mine });
  rep.onclick = async () => {
    vid.pause();
    const why = await pickAlert('어떤 점이 걱정돼요?', '어른이 확인하고, 문제가 있으면 내려요.', ['무섭거나 기분 나빠요', '나쁜 말이 나와요', '얼굴·이름·학교가 보여요', '다른 사람 작품을 베꼈어요']);
    if (!why) return;
    try { await thApi().report(f.id, why); toast('알려 줘서 고마워요. 어른이 확인할게요'); } catch (e) { toast(thErr(e)); }
  };
  const close = () => { vid.pause(); vid.removeAttribute('src'); vid.load(); fadeRemove(bg, 220); removeEventListener('keydown', onEsc); if (grid && TH.sort !== 'mine') theaterFill(grid); };
  const onEsc = e => { if (e.key === 'Escape') close(); };
  const bg = h('div', { class: 'thp-bg' },
    h('div', { class: 'thp-top' }, h('div', { class: 'thp-tt' }, h('b', {}, f.title), h('small', {}, `${f.nick} · ${mmss(f.secs || 0)}`)), h('button', { class: 'thp-x', type: 'button', 'aria-label': '닫기', html: icon('x'), onclick: close })),
    h('div', { class: 'thp-mid' }, vid),
    h('div', { class: 'thp-bar' }, like, rep));
  $('#app').append(bg); addEventListener('keydown', onEsc);
  try { const u = await (mine ? thApi() : thApi()).videoURL(f); if (u) vid.src = u; else if (!f.video) vid.replaceWith(h('div', { class: 'thp-v none', style: { backgroundImage: f.posterURL ? `url("${f.posterURL}")` : '' } }, h('span', {}, '(시연용 작품이라 영상이 없어요)'))); }
  catch (e) { toast(thErr(e)); }
}
/* 고르기 알림창: 버튼 여러 개 중 하나 */
function pickAlert(title, text, opts) {
  return new Promise(res => {
    const done = v => { fadeRemove(bg, 160); res(v); };
    const bg = h('div', { class: 'al-bg', onpointerdown: e => { if (e.target === bg) done(null); } },
      h('div', { class: 'al', role: 'alertdialog', 'aria-modal': 'true' }, h('b', { class: 'al-t' }, title), text ? h('p', { class: 'al-p' }, text) : '',
        h('div', { class: 'al-list' }, ...opts.map(o => h('button', { type: 'button', onclick: () => done(o) }, o))),
        h('div', { class: 'al-acts' }, h('button', { type: 'button', onclick: () => done(null) }, '취소'))));
    $('#app').append(bg);
  });
}

/* ---------- 올리기: 영상 만들기 → 별명·보호자 확인 → 올리기 ---------- */
function theaterUpload() {
  if (!thReady()) { iosAlert('상영관은 준비 중이에요', '곧 친구들과 작품을 나눌 수 있어요. 지금은 "영상 파일 만들기"로 저장해요.'); return; }
  if (!TL().total) { toast('먼저 촬영에서 컷을 찍어요'); return; }
  Player.pause(); exportVideo({ upload: true });
}
function theaterUploadSheet(video, ext, poster, m, box) {
  let nick = ''; try { nick = localStorage.getItem('lb_th_nick') || ''; } catch (e) { }
  const a = 6 + Math.floor(Math.random() * 13), b = 6 + Math.floor(Math.random() * 7);
  const ti = h('input', { class: 'input', maxlength: 40, value: isAutoTitle(P.title) ? '' : P.title, placeholder: '작품 제목', 'aria-label': '작품 제목' });
  const ni = h('input', { class: 'input', maxlength: 12, value: nick, placeholder: '예: 별빛토끼', 'aria-label': '별명' });
  const c1 = h('input', { type: 'checkbox' }), c2 = h('input', { type: 'checkbox' });
  const qi = h('input', { class: 'input th-q', inputmode: 'numeric', maxlength: 4, 'aria-label': '보호자 확인 답' });
  const err = h('p', { class: 'th-err', role: 'alert' });
  const go = h('button', { class: 'btn primary', type: 'button', html: icon('upload') + '<span>올리기</span>' });
  go.onclick = async () => {
    const title = ti.value.trim(), nk = ni.value.trim();
    const bad = !title ? '작품 제목을 써요' : !nk ? '별명을 써요(진짜 이름은 쓰지 않아요)' : !c1.checked ? '얼굴·이름·학교가 나오지 않는지 확인해요' : +qi.value !== a * b ? '보호자 확인 답이 맞지 않아요' : !c2.checked ? '보호자 동의에 표시해 주세요' : '';
    if (bad) { err.textContent = bad; return; }
    try { localStorage.setItem('lb_th_nick', nk); } catch (e) { }
    go.disabled = true; go.querySelector('span').textContent = '올리는 중…'; err.textContent = '';
    try {
      await thApi().upload({ title, nick: nk, secs: Math.round(TL().total * 10) / 10, video, poster, ext });
      m.close(); TH.sort = 'mine';
      iosAlert('올렸어요!', '어른이 확인하면 상영관에 나와요. 내 작품 › 상영관 › 내가 올린 에서 볼 수 있어요.');
    } catch (e) { go.disabled = false; go.querySelector('span').textContent = '다시 올리기'; err.textContent = thErr(e); }
  };
  box.innerHTML = ''; box.classList.add('th-sheet');
  box.append(h('h2', {}, '상영관에 올리기'),
    h('p', { class: 'hint th-note' }, '상영관은 모든 사람이 볼 수 있어요. 어른이 확인한 뒤에 공개돼요.'),
    h('div', { class: 'th-form' },
      h('label', {}, h('span', {}, '제목'), ti),
      h('label', {}, h('span', {}, '별명'), ni),
      h('label', { class: 'th-chk' }, c1, h('span', {}, '영상에 내 얼굴·진짜 이름·학교·집 주소가 나오지 않아요')),
      h('div', { class: 'th-parent' }, h('b', {}, '보호자 확인'), h('p', {}, '보호자가 직접 풀고 표시해 주세요.'),
        h('label', { class: 'th-qrow' }, h('span', {}, `${a} × ${b} =`), qi),
        h('label', { class: 'th-chk' }, c2, h('span', {}, '보호자인 저는 이 영상(목소리 포함)이 모두에게 공개되는 것에 동의해요')))),
    err, h('div', { class: 'acts' }, h('button', { class: 'btn', type: 'button', onclick: m.close }, '그만두기'), go));
}

/* ---------- 관리자 화면 (?admin) — 검토 중 · 숨겨진 작품을 승인 · 거절 · 지우기 ---------- */
async function theaterAdmin() {
  const api = thAdminApi();
  const body = h('div', { class: 'tha-body list' }), state = { st: 'pending,hidden' };
  const close = () => fadeRemove(bg, 220);
  const tabs = h('div', { class: 'th-seg' }, ...[['pending,hidden', '확인할 작품'], ['approved', '상영 중'], ['rejected', '거절함']].map(([st, label]) => h('button', { type: 'button', class: st === state.st ? 'on' : '', onclick: e => { state.st = st; $$('button', tabs).forEach(b => b.classList.toggle('on', b === e.currentTarget)); fill(); } }, label)));
  const bg = h('div', { class: 'thp-bg tha' }, h('div', { class: 'thp-top' }, h('div', { class: 'thp-tt' }, h('b', {}, '상영관 관리'), tabs), h('button', { class: 'thp-x', type: 'button', 'aria-label': '닫기', html: icon('x'), onclick: close })), body);
  $('#app').append(bg);
  async function fill() {
    body.innerHTML = '';
    let list; try { list = await api.queue(state.st); } catch (e) { body.append(h('p', { class: 'g-none' }, '목록을 못 불러왔어요: ' + e.message)); return; }
    if (!list.length) { body.append(h('p', { class: 'g-none' }, '확인할 작품이 없어요')); return; }
    for (const f of list) {
      const th = h('span', { class: 'th', role: 'button', 'aria-label': '보기' }); if (f.posterURL) th.style.backgroundImage = `url("${f.posterURL}")`;
      th.onclick = async () => { const u = await api.videoURL(f).catch(() => ''); if (u) open(u, '_blank'); else toast('영상이 없어요'); };
      const act = (label, st, cls = '') => h('button', { class: 'btn sm ' + cls, type: 'button', onclick: async () => { try { await api.setStatus(f.id, st); toast(label + ' 했어요'); fill(); } catch (e) { toast(e.message); } } }, label);
      body.append(h('div', { class: 'tha-row' }, th, h('div', { class: 'tha-info' }, h('b', {}, f.title), h('small', {}, `${f.nick} · ${mmss(f.secs || 0)} · ${({ pending: '검토 중', hidden: '신고로 숨김', approved: '상영 중', rejected: '거절함' })[f.status] || f.status}${f.reports ? ' · 신고 ' + f.reports : ''} · ♥ ${f.likes}`)),
        h('div', { class: 'tha-acts' }, f.status !== 'approved' ? act('승인', 'approved', 'primary') : act('숨기기', 'hidden'), f.status !== 'rejected' ? act('거절', 'rejected') : '',
          h('button', { class: 'btn sm red', type: 'button', onclick: async () => { if (!(await iosAlert('완전히 지울까요?', '영상 파일까지 지워져요.', '지우기', true))) return; try { await api.remove(f); fill(); } catch (e) { toast(e.message); } } }, '지우기'))));
    }
  }
  if (!thMock() && !api.signedIn()) {
    const em = h('input', { class: 'input', type: 'email', placeholder: '관리자 이메일', autocomplete: 'username' }), pw = h('input', { class: 'input', type: 'password', placeholder: '비밀번호', autocomplete: 'current-password' });
    const msg = h('p', { class: 'th-err' });
    const login = async () => { try { await api.login(em.value.trim(), pw.value); fill(); } catch (e) { msg.textContent = e.message; } };
    pw.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
    body.append(h('div', { class: 'tha-login' }, h('b', {}, '관리자 로그인'), em, pw, msg, h('button', { class: 'btn primary', type: 'button', onclick: login }, '들어가기')));
  } else fill();
}
