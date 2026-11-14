// 녹음이 끝난 이야기의 재생 데이터를 src/p6e_story.js(STORY)로 써요. usage: node tools/tales-story.js byeoljubu [다른 id…]
const fs = require('fs'); const TALES = require('./tales-script.js'); const { MAP } = require('./tales-images.js'); const { plan } = require('./tales-voice.js');
const out = {};
for (const id of process.argv.slice(2)) {
  const t = TALES.find(x => x.id === id), lens = JSON.parse(fs.readFileSync(`tales/${id}/v/lens.json`, 'utf8')), { items } = plan(id);
  const scenes = []; let s = 0;
  for (const [part, scs] of t.parts) for (const sc of scs) { const img = String(MAP[id][s]); s++;
    const lines = items.filter(it => it.scene === s).map(it => ({ w: it.who === '내레이터' ? '' : it.who, t: it.text.replace(/^\([^)]*\)\s*/, ''), a: it.file, d: lens[it.file] }));
    scenes.push({ img, part: part.split(' · ')[0], lines }); }
  out[id] = scenes;
}
const js = `/* 다시 쓴 전래동화(기승전결·대사) 재생 데이터 — tools/tales-story.js가 만들어요. 고치지 말고 tools/tales-script.js·tales-images.js를 고친 뒤 다시 만드세요.
   장면: img(tales/<id>/<img>.jpg, 'card'면 tales/<id>.jpg), lines: w(말하는 이, 빈칸=내레이터) · t(자막) · a(tales/<id>/v/<a>.mp3) · d(초) */
const STORY = ${JSON.stringify(out)};
`;
fs.writeFileSync('src/p6e_story.js', js); console.log(Object.entries(out).map(([k, v]) => k + ' ' + v.length + '장면').join(', '), js.length + 'B');
