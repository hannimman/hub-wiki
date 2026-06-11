import { getAdminDb } from "./db";

// 고아 이미지 정리 — 업로드됐지만 어떤 문서(모든 리비전 포함)에서도
// 참조하지 않는 Storage 파일을 찾는다. 히스토리 보기가 깨지지 않도록
// "현재 본문"이 아니라 "모든 리비전"을 참조 기준으로 삼는다.
// 업로드 직후(작성 중) 파일을 지우지 않도록 24시간 유예.

export type OrphanFile = {
  path: string;
  size: number; // bytes
  created_at: string | null;
};

const FILE_REF_RE = /\/api\/files\/(\d{4}\/[0-9a-f-]{36}\.(?:png|jpg|gif|webp))/g;
const MIN_AGE_MS = 24 * 3600 * 1000;

// Storage 의 모든 이미지 경로 (연도 폴더 → 파일)
async function listAllFiles(): Promise<OrphanFile[]> {
  const db = getAdminDb();
  const { data: roots, error } = await db.storage
    .from("wiki-images")
    .list("", { limit: 200 });
  if (error) throw new Error("스토리지 목록 조회 실패: " + error.message);

  const out: OrphanFile[] = [];
  for (const entry of roots ?? []) {
    // 연도 폴더만 (supabase 목록에서 폴더는 id 가 null)
    if (!/^\d{4}$/.test(entry.name)) continue;
    const { data: files } = await db.storage
      .from("wiki-images")
      .list(entry.name, { limit: 1000 });
    for (const f of files ?? []) {
      out.push({
        path: `${entry.name}/${f.name}`,
        size:
          ((f as { metadata?: { size?: number } }).metadata?.size as number) ??
          0,
        created_at: (f as { created_at?: string }).created_at ?? null,
      });
    }
  }
  return out;
}

// 모든 리비전 본문에서 참조 중인 파일 경로 집합
async function referencedPaths(): Promise<Set<string>> {
  const db = getAdminDb();
  const refs = new Set<string>();
  const CHUNK = 1000;
  for (let from = 0; ; from += CHUNK) {
    const { data, error } = await db
      .from("page_revisions")
      .select("content")
      .range(from, from + CHUNK - 1);
    if (error) throw new Error("리비전 조회 실패: " + error.message);
    for (const r of (data ?? []) as { content: string | null }[]) {
      if (!r.content) continue;
      for (const m of r.content.matchAll(FILE_REF_RE)) refs.add(m[1]);
    }
    if (!data || data.length < CHUNK) break;
  }
  return refs;
}

export async function listOrphanImages(): Promise<OrphanFile[]> {
  const [all, refs] = await Promise.all([listAllFiles(), referencedPaths()]);
  const cutoff = Date.now() - MIN_AGE_MS;
  return all
    .filter((f) => !refs.has(f.path))
    .filter((f) => !f.created_at || new Date(f.created_at).getTime() < cutoff)
    .sort((a, b) => ((a.created_at ?? "") < (b.created_at ?? "") ? -1 : 1));
}

// 요청 경로 중 "지금도 고아인 것"만 삭제(경합으로 참조가 생긴 파일 보호).
export async function purgeOrphanImages(paths: string[]): Promise<number> {
  const orphanSet = new Set((await listOrphanImages()).map((f) => f.path));
  const targets = paths.filter((p) => orphanSet.has(p));
  if (targets.length === 0) return 0;

  const db = getAdminDb();
  let removed = 0;
  for (let i = 0; i < targets.length; i += 100) {
    const chunk = targets.slice(i, i + 100);
    const { error } = await db.storage.from("wiki-images").remove(chunk);
    if (error) throw new Error("파일 삭제 실패: " + error.message);
    removed += chunk.length;
  }
  return removed;
}
