const INTRO = [
  { d: 6, cap: '깊고 푸른 바닷속 용궁, 용왕님이 큰 병에 걸렸어요.', bgm: 'worry', draw(c, t) {
      drawBG(c, 'palace', t);
      drawChar(c, 'king', 480, 330, 1.15, { t, sick: true });
      drawFx(c, { id: 'i1', type: 'sweat', x: .6, y: .2, s: 1, dur: 99 }, t);
      drawChar(c, 'fish', -80 + t * 190, 150 + Math.sin(t * 2) * 10, .7, { t });
    } },
  { d: 6.5, cap: '문어 의원이 말했어요. “토끼의 간을 먹어야 나으실 수 있습니다.”', draw(c, t) {
      drawBG(c, 'palace', t);
      drawChar(c, 'king', 300, 330, 1.05, { t, sick: true });
      drawChar(c, 'octopus', lerp(1100, 680, ease(clamp(t / 2, 0, 1))), 330 + Math.sin(t * 3) * 8, 1.1, { t });
      if (t > 2.5) drawFx(c, { id: 'i2', type: 'excl', x: .32, y: .12, s: .9, dur: 99 }, t - 2.5);
    } },
  { d: 5.5, cap: '충성스러운 자라, 별주부가 토끼를 찾아 육지로 떠났어요.', bgm: 'journey', draw(c, t) {
      drawBG(c, 'sea', t); const p = t / 5.5;
      drawChar(c, 'seaweed', 160, 470, 1, { t }); drawChar(c, 'coral', 820, 470, .9, { t });
      drawChar(c, 'turtle', lerp(120, 820, p), lerp(430, 120, p), .95, { t, rot: -.25 });
      drawFx(c, { id: 'i3', type: 'bubbles', x: lerp(120, 820, p) / W - .1, y: lerp(430, 120, p) / H, s: 1, dur: 99 }, t);
    } },
  { d: 6.5, cap: '“용궁에 가면 벼슬도 주고 맛있는 음식도 드려요!” 자라는 토끼를 꾀었어요.', draw(c, t) {
      drawBG(c, 'shore', t);
      drawChar(c, 'turtle', 300, 410, 1, { t: t * .3 });
      const hop = Math.abs(Math.sin(t * 5)) * 40 * (t < 2.4 ? 1 : 0);
      drawChar(c, 'rabbit', lerp(1050, 640, ease(clamp(t / 2.4, 0, 1))), 400 - hop, 1, { t, flip: true });
      if (t > 3) drawFx(c, { id: 'i4', type: 'hearts', x: .66, y: .45, s: 1, dur: 99 }, t - 3);
    } },
  { d: 5.5, cap: '토끼는 자라 등에 올라타고 바닷속 용궁으로 내려갔어요.', bgm: 'sea', draw(c, t) {
      drawBG(c, 'sea', t); const p = t / 5.5, x = lerp(140, 800, p), y = lerp(110, 360, p);
      drawChar(c, 'fish', 900 - t * 120, 420, .6, { t, flip: true });
      drawChar(c, 'turtle', x, y, 1, { t, rot: .2 });
      drawChar(c, 'rabbit', x - 10, y - 90, .8, { t, rot: .2 });
      drawFx(c, { id: 'i5', type: 'bubbles', x: x / W - .08, y: y / H, s: 1, dur: 99 }, t);
    } },
  { d: 7, cap: '“간을 내놓아라!” 토끼는 “간은 육지 바위 밑에 두고 왔어요” 하고 꾀를 냈어요.', bgm: 'tension', draw(c, t) {
      drawBG(c, 'palace', t);
      drawChar(c, 'king', 300, 330, 1.05, { t, angry: true });
      drawChar(c, 'rabbit', 680, 400, 1.05, { t, flip: true });
      if (t < 2.6) drawFx(c, { id: 'i6', type: 'boom', text: '내놓아라!', x: .3, y: .16, s: .75, dur: 2.6 }, t);
      else if (t < 4.2) drawFx(c, { id: 'i7', type: 'quest', x: .72, y: .22, s: 1, dur: 1.6 }, t - 2.6);
      else { drawFx(c, { id: 'i8', type: 'sparkle', x: .72, y: .25, s: 1, dur: 99 }, t - 4.2); drawFx(c, { id: 'i9', type: 'excl', x: .72, y: .2, s: .8, dur: 99 }, t - 4.2); }
    } },
  { d: 6.5, cap: '육지에 닿자마자 토끼는 깡충깡충 달아났답니다. 끝!', bgm: 'chase', draw(c, t) {
      drawBG(c, 'shore', t);
      drawChar(c, 'turtle', 720, 450 + Math.sin(t * 2) * 5, .9, { t: t * .3, flip: true });
      const hop = Math.abs(Math.sin(t * 6)) * 45;
      drawChar(c, 'rabbit', lerp(560, 80, clamp(t / 4.5, 0, 1)), 360 - hop, .95, { t, flip: true, laugh: true });
      if (t > 1.5) drawFx(c, { id: 'i10', type: 'sweat', x: .78, y: .62, s: .9, dur: 99 }, t - 1.5);
      if (t > 1.5) drawFx(c, { id: 'i11', type: 'text', text: '속았다!', x: .8, y: .45, s: .8, dur: 99 }, t - 1.5);
    } }
];
let introRaf = 0, introVoice = true, introBgm = null, introCut = -1;
function stopIntro() {
  cancelAnimationFrame(introRaf); introRaf = 0;
  try { speechSynthesis.cancel(); } catch (e) { }
  if (introBgm) { try { introBgm.stop(); } catch (e) { } introBgm = null; }
}
function speak(text) {
  if (!introVoice) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/[“”]/g, '')); u.lang = 'ko-KR'; u.rate = 1.02; u.pitch = 1.1; const v = speechSynthesis.getVoices().find(v => /ko/i.test(v.lang)); if (v) u.voice = v; speechSynthesis.speak(u); } catch (e) { }
}
