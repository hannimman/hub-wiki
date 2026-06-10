-- 포인트 시스템 (Phase 6)
-- 적립: 출석(1일1회), 문서 작성/수정, 평가 활동, (향후 확장 가능). 사용: 아바타 상점(해금형).
-- 핵심: award_points 는 reason 문자열만 바꾸면 어떤 출처든 적립/차감 가능(유연). 모든 변동은 원장에 남는다.

alter table users add column if not exists points integer not null default 0;

-- 포인트 원장(획득/사용 이력 — 그대로 이력 화면 데이터로 사용)
create table if not exists point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount integer not null,            -- 획득 +, 사용 -
  reason text not null,               -- attendance | new_doc | edit | rating_received | rating_given | buy | (향후 추가)
  ref text,                           -- 관련 식별자(문서/날짜/아이템키 등)
  created_at timestamptz not null default now()
);
create index if not exists point_tx_user_idx on point_transactions(user_id, created_at desc);

-- 출석: (user, KST 날짜) 유일 → 하루 1회만
create table if not exists attendance (
  user_id uuid not null references users(id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- 해금(영구 소유) 아이템
create table if not exists owned_items (
  user_id uuid not null references users(id) on delete cascade,
  item_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

alter table point_transactions enable row level security;
alter table attendance enable row level security;
alter table owned_items enable row level security;

-- 적립/차감(원자적): 원장 기록 + 잔액 갱신, 새 잔액 반환. reason 자유 → 어떤 출처든 재사용.
create or replace function award_points(p_user uuid, p_amount int, p_reason text, p_ref text default null)
returns integer language plpgsql as $$
declare new_balance int;
begin
  insert into point_transactions(user_id, amount, reason, ref)
    values (p_user, p_amount, p_reason, p_ref);
  update users set points = points + p_amount where id = p_user
    returning points into new_balance;
  return new_balance;
end; $$;

-- 출석(원자적, 1일1회): 오늘(KST) 첫 출석이면 적립. 반환: 적립 포인트(0이면 이미 출석함)
create or replace function check_in(p_user uuid, p_amount int)
returns integer language plpgsql as $$
declare today date := (now() at time zone 'Asia/Seoul')::date;
declare n int;
begin
  insert into attendance(user_id, day) values (p_user, today)
    on conflict (user_id, day) do nothing;
  get diagnostics n = row_count;
  if n > 0 then
    perform award_points(p_user, p_amount, 'attendance', today::text);
    return p_amount;
  end if;
  return 0;
end; $$;

-- 아이템 구매(원자적): 미보유 && 잔액충분이면 차감+보유등록. 반환: 'ok' | 'owned' | 'insufficient'
create or replace function buy_item(p_user uuid, p_item text, p_cost int)
returns text language plpgsql as $$
declare bal int;
begin
  if exists (select 1 from owned_items where user_id = p_user and item_key = p_item) then
    return 'owned';
  end if;
  select points into bal from users where id = p_user for update;
  if bal is null or bal < p_cost then
    return 'insufficient';
  end if;
  insert into owned_items(user_id, item_key) values (p_user, p_item);
  perform award_points(p_user, -p_cost, 'buy', p_item);
  return 'ok';
end; $$;
