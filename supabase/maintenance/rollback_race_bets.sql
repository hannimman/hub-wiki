-- 🎲 달리기 베팅 테스트 되돌리기 (로컬 테스트 후 흔적 제거)
--
-- 베팅으로 쓴 판돈(race_bet, 음수)과 받은 배당(race_win, 양수)의 순효과만큼
-- 각 사용자의 포인트를 원래대로 되돌리고, 베팅 이력 2종을 모두 삭제한다.
-- → "베팅을 한 번도 안 한 상태"로 정확히 복구된다. 언제든 다시 테스트 가능.
--
-- ⚠️ 베팅 기록만 지운다. 다른 포인트(출석/적립/선물/가챠 등)는 건드리지 않는다.

begin;

-- 1) 베팅으로 변동된 포인트 원복
--    (race_bet + race_win amount 합 = 베팅 순변동. 그만큼 빼면 베팅 전 잔액)
update public.users u
set points = u.points - coalesce((
  select sum(t.amount)
  from public.point_transactions t
  where t.user_id = u.id
    and t.reason in ('race_bet', 'race_win')
), 0)
where exists (
  select 1 from public.point_transactions t
  where t.user_id = u.id
    and t.reason in ('race_bet', 'race_win')
);

-- 2) 베팅 이력 삭제 (판돈·배당 기록)
delete from public.point_transactions
where reason in ('race_bet', 'race_win');

commit;

-- 확인용: 남은 베팅 이력이 0 이어야 정상
-- select count(*) from public.point_transactions where reason in ('race_bet','race_win');
