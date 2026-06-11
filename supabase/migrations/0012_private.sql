-- 비공개 글 (작성자 전용 전환).
-- 비공개면 모든 리스트(트리/검색/최근변경/폴더/내부링크/통계)에서 숨고,
-- 본문도 작성자 외에는 볼 수 없다. 해제하면 즉시 모든 곳에 다시 보인다.
alter table public.pages
  add column if not exists is_private boolean not null default false;
