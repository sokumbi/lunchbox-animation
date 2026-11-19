// 해님 달님 클레이(아드만 풍) 그림 계획 (2026-11-19). 장면 18개(tales-script.js 순서) + 카드 1장, 장면마다 그림 하나.
// 별주부전·흥부와 놀부(tales-clay-heungbu.js)와 같은 방식: 캐릭터 설명(C)을 모든 프롬프트에 글자 그대로 넣어서 모습이 바뀌지 않게 해요.
// 진행 상황: design/clay-haenim/<key>.png 가 있으면 만든 것. 다 모이면 tales/haenim/clay/<key>.jpg 로 옮겨 앱에 연결해요.
// 무섭지 않게: 엄마가 잡아먹히는 장면은 그리지 않고, 호랑이는 우스꽝스럽게, 떨어지는 장면도 피 없이 수수밭에 쿵.
const STYLE = 'Aardman-style claymation stop-motion film still, like Wallace and Gromit: handmade plasticine characters with visible fingerprints and slightly uneven sculpted surfaces, miniature handcrafted set with real textures, soft warm studio lighting, gentle shadows, shallow depth of field, cute and warm for children. Korean folk tale The Sun and the Moon, Joseon-era mountain village. ';
const END = ' Wide 16:9, characters fully visible in the upper two thirds of the frame, no text, no letters, no watermark.';
const C = {
  mom: "the MOTHER: a kind gentle plasticine woman with a round face, rosy cheeks, black hair in a low bun under a white cloth headscarf, wearing a plain white jeogori and a dark indigo-blue skirt",
  tiger: 'the TIGER: a big chubby plasticine tiger with bright orange fur, bold black stripes, a round goofy face, long white whiskers, big yellow eyes and a cheeky toothy grin, more silly than scary',
  dtiger: "the TIGER in disguise: a big chubby plasticine tiger with bright orange fur, bold black stripes, a round goofy face and long white whiskers, clumsily wearing the mother's white jeogori, dark indigo-blue skirt and white cloth headscarf, his striped tail poking out under the skirt",
  sister: 'the SISTER: a brave clever plasticine girl about ten years old with a long single black braid tied with a red ribbon, big bright eyes, wearing a yellow jeogori and a red skirt',
  brother: 'the BROTHER: a chubby little plasticine boy about six years old with a round bowl-cut black hair, big round eyes, rosy cheeks, wearing a light green jeogori and grey baji trousers',
  hut: 'a small thatched straw hut with paper sliding doors and a low stone wall at the foot of a pine-covered mountain',
  tree: 'a tall old tree with thick branches beside a round stone well in the hut yard',
};
const kids = `${C.sister} and ${C.brother}`;
const SCENES = {
  1: `Morning in front of ${C.hut}, ${C.mom} shapes white rice cakes on a wooden tray, ${kids} help her happily, steam rising from a pot.`,
  2: `At the gate of ${C.hut}, ${C.mom} carries a round straw basket full of rice cakes on her head and waves goodbye, ${kids} wave back from the doorway.`,
  3: `Sunset on a winding mountain pass with pine trees, ${C.tiger} blocks the path standing on his hind legs with a paw out, ${C.mom} with the basket on her head nervously hands him one white rice cake.`,
  4: `Dusk on another mountain pass, ${C.tiger} sits on the path licking his lips with rice cake crumbs on his whiskers, ${C.mom} shows him her empty straw basket and pleads with folded hands.`,
  5: `Night, a moonlit mountain path leading down to ${C.hut}, ${C.dtiger} tiptoes down the path toward the hut with a sneaky grin, silly and comical.`,
  6: `Night inside ${C.hut}, a candle glows, ${kids} sit by the closed paper door listening suspiciously, the big shadow of a tiger with a headscarf shows on the paper door.`,
  7: `Night inside ${C.hut}, a big hairy orange striped tiger paw pokes through a gap in the paper door, ${kids} lean back in surprise pointing at the hairy paw.`,
  8: `Night in the small kitchen of ${C.hut}, ${C.dtiger} dips his paws into a sack of white flour, a cloud of flour dust puffs up, his paws turn white, comical.`,
  9: `Night inside ${C.hut}, ${C.dtiger} sits on the floor pretending to be mother, ${C.sister} notices the striped tail under the skirt and whispers into the ear of ${C.brother}, candle light.`,
  10: `Moonlit night in the hut yard, ${kids} hide high up on a branch of ${C.tree}, ${C.tiger} bends over the well and stares at the children's reflection in the water, puzzled.`,
  11: `Moonlit night, ${C.tiger} looks up at ${C.tree} with a curious face, ${C.sister} sits on a high branch hugging ${C.brother} and answers him with a clever smile.`,
  12: `Moonlit night, ${C.tiger} with paws shiny with sesame oil slides down the trunk of ${C.tree} with a silly face, an oil bottle on the ground, ${C.brother} laughs out loud on the branch while ${C.sister} covers his mouth.`,
  13: `Moonlit night, ${C.tiger} climbs ${C.tree} chopping notches into the trunk with a small axe, at the very top ${kids} kneel on the highest branch and pray to the starry sky with folded hands.`,
  14: `Night sky, a strong new golden rope glowing with light comes down from the clouds, ${kids} hold on tight and rise up into the starry sky, the tree and hut far below.`,
  15: `Night sky over a field of tall red sorghum stalks, ${C.tiger} hangs from an old frayed rotten rope that snaps, he falls toward the soft sorghum field with a silly shocked face, comical, no blood.`,
  16: `High in the night sky among soft cotton clouds, ${C.sister} holds a glowing silver moon and looks a little scared of the dark, ${C.brother} holds a bright golden sun and comforts her.`,
  17: `Bright daytime sky, ${C.sister} glowing as the shining sun with golden rays around her, shyly covering her face with her hands, ${C.brother} as the gentle moon peeks from a cloud and smiles, a tiny village far below.`,
  18: `Split sky above a peaceful little village, on the left a sunny day side with ${C.sister} smiling as the sun, on the right a starry night side with ${C.brother} smiling as the moon, the two wave to each other.`,
  card: `Cover image: moonlit night, ${kids} climb a glowing golden rope up into the starry sky, far below ${C.tiger} looks up from beside ${C.tree} next to ${C.hut}, a big round moon.`,
};
// 만드는 순서: 9번(엄마로 변장한 호랑이와 오누이)을 먼저 보고 나머지를 만들어요
const KEYS = ['9', ...Array.from({ length: 18 }, (_, i) => String(i + 1)).filter(k => k !== '9'), 'card'];
const prompt = k => STYLE + SCENES[k] + END;
if (typeof module !== 'undefined') module.exports = { C, SCENES, KEYS, prompt };
if (require.main === module) { const fs = require('fs'); const done = KEYS.filter(k => fs.existsSync(`design/clay-haenim/${k}.png`)); console.log('done', done.join(','), '| todo', KEYS.filter(k => !done.includes(k)).join(',')); }
