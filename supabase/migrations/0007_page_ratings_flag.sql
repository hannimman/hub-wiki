-- 글별 평가 허용 플래그 (Phase 4)
-- 슈퍼가 점수제도를 켠 상태에서, 작성자가 글마다 평가 사용 여부를 선택.
-- 평가 위젯은 (글로벌 ratings_enabled) AND (pages.ratings_enabled) 일 때만 표시.

alter table public.pages
  add column if not exists ratings_enabled boolean not null default false;
