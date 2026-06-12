import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getPageBySlug, listRevisions, canViewPage } from "@/lib/pages";
import { Avatar } from "@/lib/avatars";
import RestoreButton from "../RestoreButton";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
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

  const revisions = await listRevisions(page.id);

  return (
    <main className="container page">
      <Link href={`/wiki/${slug}`} style={{ color: "var(--muted)", fontSize: 14 }}>
        ← {page.title}
      </Link>
      <h1 style={{ marginTop: 8 }}>수정 이력</h1>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {revisions.map((r, i) => (
          <li
            key={r.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <Avatar id={r.author_avatar} config={r.author_config} size={36} />
            <div style={{ flex: 1 }}>
              <div>
                <b>{r.author_name ?? "알 수 없음"}</b>{" "}
                {i === 0 && (
                  <span style={{ color: "#3b82f6", fontSize: 12 }}>(현재)</span>
                )}
              </div>
              <div style={{ color: "#999", fontSize: 12 }}>
                {new Date(r.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false })}
                {r.summary ? ` · ${r.summary}` : ""}
              </div>
              <Link
                href={`/wiki/${slug}/rev/${r.id}`}
                style={{ fontSize: 12, color: "#3b82f6" }}
              >
                변경내역 보기
              </Link>
            </div>
            {i !== 0 && (
              <RestoreButton pageId={page.id} revisionId={r.id} />
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
