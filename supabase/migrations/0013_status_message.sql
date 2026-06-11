-- 오늘의 한마디 — 루트 팀 마을에서 내 아바타가 말풍선으로 말하는 상태 메시지.
-- 길이 제한(50자)·정리는 앱에서 처리. null/빈값이면 기본 인사말 사용.
alter table public.users
  add column if not exists status_message text;
