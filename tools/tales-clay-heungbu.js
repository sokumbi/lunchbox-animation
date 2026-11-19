// 흥부와 놀부 클레이(아드만 풍) 그림 계획 (2026-11-15). 장면 17개(tales-script.js 순서) + 카드 1장, 장면마다 그림 하나.
// 별주부전(tales-clay-byeol.js)과 같은 방식: 캐릭터 설명(C)을 모든 프롬프트에 글자 그대로 넣어서 모습이 바뀌지 않게 해요.
// 진행 상황: design/clay-heungbu/<key>.png 가 있으면 만든 것. 다 모이면 tales/heungbu/clay/<key>.jpg 로 옮겨 앱에 연결해요.
const STYLE = 'Aardman-style claymation stop-motion film still, like Wallace and Gromit: handmade plasticine characters with visible fingerprints and slightly uneven sculpted surfaces, miniature handcrafted set with real textures, soft warm studio lighting, gentle shadows, shallow depth of field, cute and warm for children. Korean folk tale Heungbu and Nolbu, Joseon-era village. ';
const END = ' Wide 16:9, characters fully visible in the upper two thirds of the frame, no text, no letters, no watermark.';
const C = {
  heungbu: 'HEUNGBU: a thin kind plasticine young man with a round friendly face, big gentle eyes, rosy cheeks, a small black topknot on his head with a white cloth headband, clean-shaven, wearing a light sky-blue jeogori jacket and white baji trousers with straw sandals',
  nolbu: 'NOLBU: a plump greedy plasticine man with a huge round bare belly bulging out between his robe flaps, thick bushy black eyebrows, a curly black handlebar mustache, a sly grin, wearing a shiny purple silk hanbok with gold trim and a tall black horsehair gat hat',
  hwife: "HEUNGBU'S WIFE: a kind slim plasticine woman with a black hair bun and a wooden hairpin, a warm smile, wearing a cream jeogori and a faded pink skirt",
  kids: "HEUNGBU'S THREE CHILDREN: three small round-faced plasticine kids, two little boys with tufts of black hair and one little girl with a short braid, in light-colored hanbok",
  nwife: "NOLBU'S WIFE: a stout grumpy plasticine woman with an angry frown, a big hair bun with a gold hairpin, wearing a bright red silk hanbok, holding a big wooden rice paddle",
  swallow: 'the SWALLOW: a small cute plasticine swallow with a glossy dark navy back, white belly, red throat and a long forked tail',
  goblins: 'DOKKAEBI GOBLINS: chubby funny plasticine Korean goblins with one short horn, shaggy hair, big toothy grins, tiger-striped shorts and knobbly wooden clubs, silly not scary',
  hut: "a tiny broken-down thatched straw hut with cracked mud walls and holes in the paper doors",
  nhouse: "NOLBU'S big rich house with a curved black tiled roof, red wooden pillars and a stone wall",
  hhouse: "HEUNGBU'S big new house with a curved grey tiled roof and a sunny courtyard",
};
const SCENES = {
  1: `Village street in autumn: on the left ${C.nolbu} grins meanly while hammering a wooden stake into a big ripe orange pumpkin, on the right ${C.heungbu} kindly helps an old grandma carry her bundle, thatched and tiled houses behind.`,
  2: `Winter, in front of ${C.nhouse}, ${C.nolbu} stands at the gate pointing away angrily, ${C.heungbu} bows pleading while ${C.hwife} holds ${C.kids} close with small bundles, light snow falling.`,
  3: `Inside ${C.hut} in winter, ${C.kids} hold empty wooden bowls and look hungry, ${C.heungbu} hugs them gently and ${C.hwife} sits beside them, sad but warm, a tiny candle.`,
  4: `At the kitchen door of ${C.nhouse}, ${C.nwife} swings the rice paddle and slaps the cheek of ${C.heungbu}, a few white rice grains stick to his cheek and he smiles shyly, comical.`,
  5: `Spring, the eaves of ${C.hut} with a mud swallow nest, a big green clay snake slithers up the wall toward the nest, a baby version of ${C.swallow} tumbles down from the nest, ${C.heungbu} runs in with a stick to chase the snake.`,
  6: `In front of ${C.hut}, ${C.heungbu} sits on the ground and carefully wraps a tiny white cloth bandage around the leg of ${C.swallow} held gently in his palm, ${C.kids} watch with worried faces.`,
  7: `Next spring, sunny yard of ${C.hut}, ${C.swallow} flies over the yard and drops a small shiny seed from its beak, ${C.heungbu} looks up with open hands, delighted.`,
  8: `Autumn, ${C.hut} with its roof covered by green gourd vines and several enormous round white gourds as big as the house, ${C.hwife} points at the gourds and talks to ${C.heungbu}, ${C.kids} peek out.`,
  9: `In the yard of ${C.hut}, ${C.heungbu} and ${C.hwife} sit on each side of one enormous white gourd and pull a big two-handled saw back and forth, cheerful faces, ${C.kids} cheer.`,
  10: `In the yard, a giant white gourd split open, white rice and golden treasure coins and jewels pour out like a waterfall, ${C.heungbu} and ${C.hwife} gasp with joy, ${C.kids} jump up, in the background tiny clay carpenters build ${C.hhouse}.`,
  11: `In front of ${C.hhouse} with treasure chests, ${C.nolbu} grabs the sleeve of ${C.heungbu} and asks eagerly with a comical greedy face and sparkling eyes.`,
  12: `Under the eaves of ${C.nhouse}, ${C.nolbu} holds ${C.swallow} in one hand and wraps a big messy cloth bandage around its leg with a sly greedy grin, the swallow looks scared.`,
  13: `Autumn, the black tiled roof of ${C.nhouse} covered with green vines and huge white gourds, ${C.nolbu} on the ground saws a giant gourd with a big saw, laughing greedily.`,
  14: `In the courtyard of ${C.nhouse}, a giant white gourd bursts open and ${C.goblins} jump out waving their clubs, ${C.nolbu} falls on his back with his gat hat flying off, very surprised, comical.`,
  15: `In the courtyard of ${C.nhouse}, ${C.goblins} run off carrying treasure chests and bags, muddy brown water gushes out of a second split gourd and floods the yard, ${C.nolbu} sits in the puddle looking miserable, comical.`,
  16: `In the sunny courtyard of ${C.hhouse}, ${C.nolbu} in a muddy torn version of his purple hanbok bows his head deeply in apology, ${C.heungbu} smiles kindly and holds both his hands, ${C.hwife} watches warmly.`,
  17: `Happy ending at golden sunset in the courtyard of ${C.hhouse}: ${C.heungbu} and ${C.nolbu} sit side by side laughing at a low table full of food, ${C.hwife}, ${C.nwife} smiling for once, and ${C.kids} gather around, ${C.swallow} flies above.`,
  card: `Cover image: in the yard of ${C.hut}, ${C.heungbu} and ${C.hwife} saw one enormous white gourd that glows from inside with golden sparkles, ${C.swallow} flies above them, green gourd vines on the thatched roof.`,
};
// 2번 시험 그림(2026-11-15)에 맞춰 흥부 흰 머리띠·놀부 드러난 배를 설명에 넣었어요
// 만드는 순서: 2번(주인공 넷이 다 나와요)을 먼저 만들어 모습을 확인하고 나머지를 만들어요
const KEYS = ['2', '1', ...Array.from({ length: 15 }, (_, i) => String(i + 3)), 'card'];
const prompt = k => STYLE + SCENES[k] + END;
if (typeof module !== 'undefined') module.exports = { C, SCENES, KEYS, prompt };
if (require.main === module) { const fs = require('fs'); const done = KEYS.filter(k => fs.existsSync(`design/clay-heungbu/${k}.png`)); console.log('done', done.join(','), '| todo', KEYS.filter(k => !done.includes(k)).join(',')); }
