// 금도끼 은도끼 클레이(아드만 풍) 그림 계획 (2026-11-20, 미드저니). 장면 14개(tales-script.js 순서) + 카드 1장.
// 해님 달님(tales-clay-haenim.js)과 같은 방식: 캐릭터 설명(C)을 모든 프롬프트에 글자 그대로 넣고, 시험 그림 하나를 --sref로 걸어 화풍을 맞춰요.
// 표정: 늘 웃지 않게, 장면마다 이야기에 맞는 감정(슬픔·놀람·정직한 망설임·욕심·화남·후회)을 프롬프트에 적어요.
// 진행 상황: design/clay-geumdokki/<key>.png 가 있으면 만든 것. 앱에는 tales/geumdokki/clay/<key>.jpg (카드는 tales/geumdokki.jpg).
const STYLE = 'Aardman-style claymation stop-motion film still, like Wallace and Gromit: handmade plasticine characters with visible fingerprints and slightly uneven sculpted surfaces, miniature handcrafted set with real textures, soft natural studio lighting, gentle shadows, shallow depth of field, for children. Korean folk tale The Golden Axe and the Silver Axe, Joseon-era mountain village. Expressive acting faces that clearly show the emotion of this moment, not everyone smiling. ';
const C = {
  wood: 'the WOODCUTTER: a thin honest young plasticine man with a tanned face, thick black eyebrows, messy short black hair tied with a frayed grey cloth headband, wearing a worn brown patched jeogori jacket and baggy beige baji trousers with straw sandals',
  omma: 'the OLD MOTHER: a small frail plasticine old woman with grey hair in a low bun, a wrinkled kind face, wearing a plain faded grey-white hanbok',
  spirit: 'the MOUNTAIN SPIRIT: a tall old plasticine sage with a very long flowing white beard and bushy white eyebrows, wearing a softly glowing white robe and holding a gnarled wooden staff',
  greedy: 'the GREEDY NEIGHBOR: a plump plasticine man with narrow sly eyes, a pointed black goatee, wearing a flashy green silk jeogori with gold buttons and a black gat hat',
  pond: 'a deep round blue mountain pond surrounded by mossy rocks, tall pine trees and ferns',
  hut: 'a small poor thatched straw hut with a wooden fence and stacked firewood',
  iron: 'an old iron axe with a dull dark rusty head and a worn wooden handle',
  gold: 'a shining golden axe',
  silver: 'a gleaming silver axe',
};
const SCENES = {
  1: `Early morning in front of ${C.hut}, ${C.wood} with a wooden A-frame carrier on his back bows politely to ${C.omma} at the doorway, she looks at him with warm worried eyes.`,
  2: `Deep in the forest beside ${C.pond}, ${C.wood} swings ${C.iron} at a pine tree, focused and sweating, wood chips flying.`,
  3: `Beside ${C.pond}, ${C.iron} slips out of the hands of ${C.wood} and flies into the water with a big splash, he reaches out with a shocked panicked face.`,
  4: `Beside ${C.pond}, ${C.wood} sits on a rock crying with tears on his cheeks, the water swirls and ${C.spirit} rises up from the pond with a gentle concerned face.`,
  5: `Above ${C.pond}, ${C.spirit} holds up ${C.gold} with a curious testing look, ${C.wood} kneels on the bank and shakes his head and hands honestly, a little dazzled but firm.`,
  6: `Above ${C.pond}, ${C.spirit} holds up ${C.silver}, ${C.wood} kneels on the bank and calmly shakes his head again with an honest serious face.`,
  7: `Above ${C.pond}, ${C.spirit} holds out ${C.iron} together with ${C.gold} and ${C.silver} and nods kindly, ${C.wood} kneels with teary grateful eyes and both hands raised in surprise.`,
  8: `Evening inside ${C.hut}, ${C.wood} gives a warm new padded jacket and a table of food to ${C.omma}, she holds his hands with happy tears, ${C.iron} leans by the door.`,
  9: `In a neighboring village street, ${C.greedy} overhears villagers whispering and slaps his knee with a sly greedy grin and gleaming eyes.`,
  10: `Beside ${C.pond}, ${C.greedy} throws his own axe into the water on purpose while peeking around, then pretends to cry with a fake exaggerated sad face.`,
  11: `Above ${C.pond}, ${C.spirit} holds up ${C.gold} and ${C.silver} with narrowed suspicious eyes, ${C.greedy} on the bank points at both axes and reaches out greedily with his mouth wide open.`,
  12: `Above ${C.pond}, ${C.spirit} glares down very angrily with furrowed white eyebrows and pointing his staff, dark clouds gather, ${C.greedy} on the bank shrinks back frightened.`,
  13: `Beside ${C.pond}, the water is calm and empty, ${C.greedy} walks away alone along the forest path with empty hands, slumped shoulders and a regretful gloomy face.`,
  14: `Golden sunset in front of ${C.hut}, ${C.wood} and ${C.omma} sit together on the wooden porch with peaceful content faces, ${C.iron} leaning on the fence beside a neat stack of firewood.`,
  card: `Cover image: ${C.spirit} rises above ${C.pond} in a glow of light holding ${C.gold} in one hand and ${C.silver} in the other, ${C.wood} kneels on the mossy bank looking up in wonder, mist over the water.`,
};
// 만드는 순서: 7번(나무꾼·산신령·세 도끼)을 먼저 만들어 모습을 확인하고 --sref로 걸어요
const KEYS = ['7', ...Array.from({ length: 14 }, (_, i) => String(i + 1)).filter(k => k !== '7'), 'card'];
const mj = k => STYLE + SCENES[k] + ' --ar 16:9 --no text, letters, watermark';
if (typeof module !== 'undefined') module.exports = { C, SCENES, KEYS, mj };
if (require.main === module) { const fs = require('fs'); const done = KEYS.filter(k => fs.existsSync(`design/clay-geumdokki/${k}.png`)); console.log('done', done.join(','), '| todo', KEYS.filter(k => !done.includes(k)).join(',')); }
