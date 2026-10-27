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

점검 결과에서 `OFF …`(화면 밖 버튼)나 `OVERLAP a × b`(버튼끼리 겹침)가 나오면 고쳐야 해요. 선택 막대(.sel-bar)가 키 위에 뜨는 것과 스크롤 밖 컷은 겹침 검사에서 빼 둬요. 내레이션 입력칸의 `SCROLL input`과 시나리오의 `OFF 위로|장면 지우기`(스크롤 목록 안쪽)는 정상이에요.

## 폴더

```
src/                   앱 소스 (빌드 순서대로)
  p1_head.html         <head> 메타, 전체 CSS(런치박스 스킨), 화면 뼈대
  p1b_tex.html         드리미나 재질 CSS (키·모니터 베젤·찰칵 버튼 data URI) ← build_tex.py가 그림 주소를 갱신
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
- 편집은 두 장: **영상 편집**(왼쪽 완성·사운드·재생 / 오른쪽 영상 효과 / 아래 타임라인 + 자르기)과
  **사운드**(같은 틀, 오른쪽이 효과음·배경음악·내레이션 탭으로 바뀜, 완성 키는 숨김)
- 타임라인에서 장면을 누르면 장면 메뉴: 여기서 나누기 · 앞뒤 다듬기 · 다시 찍기 · 지우기
- 효과·효과음 키: **한 번 누르면 미리 보기/듣기, 한 번 더 누르면 지금 시간에 넣기**
- 각 단계에 처음 들어가면 할 일 한 줄 안내가 아래쪽에 4초 동안 떠요(GUIDE). 안내·알림(toast)은 손가락이 통과해서 버튼을 막지 않아요

화면별 버튼과 이동은 claude.ai 문서 "런치박스애니메이션 화면 흐름표"에 표로 정리돼 있어요:
https://claude.ai/artifact/XZmFFGCfP1hxr81NsLbHyY

## 디자인 규칙 (사용자가 정한 것)

- **컨셉**: 실제 애니메이션 라인테스트기 "런치박스"(도시락 가방 모양). 닫힌 상자를 열면 안이 하나의 판(트레이)으로
  된 아날로그 장비 느낌. 크림색 트레이 + 얇은 주황 테두리 + 눌리는 키 + 오목한 칸(well) + 계산기 액정(도트 글자).
- **CI 색**: Arte Black `#111111`, Nova Orange `#CF5D2A`(어두운 `#A8441A`), Canvas White `#F6F6F1`.
  앱 바탕 `#F4EFE5`, 크림 `#F3EAD8`. 트랙 색: 효과 보라 `#8A63C9`, 대사 파랑 `#3E7CB1`, 효과음 주황 `#CF5D2A`,
  배경음악 초록 `#4E9A63`, 내레이션 청록 `#2F9C9A`.
- **시작 화면**: 로고는 스틸(금속 판) 재질. 배경음악 없음, 버튼 클릭음만.
- **한 화면에 다 보이게**(스크롤 없이), **가로로 바로 시작**(회전 안내 문구 없이). 세로로 들면 JS가 앱을 90° 돌려요
  (`ROT`, 손가락 좌표는 `appPt`/`appRect`로 바꿔요 — 포인터 좌표를 쓸 땐 꼭 이걸 쓰세요).
- 촬영 화면: 모니터 최대한 크게, 왼쪽 필름 크게, 오른쪽 조작판(컷 카운터 · 되돌리기 · 재생 · 찰칵 · 겹쳐보기 · 장면 끝 · ×N).
  한 번 누르면 3프레임(기본), 겹쳐 보기는 앞 2컷.
- 이야기 선택: 새로운 이야기 키는 작게, 이야기 카세트는 같은 크기.
- 드리미나 이미지는 재질만 가져와요(키·베젤·찰칵 버튼·시작 사진). 트레이·칸·액정·타임라인은 CSS로 그려요.
- 문구: 아이 눈높이 존댓말("~해요"). "공정" 대신 "단계", "나레이션" 대신 "내레이션".

## 지켜야 할 동작

- 작품은 바뀔 때마다 IndexedDB에 자동 저장(`changed()` → `histPush` + `scheduleSave`). 상태를 바꾸면 꼭 `changed()`를 불러요.
- 소리·효과 위치는 `{ sid: 장면 id, off: 장면 시작부터 초 }`로 저장돼요. 장면 앞을 자르거나 빠르기를 바꿀 때
  `trimModal`의 `setIn`/`setFps`가 off를 같이 옮겨서 그림과 소리가 어긋나지 않게 해요. 장면을 나눌 때도 옮겨요.
- 클릭음은 `initSplash`의 전역 pointerdown에서 나와요(찰칵 버튼 제외).
- 스토리보드 스케치: 장면마다 `s.sketch = { blob, url, img }` 한 장(긴 변 900px jpeg). 시나리오 장면 카드의 스케치 칸에서 찍고,
  촬영 모니터 오른쪽 아래에 작게 보여요(누르면 크게). 도우미 `takeSketch`/`sketchModal`은 `p4_shoot.js`에 있어요. 저장엔 blob만 넣어요.

## 남은 일 (우선순위 순)

1. 원작 애니 영상이 오면 `p3c_screens.js`의 `INTRO_VIDEO`에 파일 경로를 넣기 (없으면 컷아웃 애니메이션)
2. 영상 파일이 webm이라 아이폰·윈도우에서 안 열릴 수 있음 → mp4 경로 마련
3. 작품함이 브라우저 저장소에만 있음 → 작품 백업/내보내기
4. 드리미나 크레딧이 생기면 트레이 안쪽이 빈 깨끗한 이미지를 받아 트레이 바탕도 재질로 바꾸기
5. 사운드 화면의 음량 조절(믹스)을 완성 화면으로 옮길지 검토

끝난 일: 폰 실시간 카메라·겹쳐 보기 확인(2026-10-28), 스토리보드 스케치(2026-10-28).

## 배포 (GitHub Pages)

- 저장소: https://github.com/sokumbi/lunchbox-animation (공개, `main` / root)
- 주소: **https://sokumbi.github.io/lunchbox-animation/**
- 고친 뒤 `./build.sh` → `git add -A && git commit` → `git push` 하면 1~2분 뒤 반영돼요.
- 올리지 않는 파일(mp3, *.bin, 시안 png/jpeg, `design/`)은 `.gitignore`에 있어요. 새 파일을 넣을 땐 사용자에게 확인하세요.

## 참고 링크 (claude.ai)

- 앱(배포): https://sokumbi.github.io/lunchbox-animation/
- 앱 미리보기(claude.ai): https://claude.ai/artifact/QFcQGWpKUReEyJ3bQabRr3
- 화면 흐름표 문서: https://claude.ai/artifact/XZmFFGCfP1hxr81NsLbHyY
