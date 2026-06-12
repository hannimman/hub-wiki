import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDeletedPage, listParentOptions, getTitleSlugMap } from "@/lib/pages";
import MarkdownView from "@/lib/markdown";
import TrashActions from "./TrashActions";

export const dynamic = "force-dynamic";

// 삭제된 글 보기 — 읽기 전용 + 복원(상위 폴더 선택) + 영구 삭제(관리자).
export default async function TrashItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const page = await getDeletedPage(id);
  if (!page) notFound();

  const [parentOptions, linkMap] = await Promise.all([
    listParentOptions(),
    page.is_folder ? Promise.resolve({}) : getTitleSlugMap(),
  ]);
  const isAdmin = user.role === "admin" || user.role === "super";

  return (
    <main style={{ padding: "28px 28px 72px", maxWidth: 920 }}>
      <div className="muted" style={{ fontSize: 13 }}>
        <Link href="/wiki/trash" style={{ color: "var(--muted)" }}>
          🗑️ 휴지통
        </Link>{" "}
        / 삭제된 {page.is_folder ? "폴더" : "글"}
      </div>

      <h1 style={{ marginTop: 8 }}>
        {page.is_folder ? "📁 " : ""}
        {page.title}
      </h1>
      <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
        {page.deleted_by_name ? `${page.deleted_by_name} 님이 삭제` : "삭제됨"}
        {page.deleted_at
          ? ` · ${new Date(page.deleted_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false })}`
          : ""}
      </p>

      <TrashActions
        pageId={page.id}
        slug={page.slug}
        parentOptions={parentOptions}
        isAdmin={isAdmin}
      />

      <div
        style={{
          marginTop: 20,
          padding: 16,
          border: "1px dashed var(--border)",
          borderRadius: 10,
          background: "#fafbfc",
        }}
      >
        {page.is_folder ? (
          <p className="muted" style={{ margin: 0 }}>
            폴더에는 본문이 없습니다. 복원하면 트리에 다시 나타납니다.
          </p>
        ) : page.content.trim() ? (
          <MarkdownView content={page.content} linkMap={linkMap} />
        ) : (
          <p className="muted" style={{ margin: 0 }}>(본문이 비어 있습니다)</p>
        )}
      </div>
    </main>
  );
}
