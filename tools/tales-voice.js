// 전래동화 녹음 계획: 장면 순서대로 줄(내레이션·대사)에 번호를 붙이고, 같은 목소리끼리 묶어요(일레븐랩스 한 번에 ~600자)
const TALES = require('./tales-script.js');
const VOICE = {   // 등장인물 → 일레븐랩스 목소리(voice_id) · 말투 태그
  '내레이터': ['AiutpBawf78dyoTpoaHl', '[warmly]'],             // Rumi: 동화 낭독
  '용왕': ['kiVK4omWhBQ9AzwcaRq7', '[elderly voice]'],            // Hyeonwoo
  '문어 의원': ['PLfpgtLkFW07fDYbUiRJ', ''],                       // Bong sik: 익살스러운 노인
  '자라': ['Ir7oQcBXWiq4oFGROCfj', ''],                             // taemin: 젊고 따뜻한 남자
  '토끼': ['Lb7qkOn5hF8p7qfCDH8q', '[high voice]'],                // Annie: 귀여운 목소리
  '산신령': ['5ON5Fnz24cnOozEQfGAm', '[elderly voice] [warmly]'],  // Grandfather Namchun
};
const clean = s => s.replace(/\(속삭이며\)\s*/g, '[whispers] ').replace(/\(큰 소리로\)\s*/g, '[shouting] ').replace(/\(킥킥\)\s*/g, '[giggles] ').replace(/[“”]/g, '"');
function plan(id) {
  const t = TALES.find(x => x.id === id); const items = []; let s = 0;
  for (const [, scs] of t.parts) for (const sc of scs) { s++; let k = 0;
    if (sc.n) items.push({ scene: s, k: k++, who: '내레이터', text: sc.n });
    for (const [who, line] of sc.l || []) items.push({ scene: s, k: k++, who, text: line }); }
  items.forEach((it, i) => it.file = `${String(it.scene).padStart(2, '0')}_${it.k}`);
  const groups = []; const by = {};
  for (const it of items) (by[it.who] = by[it.who] || []).push(it);
  for (const [who, list] of Object.entries(by)) { let cur = [], len = 0;
    for (const it of list) { const L = it.text.length; if (cur.length && len + L > 420) { groups.push({ who, items: cur }); cur = []; len = 0; } cur.push(it); len += L; }
    if (cur.length) groups.push({ who, items: cur }); }
  for (const g of groups) { const [vid, tag] = VOICE[g.who]; g.voice = vid; g.prompt = g.items.map(it => (tag ? tag + ' ' : '') + clean(it.text)).join('\n[long pause]\n'); g.chars = g.prompt.length; }
  return { items, groups };
}
module.exports = { plan, VOICE };
if (require.main === module) { const p = plan(process.argv[2] || 'byeoljubu'); console.log(p.items.length, 'lines', p.groups.map(g => `${g.who}:${g.items.length}줄/${g.chars}자`).join(' | ')); require('fs').writeFileSync(process.argv[3] || '/tmp/claude-501/voice-plan.json', JSON.stringify(p, null, 1)); }
