-- 포인트 선물 + 알림 (Phase B)
-- 선물: 원자 RPC(잔액 검증·차감·지급·이력 2건). 알림: 수신자가 다음 페이지
-- 이동/새로고침 때 모달로 확인하는 일반화된 알림함(이후 다른 유형도 재사용).

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,              -- 'gift' 등
  payload jsonb,                   -- gift: { from_name, amount, memo }
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_unread_idx
  on public.notifications(user_id) where read_at is null;

-- 선물 RPC — 행 잠금으로 잔액 검증과 차감을 원자 처리.
-- 반환: 'ok' | 'invalid' | 'self' | 'insufficient'
create or replace function gift_points(
  p_from uuid, p_to uuid, p_amount int
) returns text language plpgsql as $$
declare bal int;
begin
  if p_amount is null or p_amount <= 0 then return 'invalid'; end if;
  if p_from = p_to then return 'self'; end if;

  select points into bal from public.users where id = p_from for update;
  if bal is null or bal < p_amount then return 'insufficient'; end if;

  update public.users set points = points - p_amount where id = p_from;
  update public.users set points = points + p_amount where id = p_to;
  insert into public.point_transactions (user_id, amount, reason, ref) values
    (p_from, -p_amount, 'gift_sent', p_to::text),
    (p_to,  p_amount,  'gift_received', p_from::text);
  return 'ok';
end; $$;
