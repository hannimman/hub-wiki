import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getPageBySlug, getTitleSlugMap } from "@/lib/pages";
import MarkdownView from "@/lib/markdown";
import PageActions from "./PageActions";

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
    </main>
  );
}
