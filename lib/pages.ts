import { randomBytes } from "crypto";
import { getAdminDb } from "./db";

// 위키 문서 서버 로직. 모두 service_role 키(getAdminDb)로 동작.
// 조회는 공개, 쓰기(create/update/delete/restore)는 호출하는 API 라우트가
// requireUser()로 인증을 강제한 뒤에만 사용한다.

export type PageListItem = {
  id: string;
  slug: string;
  title: string;
  parent_id: string | null;
  updated_at: string;
};

export type PageDetail = {
  id: string;
  slug: string;
  title: string;
  parent_id: string | null;
  current_revision_id: string | null;
  created_by: string | null;
  updated_at: string;
  content: string;
};

export type RevisionItem = {
  id: string;
  title: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
};

function genSlug(): string {
  return randomBytes(6).toString("base64url"); // 약 8자 URL-safe
}

function nowIso(): string {
  return new Date().toISOString();
}

// 목록 (+ 제목 검색). 삭제된 문서 제외.
export async function listPages(query?: string): Promise<PageListItem[]> {
  const db = getAdminDb();
  let q = db
    .from("pages")
    .select("id, slug, title, parent_id, updated_at")
    .eq("is_deleted", false)
    .order("updated_at", { ascending: false })
    .limit(500);

  const term = query?.trim();
  if (term) q = q.ilike("title", `%${term}%`);

  const { data, error } = await q;
  if (error) throw new Error("문서 목록 조회 실패: " + error.message);
  return (data ?? []) as PageListItem[];
}

// slug로 문서 + 현재 본문
export async function getPageBySlug(slug: string): Promise<PageDetail | null> {
  const db = getAdminDb();
  const { data: page } = await db
    .from("pages")
    .select(
      "id, slug, title, parent_id, current_revision_id, created_by, is_deleted, updated_at"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!page || page.is_deleted) return null;

  let content = "";
  if (page.current_revision_id) {
    const { data: rev } = await db
      .from("page_revisions")
      .select("content")
      .eq("id", page.current_revision_id)
      .maybeSingle();
    content = rev?.content ?? "";
  }

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    parent_id: page.parent_id,
    current_revision_id: page.current_revision_id,
    created_by: page.created_by,
    updated_at: page.updated_at,
    content,
  };
}

// 문서 ID로 메타 조회 (수정/삭제 전 존재 확인용)
export async function getPageId(pageId: string) {
  const db = getAdminDb();
  const { data } = await db
    .from("pages")
    .select("id, slug, is_deleted")
    .eq("id", pageId)
    .maybeSingle();
  if (!data || data.is_deleted) return null;
  return data;
}

// 생성: 페이지 + 첫 리비전. slug 반환.
export async function createPage(
  authorId: string,
  title: string,
  content: string,
  parentId?: string | null
): Promise<string> {
  const db = getAdminDb();
  const slug = genSlug();

  const { data: page, error } = await db
    .from("pages")
    .insert({
      slug,
      title,
      parent_id: parentId ?? null,
      created_by: authorId,
    })
    .select("id, slug")
    .single();
  if (error || !page) throw new Error("문서 생성 실패: " + (error?.message ?? ""));

  const { data: rev, error: revErr } = await db
    .from("page_revisions")
    .insert({ page_id: page.id, title, content, author_id: authorId })
    .select("id")
    .single();
  if (revErr || !rev) throw new Error("리비전 생성 실패: " + (revErr?.message ?? ""));

  await db
    .from("pages")
    .update({ current_revision_id: rev.id, updated_at: nowIso() })
    .eq("id", page.id);

  return page.slug;
}

// 수정: 새 리비전 추가 + 현재 리비전 갱신
export async function updatePage(
  authorId: string,
  pageId: string,
  title: string,
  content: string
): Promise<void> {
  const db = getAdminDb();
  const { data: rev, error } = await db
    .from("page_revisions")
    .insert({ page_id: pageId, title, content, author_id: authorId })
    .select("id")
    .single();
  if (error || !rev) throw new Error("수정 실패: " + (error?.message ?? ""));

  await db
    .from("pages")
    .update({ title, current_revision_id: rev.id, updated_at: nowIso() })
    .eq("id", pageId);
}

// 소프트 삭제 (이력 보존)
export async function softDeletePage(
  userId: string,
  pageId: string
): Promise<void> {
  const db = getAdminDb();
  const { error } = await db
    .from("pages")
    .update({ is_deleted: true, deleted_at: nowIso(), deleted_by: userId })
    .eq("id", pageId);
  if (error) throw new Error("삭제 실패: " + error.message);
}

// 수정 이력 목록 (작성자 정보 포함)
export async function listRevisions(pageId: string): Promise<RevisionItem[]> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("page_revisions")
    .select("id, title, created_at, users:author_id (display_name, avatar)")
    .eq("page_id", pageId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("이력 조회 실패: " + error.message);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    created_at: r.created_at,
    author_name: r.users?.display_name ?? null,
    author_avatar: r.users?.avatar ?? null,
  }));
}

// 특정 리비전 본문
export async function getRevision(pageId: string, revisionId: string) {
  const db = getAdminDb();
  const { data } = await db
    .from("page_revisions")
    .select("id, title, content, created_at")
    .eq("id", revisionId)
    .eq("page_id", pageId)
    .maybeSingle();
  return data ?? null;
}

// 복원: 과거 리비전 내용을 새 리비전으로 복사하고 현재로 설정 (이력은 선형 유지)
export async function restoreRevision(
  userId: string,
  pageId: string,
  revisionId: string
): Promise<void> {
  const rev = await getRevision(pageId, revisionId);
  if (!rev) throw new Error("복원할 리비전을 찾을 수 없습니다.");
  await updatePage(userId, pageId, rev.title, rev.content);
}
