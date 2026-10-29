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
      const inList = el => { const sp = el.parentElement && el.parentElement.closest('.list,.film'); if (!sp) return false; const a = el.getBoundingClientRect(), r = sp.getBoundingClientRect(); return a.bottom < r.top + 2 || a.top > r.bottom - 2 || a.top < r.top - 2 || a.right > r.right + 2 || a.left < r.left - 2; };
      const app = document.getElementById('app');
      for (const el of app.querySelectorAll('*')) {
        if (el.closest('[hidden]') || !el.offsetParent && el.tagName !== 'BODY') continue;
        if (el.matches('button,.key,.btn') && el.offsetWidth && !inList(el)) { const r = el.getBoundingClientRect(); if (r.bottom > window.innerHeight + 1 || r.right > window.innerWidth + 1 || r.top < -1) bad.push('OFF ' + (el.getAttribute('aria-label') || el.textContent.trim().slice(0, 14))); }
        const cs = getComputedStyle(el);
        if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2 && !/scroll|list|modal/.test(el.className)) bad.push('SCROLL ' + el.className);
      }
      // 버튼끼리 겹침 (4px 넘게 겹치면 표시, 스크롤 목록 안에서 가려진 것은 빼요)
      const top = document.querySelector('#modals .modal-bg:last-child') || app;
      const inView = el => { const sp = el.parentElement.closest('.list,.scroll,.film'); if (!sp) return true; const a = el.getBoundingClientRect(), r = sp.getBoundingClientRect(); return a.top >= r.top - 2 && a.bottom <= r.bottom + 2 && a.left >= r.left - 2 && a.right <= r.right + 2; };
      // 선택 막대(.sel-bar)는 일부러 키 위에 띄우는 창이라 빼요
      const btns = [...top.querySelectorAll('button,.key,.btn')].filter(el => el.offsetWidth && !el.closest('[hidden]') && !el.parentElement.closest('button,.key,.btn') && inView(el));
      const bar = top.querySelector('.sel-bar:not([hidden])'), barR = bar && bar.getBoundingClientRect();
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
    await p.locator('#splash').click(); await p.waitForTimeout(900); await p.locator('#process .tray').click(); await p.waitForTimeout(2300); await sh('02_process'); await clipCheck(p, name + ' process');
    await p.locator('.proc-item').first().click(); await p.waitForTimeout(1100); await sh('03_library'); await clipCheck(p, name + ' library');
    await p.locator('.cas.on').click(); await p.waitForTimeout(900); await p.locator('#introSkip').click(); await p.waitForTimeout(1000);
    await sh('03b_process2');
    await p.locator('.proc-item').nth(1).click(); await p.waitForTimeout(900);
    await p.waitForTimeout(1800); out.push(name + ' after shoot card -> step=' + await p.evaluate(() => S.step));
    for (let i = 0; i < 6; i++) { await p.locator('.shutter').click(); await p.waitForTimeout(250); }
    await sh('04_shoot'); await clipCheck(p, name + ' shoot');
    await p.locator('.fr').nth(1).click(); await p.waitForTimeout(200); await sh('04b_shootpop'); await p.locator('.frame-pop [aria-label="닫기"]').click();
    await p.locator('.shoot .key', { hasText: '장면 끝' }).click(); await p.waitForTimeout(600); await sh('04c_endscene'); await clipCheck(p, name + ' endscene');
    await p.locator('.modal >> text=다음 장면 찍기').click(); await p.waitForTimeout(500); out.push(name + ' scenes ' + await p.evaluate(() => P.scenes.map(s => s.name + ':' + s.frames.length).join(',')));
    for (let i = 0; i < 3; i++) { await p.locator('.shutter').click(); await p.waitForTimeout(250); }
    for (const st of ['script', 'voice', 'sound', 'edit', 'final']) {
      await p.evaluate(s => goStep(s), st); await p.waitForTimeout(800);
      if (st === 'voice' && await p.locator('text=원작 대사 쓰기').count()) { await p.locator('text=원작 대사 쓰기').click(); await p.waitForTimeout(400); }
      if (st === 'edit') { await p.locator('.fxk').first().click(); await p.waitForTimeout(500); await sh('05_edit_preview'); const n0 = await p.evaluate(() => P.fx.length); await p.locator('.fxk').first().click(); await p.waitForTimeout(300); out.push(name + ' fx insert ' + n0 + '->' + await p.evaluate(() => P.fx.length)); }
      await sh('05_' + st); await clipCheck(p, name + ' ' + st);
      if (st === 'sound') {
        await p.locator('.fxk').nth(1).click(); await p.waitForTimeout(200); await p.locator('.fxk').nth(1).click(); await p.waitForTimeout(300); await sh('05_sound_sfx'); out.push(name + ' sfx count ' + await p.evaluate(() => P.sfx.length));
        for (const t of ['배경음악', '내레이션']) { await p.locator('.RR .key', { hasText: t }).click(); await p.waitForTimeout(500); await sh('05_sound_' + t); await clipCheck(p, name + ' sound ' + t); }
      }
    }
    await p.evaluate(() => goStep('edit')); await p.waitForTimeout(500);
    const before = await p.evaluate(() => P.fx.length); await p.locator('.navrow .undo').click(); await p.waitForTimeout(500); out.push(name + ' undo fx ' + before + '->' + await p.evaluate(() => P.fx.length));
    await p.locator('.tl-scene').first().click(); await p.waitForTimeout(400); await sh('06b_scenemenu'); await p.locator('.modal >> text=닫기').click(); await p.waitForTimeout(300);
    await p.locator('.RR .key', { hasText: '자르기' }).click(); await p.waitForTimeout(400); await sh('06_trim'); await p.locator('.modal >> text=다 했어요').click();
    await p.locator('.navkey').first().click(); await p.waitForTimeout(500); await sh('07_nav'); await clipCheck(p, name + ' nav');
    await p.locator('.step-go', { hasText: '촬영' }).click(); await p.waitForTimeout(800); out.push(name + ' nav -> ' + await p.evaluate(() => S.step));
    await p.locator('.navkey').first().click(); await p.waitForTimeout(400); await p.locator('.step-go', { hasText: '완성' }).click(); await p.waitForTimeout(800); out.push(name + ' nav -> ' + await p.evaluate(() => S.step));
    // "다음" 키만 눌러 시나리오부터 완성까지 가 봐요
    await p.evaluate(() => goStep('script')); await p.waitForTimeout(600); const walk = ['script'];
    for (let i = 0; i < 5; i++) { const nk = p.locator('.nextkey:visible').first(); if (!await nk.count()) { walk.push('(다음 키 없음)'); break; } await nk.click(); await p.waitForTimeout(700); if (await p.locator('.modal .choice').count()) { await p.locator('text=원작 대사 쓰기').click(); await p.waitForTimeout(400); } walk.push(await p.evaluate(() => S.step)); if (i < 4) await sh('08_next_' + walk[walk.length - 1]); }
    out.push(name + ' next walk: ' + walk.join(' > '));
    await ctx.close();
  }
  await b.close(); server.close();
  console.log(out.join('\n'));
})();
