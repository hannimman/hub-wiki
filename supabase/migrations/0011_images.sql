-- 위키 이미지 첨부용 private 버킷.
-- 모든 접근은 서버(service_role)가 /api/files 프록시로만 수행한다
-- (망분리 PC는 supabase.co 직접 접근 불가 → 브라우저는 Netlify만 본다).
insert into storage.buckets (id, name, public)
values ('wiki-images', 'wiki-images', false)
on conflict (id) do nothing;
