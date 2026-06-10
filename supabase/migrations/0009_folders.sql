-- 폴더(컨테이너) 표시 (Phase 5.1)
-- is_folder=true 인 pages 행은 "폴더": 본문/리비전(current_revision_id)·평가 없이
-- 하위 문서/폴더를 담는 컨테이너로만 동작한다. 문서는 is_folder=false.
alter table pages
  add column if not exists is_folder boolean not null default false;

-- 트리 조회·자식 카운트 가속용 인덱스(부모 기준).
create index if not exists pages_parent_id_idx on pages (parent_id) where is_deleted = false;
