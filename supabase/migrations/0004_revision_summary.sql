-- 변경 요약(edit summary) — 각 수정의 의도를 히스토리에서 확인 (Phase 3.6)
alter table public.page_revisions
  add column if not exists summary text not null default '';
