import { getAdminDb } from "./db";
import type { AvatarConfig } from "./avatars";

// 관리자 통계 — 전부 읽기 전용. pages/revisions/ratings 를 벌크로 가져와
// 서버에서 집계한다(팀 위키 규모: 수천 행 이하 전제, 한도 초과분은 잘림).

const PAGE_LIMIT = 2000;
const REV_LIMIT = 10000;
const RATING_LIMIT = 10000;

export type StatUser = {
  id: string;
  display_name: string;
  avatar: string;
  avatar_config: AvatarConfig | null;
  is_active: boolean;
};

type PageRow = {
  id: string;
  slug: string;
  title: string;
  is_folder: boolean;
  is_deleted: boolean;
  is_private: boolean;
  ratings_enabled: boolean;
  created_by: string | null;
  updated_at: string;
  current_revision_id: string | null;
};
type RevRow = { page_id: string; author_id: string | null; created_at: string };
type RatingRow = { page_id: string; score: number; rater_id: string };

async function fetchBase() {
  const db = getAdminDb();
  const [users, pages, revs, ratings] = await Promise.all([
    db
      .from("users")
      .select("id, display_name, avatar, avatar_config, is_active")
      .order("created_at", { ascending: true }),
    db
      .from("pages")
      .select(
        "id, slug, title, is_folder, is_deleted, is_private, ratings_enabled, created_by, updated_at, current_revision_id"
      )
      .limit(PAGE_LIMIT),
    db
      .from("page_revisions")
      .select("page_id, author_id, created_at")
      .limit(REV_LIMIT),
    db.from("ratings").select("page_id, score, rater_id").limit(RATING_LIMIT),
  ]);
  return {
    users: (users.data ?? []) as StatUser[],
    pages: (pages.data ?? []) as PageRow[],
    revs: (revs.data ?? []) as RevRow[],
    ratings: (ratings.data ?? []) as RatingRow[],
  };
}

function ratingAggByPage(ratings: RatingRow[]) {
  const agg = new Map<string, { sum: number; count: number }>();
  for (const r of ratings) {
    const a = agg.get(r.page_id) ?? { sum: 0, count: 0 };
    a.sum += r.score;
    a.count++;
    agg.set(r.page_id, a);
  }
  return agg;
}

// ── ① 사용자별 활동 요약 ──
export type ActivityRow = {
  user: StatUser;
  authored: number; // 작성 글 수 (폴더 제외, 삭제 제외)
  contributed: number; // 기여 글 수 (남의 글에 리비전)
  revisions: number; // 남긴 리비전 총수
  lastActivity: string | null;
  receivedAvg: number | null; // 작성글이 받은 평균 점수
  receivedCount: number;
};

export async function getUserActivitySummary(): Promise<ActivityRow[]> {
  const { users, pages, revs, ratings } = await fetchBase();
  const liveDocs = pages.filter((p) => !p.is_deleted && !p.is_folder && !p.is_private);
  const creatorOf = new Map(pages.map((p) => [p.id, p.created_by]));
  const liveDocIds = new Set(liveDocs.map((p) => p.id));
  const agg = ratingAggByPage(ratings);

  const rows = users.map((u) => {
    const authoredPages = liveDocs.filter((p) => p.created_by === u.id);
    const myRevs = revs.filter((r) => r.author_id === u.id);
    const contributedIds = new Set(
      myRevs
        .filter(
          (r) => liveDocIds.has(r.page_id) && creatorOf.get(r.page_id) !== u.id
        )
        .map((r) => r.page_id)
    );
    let sum = 0;
    let count = 0;
    for (const p of authoredPages) {
      const a = agg.get(p.id);
      if (a) {
        sum += a.sum;
        count += a.count;
      }
    }
    const lastActivity = myRevs.reduce<string | null>(
      (acc, r) => (acc && acc > r.created_at ? acc : r.created_at),
      null
    );
    return {
      user: u,
      authored: authoredPages.length,
      contributed: contributedIds.size,
      revisions: myRevs.length,
      lastActivity,
      receivedAvg: count ? Math.round(sum / count) : null,
      receivedCount: count,
    };
  });
  // 활동 많은 순
  return rows.sort((a, b) => b.revisions - a.revisions);
}

// ── ①·② 사용자 상세: 작성글 / 기여글 목록 ──
export type AuthoredPage = {
  id: string;
  slug: string;
  title: string;
  updated_at: string;
  avg: number | null;
  count: number;
};
export type ContributedPage = {
  id: string;
  slug: string;
  title: string;
  authorName: string | null;
  myRevisions: number;
  lastAt: string;
};

export async function getUserActivityDetail(userId: string): Promise<{
  authored: AuthoredPage[];
  contributed: ContributedPage[];
}> {
  const { users, pages, revs, ratings } = await fetchBase();
  const nameOf = new Map(users.map((u) => [u.id, u.display_name]));
  const agg = ratingAggByPage(ratings);
  const liveDocs = pages.filter((p) => !p.is_deleted && !p.is_folder && !p.is_private);

  const authored: AuthoredPage[] = liveDocs
    .filter((p) => p.created_by === userId)
    .map((p) => {
      const a = agg.get(p.id);
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        updated_at: p.updated_at,
        avg: a ? Math.round(a.sum / a.count) : null,
        count: a?.count ?? 0,
      };
    })
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));

  const byPage = new Map<string, { count: number; lastAt: string }>();
  for (const r of revs) {
    if (r.author_id !== userId) continue;
    const cur = byPage.get(r.page_id) ?? { count: 0, lastAt: r.created_at };
    cur.count++;
    if (r.created_at > cur.lastAt) cur.lastAt = r.created_at;
    byPage.set(r.page_id, cur);
  }
  const contributed: ContributedPage[] = liveDocs
    .filter((p) => p.created_by !== userId && byPage.has(p.id))
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      authorName: p.created_by ? nameOf.get(p.created_by) ?? null : null,
      myRevisions: byPage.get(p.id)!.count,
      lastAt: byPage.get(p.id)!.lastAt,
    }))
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));

  return { authored, contributed };
}

// ── ③ 평가 현황: 전체 / 글별 / 사용자별 ──
export type RatingsOverview = {
  global: { total: number; avg: number | null; raters: number };
  pages: {
    id: string;
    slug: string;
    title: string;
    authorName: string | null;
    avg: number;
    count: number;
  }[];
  users: {
    user: StatUser;
    avg: number | null;
    count: number;
    ratedPages: number;
  }[];
};

export async function getRatingsOverview(): Promise<RatingsOverview> {
  const { users, pages, ratings } = await fetchBase();
  const nameOf = new Map(users.map((u) => [u.id, u.display_name]));
  const agg = ratingAggByPage(ratings);
  const liveDocs = pages.filter((p) => !p.is_deleted && !p.is_folder && !p.is_private);

  const pageRows = liveDocs
    .filter((p) => agg.has(p.id))
    .map((p) => {
      const a = agg.get(p.id)!;
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        authorName: p.created_by ? nameOf.get(p.created_by) ?? null : null,
        avg: Math.round(a.sum / a.count),
        count: a.count,
      };
    })
    .sort((a, b) => b.avg - a.avg || b.count - a.count);

  const userRows = users.map((u) => {
    let sum = 0;
    let count = 0;
    let ratedPages = 0;
    for (const p of liveDocs) {
      if (p.created_by !== u.id) continue;
      const a = agg.get(p.id);
      if (a) {
        sum += a.sum;
        count += a.count;
        ratedPages++;
      }
    }
    return {
      user: u,
      avg: count ? Math.round(sum / count) : null,
      count,
      ratedPages,
    };
  });
  userRows.sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1) || b.count - a.count);

  const total = ratings.length;
  const avg = total
    ? Math.round(ratings.reduce((s, r) => s + r.score, 0) / total)
    : null;
  const raters = new Set(ratings.map((r) => r.rater_id)).size;

  return { global: { total, avg, raters }, pages: pageRows, users: userRows };
}

// ── (c) 콘텐츠 건강 리포트 ──
export type HealthDoc = { id: string; slug: string; title: string; updated_at: string };
export type ContentHealth = {
  stale: HealthDoc[]; // staleDays 이상 미수정
  empty: HealthDoc[]; // 본문이 빈 문서
  unrated: HealthDoc[]; // 평가 0건 문서
  staleDays: number;
};

export async function getContentHealth(staleDays = 90): Promise<ContentHealth> {
  const db = getAdminDb();
  const { pages, ratings } = await fetchBase();
  const liveDocs = pages.filter((p) => !p.is_deleted && !p.is_folder && !p.is_private);
  const rated = new Set(ratings.map((r) => r.page_id));

  const cutoff = new Date(Date.now() - staleDays * 86400_000).toISOString();
  const toDoc = (p: PageRow): HealthDoc => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    updated_at: p.updated_at,
  });

  const stale = liveDocs
    .filter((p) => p.updated_at < cutoff)
    .sort((a, b) => (a.updated_at < b.updated_at ? -1 : 1))
    .map(toDoc);

  // 빈 본문: 현재 리비전 content 를 100개씩 끊어 조회
  const revIds = liveDocs
    .map((p) => p.current_revision_id)
    .filter((v): v is string => !!v);
  const emptyRevIds = new Set<string>();
  for (let i = 0; i < revIds.length; i += 100) {
    const chunk = revIds.slice(i, i + 100);
    const { data } = await db
      .from("page_revisions")
      .select("id, content")
      .in("id", chunk);
    for (const r of (data ?? []) as { id: string; content: string }[]) {
      if (!r.content || r.content.trim().length === 0) emptyRevIds.add(r.id);
    }
  }
  const empty = liveDocs
    .filter(
      (p) => !p.current_revision_id || emptyRevIds.has(p.current_revision_id)
    )
    .map(toDoc);

  // 작성자가 "⭐ 평가 받기"를 켠 문서만 대상 (안 켠 글은 평가 없는 게 정상)
  const unrated = liveDocs
    .filter((p) => p.ratings_enabled && !rated.has(p.id))
    .map(toDoc);

  return { stale, empty, unrated, staleDays };
}

// ── (d) 포인트 현황 (읽기 전용 — 지급은 슈퍼 제어판) ──
export type PointsOverview = {
  balances: (StatUser & { points: number })[];
  recent: {
    id: string;
    userName: string;
    amount: number;
    reason: string;
    ref: string | null;
    created_at: string;
  }[];
};

export async function getPointsOverview(): Promise<PointsOverview> {
  const db = getAdminDb();
  const [usersRes, txRes] = await Promise.all([
    db
      .from("users")
      .select("id, display_name, avatar, avatar_config, is_active, points")
      .order("points", { ascending: false }),
    db
      .from("point_transactions")
      .select(
        "id, amount, reason, ref, created_at, users:user_id (display_name)"
      )
      .order("created_at", { ascending: false })
      .limit(80),
  ]);
  return {
    balances: (usersRes.data ?? []) as PointsOverview["balances"],
    recent: ((txRes.data ?? []) as any[]).map((t) => ({
      id: t.id,
      userName: t.users?.display_name ?? "알 수 없음",
      amount: t.amount,
      reason: t.reason,
      ref: t.ref,
      created_at: t.created_at,
    })),
  };
}
