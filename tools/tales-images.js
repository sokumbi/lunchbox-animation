// 전래동화 장면 → 그림 연결 (2026-11-14). 숫자 = 지금 있는 그림 tales/<id>/<n>.jpg, 글자 = 새 그림 tales/<id>/<글자>.jpg, 'card' = 카드 그림 tales/<id>.jpg
// 같은 장소에서 이어지는 장면은 그림을 같이 써서 새 그림 수를 줄였어요(드리미나 크레딧).
const MAP = {
  byeoljubu: [1, 2, 2, 3, 4, 4, 'b', 5, 'c', 6, 6, 5, 7, 'e', 'f', 'f'],
  heungbu: [1, 1, 'b', 'c', 2, 2, 3, 'card', 4, 4, 'd', 5, 'e', 6, 6, 7, 7],
  haenim: ['a', 'a', 1, 2, 'b', 3, 3, 'c', 'd', 4, 4, 'e', 'f', 5, 6, 7, 7, 7],
  geumdokki: ['a', 1, 1, 2, 2, 3, 4, 'b', 'c', 5, 'd', 6, 6, 'b'],
  kongjwi: [1, 1, 'a', 'b', 4, 'c', 2, 3, 4, 'd', 5, 5, 'e', 'f', 'f', 6, 6, 'g', 6],
};
const PRE = 'Japanese anime film style illustration, clean cel shading, hand-painted detailed background, vibrant colors, cute characters with big expressive eyes. Korean folk tale ';
const POST = ' Wide 16:9, characters in the upper two thirds of the frame, no text, no letters, no watermark.';
// 등장인물 모습(지금 그림과 맞춰요)
const C = {
  turtle: 'a friendly green sea turtle court official in a dark blue Joseon official robe (gwanbok) with an embroidered rank badge and a black samo winged hat',
  rabbit: 'a small cute white rabbit in a simple commoner hanbok (white jeogori jacket, beige trousers)',
  king: 'the old Dragon King with a long white beard, golden royal dragon robe and golden crown',
  spirit: 'a kind old mountain spirit with a long white beard and a glowing white robe',
  heungbu: 'Heungbu, a kind young man with short messy black hair in a light blue hanbok jacket and white trousers',
  nolbu: 'Nolbu, a greedy plump older brother with a black mustache in a rich purple silk hanbok and a tall black gat hat',
  hwife: 'Heungbu\'s kind wife with a black hair bun in a cream and pale pink hanbok',
  kids: 'several small children in simple patched hanbok',
  nwife: 'Nolbu\'s stout grumpy wife in a red hanbok holding a big wooden rice paddle',
  mom: 'a gentle young mother with a hair bun in a white hanbok',
  boy: 'a little boy with short black hair in a blue jeogori and purple trousers',
  girl: 'a little girl with a long black braid in a pink jeogori and a rainbow striped skirt',
  tiger: 'a big chubby round striped tiger, comical and cute, not scary',
  wood: 'a young woodcutter with messy black hair and NO hat, bare head, in worn brown patched clothes',
  omma: 'his old mother with gray hair in a bun and a plain gray-white hanbok',
  greedy: 'a greedy man in fancy green silk clothes and a tall black gat hat',
  kong: 'Kongjwi, a kind girl with a long black ponytail tied with a purple ribbon, cream and lilac jeogori with a pink ribbon and a blue skirt',
  step: 'a stern stepmother in a dark red hanbok with her hair in a tight bun',
  pat: 'Patjwi, a spoiled bratty girl with two hair buns and pink flowers in a yellow-green hanbok',
  mag: 'a handsome young magistrate in a blue Joseon official robe and a black gat hat',
};
// 새로 만들 그림(글자)과 다시 그릴 그림(숫자/card) 설명
const NEW = {
  byeoljubu: {
    b: `Byeoljubujeon: in a sunny pine forest, ${C.rabbit} jumps up with sparkling excited eyes and both arms raised, ${C.turtle} smiles slyly beside it.`,
    c: `Byeoljubujeon: inside the underwater dragon palace, fish soldiers with spears tie up ${C.rabbit} with seaweed rope, the rabbit is shocked, ${C.king} looks down sternly from his throne, ${C.turtle} watches.`,
    e: `Byeoljubujeon: on a quiet beach at sunset, ${C.spirit} kindly hands a small glowing medicine pouch to ${C.turtle} who has tears in his eyes.`,
    f: `Byeoljubujeon: in the bright underwater dragon palace, ${C.king} stands up healthy and smiling, hugging ${C.turtle}, fish and crab courtiers cheer, bubbles and confetti.`,
  },
  heungbu: {
    b: `Heungbu and Nolbu: inside a tiny broken-down thatched hut with holes in the walls, ${C.heungbu} comforts ${C.kids} who hold empty bowls, ${C.hwife} sits beside them, winter, sad but warm.`,
    c: `Heungbu and Nolbu: at the kitchen door of a rich tiled house, ${C.nwife} swings the rice paddle and slaps ${C.heungbu} on the cheek, a few grains of rice stick to his cheek, comical.`,
    d: `Heungbu and Nolbu: in front of Heungbu's new big tiled-roof house full of treasure chests, ${C.nolbu} grabs ${C.heungbu} by the sleeves asking eagerly, comical greedy face.`,
    e: `Heungbu and Nolbu: on the roof of a rich tiled house covered with huge green gourds, ${C.nolbu} saws a giant gourd with a big saw, grinning greedily.`,
  },
  haenim: {
    a: `The Sun and the Moon: in front of a small thatched hut in a deep mountain valley, ${C.mom} with a basket of rice cakes on her head waves goodbye to ${C.boy} and ${C.girl} at the door, morning.`,
    b: `The Sun and the Moon: on a dark mountain path at dusk, ${C.tiger} wearing a white hanbok skirt and a white headscarf as a silly disguise sneaks down toward a small village, comical.`,
    c: `The Sun and the Moon: night, a big tiger paw covered with white flour pokes through a hole in a paper door, ${C.boy} and ${C.girl} peek at it from inside by candlelight.`,
    d: `The Sun and the Moon: inside a small room at night, ${C.tiger} disguised in a white skirt and headscarf sits with a striped tail peeking out under the skirt, ${C.girl} whispers into the ear of ${C.boy}, both nervous.`,
    e: `The Sun and the Moon: night, ${C.tiger} hugs the trunk of a big tree and slides down, paws shiny with sesame oil, funny face, ${C.boy} and ${C.girl} laugh from a high branch.`,
    f: `The Sun and the Moon: night, ${C.tiger} climbs a tree chopping footholds with a small axe, ${C.boy} and ${C.girl} at the top of the tree hold hands and pray to the starry sky.`,
  },
  geumdokki: {
    card: `The Golden Axe and the Silver Axe: ${C.wood} kneels surprised beside a misty forest pond, ${C.spirit} rises from the water holding a shining golden axe in one hand and a silver axe in the other, sparkles, green forest.`,
    1: `The Golden Axe and the Silver Axe: forest beside a pond, ${C.wood} swings at a tree and his old iron axe slips from his hands and splashes into the pond, he looks shocked.`,
    2: `The Golden Axe and the Silver Axe: misty forest pond, ${C.spirit} rises from the water holding up a shining golden axe and asks ${C.wood} kneeling on the bank.`,
    3: `The Golden Axe and the Silver Axe: forest pond, ${C.spirit} holds up a shining silver axe, ${C.wood} honestly shakes his head and waves his hands no.`,
    4: `The Golden Axe and the Silver Axe: forest pond, ${C.spirit} smiles warmly and gives three axes, golden, silver and old iron, to the overjoyed ${C.wood}, sparkles.`,
    a: `The Golden Axe and the Silver Axe: morning in front of a small thatched hut on a mountain, ${C.wood} carrying an old iron axe on his shoulder bows to ${C.omma} who waves goodbye.`,
    b: `The Golden Axe and the Silver Axe: inside a warm cozy hut, ${C.wood} gives a new warm quilted coat and a table of delicious food to ${C.omma} who smiles happily, golden evening light.`,
    c: `The Golden Axe and the Silver Axe: in a village market street, ${C.greedy} overhears villagers gossiping and slaps his knee with a sneaky idea, eyes shining greedily.`,
    d: `The Golden Axe and the Silver Axe: forest pond, ${C.greedy} reaches out with both hands eagerly shouting, while ${C.spirit} rising from the water holds a golden axe and frowns suspiciously.`,
  },
  kongjwi: {
    a: `Kongjwi and Patjwi: in a rocky field under the hot sun, ${C.kong} holds a broken wooden hoe and cries, stones everywhere.`,
    b: `Kongjwi and Patjwi: a big gentle black ox descends from the sky in a beam of soft light into a rocky field, ${C.kong} looks up in wonder wiping her tears.`,
    c: `Kongjwi and Patjwi: courtyard of a traditional house, ${C.step} and ${C.pat} dressed up in fancy festival hanbok point at a huge clay jar and sacks of rice, ${C.kong} stands alone looking sad.`,
    d: `Kongjwi and Patjwi: in a courtyard at evening, a graceful fairy in flowing pastel hanbok floats down from the sky and gives a beautiful silk hanbok and embroidered flower shoes to ${C.kong} who is amazed.`,
    e: `Kongjwi and Patjwi: by a small stream, ${C.mag} on horseback with attendants picks up a single embroidered flower shoe from the water and looks at it with wonder.`,
    f: `Kongjwi and Patjwi: in a courtyard, ${C.pat} tries hard to squeeze her big foot into a tiny embroidered flower shoe while ${C.step} pushes, ${C.mag} shakes his head, comical.`,
    g: `Kongjwi and Patjwi: in a sunny courtyard with blossoms, ${C.step} and ${C.pat} bow their heads apologizing, ${C.kong} in a beautiful hanbok smiles and holds their hands, warm reconciliation.`,
  },
};
const PROMPTS = [];
for (const [id, m] of Object.entries(NEW)) for (const [k, d] of Object.entries(m)) PROMPTS.push({ id, k: String(k), p: PRE + d + POST });
if (typeof module !== 'undefined') module.exports = { MAP, NEW, PROMPTS };
if (require.main === module) console.log(PROMPTS.length, 'images');
