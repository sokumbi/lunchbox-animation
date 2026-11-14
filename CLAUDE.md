# 런치박스애니메이션 — 작업 안내 (Claude용)

**초등학생이 혼자 쓰는 스톱모션 애니메이션 웹앱**이에요. 2026-10-31부터 **세 화면(내 작품 · 촬영 · 꾸미기)**만 있어요.
찍고 → 말하고(녹음) → 소리·배경음악 넣고 → 내보내기. 그 밖의 어른용 기능(포맷·품질·컷 편집·필터·제목 카드 등)은 일부러 뺐어요.
초등 고학년이 주 사용자이고, 강사·부모님도 써요. **폰 가로 화면** 기준이고 세로·태블릿도 돼요.

## 한눈에

- 결과물은 **`index.html` 한 장**이에요. 외부 파일 없이 열려요. 예외는 **홈 화면 아이콘**뿐이에요(`icon-180/192/512.png` · `icon-maskable-512.png` · `manifest.webmanifest`, 아이폰이 HTML 안에 심은 아이콘을 못 읽어서 파일로 둬요). 아이콘이 없어도 앱은 열려요. **효과음·배경음악**도 `audio/sfx/<id>.mp3`·`audio/bgm/<id>.mp3` 파일을 먼저 읽고, 없으면(오프라인·file://) 코드로 합성한 소리로 대신해요(`AE.file`/`AE.trim`, p2_core.js).
- 소스는 `src/`의 조각 파일이에요. **`index.html`을 직접 고치지 말고** `src/`를 고친 뒤 `./build.sh`를 실행하세요.
- 프레임워크 없는 순수 JS예요. 화면은 `h()` 헬퍼로 DOM을 만들고, 무대는 canvas에 그려요. 크기 `W`·`H`는 `setFormat`이 정해요(기본 16:9, 960×540). CSS는 `--ar`(가로÷세로)로 비율을 맞춰요.
- **새 버전 자동 확인**: `build.sh`가 `<meta name="lb-build">`에 빌드 시각을 넣고, 앱이 열릴 때 `checkUpdate()`(p3c_screens.js)가 서버 번호를 캐시 없이 읽어 다르면 `?b=번호`로 다시 열어요(폰·홈 화면 앱이 예전 파일을 붙잡는 문제).
- 실시간 카메라는 **https나 localhost에서만** 켜져요. 폰 테스트는 GitHub Pages에 올려서 해요(아래 "배포" 참고).

## 명령

```bash
./build.sh                    # src → app.html → index.html (문법 검사 포함)
npm run serve                 # http://localhost:8765 (맥에서 확인)
npm i && npx playwright install chromium   # 처음 한 번
npm test                      # 4개 기기 크기로 전체 흐름 자동 점검, 사진은 tests/shots/
node tests/ui-test.js i13,se  # 고른 기기만 (i13=아이폰13 가로, se=작은 폰, por=세로 폰, tab=태블릿)
# 점검은 8765 포트에 서버를 직접 띄워요. `npm run serve`가 떠 있으면 EADDRINUSE로 바로 끝나니 먼저 꺼요
```

점검 결과에서 `OFF …`(화면 밖 버튼)나 `OVERLAP a × b`(버튼끼리 겹침), `SCROLL …`이 나오면 고쳐야 해요. 스크롤 목록(`.list`, 꾸미기 도구 판 `.dc-pane`) 안쪽은 검사에서 빼 둬요. 지금은 4개 기기 모두 `ok`예요.

## 폴더

```
src/                   앱 소스 (빌드 순서대로)
  p1_head.html         <head> 메타, 기본 CSS(버튼·창·토스트·카운트다운 등), 화면 뼈대(#library · #studio > #stBody)
  p1c_theme.html       검은 바탕 테마 + 세 화면 CSS(.rail/.ri 아이콘 줄, 촬영 .sh-*, 꾸미기 .dc-*, 내 작품 .g-*, 메뉴 .cm-*, 알림창 .al-*, 세로 화면)
  p2c_clay.js          클레이 UI 아이콘 45개(CLAY: 이름 → 72px 투명 WebP data URL, 2026-11-14). `icon(n)`이 CLAY에 있으면 그림을 <svg><image>로, 없으면 선 아이콘. 켜진 버튼은 아이콘 뒤 주황빛 판(`svg.clay`). 시트·자르는 과정은 `design/icon2/ui/`
  p2_core.js           BRAND, 무대 크기 W·H, h(), 아이콘 IC, toast/modal, DB(IndexedDB), 영상 효과 FX(지금은 UI 없음), 효과음 SFX, 배경음악 BGM, 오디오 엔진 AE
  p2b_ui.js            추가 아이콘(timer 등), 예전 LCD·key 헬퍼(거의 안 씀)
  p3a_core.js          작품 모델 P(newProject: fps 6 · hold 1), setFormat, 타임라인 TL(), 재생기 Player, 되돌리기 HIST, 저장, 작품 파일
  p3c_screens.js       show() · 시작 initApp(런치박스 시작 화면 → 갤러리) · loadWorks(휴지통 30일)
  p4_shoot.js          카메라(Cam) · drawCam · 사진 불러오기(pickImages, fileToFrameBlob) · playAll
  p5c_rec.js           녹음 도우미(Mic, recordFlow), 소리 파일 불러오기(uploadAudio)
  p6_simple.js         세 화면 전부: 내 작품(openGallery) · 촬영(openShoot) · 꾸미기(openDeco) + 메뉴·알림창·확대 전환
  p6d_extra.js         제목 카드·엔딩 크레딧 페이지(openCard, DESIGNS·FONTS, drawTitleCard/drawCredits) · 전래동화 5편(TALES, playTale 이모지 애니메이션) · 처음 한 번 설명 레이어(hintOnce)
  p6e_story.js         다시 쓴 전래동화 재생 데이터(STORY, 지금은 별주부전만). `node tools/tales-story.js byeoljubu`가 만들어요 — 직접 고치지 마세요
  p5d_export.js        영상 파일 만들기(MediaRecorder, mp4→webm), 시작 호출
brand/, design/        예전 아르떼노바 CI·런치박스 시안 (앱에서는 로고 인트로만 써요)
icon-*.png             홈 화면 아이콘(2026-11-14): 클레이로 빚은 런치박스 기계 + 이름판에 아르떼노바 로고, 코럴 배경. 원본(1024)·만든 과정·다른 시안은 `design/icon2/`(clay3_coral.png). 안드로이드 마스크용은 여백을 둔 `icon-maskable-512.png`
manifest.webmanifest   안드로이드 설치용(이름·아이콘·standalone)
tools/tales-*.js       전래동화 다시 쓰기 도구: tales-script.js(이야기·대사 원고, tales/script.md) · tales-images.js(장면→그림 연결, 새 그림 프롬프트) · tales-voice.js(목소리 배정·녹음 묶음) · tales-split.js(녹음을 줄마다 자르기) · tales-story.js(STORY 만들기)
tales/                 전래동화 그림: 카드 `tales/<id>.jpg` 5장 + 스토리 보기 장면 `tales/<id>/<n>.jpg` 33장(n은 1부터, 960×540). .gitignore 예외
audio/sfx, audio/bgm   효과음 14개·배경음악 7곡 mp3(파일 이름 = SFX/BGM의 id). 불러올 때 `AE.trim`이 앞뒤 무음을 자르고 음량을 맞춰요
tests/ui-test.js       Playwright 흐름 점검 (가짜 카메라로 촬영까지 눌러 봐요)
```

## 화면 흐름 (지금 동작)

작품은 **장면 하나(`P.scenes[0]`)**만 써요. 예전 작품에 장면이 여럿이면 열 때 `flattenScenes`가 하나로 합쳐요. 상태는 `V`(화면·끼워 넣을 자리·다시 찍을 컷·타이머·도구 탭), 화면 요소는 `EL`.

1. **내 작품**(`openGallery`, 검은 바탕): 왼쪽 줄 내 작품 · **전래동화** · 휴지통 · (아래 작게) **도움말**(`hintReset`: 한눈에 보는 안내 + 각 화면 처음 설명 다시 켜기) · 불러오기(작품 파일). 첫 칸 주황 **"＋ 새 작품"** → 이름 "작품 N"으로 만들고 **제목 카드 페이지**(`openCard('title')`: 제목 입력 · 디자인 6개+제목 없이 · 글씨체 6개, 미리 보기) → **촬영**으로. 자동 이름("작품 N", `isAutoTitle`)은 입력 칸을 비워 두고, 제목을 안 쓰면 제목 카드가 안 붙어요(`hasCard`). 내보내기에서 이름을 쓰면 그때 붙어요.
   - **전래동화** 탭: 5편(별주부전·흥부와 놀부·해님 달님·금도끼 은도끼·콩쥐 팥쥐) 카드. 카드 그림은 `tales/<id>.jpg`(960×540, 드리미나로 만든 일본 애니메이션 풍 일러스트, 2026-11-14). 뜰 때까지 어두운 바탕, 못 읽을 때만 예전 색 바탕+이모지. 누르면 작은 창(제목·부제·두 버튼, 아이콘 없음)에서 **스토리 보기**(`playTale`: **별주부전은 다시 쓴 16장면 + 일레븐랩스 목소리**(내레이터·용왕·문어 의원·자라·토끼·산신령, `tales/byeoljubu/v/<장면>_<줄>.mp3`, 자막 위 말하는 이 이름표, 배경음악은 작게). 나머지 네 편은 아직 예전 짧은 자막(보류, 2026-11-14). 첫 장면 그림이 준비되면 시작, 장면 그림 `tales/<id>/<n>.jpg`를 천천히 다가가며 보여 줘요. 아래 타임라인 `.tale-bar`(‹ 앞 장면 · 재생/멈춤 · 다음 장면 › · 끌어서 이동), 오른쪽 위 닫기, 화면 누르면 멈춤. 그림을 못 읽은 장면만 예전 이모지 장면) / **스토리 만들기**(`makeTale`: 이야기 이름으로 새 작품 → 바로 촬영, `P.tale`·`P.taleStep`. 촬영 화면 위에 장면 자막 안내 `.sh-guide`(`taleGuide`)가 떠서 ‹ › 로 넘기며 따라 찍어요). 내 작품 카드를 누르면 컷이 있으면 꾸미기, 없으면 촬영. 카드 ⋯ 또는 길게 누르기 → 이름 바꾸기 · 작품 파일로 저장 · 지우기(휴지통). 휴지통에선 되살리기 · 완전히 지우기
2. **촬영**(`openShoot`): 카메라가 가운데 가득. 왼쪽 줄 ‹ 내 작품 · ↶ 되돌리기 · **▶ 재생**(찍은 컷을 카메라 자리에서 무한 반복, `shootPv`/`V.pv`; 다시 누르거나 찰칵·컷 누르기로 멈춤) · 겹쳐보기(앞 2컷) · 격자 · 사진(앨범에서 여러 장). 오른쪽 줄 카메라 바꾸기 · 타이머(끔→3초→5초) · **큰 빨간 찰칵**(스페이스 키도) · 주황 **"다 찍었어요 → 꾸미기"**.
   - **초점**(2026-11-14): 카메라 화면을 누르면 그 자리에 맞추고 고정(`tapFocus` → `Cam.focusAt`, 노란 네모 `.fc-ring`). 기기가 직접 조절을 지원하면 오른쪽에 멀리↔가까이 막대와 자동 버튼(`focusUI`, `.fc-box`). 지원 안 하는 폰(대개 아이폰 사파리)은 처음 누를 때 안내만 떠요. 컷 메뉴를 닫으려고 누른 건 초점으로 치지 않아요(`V.popTap`)
   - 아래 필름(`.sh-film`, 검은 띠 없이 썸네일만): 컷 수 + 썸네일. **카메라 화면(`.sh-stage` > `.sh-mon`) 밖, 바로 아래**에 있어서 찍은 장면을 가리지 않아요(2026-11-14). 가운데 칸 `.sh-c`는 세로 flex라 카메라+필름이 가운데 모여요. **컷을 누르면 컷 위에 작은 메뉴**(`cutPop`, 같은 컷을 다시 누르거나 다른 곳을 누르면 닫힘): **다시 찍기**(`V.retake` — 다음 찰칵이 그 컷을 바꿔요) · **뒤에 찍기**(`V.ins` — 다음 찰칵부터 그 자리에 차례로 들어가요) · **지우기**. 고른 컷·재생 중인 컷은 주황 테두리. 위에 주황 띠로 지금 상태("3번 컷을 다시 찍어요 · 그만두기", "2번 컷 뒤에 찍어요 · 맨 뒤에 찍기")
   - 컷을 넣고 빼면 그 뒤 소리 위치(off)도 같이 옮겨요(`insFrames`/`delFrames`). 카메라를 못 켜면 찰칵이 폰 카메라 앱을 열어요
3. **꾸미기**(`openDeco`): 왼쪽 줄 ‹ 내 작품 · 📷 촬영 · ↶ 되돌리기 · 빠르기(느리게 4 · 보통 6 · 빠르게 10 fps, `setFps`가 소리 위치도 맞춰요). 가운데 영상(누르면 재생/멈춤, 큰 ▶) + 아래 **타임라인**(`tlBuild`/`tlPaint`, CSS `.tml-*`): 컷 썸네일 줄(canvas) · 말(청록 띠) · 소리(주황 칩) · 음악(초록 띠) 줄과 흰 재생 선. 누르거나 끌면 그 자리로 가고, 넣은 것을 누르면 그 자리로 가며 그 도구 탭이 열려요. 칩 오른쪽 ✕(`.tml-x`)로 말·소리·음악을 바로 빼요(되돌리기로 살려요). 오른쪽 도구 판 탭 4개:
   - **말하기**: 빨간 녹음 → 3·2·1 뒤 지금 자리부터 영상이 흐르며 녹음(`recordFlow` → `P.narrs`), 멈추기. 녹음한 말 목록에서 듣기 · 지우기. 마이크가 안 되면 소리 파일 넣기
   - **소리**: 효과음 타일 14개. 누르면 **지금 자리에 들어가고 바로 들려요**, 같은 자리에 있으면 한 번 더 눌러 빼요(`P.sfx`). "넣은 소리 n개 모두 지우기"
   - **배경음악**: 음악 없음 + 7곡 타일, 누르면 미리 듣고 작품 전체에 깔려요(`P.scenes[0].bgm`). "말할 때 음악 작게"(`P.duck`)
   - **내보내기**(스크롤 없이 한 화면, `.dc-pane.share`): 작품 이름 · 요약 · **제목 카드 / 엔딩 크레딧** 버튼(`openCard('credits')`: 글 여러 줄, 배경·글씨체, 아래에서 위로 흐름) · **영상 파일 만들기**(`exportVideo`: mp4→webm, 보내기/사진에 저장/파일로 저장) · 작품 파일(`.lunchbox.json`)
- **제목 카드·엔딩 크레딧**은 타임라인 앞뒤에 붙어요: `TL()`의 `lead`(CARD_DUR 2초)·`tail`(`creditDur(text)`: 줄 수에 따라 3~10초, 올라가는 빠르기 CREDIT_SPEED 일정)·`body`. `renderAt`이 그 구간에 `drawTitleCard`/`drawCredits`를 그려요. 소리 위치(`setAbs`)는 컷 구간 안으로 눌러요(`bodyT`). 데이터는 `P.card {on, design, font}`, `P.credits {text, design, font}`.
- **처음 한 번 설명 레이어**(`hintOnce(key)`): 제목 카드·촬영·꾸미기·크레딧 화면을 처음 열 때만 반투명 안내가 뜨고 아무 데나 누르면 사라져요(localStorage `lb_hint_*`). 내 작품의 **도움말**을 누르면 기억이 지워져 다시 나와요. 자동 점검은 `.hint-ov`를 먼저 눌러 없애요. (`.hint`는 창 안 작은 안내 글 클래스라 쓰면 안 돼요)
- 되돌리기: `changed()`마다 `histPush`, `undo()`가 `goStep()`으로 지금 화면을 다시 그려요(`shootPaint`/`decoPaint`)
- 안내·알림(toast)은 손가락이 통과해서 버튼을 막지 않아요

## 디자인 규칙 (사용자가 정한 것)

- **컨셉 (2026-10-31)**: **심플**. 화면 세 장, 아이가 할 일은 찍기·말하기·소리·내보내기뿐. 선택지를 늘리지 말고, 새 기능은 꼭 필요한지 먼저 물어요.
  **고치기가 쉬워야** 해요: 잘못 찍은 컷은 필름에서 눌러 두 번 안에 지우기/다시 찍기, 되돌리기는 항상 보여요.
- 검은 바탕(`#000`, 판 `#1c1c1e`/`#2c2c2e`) + **크고 이름 붙은 아이콘**(`.ri`: 아이콘 밑에 글자). 강조 주황 `#CF5D2A`, 찰칵·녹음 빨강 `#FF3B30`. 소리 주황, 말(내레이션) 청록 `#2F9C9A`, 배경음악 초록 `#4E9A63`.
- 시작(2026-11-14): 코럴 바탕에 클레이 런치박스(앱 아이콘과 같은 그림, `SPLASH_IMG`로 파일 안에 심음) + "런치박스 애니메이션 스튜디오" + 작은 아르떼노바 심볼(회사 이름 글자 없음). `introLogo`, 누르면 넘어가요 → 내 작품. 배경음악 없음, 버튼 클릭음만.
- **한 화면에 다 보이게**(꾸미기 도구 판만 스크롤). **가로·세로 둘 다** 돼요(`@media (orientation:portrait)`: 위 줄 · 가운데 · 아래 줄).
- 창·메뉴·알림은 스프링 곡선으로 열리고 `fadeRemove`로 부드럽게 닫혀요. 카드 ↔ 화면은 확대·축소 전환(`zoomFrom`/`zoomInto`).
- 문구: 아이 눈높이 존댓말("~해요"). "공정" 대신 "단계", "나레이션" 대신 "내레이션"(화면에선 "말하기").

## 지켜야 할 동작

- 작품은 바뀔 때마다 IndexedDB에 자동 저장(`changed()` → `histPush` + `scheduleSave`). 상태를 바꾸면 꼭 `changed()`를 불러요.
- 소리 위치는 `{ sid: 장면 id, off: 장면 시작부터 초 }`. 컷을 넣고 빼거나 빠르기를 바꿀 때 `shiftItems`/`setFps`가 off를 같이 옮겨요.
- 클릭음은 `initApp`의 전역 pointerdown에서 나와요(찰칵 제외). 첫 손댐에 소리 엔진(AE)을 켜요.
- 소리 파일 버퍼에는 `__gain`(맞춘 음량 계수)과 음악은 `__loopStart`/`__loopEnd`(무음 없는 반복 구간)가 붙어요. 소리를 트는 곳(`Player.schedule`, `AE.playPreview`, `playTale`)은 이 값을 꼭 써요. 합성 소리는 없어서 1·전체 길이로 돼요.
- 타이머: `V.timer`(기기 세션에만). 카운트다운 중 찰칵을 다시 누르면 취소.
- 영상 파일: mp4를 먼저 시도하고 안 되면 webm. 공유 가능한 기기는 "보내기 · 사진에 저장" 버튼이 나와요.
- 작품 파일: `exportProjectFile`/`importProjectFile`(`p3a_core.js`) — Blob은 `{__blob, data(base64)}`로 바꾼 `.lunchbox.json`. 같은 id가 있으면 새 id + "(가져옴)".
- 휴지통: 지우면 `d.trashed = 시각`, 30일(`TRASH_DAYS`) 뒤 갤러리를 열 때 정말 지워져요.
- 데이터 모델엔 예전 필드(`fx`, `voices`, `script`, `look`, `trimIn/Out`)가 남아 있어요. 예전 작품이 열리게 두는 것이고 새 화면은 쓰지 않아요.

## 남은 일 (우선순위 순)

1. **폰에서 세 화면 써 보기** — 찰칵·컷 창·녹음·소리 넣기·내보내기. 아이와 같이 써 보고 막히는 곳 고치기
2. 폰에서 기능 확인: 타이머, 카메라 바꾸기, mp4 저장·사진에 저장, 작품 파일 주고받기, 세로 화면
3. 화면 흐름표 문서(claude.ai)를 세 화면으로 다시 쓰기
4. 필요하면 어른용 "자세히" 메뉴로 뺀 기능 일부 되살리기(장면 나누기, 효과 등) — 먼저 사용자에게 물어요

끝난 일: UX 점검 뒤 손보기 — 제목 카드 자동 이름 제외·2초, 크레딧 길이 줄 수 비례, 아이콘 줄 글자 12px 이상, 도움말 버튼, 타임라인 칩 ✕, 스토리 만들기(장면 자막 안내), 세로 내보내기 판 한 화면(2026-11-13).
그 전: 세 화면으로 단순화 — 내 작품·촬영(컷 창: 다시 찍기·여기 뒤에 찍기·지우기)·꾸미기(말하기·소리·배경음악·내보내기, 빠르기 셋), 6단계·Stop Motion Studio 편집기·새 영화 창·설정 판 제거(2026-10-31).
그 전: Stop Motion Studio 방식 편집기(2026-10-29~30), 폰 실시간 카메라·겹쳐 보기 확인(2026-10-28), 타이머·자동 촬영, 카메라 고정, mp4, 작품 파일·휴지통(2026-10-29).

## 배포 (GitHub Pages)

- 저장소: https://github.com/sokumbi/lunchbox-animation (공개, `main` / root)
- 주소: **https://sokumbi.github.io/lunchbox-animation/**
- 고친 뒤 `./build.sh` → `git add -A && git commit` → `git push` 하면 1~2분 뒤 반영돼요.
- 올리지 않는 파일(mp3, *.bin, 시안 png/jpeg, `design/`)은 `.gitignore`에 있어요(아이콘 `icon-*.png`와 `audio/`·`tales/` 폴더만 예외). 새 파일을 넣을 땐 사용자에게 확인하세요.

## 참고 링크 (claude.ai)

- 앱(배포): https://sokumbi.github.io/lunchbox-animation/
- 화면 흐름표 문서(예전 6단계 기준): https://claude.ai/artifact/XZmFFGCfP1hxr81NsLbHyY
