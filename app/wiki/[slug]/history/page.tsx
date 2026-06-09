import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getPageBySlug, listRevisions } from "@/lib/pages";
import { Avatar } from "@/lib/avatars";
import RestoreButton from "../RestoreButton";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = {
  maxWidth: 820,
  margin: "32px auto",
  padding: "0 20px",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

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

  const revisions = await listRevisions(page.id);

  return (
    <main style={wrap}>
      <Link href={`/wiki/${slug}`} style={{ color: "#666", fontSize: 14 }}>
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
            <Avatar id={r.author_avatar} size={36} />
            <div style={{ flex: 1 }}>
              <div>
                <b>{r.author_name ?? "알 수 없음"}</b>{" "}
                {i === 0 && (
                  <span style={{ color: "#3b82f6", fontSize: 12 }}>(현재)</span>
                )}
              </div>
              <div style={{ color: "#999", fontSize: 12 }}>
                {new Date(r.created_at).toLocaleString("ko-KR")} · {r.title}
              </div>
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
