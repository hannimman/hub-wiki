import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  getPageBySlug,
  getTitleSlugMap,
  getAncestors,
  getPageAuthors,
  listTree,
  canViewPage,
} from "@/lib/pages";
import {
  isV2,
  DEFAULT_AVATAR_V2,
  type AvatarV2Data,
} from "@/lib/avatar/render";
import WikiPlaza, { type PlazaMember } from "../WikiPlaza";
import { SCENE_COUNT } from "../PlazaScenes";
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
  if (!canViewPage(page, user.id)) notFound(); // 비공개 글은 작성자만
  const ancestors = await getAncestors(page.id);

  // ── 폴더: 본문/평가 없이 하위 목록만 ──
  if (page.is_folder) {
    const children = (await listTree(user.id)).filter(
      (n) => n.parent_id === page.id
    );
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
                <span>{c.is_folder ? "📁" : c.is_private ? "🔒" : "📄"}</span>
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
  const { author, contributors } = await getPageAuthors(
    page.id,
    page.created_by
  );

  // 작성자·기여자 미니 광장 (팀 광장과 동일한 자율 애니메이션, 배경만 다름)
  const toData = (cfg: unknown): AvatarV2Data =>
    isV2(cfg) ? cfg : DEFAULT_AVATAR_V2;
  const crew: PlazaMember[] = [
    ...(author
      ? [
          {
            id: author.id,
            name: `✍️ ${author.display_name}`,
            data: toData(author.avatar_config),
          },
        ]
      : []),
    ...contributors.map((c) => ({
      id: c.id,
      name: c.display_name,
      data: toData(c.avatar_config),
    })),
  ];
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
        <PageActions
          pageId={page.id}
          slug={page.slug}
          isAuthor={page.created_by === user.id}
          isPrivate={page.is_private}
        />
      </div>

      <h1 style={{ marginTop: 8 }}>
        {page.is_private && (
          <span
            title="비공개 글 — 본인만 볼 수 있습니다"
            style={{
              fontSize: 14,
              fontWeight: 700,
              verticalAlign: "middle",
              marginRight: 8,
              padding: "3px 10px",
              borderRadius: 999,
              background: "#fef3c7",
              color: "#92400e",
            }}
          >
            🔒 비공개
          </span>
        )}
        {page.title}
      </h1>

      <WikiPlaza
        members={crew}
        className="plaza--doc"
        uidPrefix="dplz"
        scene={Math.floor(Math.random() * SCENE_COUNT)}
        title={[
          author ? `작성자 : ${author.display_name}` : null,
          contributors.length > 0
            ? `기여자 : ${contributors.map((c) => c.display_name).join(", ")}`
            : null,
        ]
          .filter(Boolean)
          .join("\n")}
      />

      <div
        className="row muted"
        style={{ fontSize: 13, marginBottom: 20, flexWrap: "wrap", gap: 8 }}
      >
        <span>
          마지막 수정 {new Date(page.updated_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false })}
        </span>
      </div>

      <MarkdownView content={page.content} linkMap={linkMap} />

      {rating && <RatingWidget {...rating} />}
    </main>
  );
}
