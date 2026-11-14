# 온라인 상영관 켜기 (Supabase)

앱 코드는 다 들어가 있어요. 서버만 만들어 연결하면 상영관이 열려요. 서버 주소가 비어 있는 동안 앱에는 "상영관은 준비 중이에요"가 보여요.

## 1. Supabase 프로젝트 만들기 (보호자·운영자가 직접)

1. https://supabase.com 에 가입하고 **New project**를 만들어요. 지역은 **Northeast Asia (Seoul)**, 무료(Free) 요금제로 시작해요.
2. **Authentication › Sign In / Providers**에서 **Allow anonymous sign-ins**를 켜요. 아이들은 이메일 없이 기기마다 익명으로 들어와요.
3. **Allow new users to sign up**은 켜 둬요. 끄면 익명 로그인도 막혀요. 이메일로 가입한 사람도 관리자 표(admins)에 없으면 아이들과 같은 권한뿐이에요.
4. **SQL Editor**에 `docs/theater.sql` 전체를 붙여 넣고 **Run** 해요. 표·보안 규칙·저장소(films)가 만들어져요.

## 2. 관리자 계정 만들기

1. **Authentication › Users › Add user**에서 관리자 이메일과 비밀번호로 사용자를 만들어요.
2. SQL Editor에서 아래 한 줄을 그 이메일로 바꿔 실행해요.

```sql
insert into public.admins (uid) select id from auth.users where email = '관리자@이메일' on conflict do nothing;
```

## 3. 앱에 연결하기

**Project Settings › API**에서 **Project URL**과 **anon public** 키를 복사해 `src/p7_theater.js` 맨 위에 넣어요.

```js
const THEATER = { url: 'https://xxxx.supabase.co', key: 'eyJ...' };
```

anon 키는 공개돼도 괜찮은 키예요. 보안은 SQL의 보안 규칙(RLS)이 지켜요. **service_role 키는 절대 넣지 마세요.**

그다음 `./build.sh` → 커밋 → push 하면 배포돼요.

## 4. 운영하기

- **관리자 화면**: 앱 주소 뒤에 `?admin`을 붙여 열어요. 예: `https://sokumbi.github.io/lunchbox-animation/?admin`
- **확인할 작품**: 새로 올라온 작품과 신고 3번으로 숨겨진 작품이 보여요. 그림을 누르면 영상이 새 탭에서 열려요. 승인 · 거절 · 지우기 중에 골라요.
- **상영 중**: 이미 공개된 작품을 숨길 수 있어요.
- 승인된 작품만 모두에게 보이고, 영상 주소는 1시간 뒤 만료돼요.

## 안전장치 정리

| 장치 | 내용 |
|---|---|
| 사전 검토 | 올린 작품은 관리자가 승인해야 공개돼요 |
| 별명만 | 실명·이메일을 받지 않아요. 기기마다 익명 사용자예요 |
| 보호자 확인 | 올릴 때마다 보호자용 곱셈 문제와 공개 동의 표시가 있어야 해요 |
| 신고 | 누구나 신고할 수 있고, 3번이면 저절로 숨겨져 다시 검토해요 |
| 댓글 없음 | 반응은 좋아요(하트)만 있어요 |
| 올리기 제한 | 한 기기에서 하루 5편까지예요 |
| 좋아요 | 사용자마다 작품 하나에 한 번이에요 |

보호자 확인은 앱 안의 간단한 확인이에요. 만 14세 미만 아이의 개인정보(얼굴·목소리)를 공개하는 서비스라면, 정식으로 운영하기 전에 개인정보 처리방침과 법정대리인 동의 절차를 전문가와 확인하는 게 좋아요.

## 용량

올리는 영상은 긴 변 854픽셀, 약 1.2Mbps로 만들어요. 30초 작품이 약 5MB예요. 무료 요금제 저장소 1GB면 약 200편이에요.

## 시연

서버 없이 주소에 `?theater=mock`을 붙이면 기기 안 가짜 서버로 상영관을 써 볼 수 있어요. 새로 고치면 사라져요. 관리자 화면 시연은 `?theater=mock&admin`이에요.
