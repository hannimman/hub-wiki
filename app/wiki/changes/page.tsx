import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listRecentChanges } from "@/lib/pages";
import { Avatar } from "@/lib/avatars";

export const dynamic = "force-dynamic";

export default async function RecentChangesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const changes = await listRecentChanges(user.id); // 내 비공개 글 변경은 나에게만

  return (
    <main className="container page">
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
              <Avatar
                id={c.author_avatar}
                config={c.author_config}
                size={32}
                ownerId={c.author_id}
                ownerName={c.author_name}
              />
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
              {c.kind === "edit" ? (
                <Link
                  href={`/wiki/${c.slug}/rev/${c.revision_id}`}
                  style={{ fontSize: 12, color: "#3b82f6" }}
                >
                  변경내역
                </Link>
              ) : (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "2px 10px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                    ...(c.kind === "create"
                      ? { background: "#e8f5e9", color: "#2e7d32" }
                      : c.kind === "delete"
                      ? { background: "#fdecea", color: "#c62828" }
                      : { background: "#e3f2fd", color: "#1565c0" }),
                  }}
                >
                  {c.kind === "create"
                    ? "🌱 최초 작성"
                    : c.kind === "delete"
                    ? "🗑 삭제"
                    : "♻ 복원"}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
