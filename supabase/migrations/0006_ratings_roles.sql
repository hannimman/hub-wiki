-- 평가 점수 시스템 + 역할 체계(super/admin/member) (Phase 4)

-- 1) 사용자: 역할 'super' 허용 + 평가/열람 권한 플래그
alter table public.users
  add column if not exists can_rate boolean not null default false;
alter table public.users
  add column if not exists can_view_scores boolean not null default false;

alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check check (role in ('super', 'admin', 'member'));

-- 2) 부트스트랩 관리자(초대받지 않고 가입한 최초 유저)를 슈퍼유저로 승격
update public.users
set role = 'super', can_rate = true, can_view_scores = true
where invited_by is null;

-- 3) 평가(점수) 테이블 — 글당 사용자별 1회, 0~100 10점단위, 수정 불가
create table if not exists public.ratings (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.pages(id) on delete cascade,
  rater_id   uuid not null references public.users(id) on delete cascade,
  score      int  not null check (score >= 0 and score <= 100 and score % 10 = 0),
  created_at timestamptz not null default now(),
  unique (page_id, rater_id)
);
alter table public.ratings enable row level security;
create index if not exists idx_ratings_page on public.ratings(page_id);

-- 수정 불가 보장: ratings UPDATE 차단 트리거 (DB 레벨 안전장치)
create or replace function public.prevent_rating_update()
returns trigger language plpgsql as $$
begin
  raise exception 'ratings are immutable';
end;
$$;
drop trigger if exists ratings_no_update on public.ratings;
create trigger ratings_no_update
  before update on public.ratings
  for each row execute function public.prevent_rating_update();

-- 4) 앱 설정(슈퍼 제어) — key/value. 점수제도 on/off 등
create table if not exists public.app_settings (
  key   text primary key,
  value jsonb not null
);
alter table public.app_settings enable row level security;
insert into public.app_settings (key, value)
values ('ratings_enabled', 'false'::jsonb)
on conflict (key) do nothing;
