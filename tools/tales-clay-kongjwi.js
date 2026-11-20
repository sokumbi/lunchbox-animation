// 콩쥐 팥쥐 클레이(아드만 풍) 그림 계획 (2026-11-20, 미드저니). 장면 19개(tales-script.js 순서) + 카드 1장.
// 해님 달님(tales-clay-haenim.js)과 같은 방식: 캐릭터 설명(C)을 모든 프롬프트에 글자 그대로 넣고, 시험 그림 하나를 --sref로 걸어 화풍을 맞춰요.
// 표정: 늘 웃지 않게, 장면마다 이야기에 맞는 감정(외로움·서러움·고마움·놀람·심술·부끄러움·화해)을 프롬프트에 적어요.
// 진행 상황: design/clay-kongjwi/<key>.png 가 있으면 만든 것. 앱에는 tales/kongjwi/clay/<key>.jpg (카드는 tales/kongjwi.jpg).
const STYLE = 'Aardman-style claymation stop-motion film still, like Wallace and Gromit: handmade plasticine characters with visible fingerprints and slightly uneven sculpted surfaces, miniature handcrafted set with real textures, soft natural studio lighting, gentle shadows, shallow depth of field, for children. Korean folk tale Kongjwi and Patjwi, Joseon-era farming village. Expressive acting faces that clearly show the emotion of this moment, not everyone smiling. ';
const C = {
  kong: 'KONGJWI: a gentle kind plasticine girl about twelve years old with a long black braid tied with a purple ribbon, soft dark eyes, wearing a faded patched lilac jeogori and a worn navy-blue skirt',
  kongS: 'KONGJWI: a gentle kind plasticine girl about twelve years old with a long black braid tied with a purple ribbon, soft dark eyes, now dressed in a shining pink silk jeogori and a sky-blue silk skirt with pink embroidered flower shoes',
  step: 'the STEPMOTHER: a tall thin stern plasticine woman with a long sharp face, thin arched eyebrows, hair in a tight high bun with a gold pin, wearing a dark red silk hanbok',
  pat: 'PATJWI: a chubby spoiled plasticine girl about twelve years old with two round hair buns decorated with pink flowers, puffy cheeks, wearing a bright yellow-green silk hanbok',
  dad: 'the FATHER: a gentle tired plasticine man with a short black beard, wearing a white hanbok and a black gat hat',
  ox: 'the BLACK OX: a huge gentle plasticine black ox with kind brown eyes and curved horns, a soft heavenly glow around it',
  toad: 'the TOAD: a big round plasticine brown toad with bumpy skin, golden eyes and a kind face',
  fairy: 'the HEAVENLY FAIRY: a graceful plasticine fairy in flowing white and pale blue silk with long floating ribbons and an elegant hair updo',
  mag: 'the MAGISTRATE: a kind young plasticine official with a calm gentle face and a thin mustache, wearing a deep blue Joseon official robe with a red sash and a black gat hat',
  house: 'a modest thatched-roof farmhouse with a mud wall and big brown clay jars in the yard',
  shoe: 'a small pink embroidered silk flower shoe',
};
const SCENES = {
  1: `In the yard of ${C.house}, ${C.dad} introduces ${C.step} and ${C.pat} to ${C.kong}, Kongjwi holds her braid and looks shy and lonely, the stepmother looks down at her coldly, Patjwi eyes her with a smug look.`,
  2: `In the yard of ${C.house}, ${C.step} points sharply toward a stony field with an angry scolding face, ${C.kong} bows her head sadly holding a hoe, ${C.pat} sticks out her tongue mockingly while eating a rice cake.`,
  3: `In a rocky stony field, ${C.kong} kneels and cries softly holding a wooden hoe snapped in half, alone, the sky grey.`,
  4: `In a rocky stony field, ${C.ox} descends gently from the clouds in a beam of light, ${C.kong} looks up with wide teary surprised eyes, the broken hoe on the ground.`,
  5: `In a freshly plowed field, ${C.ox} stands beside neat furrows, ${C.kong} bows deeply in gratitude holding a basket full of fruit, a relieved thankful face.`,
  6: `In the yard of ${C.house}, ${C.step} and ${C.pat} in fancy festival clothes walk out of the gate with noses in the air, Patjwi waves mockingly, ${C.kong} stands beside a huge clay jar and a big pile of unhusked rice sacks, looking worried.`,
  7: `In the yard of ${C.house}, ${C.kong} pours water from a bucket into a huge brown clay jar but water leaks out through a hole at the bottom, she looks tired and desperate.`,
  8: `In the yard of ${C.house}, ${C.toad} hops up beside the leaking clay jar and speaks to ${C.kong}, who kneels down with a surprised hopeful face.`,
  9: `In the yard of ${C.house}, the clay jar is full of water with ${C.toad} peeking from inside, a flock of small plasticine sparrows pecks rice husks off a big pile of grain turning it into white rice, ${C.kong} watches amazed with hands clasped.`,
  10: `In the yard of ${C.house} at golden hour, ${C.fairy} floats down and offers folded silk clothes and a pair of pink embroidered flower shoes to ${C.kong}, who covers her mouth in disbelief with shining teary eyes.`,
  11: `At a stream with stepping stones, ${C.kongS} is crossing the stones and turns around startled, in the distance a magistrate's procession with flags, a palanquin and runners approaches on the road.`,
  12: `At the stream, ${C.kongS} hurries off the stepping stones in a panic hopping on one foot, ${C.shoe} has fallen and floats in the water behind her.`,
  13: `At the stream, ${C.mag} steps down from his palanquin and holds ${C.shoe} dripping with water, looking at it with a curious thoughtful face, servants stand behind him.`,
  14: `In a village yard, ${C.mag} holds ${C.shoe} on a cushion, ${C.pat} rushes forward pointing at herself eagerly claiming it, ${C.step} pushes her forward with a scheming smile.`,
  15: `In a village yard, ${C.pat} sits on a stool trying to squeeze her big foot into ${C.shoe} with a pained red face, ${C.step} pushes her foot down desperately, ${C.mag} frowns and raises a hand to stop them, comical.`,
  16: `In a village yard, ${C.kong} steps out shyly from the kitchen door and slips her foot into ${C.shoe} which fits perfectly, she shows the matching shoe in her hand, ${C.mag} smiles in quiet wonder, ${C.step} and ${C.pat} gape in shock.`,
  17: `A village wedding celebration in a yard decorated with colorful cloth, ${C.kongS} and ${C.mag} stand side by side shyly happy, villagers cheer and clap around them.`,
  18: `In the yard of ${C.house}, ${C.step} and ${C.pat} bow their heads deeply in apology with ashamed tearful faces, ${C.kongS} gently takes their hands with a kind forgiving face.`,
  19: `Peaceful evening at a beautiful tiled-roof house with a flower garden, ${C.kongS} and ${C.mag} walk together under a blossoming tree with calm warm content faces.`,
  card: `Cover image: at a stream with stepping stones under spring blossoms, ${C.kongS} stands on a stone looking back with a startled face as ${C.shoe} floats away on the water, ${C.toad} and a few sparrows watch from the bank.`,
};
// 만드는 순서: 2번(콩쥐·새어머니·팥쥐)을 먼저 만들어 모습을 확인하고 --sref로 걸어요
const KEYS = ['2', ...Array.from({ length: 19 }, (_, i) => String(i + 1)).filter(k => k !== '2'), 'card'];
const mj = k => STYLE + SCENES[k] + ' --ar 16:9 --no text, letters, watermark';
if (typeof module !== 'undefined') module.exports = { C, SCENES, KEYS, mj };
if (require.main === module) { const fs = require('fs'); const done = KEYS.filter(k => fs.existsSync(`design/clay-kongjwi/${k}.png`)); console.log('done', done.join(','), '| todo', KEYS.filter(k => !done.includes(k)).join(',')); }
