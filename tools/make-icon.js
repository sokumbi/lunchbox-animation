// icon.svg → icon-180.png(아이폰 홈 화면) · icon-192.png · icon-512.png(안드로이드 manifest)
// 쓰는 법: node tools/make-icon.js   (npm i 로 playwright가 있어야 해요)
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..'), svg = fs.readFileSync(path.join(root, 'icon.svg'), 'utf8');
const data = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ deviceScaleFactor: 1 });
  for (const n of [180, 192, 512]) {
    await p.setViewportSize({ width: n, height: n });
    await p.setContent(`<body style="margin:0;background:#111"><img src="${data}" width="${n}" height="${n}" style="display:block"></body>`);
    await p.screenshot({ path: path.join(root, `icon-${n}.png`), clip: { x: 0, y: 0, width: n, height: n } });
    console.log(`icon-${n}.png`);
  }
  await b.close();
})();
