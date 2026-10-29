# 런치박스애니메이션 — 작업 안내 (Claude용)

아르떼노바(ARTENOVA) 애니메이션 교구와 함께 쓰는 **스톱모션 애니메이션 제작 웹앱**이에요.
초등 고학년이 주 사용자이고, 강사·부모님도 써요. **폰 가로 화면** 기준이에요. 태블릿에서도 돼요.
이 문서는 claude.ai 대화(2026년 10월)에서 만든 것을 Claude Code로 옮기면서 정리한 거예요.

## 한눈에

- 결과물은 **`index.html` 한 장**이에요. 외부 파일 없이 열리고, 그림 조각은 data URI로 들어 있어요.
- 소스는 `src/`의 조각 파일이에요. **`index.html`을 직접 고치지 말고** `src/`를 고친 뒤 `./build.sh`를 실행하세요.
- 프레임워크 없는 순수 JS예요. 화면은 `h()` 헬퍼로 DOM을 만들고, 무대는 canvas(960×540)에 그려요.
- 실시간 카메라는 **https나 localhost에서만** 켜져요. 폰 테스트는 GitHub Pages에 올려서 해요(아래 "배포" 참고).

## 명령

```bash
./build.sh                    # src → app.html → index.html (문법 검사 포함)
npm run serve                 # http://localhost:8765 (맥에서 확인)
npm i && npx playwright install chromium   # 처음 한 번
npm test                      # 4개 기기 크기로 전체 흐름 자동 점검, 사진은 tests/shots/
node tests/ui-test.js i13,se  # 고른 기기만 (i13=아이폰13 가로, se=작은 폰, por=세로 폰, tab=태블릿)
npm run design:vector         # 벡터 시안 SVG/PNG 다시 만들기 (Noto Sans CJK 글꼴 필요)
npm run design:textures       # 드리미나 원본에서 재질 조각을 다시 잘라 src에 반영 + 빌드
```

점검 결과에서 `OFF …`(화면 밖 버튼)나 `OVERLAP a × b`(버튼끼리 겹침)가 나오면 고쳐야 해요. 선택 막대(.sel-bar)가 키 위에 뜨는 것과 스크롤 목록(가로·세로) 밖 컷은 검사에서 빼 둬요. 내레이션 입력칸의 `SCROLL input`과 시나리오의 `OFF 위로|장면 지우기`(스크롤 목록 안쪽)는 정상이에요.

## 폴더

```
src/                   앱 소스 (빌드 순서대로)
  p1_head.html         <head> 메타, 전체 CSS(런치박스 스킨), 화면 뼈대
  p1b_tex.html         드리미나 재질 CSS — 지금은 시작 사진 규칙만 써요(키·베젤 재질은 안 씀) ← build_tex.py가 그림 주소를 갱신
  p1c_theme.html       베이지 테마 CSS + 편집기·갤러리 CSS(맨 아래 "한 화면 편집기"). p1_head의 런치박스 스킨을 덮어써요 (위쪽 .lay/.shoot/.sheet 규칙은 6단계 시절 것)
  p2_core.js           BRAND, 화면 회전(ROT), h(), 아이콘 IC, 로고, toast/modal, 이야기 목록 TALES, DB(IndexedDB),
                       캐릭터·배경 그리기, 영상 효과 FX + drawFx, 효과음 SFX, 배경음악 BGM, 오디오 엔진 AE
  p2b_ui.js            추가 아이콘, 계산기 액정 LCD(도트 글자), 7세그먼트 seg7, key() 헬퍼
  p2c_artdata.js       벡터 런치박스 SVG (지금은 안 씀, 예비)
  p2d_splash.js        시작 화면 드리미나 사진 (data URI) ← build_tex.py가 생성
  p2e_stories.js       이야기 갈래 STORY_KINDS, 팔도 지도 PALDO(Natural Earth 행정 구역을 팔도로 묶은 SVG 경로), 민담 LEGENDS, storyInfo()
  p3a_core.js          작품 모델 P, 타임라인 계산 TL(), 재생기 Player, 되돌리기 HIST, 저장, 작품 파일
  p3b_intro_data.js    별주부전 원작 컷아웃 애니메이션 (원작 영상 파일이 생기면 대체)
  p3c_screens.js       시작 · 이야기 갈래 · 전래동화 · 팔도 지도 · 휴지통 · 원작 영상
  p4_shoot.js          카메라(Cam) · 사진 불러오기 · 스케치 도우미 · 전체 보기(playAll)
  p5a_steps.js         효과·효과음 키(fxKey), 장면 자르기·빠르기 창(trimModal)
  p5b_script.js        별주부전 줄거리
  p5c_rec.js           녹음 도우미, 대사 파일 불러오기
  p6_editor.js         한 화면 편집기(카메라·필름·컷 말풍선·오른쪽 판·카메라 설정·완성 창) + 갤러리
  p5e_theater.js       상영관: 순위(rankWorks) · 감상(watchWork) · 별점 · 작품 올리기
  p5d_export.js        영상 파일 만들기(MediaRecorder, webm), 시작 호출
brand/                 아르떼노바 공식 CI (로고 SVG/PNG)
design/source/         드리미나 원본 이미지 (process/shoot/story/edit.jpg, 닫힌 런치박스, 시작 렌더)
design/vector/         벡터 시안 생성기 (svgkit.py, screens.py → out/*.svg, render.js → out/*.png)
design/textures/       드리미나 원본에서 재질 조각 자르기 (build_tex.py → out/ + src 반영)
tests/ui-test.js       Playwright 흐름 점검 (가짜 카메라로 촬영까지 눌러 봐요)
```

## 화면 흐름 (지금 동작) — 2026-10-29부터 Stop Motion Studio 방식

앱은 **갤러리 → 편집기 한 장** 두 화면이 중심이에요. 예전 6단계(시나리오→촬영→대사→사운드→편집→완성), "다음" 키, 단계 메뉴, 제작 과정 화면은 없앴어요.

- 시작(닫힌 런치박스 사진, 터치) → **갤러리**(`openGallery`, p6_editor): 주황 "새 작품" 카드 + 내 작품 카드(누르면 이어서 편집, ⋯ 메뉴: 이어서·복사·작품 파일·지우기). 위쪽: 파일 불러오기 · 휴지통 · 상영관
- 새 작품 → **이야기 갈래**(`openLibrary()`: 전래동화 · 전국 팔도 민담 · 나만의 이야기)
  - 전래동화(`openTales`): 그림 카드 15개, 별주부전만 켜짐 → 원작 영상(건너뛰기) → `setupProject` → 편집기(촬영)
  - 전국 팔도 민담(`openMap`): 지도에서 깜빡이는 곳 → "이 이야기로 만들기" → `startLegend` → 편집기 + 이야기 판이 열린 채
  - 나만의 이야기(`startOwnStory`): 바로 편집기(촬영)
- **편집기**(`openEditor(panel?)`, `src/p6_editor.js`) — 한 화면에서 다 해요
  - 가운데: 카메라(실시간, 겹쳐보기·격자) 또는 고른 컷(효과·자막까지 `renderAt`으로). 그리기는 `edLoop`, 재생·녹음 중엔 `Player`가 그려요
  - 왼쪽 둥근 버튼: ‹ 내 작품(갤러리) · ↶ 되돌리기 / 재생 · 이야기 · 소리 · 효과
  - 오른쪽: 카메라 설정 말풍선(`edCamPop`: 앞뒤 · 한 번에 몇 컷 · 타이머/자동 · 겹쳐보기 진하기 · 격자 · 고정 · 앨범) · **큰 빨간 찰칵** · 겹쳐보기
  - 위: 가운데 알약(장면·컷 수 / 고른 컷 번호·시간), 오른쪽 주황 **"완성"**(`edFinish`: 제목 · 처음부터 보기 · 영상 파일 · 상영관에 올리기 · 작품 파일 · 빠르기 · 부드럽게 · 자막)
  - 아래 **필름**(`edStrip`): 장면 칸막이(누르면 `edSceneMenu`: 이어 찍기 · 자르기/빠르기 · 스케치 · 앞으로 · 거꾸로 · 지우기) → 컷들 → 빨간 테두리 **"지금 카메라" 칸**(찍으면 여기 쌓여요) → "+ 장면". 그 아래 색 줄(`edTracks`: 초록 배경음악 · 파랑 대사 · 청록 내레이션 · 주황 효과음 · 보라 효과, 누르면 해당 판이 열려요)
  - 컷을 누르면 위에 말풍선(`edPopPaint`): 복사 · 거꾸로 · ×N(길게) · 장면 나누기 · 여기에 찍기 · 지우기
  - 왼쪽 버튼을 누르면 **오른쪽에서 판**(`edPanel`)이 나와요: 이야기(제목 · 줄거리 · 장면 · 대사) / 소리(탭: 대사 녹음 · 효과음 · 배경음악 · 내레이션+소리 크기) / 효과. 소리·효과는 **지금 고른 컷 시간(`Player.t`)**에 넣어요
- 상영관(`openTheater`): 갤러리 위쪽이나 완성 창에서. 별점 평균 순위 · 감상 · 별점 · 친구에게 보내기 · 내리기. 편집기에서 왔으면 뒤로 가면 편집기로 돌아가요
- 예전 이름 `goStep(id)`·`openStudio(id)`·`leaveStep()`은 편집기로 이어 줘요(script→이야기 판, voice/sound→소리 판, edit→효과 판, final→완성 창). `undo()`가 `goStep(S.step)`을 불러요
- 안내·알림(toast)은 손가락이 통과해서 버튼을 막지 않아요

화면별 버튼과 이동은 claude.ai 문서 "런치박스애니메이션 화면 흐름표"에 표로 정리돼 있어요(6단계 시절 기준이라 다시 고쳐야 해요):
https://claude.ai/artifact/XZmFFGCfP1hxr81NsLbHyY

## 디자인 규칙 (사용자가 정한 것)

- **컨셉 (2026-10-29)**: 사용자 요청으로 **Stop Motion Studio 앱의 화면 짜임새와 쓰는 방식을 거의 그대로** 따라요(갤러리 + 편집기 한 장, 필름, 컷 말풍선, 오른쪽 판). 그 앱의 이름·로고·아이콘·그림은 쓰지 않아요.
  시안: `design/mockups/sms-style.html` (git에는 안 올라가요). 이전 시안 `studio-style.html`(6단계 스튜디오형)은 지난 것이에요.
  - 바탕은 **아르떼노바 밝은 베이지**(`#F4EFE5`), 판·버튼은 흰색, 글자 Arte Black, 강조 Nova Orange. 검은 바탕은 쓰지 않아요(카메라 화면만 검정).
  - 버튼은 둥근 흰 버튼 + 밑에 짧은 글자(아이들용). 찰칵·녹음은 빨강 `#E2412E`.
- **촬영**: 카메라 화면을 남은 높이에서 최대한 크게(16:9). 한 번 누르면 3프레임(기본, 카메라 설정에서 바꿔요), 겹쳐 보기는 앞 2컷.
- **시작 화면**(닫힌 런치박스 사진)은 그대로. 배경음악 없음, 버튼 클릭음만.
- **CI 색**: Arte Black `#111111`, Nova Orange `#CF5D2A`(어두운 `#A8441A`), Canvas White `#F6F6F1`. 앱 바탕 `#F4EFE5`.
  트랙 색: 효과 보라 `#8A63C9`, 대사 파랑 `#3E7CB1`, 효과음 주황 `#CF5D2A`, 배경음악 초록 `#4E9A63`, 내레이션 청록 `#2F9C9A`. 찰칵·녹음 빨강 `#E2412E`.
- **한 화면에 다 보이게**(스크롤 없이), **가로로 바로 시작**(회전 안내 문구 없이). 세로로 들면 JS가 앱을 90° 돌려요
  (`ROT`, 손가락 좌표는 `appPt`/`appRect`로 바꿔요 — 포인터 좌표를 쓸 땐 꼭 이걸 쓰세요).
- 문구: 아이 눈높이 존댓말("~해요"). "공정" 대신 "단계", "나레이션" 대신 "내레이션".

## 지켜야 할 동작

- 작품은 바뀔 때마다 IndexedDB에 자동 저장(`changed()` → `histPush` + `scheduleSave`). 상태를 바꾸면 꼭 `changed()`를 불러요.
- 소리·효과 위치는 `{ sid: 장면 id, off: 장면 시작부터 초 }`로 저장돼요. 장면 앞을 자르거나 빠르기를 바꿀 때
  `trimModal`의 `setIn`/`setFps`가 off를 같이 옮겨서 그림과 소리가 어긋나지 않게 해요. 장면을 나눌 때도 옮겨요.
- 클릭음은 `initSplash`의 전역 pointerdown에서 나와요(찰칵 버튼 제외).
- 스토리보드 스케치: 장면마다 `s.sketch = { blob, url, img }` 한 장(긴 변 900px jpeg). 시나리오 장면 카드의 스케치 칸에서 찍고,
  촬영 모니터 오른쪽 아래에 작게 보여요(누르면 크게). 도우미 `takeSketch`/`sketchModal`은 `p4_shoot.js`에 있어요. 저장엔 blob만 넣어요.
- 타이머·자동 촬영: `S.shot = { delay, auto }`(기기 세션에만, 저장 안 함). 찰칵을 다시 누르면 취소·멈춤. 카메라 앱 대체 방식에선 타이머 없이 바로 찍어요.
- 카메라 고정: `applyConstraints`로 exposure/focus/whiteBalance를 manual(또는 single-shot)로. 안드로이드 크롬은 대부분 되고 아이폰은 일부만 돼요. 카메라를 바꾸면 풀려요.
- 컷 창(필름에서 컷 누르기): 복사(바로 뒤에 하나 더) · 거꾸로 이어 붙이기(여기부터 끝까지를 거꾸로 덧붙여 왕복). 장면 다듬기 창에 장면 "거꾸로".
- 영상 파일: mp4를 먼저 시도하고 안 되면 webm. 공유 가능한 기기는 "보내기 · 사진에 저장" 버튼이 나와요.
- 작품 파일: `exportProjectFile`/`importProjectFile`(`p3a_core.js`) — DB 모양 그대로, Blob은 `{__blob, data(base64)}`로 바꾼 `.lunchbox.json`.
  같은 id가 이미 있으면 새 id + "(가져옴)". 갤러리 카드 ⋯ 메뉴·완성 창의 "작품 파일", 갤러리 위쪽 "파일 불러오기".
- 상영관 저장: 작품 문서에 `show`(올린 시각, 0이면 안 올림) · `stars`(별점 배열). `projectDump`가 같이 저장해요. **지금은 이 기기 안에서만** 모이고, 다른 기기 친구에겐 작품 파일로 보내면 별점까지 같이 가요.
- 민담 추가: `LEGENDS`에 `{ id, p(팔도 id), place, at:[경도,위도], title, sub, syn, scenes }`를 넣으면 지도에 점이 생겨요. 같은 place면 한 점에 탭으로 묶여요.
- 휴지통: 작품을 지우면 `d.trashed = 시각`으로 남고 30일(`TRASH_DAYS`) 지나면 갤러리를 열 때 정말 지워져요.

## 남은 일 (우선순위 순)

1. 폰에서 새 편집기(Stop Motion Studio 방식) 써 보고 불편한 곳 고치기 — 필름 손가락 넘기기, 컷 말풍선, 소리 판 녹음
1-1. 화면 흐름표 문서를 새 구조로 고치기, p1c_theme·p1_head에 남은 6단계 시절 CSS 정리
2. 폰에서 1차 기능 확인: 타이머·자동 촬영, 카메라 고정(아이폰/안드로이드), mp4 저장·사진에 저장, 작품 파일 주고받기
3. 상영관을 여러 기기에서 같이 보기(온라인 저장소 필요 — 아이들 영상이 올라가니 공개 범위·반 코드 등 먼저 정하기)
4. 민담 더 늘리기(지금 14편, 평안·황해·함경은 1편씩), 전래동화 나머지 14편 열기
5. Stop Motion Studio 비교 2차: 그린스크린 + 별주부전 배경 합성, 말풍선·제목/끝 카드, 표정 스티커
6. 원작 애니 영상이 오면 `p3c_screens.js`의 `INTRO_VIDEO`에 파일 경로를 넣기 (없으면 컷아웃 애니메이션)
7. 사운드 화면의 음량 조절(믹스)을 완성 화면으로 옮길지 검토

끝난 일: Stop Motion Studio 방식 갤러리 + 한 화면 편집기로 전체 바꾸기(2026-10-29), 이야기 갈래·팔도 민담 지도·나만의 이야기 바로 촬영·상영관(별점·순위)(2026-10-29), 스튜디오형 화면으로 전체 바꾸기·배경음악/효과음 재생 버그(2026-10-29), 폰 실시간 카메라·겹쳐 보기 확인(2026-10-28), 스토리보드 스케치(2026-10-28), 단계 메뉴·겹침 고치기(2026-10-28),
Stop Motion Studio 비교 1차 — 타이머·자동 촬영, 카메라 고정, mp4, 컷 복사·거꾸로, 작품 파일·휴지통(2026-10-29).

## 배포 (GitHub Pages)

- 저장소: https://github.com/sokumbi/lunchbox-animation (공개, `main` / root)
- 주소: **https://sokumbi.github.io/lunchbox-animation/**
- 고친 뒤 `./build.sh` → `git add -A && git commit` → `git push` 하면 1~2분 뒤 반영돼요.
- 올리지 않는 파일(mp3, *.bin, 시안 png/jpeg, `design/`)은 `.gitignore`에 있어요. 새 파일을 넣을 땐 사용자에게 확인하세요.

## 참고 링크 (claude.ai)

- 앱(배포): https://sokumbi.github.io/lunchbox-animation/
- 앱 미리보기(claude.ai): https://claude.ai/artifact/QFcQGWpKUReEyJ3bQabRr3
- 화면 흐름표 문서: https://claude.ai/artifact/XZmFFGCfP1hxr81NsLbHyY
