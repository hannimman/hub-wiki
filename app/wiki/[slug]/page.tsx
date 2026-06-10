import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getPageBySlug, getTitleSlugMap } from "@/lib/pages";
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

const wrap: React.CSSProperties = {
  maxWidth: 820,
  margin: "32px auto",
  padding: "0 20px",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  lineHeight: 1.7,
};

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
  const linkMap = await getTitleSlugMap();

  // 평가 데이터 (점수 제도가 켜져 있을 때만)
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Link href="/wiki" style={{ color: "#666", fontSize: 14 }}>
          ← 목록
        </Link>
        <PageActions pageId={page.id} slug={page.slug} />
      </div>

      <h1 style={{ marginTop: 12 }}>{page.title}</h1>
      <div style={{ color: "#999", fontSize: 13, marginBottom: 20 }}>
        마지막 수정: {new Date(page.updated_at).toLocaleString("ko-KR")}
      </div>

      <MarkdownView content={page.content} linkMap={linkMap} />

      {rating && <RatingWidget {...rating} />}
    </main>
  );
}
