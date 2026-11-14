# 소리 출처

앱에 들어 있는 효과음(`audio/sfx`)과 배경음악(`audio/bgm`)은 모두 **OpenGameArt.org**에서 받은 **CC0(퍼블릭 도메인)** 소리예요.
CC0는 저작권을 포기한 것이라 출처 표기 의무가 없지만, 만든 분들께 고마운 마음으로 여기 적어 둬요.
원본은 60초 안팎으로 자르고 mp3로 다시 압축했어요(만드는 방법은 이 폴더 바깥의 작업 기록 참고).

## 배경음악 (`audio/bgm`)

| 파일 | 앱에서 이름 | 원곡 · 만든 이 | 원본 |
|---|---|---|---|
| sea.mp3 | 평화로운 바닷속 | Underwater Theme · Cleyton Kauffman (CleytonRX) | `Cleyton RX - Underwater_0.mp3` (앞 64초) |
| palace.mp3 | 용궁 궁중음악 | Asianoriental1 · Tozan | `asianoriental1_0.ogg` (전체) |
| worry.mp3 | 걱정과 슬픔 | Emotional Piano · Centurion_of_war | `emotional_piano_2.ogg` (전체) |
| journey.mp3 | 씩씩한 길 떠나기 | Children's March Theme · Cleyton Kauffman | `childrens_march_theme.zip` 안 ogg (64초 반복곡 전체) |
| tension.mp3 | 두근두근 긴장 | It's time for adventure vol 2 – 12 Tension · Komiku | `Komiku - ... 12 Tension_0.mp3` (앞 64초) |
| chase.mp3 | 신나는 도망 | It's time for adventure vol 2 – 13 Fight, run, breath deeply · Komiku | `Komiku - ... 13 Fight, run, breath deeply_0.mp3` (앞 64초) |
| happy.mp3 | 행복한 마무리 | End Credits Theme (Farewell) · Cleyton Kauffman | `End_Credits_Theme_ogg.ogg` (전체) |

## 효과음 (`audio/sfx`)

| 파일 | 앱에서 이름 | 원본 (OpenGameArt) | 손본 것 |
|---|---|---|---|
| pop.mp3 | 뽁 | `pop_.wav` | 그대로 |
| boing.mp3 | 뿅 | `boing.flac` | 1.6초로 자름 |
| swoosh.mp3 | 휘익 | `swishes.zip` 안 `swish-9.wav` | 0.6배 느리게·낮게 |
| bubbles.mp3 | 보글보글 | `bubbles-loop1-amp.wav` | 3.0~4.3초 구간 |
| splash.mp3 | 첨벙 | `water-splash-slime-sfx.zip` 안 `splash_04.ogg` | 그대로 |
| drop.mp3 | 똑 | `100-CC0-SFX_0.zip` (rubberduck) 안 `plop_01.ogg` | 그대로 |
| wave.mp3 | 철썩 | `wave_01_cc0-11505__transitking__wavesound.flac` (TransitKing) | 1.4초로 자름 |
| steps.mp3 | 깡충깡충 | `[kdd]DifferentSteps_0.zip` (kdd) 안 `wood01/02/03.ogg` | 발소리 4번 이어 붙임 |
| drum.mp3 | 둥둥 | `100-CC0-SFX_0.zip` 안 `pot_01.ogg` | 낮춰서 두 번 |
| boom.mp3 | 쾅 | `100-CC0-SFX_0.zip` 안 `explosion.ogg` + `slam_03.ogg` | 둘을 겹침 |
| ding.mp3 | 띠링 | `100-CC0-SFX_0.zip` 안 `bell_01.ogg` | 그대로 |
| sparkle.mp3 | 반짝 | `100-CC0-SFX_0.zip` 안 `glass_05.ogg` + `bell_02.ogg`×2 | 종을 높여 겹침 |
| gong.mp3 | 징 | `100-CC0-SFX_0.zip` 안 `gong_01.ogg` | 0.7배 느리게(여운) |
| tap.mp3 | (버튼 터치 소리) | `100-CC0-SFX_0.zip` 안 `wooden_01.ogg` | 앞 0.14초 |
| fail.mp3 | 띠로리 | `sad_theme_0.ogg` | 0.85~4.6초 구간, 페이드 아웃 |

모든 원본 주소는 `https://opengameart.org/sites/default/files/<파일 이름>` 이에요.
파일이 없거나(오프라인·file://) 못 읽으면 앱이 코드로 합성한 소리로 대신해요(`AE.file` → `AE.render`, `src/p2_core.js`).
