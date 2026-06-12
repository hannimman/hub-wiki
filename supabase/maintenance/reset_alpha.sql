-- ⚠️ 알파 테스트 전체 초기화 (되돌릴 수 없음 — 실행 전 확인!)
--
-- 남기는 것:
--   * 슈퍼유저 계정 (role = 'super') — 잔액은 "설정된 가입 포인트"로 세팅 + 이력 기록
--   * app_settings 의 point_config (항목별 지급 포인트 설정)
-- 지우는 것:
--   * 슈퍼 외 모든 회원, 문서/폴더/리비전/평가 전부(휴지통 포함)
--   * 포인트 이력, 출석, 보유 아이템, 초대, 알림
--   * 아이템 오버라이드/커스텀(shop_items) — 남기고 싶으면 해당 줄을 주석 처리
--   * point_config 외 설정, 업로드 이미지 전부

begin;

-- 0) 자기참조 FK 해제 (삭제 순서 문제 방지)
update public.users set invited_by = null;
update public.pages set current_revision_id = null, parent_id = null;

-- 1) 문서 트리 (리비전·평가는 cascade 지만 명시 삭제)
delete from public.ratings;
delete from public.page_revisions;
delete from public.pages;

-- 2) 포인트·출석·보유 아이템·알림 (users cascade 로도 지워지지만 슈퍼 것까지 포함해 전체 삭제)
delete from public.point_transactions;
delete from public.attendance;
delete from public.owned_items;
delete from public.notifications;

-- 3) 초대 내역
delete from public.invites;

-- 4) 아이템 설정 — 남기고 싶으면 이 줄을 주석 처리
delete from public.shop_items;

-- 5) 설정 — 항목별 지급 포인트(point_config)만 남김
delete from public.app_settings where key <> 'point_config';

-- 6) 슈퍼 외 모든 회원 삭제
delete from public.users where role <> 'super';

-- 7) 슈퍼유저 정리 — 잔액 = 설정된 가입 포인트, 장착 해제(얼굴 유지), 한마디 초기화
update public.users set
  points = coalesce(
    (select (value->>'signup')::int from public.app_settings where key = 'point_config'),
    1000
  ),
  status_message = null,
  needs_password_reset = false,
  avatar_config = case
    when avatar_config ? 'face'
      then jsonb_build_object('v', 2, 'face', avatar_config->'face', 'equipped', '{}'::jsonb)
    else avatar_config
  end
where role = 'super';

-- 8) 가입 보너스 이력 기록 (잔액과 원장이 맞도록)
insert into public.point_transactions (user_id, amount, reason)
select id,
       coalesce(
         (select (value->>'signup')::int from public.app_settings where key = 'point_config'),
         1000
       ),
       'signup'
from public.users where role = 'super';

commit;

-- 9) 업로드 이미지는 SQL 로 못 지운다 (storage.protect_delete 트리거가 차단).
--    둘 중 하나로 비우면 됨:
--    a. Supabase 대시보드 → Storage → wiki-images → 전체 선택 → Delete
--    b. Claude 에게 "스토리지 비워줘" 요청 (Storage API 스크립트로 처리)
