-- ⚠️ 전체 데이터 초기화 (되돌릴 수 없음 — 실행 전 확인!)
--
-- 남기는 것:
--   * users 계정 전원 (아이디/비밀번호/역할/평가권한/아바타 얼굴)
--   * app_settings 의 point_config (항목별 지급 포인트 설정)
-- 지우는 것:
--   * 문서/폴더/리비전/평가 전부 (휴지통 포함)
--   * 포인트 이력·잔액, 출석, 보유 아이템 (장착 아이템도 해제)
--   * 초대 내역, point_config 외 설정(평가 제도 on/off 등 → 기본값으로)
--   * 업로드 이미지(wiki-images 버킷) 전부

begin;

-- 1) 문서 트리 — FK 참조 해제 후 삭제 (리비전·평가는 cascade 지만 명시 삭제)
update public.pages set current_revision_id = null, parent_id = null;
delete from public.ratings;
delete from public.page_revisions;
delete from public.pages;

-- 2) 포인트·출석·보유 아이템
delete from public.point_transactions;
delete from public.attendance;
delete from public.owned_items;

-- 3) 초대 내역 (계정은 유지되므로 기록만 정리)
delete from public.invites;

-- 4) 설정 — 항목별 지급 포인트(point_config)만 남김
delete from public.app_settings where key <> 'point_config';

-- 5) 사용자 — 계정·아바타 얼굴은 유지, 나머지 초기화
--    (보유 아이템이 사라지므로 장착도 전부 해제)
update public.users set
  points = 0,
  status_message = null,
  needs_password_reset = false,
  avatar_config = case
    when avatar_config ? 'face'
      then jsonb_build_object('v', 2, 'face', avatar_config->'face', 'equipped', '{}'::jsonb)
    else avatar_config
  end;

-- (선택) 가입 보너스를 다시 주고 싶으면 위의 points = 0 대신 아래 두 줄 사용:
-- update public.users set points = 1000 where is_active;
-- insert into public.point_transactions (user_id, amount, reason)
--   select id, 1000, 'signup' from public.users where is_active;

-- 6) 업로드 이미지 전부 삭제 (문서가 사라지므로 전부 고아가 됨)
delete from storage.objects where bucket_id = 'wiki-images';

commit;
