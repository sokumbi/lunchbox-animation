/* 런치박스 UI 점검: 폰 가로(i13) · 작은 폰(se) · 세로 폰(por) · 태블릿(tab)에서 전체 흐름을 눌러 보고
   화면 밖으로 나간 버튼·불필요한 스크롤을 찾아요. 사진은 tests/shots/ 에 저장돼요.
   사용: npm test            (모든 기기)
        node tests/ui-test.js i13,se   (고른 기기만) */
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.join(__dirname, '..');
const server = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html'); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }); r.end(d); }); }).listen(8765);
fs.mkdirSync(path.join(__dirname, 'shots'), { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const out = [];
  const only = process.argv[2];
  const clipCheck = async (p, tag) => {
    const r = await p.evaluate(() => {
      const bad = [];
      const inList = el => { const sp = el.parentElement && el.parentElement.closest('.list,.film,.scroll,.pn-list,.kgrid'); if (!sp) return false; const a = el.getBoundingClientRect(), r = sp.getBoundingClientRect(); return a.bottom < r.top + 2 || a.top > r.bottom - 2 || a.top < r.top - 2 || a.right > r.right + 2 || a.left < r.left - 2; };
      const app = document.getElementById('app');
      for (const el of app.querySelectorAll('*')) {
        if (el.closest('[hidden]') || !el.offsetParent && el.tagName !== 'BODY') continue;
        if (el.matches('button,.key,.btn') && el.offsetWidth && !inList(el)) { const r = el.getBoundingClientRect(); if (r.bottom > window.innerHeight + 1 || r.right > window.innerWidth + 1 || r.top < -1) bad.push('OFF ' + (el.getAttribute('aria-label') || el.textContent.trim().slice(0, 14))); }
        const cs = getComputedStyle(el);
        if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2 && !/scroll|list|modal|kgrid/.test(el.className)) bad.push('SCROLL ' + el.className);
      }
      // 버튼끼리 겹침 (4px 넘게 겹치면 표시, 스크롤 목록 안에서 가려진 것은 빼요)
      const top = document.querySelector('#modals .modal-bg:last-child') || app;
      const inView = el => { const sp = el.parentElement.closest('.list,.scroll,.film,.pn-list,.kgrid'); if (!sp) return true; const a = el.getBoundingClientRect(), r = sp.getBoundingClientRect(); return a.top >= r.top - 2 && a.bottom <= r.bottom + 2 && a.left >= r.left - 2 && a.right <= r.right + 2; };
      // 선택 막대(.sel-bar)와 컷 말풍선(.ed-pop)은 일부러 키 위에 띄우는 창이라 빼요
      const btns = [...top.querySelectorAll('button,.key,.btn')].filter(el => el.offsetWidth && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[hidden]') && !el.parentElement.closest('button,.key,.btn') && !el.matches('.tb') && inView(el));
      const bar = top.querySelector('.ed-pop:not([hidden])') || top.querySelector('.ed-menu') || top.querySelector('.ed-cpop') || top.querySelector('.sel-bar:not([hidden])'), barR = bar && bar.getBoundingClientRect();
      const under = el => { if (!barR || bar.contains(el)) return false; const a = el.getBoundingClientRect(); return a.left < barR.right && a.right > barR.left && a.top < barR.bottom && a.bottom > barR.top; };
      const nm = el => (el.getAttribute('aria-label') || el.textContent.trim().slice(0, 10) || el.className.split(' ')[0]);
      for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) {
        const a = btns[i].getBoundingClientRect(), c = btns[j].getBoundingClientRect();
        const ox = Math.min(a.right, c.right) - Math.max(a.left, c.left), oy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
        if (ox > 4 && oy > 4 && !under(btns[i]) && !under(btns[j])) bad.push('OVERLAP ' + nm(btns[i]) + ' × ' + nm(btns[j]));
      }
      return [...new Set(bad)].slice(0, 12);
    });
    out.push(tag + ': ' + (r.length ? r.join(' | ') : 'ok'));
  };
  const devs = [['i13', devices['iPhone 13 landscape']], ['se', { viewport: { width: 667, height: 375 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }], ['por', devices['iPhone 13']], ['tab', { viewport: { width: 1180, height: 820 }, isMobile: true, hasTouch: true }]].filter(d => !only || only.split(',').includes(d[0]));
  for (const [name, dev] of devs) {
    const ctx = await b.newContext({ ...dev, permissions: ['camera', 'microphone'] });
    const p = await ctx.newPage(); p.on('pageerror', e => out.push(name + ' ERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') out.push(name + ' CONSOLE ' + m.text()); });
    const sh = async n => p.screenshot({ path: `${__dirname}/shots/${name}_${n}.png` });
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1600); await sh('01_splash');
    const T = async (sel, ms = 400, o = {}) => { await p.locator(sel).first().click(o); await p.waitForTimeout(ms); };
    const ev = f => p.evaluate(f);
    await T('#splash', 1000); await sh('02_gallery'); await clipCheck(p, name + ' gallery');
    await T('.gcard.new', 500); await sh('03_kinds'); await clipCheck(p, name + ' kinds');
    // 팔도 민담 지도: 깜빡이는 곳 누르기 (경주는 이야기 두 편)
    await T('.kind[data-kind=map]', 500); await sh('03m_map'); await clipCheck(p, name + ' map');
    await T('.pin[aria-label="경주"]', 300, { force: true }); await sh('03m_pin'); await clipCheck(p, name + ' map pin');
    out.push(name + ' map pin: ' + await p.locator('.map-side .ms-body h3').textContent() + ' / tabs ' + await p.locator('.ms-tabs .chip').count());
    await T('#libTop [aria-label="뒤로"]', 300);
    await T('.kind[data-kind=tales]', 400); await sh('03_library'); await clipCheck(p, name + ' library');
    await T('.cas.on', 900); await T('#introSkip', 1200);
    out.push(name + ' editor open ' + await ev(() => ED.open + ' cap=' + ED.cap + ' ' + P.title));
    await sh('04_capture'); await clipCheck(p, name + ' capture');
    for (let i = 0; i < 4; i++) await T('.cp-shut', 350);
    await T('.cp-r [aria-label="카메라 설정"]', 300); await sh('04c_camset'); await clipCheck(p, name + ' camset'); await T('.cp-r [aria-label="카메라 설정"]', 300);
    await T('.cp-r [aria-label="편집으로"]', 500);
    out.push(name + ' frames ' + await ev(() => P.scenes.map(s => s.frames.length).join(',')));
    await sh('04_editor'); await clipCheck(p, name + ' editor');
    await T('.ef-fr >> nth=1', 400); await sh('04b_pop'); await clipCheck(p, name + ' pop');
    await T('.ed-pop button:has-text("복사")', 300); await T('.ef-fr.sel', 300); await T('.ed-pop button:has-text("붙여넣기")', 300); out.push(name + ' copy+paste -> ' + await ev(() => P.scenes[0].frames.length));
    await T('.ef-fr.sel', 300); await T('.ed-pop button:has-text("일시중지")', 400); await sh('04f_hold'); await clipCheck(p, name + ' hold');
    await ev(() => { const sc = document.querySelector('.rl-sc'); sc.scrollLeft += 14 * 4; }); await p.waitForTimeout(200); await T('.bs-ok', 300); out.push(name + ' hold -> ' + await ev(() => P.scenes[0].frames[ED.sel.i].hold));
    await T('.ef-fr.sel', 300); await T('.ed-pop button:has-text("편집")', 400); await T('.bs-tabs [aria-label="색"]', 300); await T('.pk >> nth=1', 300); await sh('04g_frameedit'); await clipCheck(p, name + ' frame edit'); await T('.bs-ok', 800);
    await T('.ed-rl [aria-label="더하기"]', 300); await T('.ed-menu button:has-text("제목 카드")', 400); await T('.pk >> nth=2', 300); await sh('04h_title'); await clipCheck(p, name + ' title card'); await T('.bs-ok', 600);
    out.push(name + ' title card -> ' + await ev(() => P.scenes[0].frames.length + ' first hold ' + P.scenes[0].frames[0].hold));
    await T('.ed-rl [aria-label="더하기"]', 300); await sh('04e_addmenu'); await T('.ed-menu button:has-text("새 장면")', 400); await T('.modal button:has-text("만들고 찍기")', 600);
    for (let i = 0; i < 3; i++) await T('.cp-shut', 350);
    await T('.cp-r [aria-label="편집으로"]', 500);
    out.push(name + ' scenes ' + await ev(() => P.scenes.map(s => s.name + ':' + s.frames.length).join(',')));
    await sh('04d_scene2'); await clipCheck(p, name + ' scene2');
    await T('.ed-rl [aria-label="이야기"]', 500); await sh('05_story'); await clipCheck(p, name + ' story'); await T('.modal .pn-x', 300);
    await T('.ed-rl [aria-label="소리"]', 500); await sh('05_sound_voice'); await clipCheck(p, name + ' sound voice');
    if (await p.locator('.bs-btn:has-text("원작 대사 넣기")').count()) await T('.bs-btn:has-text("원작 대사 넣기")', 400);
    await sh('05_sound_lines'); await clipCheck(p, name + ' sound lines');
    await T('.bs-tabs [aria-label="효과음"]', 400); await T('.bt >> nth=1', 300); await sh('05_sound_sfx'); await clipCheck(p, name + ' sound sfx'); await T('.bs-ok', 400);
    out.push(name + ' sfx count ' + await ev(() => P.sfx.length));
    await T('.ed-rl [aria-label="소리"]', 400); await T('.bs-tabs [aria-label="배경음악"]', 400); await T('.bt >> nth=1', 300); await sh('05_sound_bgm'); await clipCheck(p, name + ' sound bgm'); await T('.bs-ok', 400);
    out.push(name + ' bgm ' + await ev(() => P.scenes.map(s => s.bgm || '-').join(',')));
    await T('.ed-rl [aria-label="소리"]', 400); await T('.bs-tabs [aria-label="내레이션"]', 400); await sh('05_sound_narr'); await clipCheck(p, name + ' sound narr');
    await T('.bs-tabs [aria-label="소리 크기"]', 400); await sh('05_sound_mix'); await clipCheck(p, name + ' sound mix'); await T('.bs-x', 300);
    const f0 = await ev(() => P.fx.length);
    await T('.ed-rl [aria-label="더하기"]', 300); await T('.ed-menu button:has-text("효과 넣기")', 400); await T('.bt >> nth=0', 300); await sh('05_fx'); await clipCheck(p, name + ' fx'); await T('.bs-ok', 400);
    out.push(name + ' fx insert ' + f0 + '->' + await ev(() => P.fx.length));
    await T('.ed-rr [aria-label="되돌리기"]', 400); out.push(name + ' undo fx -> ' + await ev(() => P.fx.length));
    await T('.ed-rr [aria-label="재생"]', 900); await sh('06_play'); out.push(name + ' playing ' + await ev(() => Player.playing)); await T('.ed-rr [aria-label="재생"]', 300);
    await T('.ef-scn', 400); await sh('06b_scenemenu'); await clipCheck(p, name + ' scenemenu'); await T('.modal button:has-text("닫기")', 300);
    await T('.ed-rl [aria-label="설정"]', 400); await sh('06c_settings'); await clipCheck(p, name + ' settings');
    await T('.bs-tabs [aria-label="전경"]', 300); await T('.pk >> nth=1', 300); await T('.bs-tabs [aria-label="효과"]', 300); await T('.pk >> nth=2', 300); await sh('06d_settings_look'); await clipCheck(p, name + ' settings look'); await T('.bs-ok', 300);
    out.push(name + ' look ' + await ev(() => JSON.stringify(P.look)));
    await T('.ed-rr [aria-label="완성"]', 500); await sh('07_finish'); await clipCheck(p, name + ' finish');
    // 상영관: 올리기 → 순위 → 감상 → 별점 → 편집기로 돌아오기
    await T('.fin-b:has-text("상영관")', 900); await sh('09_theater'); await clipCheck(p, name + ' theater');
    await T('.th-row', 900); await sh('09_watch'); await clipCheck(p, name + ' watch');
    await T('.tw-give button >> nth=3', 400); await sh('09_rated');
    await T('.tw-top [aria-label="닫기"]', 700);
    out.push(name + ' theater rows ' + await p.locator('.th-row').count() + ' / ' + (await p.locator('.th-row .th-s small').first().textContent()));
    await T('#libTop [aria-label="뒤로"]', 900); out.push(name + ' theater back -> ' + await ev(() => ED.open + ' ' + !!P));
    await T('.ed-rl [aria-label="내 작품"]', 900); out.push(name + ' gallery cards ' + await p.locator('.gcard:not(.new)').count()); await sh('08_gallery2'); await clipCheck(p, name + ' gallery2');
    // 민담으로 시작 → 이야기 판이 열린 편집기, 나만의 이야기 → 바로 촬영
    await T('.gcard.new', 400); await T('.kind[data-kind=map]', 400);
    await T('.pin[aria-label="단양 도담삼봉"]', 200, { force: true }); await T('.ms-go', 900);
    out.push(name + ' legend -> ' + await ev(() => !!$('.story-modal') + ' ' + P.title + ' scenes ' + P.scenes.length));
    await T('.modal .pn-x', 300); if (await p.locator('.cp').count()) await T('.cp-r [aria-label="편집으로"]', 400); await sh('08b_legend'); await T('.ed-rl [aria-label="내 작품"]', 900); await T('.gcard.new', 400);
    await T('.kind[data-kind=own]', 900); out.push(name + ' own -> ' + await ev(() => ED.open + ' cap=' + ED.cap + ' ' + P.storyId));
    await ctx.close();
  }
  await b.close(); server.close();
  console.log(out.join('\n'));
})();
