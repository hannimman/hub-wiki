-- 가챠 (Phase D) — buy_item 과 동일한 원자 구조, 이력 reason 만 'gacha'.
-- 대상 아이템은 서버가 풀(활성·미보유)에서 가중 추첨해 p_item 으로 전달한다.
create or replace function gacha_pull(p_user uuid, p_item text, p_cost int)
returns text language plpgsql as $$
declare bal int;
begin
  if exists (select 1 from public.owned_items where user_id = p_user and item_key = p_item) then
    return 'owned';
  end if;
  select points into bal from public.users where id = p_user for update;
  if bal is null or bal < p_cost then
    return 'insufficient';
  end if;
  insert into public.owned_items(user_id, item_key) values (p_user, p_item);
  perform award_points(p_user, -p_cost, 'gacha', p_item);
  return 'ok';
end; $$;
