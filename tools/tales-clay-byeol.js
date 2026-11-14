// 별주부전 클레이(아드만 풍) 그림 계획 (2026-11-14). 장면 16개 + 카드 1장, 장면마다 그림 하나(재사용 없음).
// 캐릭터 설명(C)을 모든 프롬프트에 그대로 넣어서 모습이 바뀌지 않게 해요.
// 진행 상황: design/clay-byeol/<key>.png 가 있으면 만든 것. 다 모이면 tales/byeoljubu/clay/<key>.jpg 로 옮겨 앱에 연결해요.
const STYLE = 'Aardman-style claymation stop-motion film still, like Wallace and Gromit: handmade plasticine characters with visible fingerprints and slightly uneven sculpted surfaces, miniature handcrafted set with real textures, soft warm studio lighting, gentle shadows, shallow depth of field, cute and warm for children. Korean folk tale Byeoljubujeon. ';
const END = ' Wide 16:9, characters fully visible in the upper two thirds of the frame, no text, no letters, no watermark.';
const C = {
  turtle: 'BYEOLJUBU the sea turtle: a friendly green plasticine sea turtle with a big round head, large white oval eyes with black pupils, a wide gentle smile, a dark brown domed shell, wearing a navy blue Joseon official robe (gwanbok) with a square embroidered white crane badge on the chest and a black samo winged hat',
  rabbit: 'TOKKI the rabbit: a small white plasticine rabbit with long upright ears with pink insides, big round black eyes, rosy cheeks, two buck teeth, wearing a plain white jeogori jacket tied with a cream ribbon and loose beige trousers',
  king: 'the DRAGON KING: a plasticine old man with two small golden dragon horns, bushy white eyebrows, a long flowing white beard, a golden royal robe with dragon patterns and a golden crown',
  octopus: 'DOCTOR OCTOPUS: a round purple plasticine octopus with round spectacles, a small black scholar hat and a little medicine bag',
  spirit: 'the MOUNTAIN SPIRIT: a kind plasticine old man with a long white beard, white hair in a topknot, a flowing white robe and a wooden staff, softly glowing',
  palace: 'an underwater Korean dragon palace throne room made of clay, red pillars, curved tiled roof edges, golden throne, coral and seaweed, bubbles',
};
const SCENES = {
  1: `Inside ${C.palace}, ${C.king} lies sick and pale on a throne bed with a cold cloth on his forehead, worried clay fish and crab courtiers around him.`,
  2: `Inside ${C.palace}, ${C.octopus} checks the pulse of ${C.king} who sits weakly on the throne, a clay thought bubble above the octopus shows a little white rabbit.`,
  3: `Inside ${C.palace}, ${C.turtle} steps forward bravely with one flipper raised, bowing to ${C.king}, clay fish courtiers look at him in surprise.`,
  4: `${C.turtle} swims upward through clear blue clay water toward the bright sunny surface, a green clay shore with pine trees visible above, bubbles and light rays.`,
  5: `In a small clay pine forest, ${C.turtle} peeks from behind a bush and spots ${C.rabbit} nibbling clover, the rabbit looks up curiously.`,
  6: 'TEST IMAGE (design/clay-byeol/test1.png)',
  7: `On the clay seashore, ${C.rabbit} jumps up joyfully with both arms raised and ears straight up, ${C.turtle} smiles slyly beside it.`,
  8: `${C.rabbit} rides on the shell of ${C.turtle} diving down through the blue clay sea, colorful clay fish, swaying seaweed and coral, the glowing dragon palace far below.`,
  9: `Inside ${C.palace}, clay fish soldiers with spears tie up ${C.rabbit} with seaweed rope, the rabbit looks shocked, ${C.king} looks down sternly from the throne, ${C.turtle} watches nervously.`,
  10: `Inside ${C.palace}, close-up of ${C.rabbit} with a calm clever face and one finger on its chin, thinking, sweat drop on its forehead, the blurred throne behind.`,
  11: `Inside ${C.palace}, ${C.rabbit} proudly pushes out its round belly and points at it, talking cleverly to the surprised ${C.king} on the throne.`,
  12: `${C.turtle} swims up toward the shore carrying ${C.rabbit} on its shell, the rabbit secretly grinning, sunlight from the water surface above.`,
  13: `On the clay seashore, ${C.rabbit} jumps off and runs laughing into the green pine forest, ${C.turtle} sits on the sand looking shocked with an open mouth.`,
  14: `On a clay beach at sunset, ${C.turtle} sits crying with clay tears, ${C.spirit} appears beside him and kindly hands him a small glowing medicine pouch.`,
  15: `Inside ${C.palace} decorated for a party, ${C.king} stands healthy and laughing, hugging ${C.turtle}, clay fish and crabs cheer with confetti and bubbles.`,
  16: `Golden sunset ending scene: on the left on a hill in the pine forest ${C.rabbit} looks around carefully, on the right far below under the sea ${C.turtle} stands proudly beside ${C.king}, cozy and peaceful.`,
  card: `Cover image: ${C.rabbit} rides happily on the shell of ${C.turtle} swimming through the blue clay sea toward the glowing dragon palace, bubbles and colorful clay fish.`,
};
const KEYS = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 'card'].map(String);   // 6번은 테스트 그림
const prompt = k => STYLE + SCENES[k] + END;
if (typeof module !== 'undefined') module.exports = { C, SCENES, KEYS, prompt };
if (require.main === module) { const fs = require('fs'); const done = KEYS.filter(k => fs.existsSync(`design/clay-byeol/${k}.png`)); console.log('done', done.join(','), '| todo', KEYS.filter(k => !done.includes(k)).join(',')); }
