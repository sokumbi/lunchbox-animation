# 소리 출처

앱에 들어 있는 효과음(`audio/sfx`)과 배경음악(`audio/bgm`)은 모두 **OpenGameArt.org**에서 받은 **CC0(퍼블릭 도메인)** 소리예요.
CC0는 저작권을 포기한 것이라 출처 표기 의무가 없지만, 만든 분들께 고마운 마음으로 여기 적어 둬요.
원본은 60초 안팎으로 자르고 mp3로 다시 압축했어요(만드는 방법은 이 폴더 바깥의 작업 기록 참고).

## 배경음악 (`audio/bgm`)

2026-11-14에 실제 악기 느낌의 곡으로 모두 바꿨어요. 6곡은 **FreePD.com**(운영자 Kevin MacLeod, 2025년에 문 닫음. 사이트 전체가 "CC0 1.0 Universal Public Domain Dedication", 소프트웨어에 넣어도 된다고 명시)의 곡이고 archive.org 보관본(`https://archive.org/download/freepd/<경로>`)에서 받았어요. 1곡은 OpenGameArt의 CC0 곡이에요.

| 파일 | 앱에서 이름 | 원곡 · 만든 이 | 원본 | 쓴 구간 |
|---|---|---|---|---|
| sea.mp3 | 평화로운 바닷속 | Aquarium (생상스 '동물의 사육제') · Kevin MacLeod | freepd `misc/Aquarium.mp3` | 앞 64초 |
| palace.mp3 | 용궁 궁중음악 | Hot Springs Town · Kistol | opengameart.org `hot_spring_town.mp3` | 앞 64초 |
| worry.mp3 | 걱정과 슬픔 | Piano Magic Motive · Kevin MacLeod | freepd `romantic/Piano Magic Motive.mp3` | 앞 66초 |
| journey.mp3 | 씩씩한 길 떠나기 | Royal Coupling · Kevin MacLeod | freepd `misc/Royal Coupling.mp3` | 14~78초 |
| tension.mp3 | 두근두근 긴장 | Managing Mischief · Bryan Teoh | freepd `comedy/Managing Mischief.mp3` | 앞 64초 |
| chase.mp3 | 신나는 도망 | Rush · Rafael Krux | freepd `comedy/Rush.mp3` | 앞 54초 |
| happy.mp3 | 행복한 마무리 | Motions · Rafael Krux | freepd `upbeat/Motions.mp3` | 앞 70초 |

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
