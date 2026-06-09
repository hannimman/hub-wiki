import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listRecentChanges } from "@/lib/pages";
import { Avatar } from "@/lib/avatars";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = {
  maxWidth: 820,
  margin: "32px auto",
  padding: "0 20px",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export default async function RecentChangesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const changes = await listRecentChanges();

  return (
    <main style={wrap}>
      <Link href="/wiki" style={{ color: "#666", fontSize: 14 }}>
        ← 위키 목록
      </Link>
      <h1 style={{ marginTop: 8 }}>🕒 최근 변경</h1>

      {changes.length === 0 ? (
        <p style={{ color: "#888" }}>아직 변경 내역이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {changes.map((c) => (
            <li
              key={c.revision_id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <Avatar id={c.author_avatar} config={c.author_config} size={32} />
              <div style={{ flex: 1 }}>
                <Link
                  href={`/wiki/${c.slug}`}
                  style={{ fontWeight: 600, textDecoration: "none" }}
                >
                  {c.page_title}
                </Link>
                <div style={{ color: "#999", fontSize: 12 }}>
                  {c.author_name ?? "알 수 없음"} ·{" "}
                  {new Date(c.created_at).toLocaleString("ko-KR")}
                  {c.summary ? ` · ${c.summary}` : ""}
                </div>
              </div>
              <Link
                href={`/wiki/${c.slug}/rev/${c.revision_id}`}
                style={{ fontSize: 12, color: "#3b82f6" }}
              >
                변경내역
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
