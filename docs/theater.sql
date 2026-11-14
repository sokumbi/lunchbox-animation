-- 런치박스 온라인 상영관 (Supabase) — 2026-11-14
-- Supabase 대시보드 › SQL Editor 에 이 파일 전체를 붙여 넣고 Run 하세요. 여러 번 실행해도 괜찮아요.
-- 규칙
--   * 아이들은 기기마다 익명 사용자(anonymous sign-in)로 들어와요. 이메일·실명은 받지 않아요.
--   * 올린 작품은 'pending'(검토 중)으로 들어가고, 관리자가 승인해야 모두에게 보여요.
--   * 영상·포스터는 비공개 저장소(films)에 두고, 승인된 작품만 잠깐 쓰는 주소(signed URL)로 보여 줘요.
--   * 좋아요는 사용자마다 작품 하나에 한 번. 신고가 3번 쌓이면 저절로 숨겨지고 관리자가 다시 봐요.
--   * 한 사용자는 하루 5편까지 올릴 수 있어요.

create extension if not exists pgcrypto;

-- ---------- 표 ----------
create table if not exists public.films (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null check (char_length(title) between 1 and 40),
  nick text not null check (char_length(nick) between 1 and 12),
  video text not null,                       -- 저장소 경로: <owner>/<id>.mp4
  poster text not null,                      -- 저장소 경로: <owner>/<id>.jpg
  secs real not null default 0 check (secs >= 0 and secs <= 600),
  parent_ok boolean not null check (parent_ok),   -- 보호자 확인을 거쳤어요
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden', 'rejected')),
  likes int not null default 0,
  reports int not null default 0,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
create index if not exists films_status_idx on public.films (status, approved_at desc);
create index if not exists films_owner_idx on public.films (owner, created_at desc);

create table if not exists public.likes (
  film uuid not null references public.films on delete cascade,
  uid uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (film, uid)
);
create index if not exists likes_recent_idx on public.likes (film, created_at);

create table if not exists public.reports (
  film uuid not null references public.films on delete cascade,
  uid uuid not null default auth.uid() references auth.users on delete cascade,
  reason text not null check (char_length(reason) <= 40),
  created_at timestamptz not null default now(),
  primary key (film, uid)
);

create table if not exists public.admins (uid uuid primary key references auth.users on delete cascade);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where uid = auth.uid())
$$;

-- ---------- 지킴이(트리거) ----------
-- 올릴 때: 하루 5편 제한, 상태·숫자는 서버가 정해요
create or replace function public.films_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.films where owner = auth.uid() and created_at > now() - interval '1 day') >= 5 then
    raise exception 'daily_limit';
  end if;
  new.owner := auth.uid();
  new.status := 'pending'; new.likes := 0; new.reports := 0;
  new.created_at := now(); new.approved_at := null;
  return new;
end $$;
drop trigger if exists films_before_insert on public.films;
create trigger films_before_insert before insert on public.films for each row execute function public.films_before_insert();

-- 승인할 때 시각을 적어요
create or replace function public.films_before_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then new.approved_at := now(); end if;
  if new.status = 'approved' and old.status = 'hidden' then new.reports := 0; delete from public.reports where film = new.id; end if;
  return new;
end $$;
drop trigger if exists films_before_update on public.films;
create trigger films_before_update before update on public.films for each row execute function public.films_before_update();

-- 좋아요 수
create or replace function public.likes_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update public.films set likes = likes + 1 where id = new.film;
  else update public.films set likes = greatest(likes - 1, 0) where id = old.film; end if;
  return null;
end $$;
drop trigger if exists likes_count on public.likes;
create trigger likes_count after insert or delete on public.likes for each row execute function public.likes_count();

-- 신고 3번이면 숨겨요
create or replace function public.reports_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.films set reports = reports + 1,
    status = case when reports + 1 >= 3 and status = 'approved' then 'hidden' else status end
  where id = new.film;
  return null;
end $$;
drop trigger if exists reports_count on public.reports;
create trigger reports_count after insert on public.reports for each row execute function public.reports_count();

-- ---------- 보안 규칙(RLS) ----------
alter table public.films enable row level security;
alter table public.likes enable row level security;
alter table public.reports enable row level security;
alter table public.admins enable row level security;

drop policy if exists films_read on public.films;
create policy films_read on public.films for select using (status = 'approved' or owner = auth.uid() or public.is_admin());
drop policy if exists films_add on public.films;
create policy films_add on public.films for insert to authenticated with check (owner = auth.uid() and parent_ok);
drop policy if exists films_admin_edit on public.films;
create policy films_admin_edit on public.films for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists films_remove on public.films;
create policy films_remove on public.films for delete to authenticated using (owner = auth.uid() or public.is_admin());

drop policy if exists likes_read on public.likes;
create policy likes_read on public.likes for select to authenticated using (uid = auth.uid());
drop policy if exists likes_add on public.likes;
create policy likes_add on public.likes for insert to authenticated
  with check (uid = auth.uid() and exists (select 1 from public.films f where f.id = film and f.status = 'approved'));
drop policy if exists likes_remove on public.likes;
create policy likes_remove on public.likes for delete to authenticated using (uid = auth.uid());

drop policy if exists reports_add on public.reports;
create policy reports_add on public.reports for insert to authenticated
  with check (uid = auth.uid() and exists (select 1 from public.films f where f.id = film and f.status = 'approved'));
drop policy if exists reports_admin on public.reports;
create policy reports_admin on public.reports for select to authenticated using (public.is_admin());

drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins for select to authenticated using (uid = auth.uid());

-- ---------- 상영관 목록(순위) ----------
-- sort: 'new' 새 작품 · 'week' 이번 주 좋아요 · 'all' 전체 좋아요
create or replace function public.theater_list(sort text default 'new', lim int default 60)
returns table (id uuid, title text, nick text, video text, poster text, secs real, likes int, week int, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select f.id, f.title, f.nick, f.video, f.poster, f.secs, f.likes,
         coalesce(w.n, 0)::int as week, f.approved_at as created_at
  from public.films f
  left join (select film, count(*) n from public.likes where created_at > now() - interval '7 days' group by film) w on w.film = f.id
  where f.status = 'approved'
  order by case when sort = 'week' then coalesce(w.n, 0) end desc nulls last,
           case when sort = 'all' then f.likes end desc nulls last,
           f.approved_at desc
  limit least(greatest(lim, 1), 100)
$$;
revoke all on function public.theater_list(text, int) from public;
grant execute on function public.theater_list(text, int) to anon, authenticated;

-- ---------- 저장소(영상·포스터) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('films', 'films', false, 31457280, array['video/mp4', 'video/webm', 'image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists films_obj_add on storage.objects;
create policy films_obj_add on storage.objects for insert to authenticated
  with check (bucket_id = 'films' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists films_obj_read on storage.objects;
create policy films_obj_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'films' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or exists (select 1 from public.films f where f.status = 'approved' and (f.video = name or f.poster = name))));
drop policy if exists films_obj_remove on storage.objects;
create policy films_obj_remove on storage.objects for delete to authenticated
  using (bucket_id = 'films' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ---------- 관리자 등록 ----------
-- Authentication › Users 에서 관리자 이메일 사용자를 만든 뒤, 그 이메일로 한 번 실행하세요:
-- insert into public.admins (uid) select id from auth.users where email = '관리자@이메일' on conflict do nothing;
