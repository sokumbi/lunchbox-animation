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
  p1c_theme.html       스튜디오형 화면 CSS (밝은 베이지 · 양옆 아이콘 줄 · 도구 판). p1_head의 런치박스 스킨을 덮어써요
  p2_core.js           BRAND, 화면 회전(ROT), h(), 아이콘 IC, 로고, toast/modal, 이야기 목록 TALES, DB(IndexedDB),
                       캐릭터·배경 그리기, 영상 효과 FX + drawFx, 효과음 SFX, 배경음악 BGM, 오디오 엔진 AE
  p2b_ui.js            추가 아이콘, 계산기 액정 LCD(도트 글자), 7세그먼트 seg7, key() 헬퍼
  p2c_artdata.js       벡터 런치박스 SVG (지금은 안 씀, 예비)
  p2d_splash.js        시작 화면 드리미나 사진 (data URI) ← build_tex.py가 생성
  p3a_core.js          작품 모델 P, 타임라인 계산 TL(), 재생기 Player, Timeline UI(색깔 트랙), 되돌리기 HIST, 저장
  p3b_intro_data.js    별주부전 원작 컷아웃 애니메이션 (원작 영상 파일이 생기면 대체)
  p3c_screens.js       화면 흐름: 시작 → 제작 과정 → 이야기 고르기 → 원작 → 스튜디오 틀(goStep, 단계 안내 GUIDE)
  p4_shoot.js          촬영 (카메라, 필름, 조작판, 장면 끝 창, 장면 목록)
  p5a_steps.js         편집(영상)·사운드·대사 녹음·완성 화면, 장면 메뉴, 장면 다듬기 창
  p5b_script.js        시나리오
  p5c_rec.js           녹음 도우미, 대사 파일 불러오기
  p5d_export.js        영상 파일 만들기(MediaRecorder, webm), 시작 호출
brand/                 아르떼노바 공식 CI (로고 SVG/PNG)
design/source/         드리미나 원본 이미지 (process/shoot/story/edit.jpg, 닫힌 런치박스, 시작 렌더)
design/vector/         벡터 시안 생성기 (svgkit.py, screens.py → out/*.svg, render.js → out/*.png)
design/textures/       드리미나 원본에서 재질 조각 자르기 (build_tex.py → out/ + src 반영)
tests/ui-test.js       Playwright 흐름 점검 (가짜 카메라로 촬영까지 눌러 봐요)
```

## 화면 흐름 (지금 동작)

시작(닫힌 런치박스 사진, 터치) → 제작 과정(터치하면 5단계 키가 하나씩 나타나요) → 시나리오 키가 커지며 →
이야기 고르기(카세트 15개, 별주부전만 켜짐 · 작은 진한 키 "새로운 이야기") → 별주부전 원작 영상(건너뛰기 가능) →
제작 과정(별주부전) → 촬영 키 → **바로 촬영**(제목 "나의 별주부전", 첫 장면 "아픈 용왕님" 자동)

단계: 시나리오 → 촬영 → 대사 녹음 → 사운드 → 편집 → 완성
- 모든 작업 화면 왼쪽 위: **단계 키**(누르면 6단계 메뉴 `stepMenu()`가 떠서 아무 단계로 바로 이동, 이야기 목록도 여기서) + **되돌리기 ↶**(최근 40번)
- **다음 키**(`nextKey(cur, 'pill')`): 모든 단계에서 화면 오른쪽 위 주황 알약 "다음 · 단계명 ›". 단계를 넘어가는 키는 이것 하나예요.
  뒤로 가는 단계 키는 왼쪽 줄의 "‹ 단계명".
  할 일을 다 하면 `pulseNext(msg)`로 다음 키를 반짝여요(지금은 대사를 다 녹음했을 때). 점검(`npm test`)이 다음 키만 눌러 시나리오→완성까지 가 봐요.
- 편집은 두 장: **사운드**(오른쪽 줄 효과음·배경음악·내레이션 → 도구 판, 자르기)와 **영상 편집**(오른쪽 줄 효과 → 도구 판, 자르기).
  **완성**은 오른쪽 줄 영상 파일·한눈에·처음부터·작품함. 순서는 사운드 → 편집 → 완성
- 타임라인에서 장면을 누르면 장면 메뉴: 여기서 나누기 · 앞뒤 다듬기 · 다시 찍기 · 지우기
- 효과·효과음 키: **한 번 누르면 미리 보기/듣기, 한 번 더 누르면 지금 시간에 넣기**
- 각 단계에 처음 들어가면 할 일 한 줄 안내가 화면 위쪽 가운데에 4초 동안 떠요(GUIDE). 안내·알림(toast)은 손가락이 통과해서 버튼을 막지 않아요

화면별 버튼과 이동은 claude.ai 문서 "런치박스애니메이션 화면 흐름표"에 표로 정리돼 있어요:
https://claude.ai/artifact/XZmFFGCfP1hxr81NsLbHyY

## 디자인 규칙 (사용자가 정한 것)

- **컨셉 (2026-10-29 바꿈)**: Stop Motion Studio 같은 **스튜디오형 화면**. 예전 "런치박스(크림 트레이·눌리는 키·계산기 액정)"는 그만 써요.
  시안: `design/mockups/studio-style.html` (git에는 안 올라가요).
  - 바탕은 **아르떼노바 밝은 베이지**(`#F4EFE5`), 패널은 흰색·`#EDE5D6`, 글자 Arte Black, 강조 Nova Orange. 검은 바탕은 쓰지 않아요.
  - 작업 화면 공통 틀(`goStep`의 `.lay`): **왼쪽 아이콘 줄**(단계·되돌리기·뒤로 가는 단계·재생) | **가운데 큰 화면** | **오른쪽 아이콘 줄**(그 단계 도구) / 아래 타임라인.
    아이콘 밑에 짧은 글자를 남겨요(아이들용).
  - 도구는 오른쪽 줄 키를 누르면 **화면 아래에서 올라오는 도구 판**(`sheet`, ✕로 닫기)에 나와요. 모듈은 `mount({ L, M, R, RR, B, tlw, sheet })`를 받아요
    (R = 도구 판 안쪽, RR = 오른쪽 줄, `sheet.open()/close()/isOpen/onToggle`). 오른쪽 줄 도구 키는 `railTool()` + `paintRail()`.
  - **다음 키**는 모든 단계에서 화면 오른쪽 위 주황 알약 "다음 · 단계명 ›"(`nextKey(id, 'pill')`).
- **촬영 화면**: 카메라 화면을 **높이 전체로 최대한 크게**(16:9). 왼쪽 줄: 단계·되돌리기(마지막 컷 지우기)·겹쳐보기+진하기 막대(`S.onionA`)·격자.
  오른쪽 줄: 카메라 바꾸기·타이머·고정·**큰 빨간 찰칵**·재생·×N. 찍은 컷 필름은 카메라 화면 아래쪽에 반투명 띠(`.fbar`)로 겹치고
  띠 안에 장면 키(장면 목록)·컷 수·"장면 끝"이 있어요. 한 번 누르면 3프레임(기본), 겹쳐 보기는 앞 2컷.
- **대사 녹음**: 대사는 화면 위 자막(`guide`), 위쪽 가운데 알약에 "대사 n/전체 · 인물 · 녹음 수". 왼쪽 줄 앞·뒤 대사, 오른쪽 줄 듣기·큰 빨간 마이크·파일·고치기.
- **이야기 고르기**: 카세트 대신 같은 크기의 **그림 카드 15개**(색은 `TALES[].c`), 별주부전만 "시작", 나머지 "준비 중". 위쪽: 처음으로·앱 이름·내 작품함·새로운 이야기.
- **시작 화면**(닫힌 런치박스 사진)과 제작 과정 소개는 내용 그대로, 같은 베이지 톤. 시작 화면은 배경음악 없음, 버튼 클릭음만.
- 제목 글자는 `LCD.make()`가 평범한 글자(`.lcd-t`)로 만들어요(도트 액정은 안 써요).
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
  같은 id가 이미 있으면 새 id + "(가져옴)". 작품함의 ⬇ 키, 단계 메뉴의 "작품 파일로 저장", 작품함의 "파일 불러오기".
- 휴지통: 작품을 지우면 `d.trashed = 시각`으로 남고 30일(`TRASH_DAYS`) 지나면 작품함을 열 때 정말 지워져요.

## 남은 일 (우선순위 순)

1. 폰에서 새 화면 전체 써 보고 불편한 곳 고치기 (특히 작은 폰의 도구 판 높이, 촬영 오른쪽 줄)
2. 폰에서 1차 기능 확인: 타이머·자동 촬영, 카메라 고정(아이폰/안드로이드), mp4 저장·사진에 저장, 작품 파일 주고받기
3. Stop Motion Studio 비교 2차: 그린스크린 + 별주부전 배경 합성, 말풍선·제목/끝 카드, 표정 스티커
4. 원작 애니 영상이 오면 `p3c_screens.js`의 `INTRO_VIDEO`에 파일 경로를 넣기 (없으면 컷아웃 애니메이션)
5. 사운드 화면의 음량 조절(믹스)을 완성 화면으로 옮길지 검토

끝난 일: 스튜디오형 화면으로 전체 바꾸기·배경음악/효과음 재생 버그(2026-10-29), 폰 실시간 카메라·겹쳐 보기 확인(2026-10-28), 스토리보드 스케치(2026-10-28), 단계 메뉴·겹침 고치기(2026-10-28),
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
