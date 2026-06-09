-- 본문 전문 검색 (Phase 3.6)
-- 제목 + 현재 리비전 본문을 함께 검색. 삭제된 문서 제외.
create or replace function public.search_pages(q text)
returns table (id uuid, slug text, title text, updated_at timestamptz)
language sql
stable
as $$
  select p.id, p.slug, p.title, p.updated_at
  from public.pages p
  left join public.page_revisions r on r.id = p.current_revision_id
  where p.is_deleted = false
    and (p.title ilike '%' || q || '%' or r.content ilike '%' || q || '%')
  order by p.updated_at desc
  limit 500;
$$;
