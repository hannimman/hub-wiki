import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  getPageBySlug,
  getTitleSlugMap,
  getAncestors,
  listTree,
} from "@/lib/pages";
import {
  getRatingsEnabled,
  getMyRating,
  getAggregate,
  canUserRate,
  canUserViewScores,
} from "@/lib/ratings";
import MarkdownView from "@/lib/markdown";
import PageActions from "./PageActions";
import RatingWidget from "./RatingWidget";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = { padding: "28px 28px 72px", maxWidth: 920 };

function Breadcrumb({
  ancestors,
}: {
  ancestors: { slug: string; title: string }[];
}) {
  return (
    <div
      className="muted"
      style={{ fontSize: 13, display: "flex", gap: 6, flexWrap: "wrap" }}
    >
      <Link href="/wiki" style={{ color: "var(--muted)" }}>
        위키
      </Link>
      {ancestors.map((a) => (
        <span key={a.slug}>
          /{" "}
          <Link href={`/wiki/${a.slug}`} style={{ color: "var(--muted)" }}>
            {a.title}
          </Link>
        </span>
      ))}
    </div>
  );
}

export default async function PageView({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();
  const ancestors = await getAncestors(page.id);

  // ── 폴더: 본문/평가 없이 하위 목록만 ──
  if (page.is_folder) {
    const children = (await listTree()).filter((n) => n.parent_id === page.id);
    return (
      <main style={wrap}>
        <Breadcrumb ancestors={ancestors} />
        <h1 style={{ marginTop: 8 }}>📁 {page.title}</h1>
        <div style={{ margin: "8px 0 20px" }}>
          <Link
            href={`/wiki/new?parent=${page.id}`}
            className="btn btn-primary btn-sm"
          >
            ＋ 이 폴더에 새 글
          </Link>
        </div>

        {children.length === 0 ? (
          <p className="muted">비어 있는 폴더입니다. 왼쪽 트리에서 항목을 추가하세요.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {children.map((c) => (
              <li
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span>{c.is_folder ? "📁" : "📄"}</span>
                <Link
                  href={`/wiki/${c.slug}`}
                  style={{
                    fontSize: 16,
                    fontWeight: c.is_folder ? 700 : 500,
                    textDecoration: "none",
                  }}
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  // ── 문서: 기존 글 보기 + (켜져 있으면) 평가 ──
  const linkMap = await getTitleSlugMap();
  const ratingsEnabled = await getRatingsEnabled();
  let rating: {
    pageId: string;
    isAuthor: boolean;
    myScore: number | null;
    canRate: boolean;
    canView: boolean;
    avg: number | null;
    count: number | null;
  } | null = null;
  if (ratingsEnabled && page.ratings_enabled) {
    const canView = canUserViewScores(user);
    const agg = canView ? await getAggregate(page.id) : null;
    rating = {
      pageId: page.id,
      isAuthor: page.created_by === user.id,
      myScore: await getMyRating(user.id, page.id),
      canRate: canUserRate(user),
      canView,
      avg: agg ? agg.avg : null,
      count: agg ? agg.count : null,
    };
  }

  return (
    <main style={wrap}>
      <div className="row-between">
        <Breadcrumb ancestors={ancestors} />
        <PageActions pageId={page.id} slug={page.slug} />
      </div>

      <h1 style={{ marginTop: 8 }}>{page.title}</h1>
      <div className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
        마지막 수정: {new Date(page.updated_at).toLocaleString("ko-KR")}
      </div>

      <MarkdownView content={page.content} linkMap={linkMap} />

      {rating && <RatingWidget {...rating} />}
    </main>
  );
}
