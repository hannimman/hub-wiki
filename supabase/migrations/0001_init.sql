-- hub-wiki 초기 스키마 (Phase 1)
-- 설계 원칙(보안):
--   * 모든 테이블 RLS 활성화 + 공개 정책 0개
--     → publishable/anon 키로는 직접 접근 불가. 혹시 supabase.co가 뚫려도 차단(방어 심화).
--   * 실제 접근은 전부 서버(Next.js)에서 service_role 키로만 수행.
--   * "조회 공개 / 쓰기는 인증된 활성 멤버만"은 서버 코드가 강제한다(RLS가 아니라).

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ──────────────────────────────────────────────
-- 사용자
-- ──────────────────────────────────────────────
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,                 -- 로그인 ID (서버에서 소문자 정규화)
  display_name  text not null,                        -- 표시 이름
  password_hash text not null,                        -- bcrypt 해시 (평문 저장 절대 금지)
  role          text not null default 'member' check (role in ('admin','member')),
  is_active     boolean not null default true,        -- 비활성화 플래그
  invited_by    uuid references public.users(id),
  created_at    timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 초대 (1회용 + 유효기간)
-- ──────────────────────────────────────────────
create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  token       text unique not null default gen_random_uuid()::text, -- 추측 불가능한 초대 토큰
  role        text not null default 'member' check (role in ('admin','member')),
  email       text,                                   -- 선택: 특정 이메일 대상 메모
  created_by  uuid references public.users(id),       -- 누가 발급(부트스트랩은 null)
  expires_at  timestamptz not null,                   -- 유효기간
  used_at     timestamptz,                            -- 사용 시각(1회용: null이어야 사용 가능)
  used_by     uuid references public.users(id),
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 문서
-- ──────────────────────────────────────────────
create table if not exists public.pages (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,           -- URL 경로
  title               text not null,
  parent_id           uuid references public.pages(id), -- 트리(폴더) 구조
  current_revision_id uuid,                           -- 현재 표시 중인 리비전 (아래에서 FK 연결)
  created_by          uuid references public.users(id),
  is_deleted          boolean not null default false, -- 소프트 삭제(이력 보존)
  deleted_at          timestamptz,
  deleted_by          uuid references public.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 수정 이력 (작성자 기록)
-- ──────────────────────────────────────────────
create table if not exists public.page_revisions (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.pages(id) on delete cascade,
  title      text not null,
  content    text not null default '',                -- Markdown 본문
  author_id  uuid references public.users(id),        -- 누가 작성/수정
  created_at timestamptz not null default now()
);

-- pages.current_revision_id → page_revisions(id) FK (테이블 생성 후 연결)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pages_current_revision_fk'
  ) then
    alter table public.pages
      add constraint pages_current_revision_fk
      foreign key (current_revision_id) references public.page_revisions(id);
  end if;
end $$;

-- 인덱스
create index if not exists idx_pages_parent     on public.pages(parent_id);
create index if not exists idx_pages_slug        on public.pages(slug);
create index if not exists idx_revisions_page    on public.page_revisions(page_id, created_at desc);
create index if not exists idx_users_username    on public.users(username);
create index if not exists idx_invites_token     on public.invites(token);

-- RLS 활성화 (정책은 추가하지 않음 = 직접 접근 전면 차단)
alter table public.users          enable row level security;
alter table public.invites        enable row level security;
alter table public.pages          enable row level security;
alter table public.page_revisions enable row level security;

-- ──────────────────────────────────────────────
-- 최초 관리자 부트스트랩 초대 (1회용, 30일 유효)
-- 이 토큰으로 가입하면 첫 관리자가 됩니다. 가입 후 자동으로 used 처리됨.
-- ──────────────────────────────────────────────
insert into public.invites (role, expires_at)
values ('admin', now() + interval '30 days');

-- 실행 후 아래 쿼리로 부트스트랩 토큰을 확인하세요:
--   select token, role, expires_at from public.invites where used_at is null;
