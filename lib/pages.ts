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
  is_folder: boolean;
  current_revision_id: string | null;
  created_by: string | null;
  updated_at: string;
  content: string;
  ratings_enabled: boolean;
  is_private: boolean;
};

// 비공개 글 접근 규칙: 작성자만 볼 수 있다.
export function canViewPage(
  page: { is_private?: boolean | null; created_by?: string | null },
  viewerId: string
): boolean {
  return !page.is_private || page.created_by === viewerId;
}

export type RevisionItem = {
  id: string;
  title: string;
  summary: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
  author_config: AvatarConfig | null;
};

export type ChangeKind = "create" | "delete" | "restore" | "edit";

export type RecentChange = {
  revision_id: string;
  slug: string;
  page_title: string;
  summary: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
  author_config: AvatarConfig | null;
  kind: ChangeKind; // 최초작성/삭제/복원은 diff 가 무의미 → 목록에서 플래그로 표시
};

function genSlug(): string {
  return randomBytes(6).toString("base64url");
}
function nowIso(): string {
  return new Date().toISOString();
}

// 목록 + 검색(제목 + 본문). 검색어 있으면 RPC(search_pages) 사용.
export async function listPages(
  query?: string,
  viewerId?: string
): Promise<PageListItem[]> {
  const db = getAdminDb();
  const term = query?.trim();

  if (term) {
    const { data, error } = await db.rpc("search_pages", { q: term });
    if (error) throw new Error("검색 실패: " + error.message);
    const rows = (data ?? []) as PageListItem[];
    // 검색 RPC(0005)는 비공개를 모름 → 비공개 글은 작성자 본인에게만 노출
    if (rows.length === 0) return rows;
    const { data: privs } = await db
      .from("pages")
      .select("id, created_by")
      .in("id", rows.map((r) => r.id))
      .eq("is_private", true);
    const hidden = new Set(
      ((privs ?? []) as { id: string; created_by: string | null }[])
        .filter((p) => !viewerId || p.created_by !== viewerId)
        .map((p) => p.id)
    );
    return rows.filter((r) => !hidden.has(r.id));
  }

  let q = db
    .from("pages")
    .select("id, slug, title, updated_at")
    .eq("is_deleted", false);
  q = viewerId
    ? q.or(`is_private.eq.false,created_by.eq.${viewerId}`)
    : q.eq("is_private", false);
  const { data, error } = await q
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
      "id, slug, title, parent_id, is_folder, current_revision_id, created_by, is_deleted, is_private, updated_at, ratings_enabled"
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
    is_folder: page.is_folder ?? false,
    current_revision_id: page.current_revision_id,
    created_by: page.created_by,
    updated_at: page.updated_at,
    content,
    ratings_enabled: page.ratings_enabled ?? false,
    is_private: (page as { is_private?: boolean }).is_private ?? false,
  };
}

export async function getPageId(pageId: string) {
  const db = getAdminDb();
  const { data } = await db
    .from("pages")
    .select("id, slug, is_deleted, is_folder, current_revision_id, created_by, is_private")
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
    .eq("is_private", false) // [[링크]] 해석은 공개 글만 (비공개 제목 유출 방지)
    .limit(2000);
  const map: Record<string, string> = {};
  for (const p of data ?? []) map[(p as any).title] = (p as any).slug;
  return map;
}

// ── 폴더(페이지 트리) ─────────────────────────────
export type PageTreeNode = {
  id: string;
  slug: string;
  title: string;
  parent_id: string | null;
  is_folder: boolean;
  updated_at: string;
  is_private: boolean;
};

export type ParentOption = { id: string; label: string };

// 삭제되지 않은 전체 문서/폴더(부모정보 포함) — 트리/경로/상위선택에 공용으로 쓴다.
// viewerId 를 주면 "공개 글 + 내 비공개 글"이 보인다(본인 트리에는 🔒로 표시).
export async function listTree(viewerId?: string): Promise<PageTreeNode[]> {
  const db = getAdminDb();
  let q = db
    .from("pages")
    .select("id, slug, title, parent_id, is_folder, updated_at, is_private")
    .eq("is_deleted", false);
  q = viewerId
    ? q.or(`is_private.eq.false,created_by.eq.${viewerId}`)
    : q.eq("is_private", false);
  const { data, error } = await q
    .order("is_folder", { ascending: false })
    .order("title", { ascending: true })
    .limit(2000);
  if (error) throw new Error("문서 트리 조회 실패: " + error.message);
  return (data ?? []) as PageTreeNode[];
}

// parent_id 가 존재하는(삭제 안 된) 문서를 가리키지 않으면 최상위로 간주.
function effectiveParent(node: PageTreeNode, ids: Set<string>): string | null {
  return node.parent_id && ids.has(node.parent_id) ? node.parent_id : null;
}

// rootId 의 모든 하위(자손) id 집합 — 순환참조 방지·삭제검사용.
function descendantSet(all: PageTreeNode[], rootId: string): Set<string> {
  const childrenOf = new Map<string, string[]>();
  for (const p of all) {
    if (!p.parent_id) continue;
    if (!childrenOf.has(p.parent_id)) childrenOf.set(p.parent_id, []);
    childrenOf.get(p.parent_id)!.push(p.id);
  }
  const out = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const c of childrenOf.get(cur) ?? []) {
      if (!out.has(c)) {
        out.add(c);
        stack.push(c);
      }
    }
  }
  return out;
}

// 상위 폴더 선택 옵션(들여쓰기된 평탄 트리). excludeId 의 자기·자손은 제외(순환 방지).
export async function listParentOptions(
  excludeId?: string
): Promise<ParentOption[]> {
  const all = await listTree();
  // 상위 후보는 폴더만 (문서 안에는 넣지 않는다)
  const folders = all.filter((p) => p.is_folder);
  const ids = new Set(folders.map((p) => p.id));

  const exclude = new Set<string>();
  if (excludeId) {
    exclude.add(excludeId);
    for (const d of descendantSet(all, excludeId)) exclude.add(d);
  }

  const childrenOf = new Map<string | null, PageTreeNode[]>();
  for (const p of folders) {
    const k = effectiveParent(p, ids);
    if (!childrenOf.has(k)) childrenOf.set(k, []);
    childrenOf.get(k)!.push(p);
  }

  const out: ParentOption[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const node of childrenOf.get(parentId) ?? []) {
      if (exclude.has(node.id)) continue;
      const indent = "  ".repeat(depth);
      out.push({ id: node.id, label: `${indent}${depth > 0 ? "└ " : ""}${node.title}` });
      walk(node.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

// 경로(breadcrumb): 루트 → 부모 순서. 순환이 있어도 guard 로 안전.
export async function getAncestors(
  pageId: string
): Promise<{ slug: string; title: string }[]> {
  const all = await listTree();
  const byId = new Map(all.map((p) => [p.id, p]));
  const ids = new Set(all.map((p) => p.id));
  const chain: { slug: string; title: string }[] = [];
  const self = byId.get(pageId);
  let cur = self ? effectiveParent(self, ids) : null;
  let guard = 0;
  const seen = new Set<string>();
  while (cur && guard++ < 50 && !seen.has(cur)) {
    seen.add(cur);
    const node = byId.get(cur);
    if (!node) break;
    chain.unshift({ slug: node.slug, title: node.title });
    cur = effectiveParent(node, ids);
  }
  return chain;
}

// 하위(직속 자식) 문서 존재 여부 — 폴더 삭제 차단용.
export async function hasChildren(pageId: string): Promise<boolean> {
  const db = getAdminDb();
  const { count } = await db
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", pageId)
    .eq("is_deleted", false);
  return (count ?? 0) > 0;
}

// 폴더 생성 — 본문/리비전/평가 없이 컨테이너만 만든다. 상위는 폴더만 허용.
export async function createFolder(
  authorId: string,
  title: string,
  parentId?: string | null
): Promise<{ id: string; slug: string }> {
  const db = getAdminDb();
  const t = title.trim();
  if (t.length < 1 || t.length > 200)
    throw new AuthError("폴더 이름은 1~200자여야 합니다.", 400);

  if (parentId) {
    const { data: parent } = await db
      .from("pages")
      .select("id, is_folder, is_deleted")
      .eq("id", parentId)
      .maybeSingle();
    if (!parent || parent.is_deleted || !parent.is_folder)
      throw new AuthError("상위 폴더가 올바르지 않습니다.", 400);
  }

  const slug = genSlug();
  const { data: page, error } = await db
    .from("pages")
    .insert({
      slug,
      title: t,
      parent_id: parentId ?? null,
      created_by: authorId,
      is_folder: true,
    })
    .select("id, slug")
    .single();
  if (error || !page)
    throw new Error("폴더 생성 실패: " + (error?.message ?? ""));
  return { id: page.id, slug: page.slug };
}

// 폴더 이름변경/이동 (본문 없음). 순환·자기참조 방지, 상위는 폴더만.
export async function updateFolder(
  pageId: string,
  title?: string,
  parentId?: string | null
): Promise<void> {
  const db = getAdminDb();
  const patch: Record<string, unknown> = {};

  if (title !== undefined) {
    const t = title.trim();
    if (t.length < 1 || t.length > 200)
      throw new AuthError("폴더 이름은 1~200자여야 합니다.", 400);
    patch.title = t;
  }

  if (parentId !== undefined) {
    if (parentId === pageId)
      throw new AuthError("자기 자신을 상위로 지정할 수 없습니다.", 400);
    if (parentId) {
      const all = await listTree();
      if (descendantSet(all, pageId).has(parentId))
        throw new AuthError("하위 폴더를 상위로 지정할 수 없습니다.", 400);
      const parent = all.find((p) => p.id === parentId);
      if (!parent || !parent.is_folder)
        throw new AuthError("상위 폴더가 올바르지 않습니다.", 400);
    }
    patch.parent_id = parentId;
  }

  if (Object.keys(patch).length === 0) return;
  patch.updated_at = nowIso();
  const { error } = await db.from("pages").update(patch).eq("id", pageId);
  if (error) throw new Error("폴더 수정 실패: " + error.message);
}

// 이동(드래그앤드롭) — 폴더/문서 공용. parent_id 만 바꾸면 하위 서브트리는 그대로 따라온다.
// 상위는 폴더만 허용, 자기 자신/자손으로의 이동은 차단(순환 방지).
export async function movePage(
  pageId: string,
  parentId: string | null
): Promise<void> {
  if (parentId === pageId)
    throw new AuthError("자기 자신 안으로는 옮길 수 없습니다.", 400);

  const all = await listTree();
  const node = all.find((p) => p.id === pageId);
  if (!node) throw new AuthError("대상을 찾을 수 없습니다.", 404);

  if (parentId) {
    if (descendantSet(all, pageId).has(parentId))
      throw new AuthError("하위 항목 안으로는 옮길 수 없습니다.", 400);
    const parent = all.find((p) => p.id === parentId);
    if (!parent || !parent.is_folder)
      throw new AuthError("폴더 안으로만 옮길 수 있습니다.", 400);
  }

  const db = getAdminDb();
  const { error } = await db
    .from("pages")
    .update({ parent_id: parentId, updated_at: nowIso() })
    .eq("id", pageId);
  if (error) throw new Error("이동 실패: " + error.message);
}

export async function createPage(
  authorId: string,
  title: string,
  content: string,
  summary: string,
  ratingsEnabled: boolean,
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
      ratings_enabled: ratingsEnabled,
    })
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
  ratingsEnabled?: boolean,
  baseRevisionId?: string | null,
  parentId?: string | null
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

  // 평가 허용 플래그는 내용 변경 여부와 무관하게 반영
  const pagePatch: Record<string, unknown> = {};
  if (ratingsEnabled !== undefined) pagePatch.ratings_enabled = ratingsEnabled;

  // 상위 폴더 이동 (undefined = 변경 안 함, null = 최상위로). 순환/자기참조 방지.
  if (parentId !== undefined) {
    if (parentId === pageId)
      throw new AuthError("자기 자신을 상위 폴더로 지정할 수 없습니다.", 400);
    if (parentId) {
      const all = await listTree();
      if (descendantSet(all, pageId).has(parentId))
        throw new AuthError("하위 문서를 상위 폴더로 지정할 수 없습니다.", 400);
    }
    pagePatch.parent_id = parentId;
  }

  // no-op: 제목/본문이 현재와 동일하면 새 리비전을 만들지 않음
  let changed = true;
  if (page.current_revision_id) {
    const { data: cur } = await db
      .from("page_revisions")
      .select("title, content")
      .eq("id", page.current_revision_id)
      .maybeSingle();
    if (cur && cur.title === title && cur.content === content) changed = false;
  }

  if (changed) {
    const { data: rev, error } = await db
      .from("page_revisions")
      .insert({ page_id: pageId, title, content, summary, author_id: authorId })
      .select("id")
      .single();
    if (error || !rev) throw new Error("수정 실패: " + (error?.message ?? ""));
    pagePatch.title = title;
    pagePatch.current_revision_id = rev.id;
    pagePatch.updated_at = nowIso();
  }

  if (Object.keys(pagePatch).length > 0) {
    await db.from("pages").update(pagePatch).eq("id", pageId);
  }

  return { changed };
}

// 수정 이력에 삭제/복원 흔적을 남기는 마커 리비전 — 본문은 현재 리비전 그대로 복사.
// (폴더는 리비전이 없으므로 건너뛴다. 실패해도 본 동작은 막지 않는다.)
async function insertAuditRevision(
  pageId: string,
  authorId: string,
  summary: string
): Promise<void> {
  try {
    const db = getAdminDb();
    const { data: page } = await db
      .from("pages")
      .select("title, is_folder, current_revision_id")
      .eq("id", pageId)
      .maybeSingle();
    if (!page || page.is_folder || !page.current_revision_id) return;
    const { data: rev } = await db
      .from("page_revisions")
      .select("content")
      .eq("id", page.current_revision_id)
      .maybeSingle();
    await db.from("page_revisions").insert({
      page_id: pageId,
      title: page.title,
      content: rev?.content ?? "",
      summary,
      author_id: authorId,
    });
  } catch (e) {
    console.error("audit revision failed", e);
  }
}

export async function softDeletePage(userId: string, pageId: string): Promise<void> {
  const db = getAdminDb();
  const { error } = await db
    .from("pages")
    .update({ is_deleted: true, deleted_at: nowIso(), deleted_by: userId })
    .eq("id", pageId);
  if (error) throw new Error("삭제 실패: " + error.message);
  await insertAuditRevision(pageId, userId, "🗑 문서 삭제");
}

// ── 비공개 글 ─────────────────────────────
// 작성자 본인만 전환 가능(폴더 제외). 비공개면 모든 리스트에서 숨고
// 본문도 작성자 외 접근 불가. 해제 시 즉시 모든 곳에 다시 보인다.
export async function setPagePrivacy(
  userId: string,
  pageId: string,
  isPrivate: boolean
): Promise<void> {
  const db = getAdminDb();
  const { data: page } = await db
    .from("pages")
    .select("id, created_by, is_folder, is_deleted")
    .eq("id", pageId)
    .maybeSingle();
  if (!page || page.is_deleted)
    throw new AuthError("문서를 찾을 수 없습니다.", 404);
  if (page.is_folder)
    throw new AuthError("폴더는 비공개로 전환할 수 없습니다.", 400);
  if (page.created_by !== userId)
    throw new AuthError("본인이 작성한 글만 비공개로 전환할 수 있습니다.", 403);

  const { error } = await db
    .from("pages")
    .update({ is_private: isPrivate })
    .eq("id", pageId);
  if (error) throw new Error("비공개 설정 실패: " + error.message);
}

// 마이페이지용 — 내 비공개 글 목록 (리스트에서 숨는 글을 본인이 찾는 유일한 통로)
export async function listMyPrivatePages(
  userId: string
): Promise<PageListItem[]> {
  const db = getAdminDb();
  const { data } = await db
    .from("pages")
    .select("id, slug, title, updated_at")
    .eq("is_deleted", false)
    .eq("is_private", true)
    .eq("created_by", userId)
    .order("updated_at", { ascending: false })
    .limit(200);
  return (data ?? []) as PageListItem[];
}

// ── 휴지통 ─────────────────────────────
// 휴지통은 DB 폴더가 아니라 가상 노드: is_deleted 행의 목록일 뿐이다.
export type TrashItem = {
  id: string;
  slug: string;
  title: string;
  is_folder: boolean;
  deleted_at: string | null;
  deleted_by_name: string | null; // 삭제 감사용
};

export async function listTrash(): Promise<TrashItem[]> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("pages")
    .select(
      "id, slug, title, is_folder, deleted_at, deleter:users!pages_deleted_by_fkey (display_name)"
    )
    .eq("is_deleted", true)
    .order("deleted_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("휴지통 조회 실패: " + error.message);
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    is_folder: r.is_folder,
    deleted_at: r.deleted_at,
    deleted_by_name: r.deleter?.display_name ?? null,
  }));
}

// 삭제된 문서 상세 (휴지통에서 본문 보기용 — 일반 조회는 deleted 를 숨기므로 별도 함수)
export async function getDeletedPage(pageId: string): Promise<{
  id: string;
  slug: string;
  title: string;
  is_folder: boolean;
  deleted_at: string | null;
  deleted_by_name: string | null;
  content: string;
} | null> {
  const db = getAdminDb();
  const { data: page } = await db
    .from("pages")
    .select(
      "id, slug, title, is_folder, is_deleted, deleted_at, current_revision_id, deleter:users!pages_deleted_by_fkey (display_name)"
    )
    .eq("id", pageId)
    .maybeSingle();
  if (!page || !page.is_deleted) return null;

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
    is_folder: page.is_folder ?? false,
    deleted_at: page.deleted_at,
    deleted_by_name: (page as any).deleter?.display_name ?? null,
    content,
  };
}

// 영구 삭제 (관리자 전용 호출) — 리비전·평가는 FK cascade 로 함께 삭제.
// parent_id 로 이 문서를 가리키는 행이 있으면 FK 가 막으므로 먼저 끊는다.
export async function hardDeletePage(pageId: string): Promise<void> {
  const db = getAdminDb();
  const { data: page } = await db
    .from("pages")
    .select("id, is_deleted")
    .eq("id", pageId)
    .maybeSingle();
  if (!page || !page.is_deleted)
    throw new AuthError("휴지통에 있는 문서만 영구 삭제할 수 있습니다.", 400);

  await db.from("pages").update({ parent_id: null }).eq("parent_id", pageId);
  const { error } = await db.from("pages").delete().eq("id", pageId);
  if (error) throw new Error("영구 삭제 실패: " + error.message);
}

// 복원 — 상위 폴더는 복원자가 지정(null=최상위). 원래 폴더가 삭제됐을 수 있어
// 삭제 당시 parent_id 는 신뢰하지 않는다.
export async function restorePage(
  pageId: string,
  parentId: string | null,
  userId: string
): Promise<void> {
  const db = getAdminDb();
  const { data: page } = await db
    .from("pages")
    .select("id, is_deleted")
    .eq("id", pageId)
    .maybeSingle();
  if (!page || !page.is_deleted)
    throw new AuthError("휴지통에 없는 문서입니다.", 404);

  let parentTitle: string | null = null;
  if (parentId) {
    const { data: parent } = await db
      .from("pages")
      .select("id, title, is_folder, is_deleted")
      .eq("id", parentId)
      .maybeSingle();
    if (!parent || parent.is_deleted || !parent.is_folder)
      throw new AuthError("복원할 상위 폴더가 올바르지 않습니다.", 400);
    parentTitle = parent.title;
  }

  const { error } = await db
    .from("pages")
    .update({
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      parent_id: parentId,
      updated_at: nowIso(),
    })
    .eq("id", pageId);
  if (error) throw new Error("복원 실패: " + error.message);
  await insertAuditRevision(
    pageId,
    userId,
    `♻ 휴지통에서 복원 (위치: ${parentTitle ?? "최상위"})`
  );
}

// ── 작성자/기여자 ──
export type UserBrief = {
  id: string;
  display_name: string;
  avatar: string;
  avatar_config: AvatarConfig | null;
};

// 최초 작성자 + 기여자(작성자 외 리비전을 남긴 사람들, 중복 제거)
export async function getPageAuthors(
  pageId: string,
  createdBy: string | null
): Promise<{ author: UserBrief | null; contributors: UserBrief[] }> {
  const db = getAdminDb();
  const { data } = await db
    .from("page_revisions")
    .select("users:author_id (id, display_name, avatar, avatar_config)")
    .eq("page_id", pageId)
    .limit(500);

  const seen = new Map<string, UserBrief>();
  for (const r of (data ?? []) as any[]) {
    const u = r.users as UserBrief | null;
    if (u && !seen.has(u.id)) seen.set(u.id, u);
  }

  let author = createdBy ? seen.get(createdBy) ?? null : null;
  if (createdBy && !author) {
    // 리비전이 전부 타인(복원 등)인 경우 작성자 정보 직접 조회
    const { data: u } = await db
      .from("users")
      .select("id, display_name, avatar, avatar_config")
      .eq("id", createdBy)
      .maybeSingle();
    author = (u as UserBrief) ?? null;
  }

  const contributors = [...seen.values()].filter((u) => u.id !== createdBy);
  return { author, contributors };
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
export async function listRecentChanges(
  viewerId?: string
): Promise<RecentChange[]> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("page_revisions")
    .select(
      "id, page_id, summary, created_at, pages:page_id (slug, title, is_deleted, is_private, created_by), users:author_id (display_name, avatar, avatar_config)"
    )
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error("최근 변경 조회 실패: " + error.message);

  const rows = (data ?? []).filter(
    (r: any) =>
      r.pages &&
      !r.pages.is_deleted &&
      (!r.pages.is_private || (viewerId && r.pages.created_by === viewerId))
  );

  // 최초작성 판별: 관련 페이지들의 가장 오래된 리비전 id
  const pageIds = [...new Set(rows.map((r: any) => r.page_id as string))];
  const firstOf = new Map<string, string>();
  if (pageIds.length > 0) {
    const { data: firsts } = await db
      .from("page_revisions")
      .select("id, page_id, created_at")
      .in("page_id", pageIds)
      .order("created_at", { ascending: true })
      .limit(2000);
    for (const f of (firsts ?? []) as { id: string; page_id: string }[]) {
      if (!firstOf.has(f.page_id)) firstOf.set(f.page_id, f.id);
    }
  }

  const kindOf = (r: any): ChangeKind => {
    const s: string = r.summary ?? "";
    if (s.startsWith("🗑 문서 삭제")) return "delete";
    if (s.startsWith("♻ 휴지통에서 복원")) return "restore";
    if (firstOf.get(r.page_id) === r.id) return "create";
    return "edit";
  };

  return rows.map((r: any) => ({
    revision_id: r.id,
    slug: r.pages.slug,
    page_title: r.pages.title,
    summary: r.summary ?? "",
    created_at: r.created_at,
    author_name: r.users?.display_name ?? null,
    author_avatar: r.users?.avatar ?? null,
    author_config: r.users?.avatar_config ?? null,
    kind: kindOf(r),
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
  await updatePage(
    userId,
    pageId,
    rev.title,
    rev.content,
    "이전 버전 복원",
    undefined,
    null
  );
}
