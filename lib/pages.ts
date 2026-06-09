import { randomBytes } from "crypto";
import { getAdminDb } from "./db";
import { AuthError } from "./auth";
import type { AvatarConfig } from "./avatars";

// 위키 문서 서버 로직. 모두 service_role 키(getAdminDb)로 동작.
// 조회는 로그인 사용자, 쓰기는 호출 API가 requireUser()로 인증 강제 후 사용.

export type PageListItem = {
  id: string;
  slug: string;
  title: string;
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
  summary: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
  author_config: AvatarConfig | null;
};

export type RecentChange = {
  revision_id: string;
  slug: string;
  page_title: string;
  summary: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
  author_config: AvatarConfig | null;
};

function genSlug(): string {
  return randomBytes(6).toString("base64url");
}
function nowIso(): string {
  return new Date().toISOString();
}

// 목록 + 검색(제목 + 본문). 검색어 있으면 RPC(search_pages) 사용.
export async function listPages(query?: string): Promise<PageListItem[]> {
  const db = getAdminDb();
  const term = query?.trim();

  if (term) {
    const { data, error } = await db.rpc("search_pages", { q: term });
    if (error) throw new Error("검색 실패: " + error.message);
    return (data ?? []) as PageListItem[];
  }

  const { data, error } = await db
    .from("pages")
    .select("id, slug, title, updated_at")
    .eq("is_deleted", false)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("문서 목록 조회 실패: " + error.message);
  return (data ?? []) as PageListItem[];
}

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

export async function getPageId(pageId: string) {
  const db = getAdminDb();
  const { data } = await db
    .from("pages")
    .select("id, slug, is_deleted, current_revision_id")
    .eq("id", pageId)
    .maybeSingle();
  if (!data || data.is_deleted) return null;
  return data;
}

// 모든 문서의 제목→slug 매핑 (내부 링크 [[제목]] 해석용)
export async function getTitleSlugMap(): Promise<Record<string, string>> {
  const db = getAdminDb();
  const { data } = await db
    .from("pages")
    .select("slug, title")
    .eq("is_deleted", false)
    .limit(2000);
  const map: Record<string, string> = {};
  for (const p of data ?? []) map[(p as any).title] = (p as any).slug;
  return map;
}

export async function createPage(
  authorId: string,
  title: string,
  content: string,
  summary: string,
  parentId?: string | null
): Promise<string> {
  const db = getAdminDb();
  const slug = genSlug();

  const { data: page, error } = await db
    .from("pages")
    .insert({ slug, title, parent_id: parentId ?? null, created_by: authorId })
    .select("id, slug")
    .single();
  if (error || !page) throw new Error("문서 생성 실패: " + (error?.message ?? ""));

  const { data: rev, error: revErr } = await db
    .from("page_revisions")
    .insert({ page_id: page.id, title, content, summary, author_id: authorId })
    .select("id")
    .single();
  if (revErr || !rev) throw new Error("리비전 생성 실패: " + (revErr?.message ?? ""));

  await db
    .from("pages")
    .update({ current_revision_id: rev.id, updated_at: nowIso() })
    .eq("id", page.id);

  return page.slug;
}

// 수정: 효율적 버전관리
//  - 편집충돌 감지: baseRevisionId 가 현재 current_revision_id 와 다르면 409.
//  - no-op 스킵: 제목/본문이 현재와 동일하면 새 리비전을 만들지 않음.
export async function updatePage(
  authorId: string,
  pageId: string,
  title: string,
  content: string,
  summary: string,
  baseRevisionId?: string | null
): Promise<{ changed: boolean }> {
  const db = getAdminDb();

  const { data: page } = await db
    .from("pages")
    .select("current_revision_id")
    .eq("id", pageId)
    .maybeSingle();
  if (!page) throw new AuthError("문서를 찾을 수 없습니다.", 404);

  if (
    baseRevisionId &&
    page.current_revision_id &&
    baseRevisionId !== page.current_revision_id
  ) {
    throw new AuthError(
      "다른 사람이 먼저 이 문서를 수정했어요. 새로고침 후 다시 시도해주세요.",
      409
    );
  }

  if (page.current_revision_id) {
    const { data: cur } = await db
      .from("page_revisions")
      .select("title, content")
      .eq("id", page.current_revision_id)
      .maybeSingle();
    if (cur && cur.title === title && cur.content === content) {
      return { changed: false }; // 변경 없음 → 새 버전 안 만듦
    }
  }

  const { data: rev, error } = await db
    .from("page_revisions")
    .insert({ page_id: pageId, title, content, summary, author_id: authorId })
    .select("id")
    .single();
  if (error || !rev) throw new Error("수정 실패: " + (error?.message ?? ""));

  await db
    .from("pages")
    .update({ title, current_revision_id: rev.id, updated_at: nowIso() })
    .eq("id", pageId);

  return { changed: true };
}

export async function softDeletePage(userId: string, pageId: string): Promise<void> {
  const db = getAdminDb();
  const { error } = await db
    .from("pages")
    .update({ is_deleted: true, deleted_at: nowIso(), deleted_by: userId })
    .eq("id", pageId);
  if (error) throw new Error("삭제 실패: " + error.message);
}

export async function listRevisions(pageId: string): Promise<RevisionItem[]> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("page_revisions")
    .select(
      "id, title, summary, created_at, users:author_id (display_name, avatar, avatar_config)"
    )
    .eq("page_id", pageId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("이력 조회 실패: " + error.message);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    summary: r.summary ?? "",
    created_at: r.created_at,
    author_name: r.users?.display_name ?? null,
    author_avatar: r.users?.avatar ?? null,
    author_config: r.users?.avatar_config ?? null,
  }));
}

// 최근 변경 (전체 위키)
export async function listRecentChanges(): Promise<RecentChange[]> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("page_revisions")
    .select(
      "id, summary, created_at, pages:page_id (slug, title, is_deleted), users:author_id (display_name, avatar, avatar_config)"
    )
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error("최근 변경 조회 실패: " + error.message);

  return (data ?? [])
    .filter((r: any) => r.pages && !r.pages.is_deleted)
    .map((r: any) => ({
      revision_id: r.id,
      slug: r.pages.slug,
      page_title: r.pages.title,
      summary: r.summary ?? "",
      created_at: r.created_at,
      author_name: r.users?.display_name ?? null,
      author_avatar: r.users?.avatar ?? null,
      author_config: r.users?.avatar_config ?? null,
    }));
}

export async function getRevision(pageId: string, revisionId: string) {
  const db = getAdminDb();
  const { data } = await db
    .from("page_revisions")
    .select("id, title, content, summary, created_at")
    .eq("id", revisionId)
    .eq("page_id", pageId)
    .maybeSingle();
  return data ?? null;
}

// diff 보기용: 해당 리비전 + 직전 리비전
export async function getRevisionForDiff(pageId: string, revisionId: string) {
  const db = getAdminDb();
  const { data: cur } = await db
    .from("page_revisions")
    .select("id, title, content, summary, created_at")
    .eq("id", revisionId)
    .eq("page_id", pageId)
    .maybeSingle();
  if (!cur) return null;

  const { data: prev } = await db
    .from("page_revisions")
    .select("id, title, content, created_at")
    .eq("page_id", pageId)
    .lt("created_at", cur.created_at)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { cur, prev: prev ?? null };
}

// 복원: 과거 리비전 내용을 새 리비전으로 (충돌검사 없이 강제)
export async function restoreRevision(
  userId: string,
  pageId: string,
  revisionId: string
): Promise<void> {
  const rev = await getRevision(pageId, revisionId);
  if (!rev) throw new AuthError("복원할 리비전을 찾을 수 없습니다.", 404);
  await updatePage(userId, pageId, rev.title, rev.content, "이전 버전 복원", null);
}
