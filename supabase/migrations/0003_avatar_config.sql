-- 아바타 커스터마이징 설정 저장 (Phase 3.5)
-- 프리셋(기본 8종)을 고르면 avatar = 프리셋id, avatar_config = null.
-- "더보기"로 커스텀하면 avatar = 'custom', avatar_config = {헤어/머리색/옷색/피부/악세서리/배경} JSON.

alter table public.users
  add column if not exists avatar_config jsonb;
