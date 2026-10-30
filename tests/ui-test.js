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
      const inList = el => { const sp = el.parentElement && el.parentElement.closest(".list,.film,.scroll,.pn-list,.kgrid,.dc-pane"); if (!sp) return false; const a = el.getBoundingClientRect(), r = sp.getBoundingClientRect(); return a.bottom < r.top + 2 || a.top > r.bottom - 2 || a.top < r.top - 2 || a.bottom > r.bottom + 2 || a.right > r.right + 2 || a.left < r.left - 2; };
      const app = document.getElementById('app');
      for (const el of app.querySelectorAll('*')) {
        if (el.closest('[hidden]') || !el.offsetParent && el.tagName !== 'BODY') continue;
        if (el.matches('button,.key,.btn') && el.offsetWidth && !inList(el) && getComputedStyle(el).visibility !== 'hidden') { const r = el.getBoundingClientRect(); if (r.bottom > window.innerHeight + 1 || r.right > window.innerWidth + 1 || r.top < -1) bad.push('OFF ' + (el.getAttribute('aria-label') || el.textContent.trim().slice(0, 14))); }
        const cs = getComputedStyle(el);
        if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2 && !/scroll|list|modal|kgrid/.test(el.className)) bad.push('SCROLL ' + el.className);
      }
      // 버튼끼리 겹침 (4px 넘게 겹치면 표시, 스크롤 목록 안에서 가려진 것은 빼요)
      const top = document.querySelector('#modals .modal-bg:last-child') || document.querySelector('.al-bg') || document.querySelector('.ns-pg:last-child') || document.querySelector('.cm-bg') || app;
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
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1400);
    const T = async (sel, ms = 400, o = {}) => { await p.locator(sel).first().click(o); await p.waitForTimeout(ms); };
    const ev = f => p.evaluate(f);
    await sh('01_gallery'); await clipCheck(p, name + ' gallery');
    // 새 작품 → 바로 촬영
    await T('.g-card.new', 900);
    out.push(name + ' shoot open ' + await ev(() => V.screen + ' ' + P.title + ' fps=' + P.fps + ' ' + W + 'x' + H));
    await sh('02_shoot'); await clipCheck(p, name + ' shoot');
    for (let i = 0; i < 4; i++) await T('.shutter', 350);
    out.push(name + ' frames ' + await ev(() => nFrames()));
    await T('.sh-fr >> nth=1', 500); await sh('03_cut'); await clipCheck(p, name + ' cut panel');
    await T('.cut-b:has-text("지우기")', 400); out.push(name + ' delete -> ' + await ev(() => nFrames()));
    await T('.sh-fr >> nth=0', 400); await T('.cut-b:has-text("여기 뒤에 찍기")', 400); await sh('03b_insert'); await clipCheck(p, name + ' insert mode');
    await T('.shutter', 350); out.push(name + ' insert -> ins=' + await ev(() => V.ins + ' frames=' + nFrames()));
    await T('.sh-banner button', 300);
    await T('.sh-fr >> nth=2', 400); await T('.cut-b:has-text("다시 찍기")', 400); await sh('03c_retake'); await T('.shutter', 350);
    out.push(name + ' retake -> ' + await ev(() => V.retake + ' frames=' + nFrames()));
    await T('.sh-l [aria-label="되돌리기"]', 400); out.push(name + ' undo -> ' + await ev(() => nFrames()));
    await T('.sh-r [aria-label="타이머"]', 200); out.push(name + ' timer ' + await ev(() => V.timer)); await T('.sh-r [aria-label="타이머"]', 200); await T('.sh-r [aria-label="타이머"]', 200);
    await T('.sh-r [aria-label="사진"]', 10).catch(() => { });
    // 다 찍었어요 → 꾸미기
    await T('.sh-done', 700); out.push(name + ' deco open ' + await ev(() => V.screen));
    await sh('04_deco_voice'); await clipCheck(p, name + ' deco voice');
    await T('.dc-tabs [aria-label="소리"]', 400); await sh('04_deco_sfx'); await clipCheck(p, name + ' deco sfx');
    await T('.tl >> nth=1', 300); out.push(name + ' sfx add ' + await ev(() => P.sfx.length)); await T('.tl >> nth=1', 300); out.push(name + ' sfx toggle off ' + await ev(() => P.sfx.length)); await T('.tl >> nth=2', 300);
    await T('.dc-tabs [aria-label="배경음악"]', 400); await T('.tl >> nth=2', 300); await sh('04_deco_bgm'); await clipCheck(p, name + ' deco bgm'); out.push(name + ' bgm ' + await ev(() => sc().bgm));
    await T('.dc-speed button:has-text("빠르게")', 300); out.push(name + ' fps ' + await ev(() => P.fps));
    await T('.dc-play', 120); out.push(name + ' playing ' + await ev(() => Player.playing)); await sh('05_play'); await p.waitForTimeout(600); await T('.dc-mon canvas', 300, { position: { x: 20, y: 20 } });
    await T('.dc-tabs [aria-label="내보내기"]', 400); await sh('06_share'); await clipCheck(p, name + ' deco share');
    await T('.dc-l [aria-label="촬영"]', 600); out.push(name + ' back to shoot ' + await ev(() => V.screen + ' ins=' + V.ins)); await T('.sh-done', 600);
    await T('.dc-l [aria-label="내 작품"]', 900); out.push(name + ' gallery cards ' + await p.locator('.g-card:not(.new)').count()); await sh('07_gallery2'); await clipCheck(p, name + ' gallery2');
    await p.locator('.g-card:not(.new)').first().click({ button: 'right' }); await p.waitForTimeout(400); await sh('07b_ctx'); await clipCheck(p, name + ' ctx menu');
    await T('.cm-i:has-text("이름 바꾸기")', 400); await p.locator('.al-in').fill('바뀐 이름'); await T('.al-acts .ok', 600);
    out.push(name + ' rename -> ' + await p.locator('.g-card:not(.new) .tt b').first().textContent());
    await T('.g-card:not(.new)', 900); out.push(name + ' reopen -> ' + await ev(() => V.screen + ' frames=' + nFrames())); await T('.dc-l [aria-label="내 작품"]', 900);
    await p.locator('.g-card:not(.new) .g-more').first().click(); await p.waitForTimeout(400); await T('.cm-i.red', 400); await sh('07c_alert'); await T('.al-acts .red', 900);
    await T('.g-rb[aria-label="휴지통"]', 500); out.push(name + ' trash ' + await p.locator('.g-card').count()); await sh('08_trash');
    await T('.g-card', 400); await T('.cm-i:has-text("되살리기")', 700); await T('.g-rb[aria-label="내 작품"]', 500);
    await ctx.close();
  }
  await b.close(); server.close();
  console.log(out.join('\n'));
})();
