-- 사용자 아바타 칸 추가 (Phase 2 준비)
-- 가입(온보딩) 시 고른 아바타 id(예: "f1", "m2")를 저장한다.
-- 0001을 이미 실행했어도 안전하게 컬럼만 추가.

alter table public.users
  add column if not exists avatar text not null default 'm1';
