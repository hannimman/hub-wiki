-- 달리기 경주 베팅 정산 (Phase E)
-- 서버가 시드를 쥐고 등수를 계산한 뒤, 이 RPC 로 원자 정산한다:
--   · 1회 판돈/잔액/일일 한도(횟수·합계) 검증 (KST 기준)
--   · 판돈 차감 + 이력(race_bet, 음수)
--   · 적중(1·2·3등) 시 배당 지급 + 이력(race_win, 양수)
-- 별도 테이블 없이 point_transactions 원장만으로 한도를 집계한다.
-- ref 에는 사람이 읽을 텍스트("강성현" / "강성현 1위 적중")가 그대로 들어간다.
-- 반환: 'ok' | 'invalid' | 'insufficient' | 'limit_count' | 'limit_total'

create or replace function settle_race_bet(
  p_user uuid,
  p_stake int,
  p_payout int,
  p_bet_ref text,
  p_win_ref text,
  p_max_stake int,
  p_daily_count int,
  p_daily_total int
) returns text language plpgsql as $$
declare
  bal int;
  v_count int;
  v_sum int;
  v_day_start timestamptz;
begin
  if p_stake is null or p_stake <= 0 or p_stake > p_max_stake then
    return 'invalid';
  end if;

  -- 잔액 행 잠금
  select points into bal from public.users where id = p_user for update;
  if bal is null or bal < p_stake then
    return 'insufficient';
  end if;

  -- 오늘(KST 자정 이후) 베팅 횟수·합계
  v_day_start := ((now() at time zone 'Asia/Seoul')::date)::timestamp at time zone 'Asia/Seoul';
  select count(*), coalesce(sum(-amount), 0)
    into v_count, v_sum
  from public.point_transactions
  where user_id = p_user
    and reason = 'race_bet'
    and created_at >= v_day_start;

  if v_count >= p_daily_count then
    return 'limit_count';
  end if;
  if v_sum + p_stake > p_daily_total then
    return 'limit_total';
  end if;

  -- 판돈 차감 + 베팅 이력
  update public.users set points = points - p_stake where id = p_user;
  insert into public.point_transactions(user_id, amount, reason, ref)
    values (p_user, -p_stake, 'race_bet', p_bet_ref);

  -- 적중 시 배당 지급 + 배당 이력
  -- created_at 을 1ms 뒤로 두어 "베팅 → 배당" 시간순이 유지되게(이력 최신순에서 배당이 위).
  if p_payout > 0 then
    update public.users set points = points + p_payout where id = p_user;
    insert into public.point_transactions(user_id, amount, reason, ref, created_at)
      values (p_user, p_payout, 'race_win', p_win_ref, now() + interval '1 millisecond');
  end if;

  return 'ok';
end; $$;
