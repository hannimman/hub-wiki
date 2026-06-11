import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listTrash } from "@/lib/pages";
import EmptyTrashButton from "./EmptyTrashButton";

export const dynamic = "force-dynamic";

// 휴지통 — 삭제된 글이 메인 화면에 리스트로 표시된다.
// 항목 클릭 → 삭제글 보기(/wiki/trash/[id], 복원 버튼 포함).
export default async function TrashPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = await listTrash();
  const isAdmin = user.role === "admin" || user.role === "super";

  return (
    <main style={{ padding: "28px 28px 72px", maxWidth: 920 }}>
      <div className="row-between">
        <h1 style={{ margin: 0 }}>🗑️ 휴지통</h1>
        {isAdmin && items.length > 0 && <EmptyTrashButton count={items.length} />}
      </div>
      <p className="muted" style={{ marginTop: 6 }}>
        삭제된 글을 클릭하면 내용을 확인하고 복원할 수 있습니다.
        {isAdmin && " 영구 삭제는 관리자만 가능합니다."}
      </p>

      {items.length === 0 ? (
        <p className="muted" style={{ marginTop: 24 }}>휴지통이 비어 있습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0" }}>
          {items.map((t) => (
            <li
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span>{t.is_folder ? "📁" : "📄"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link
                  href={`/wiki/trash/${t.id}`}
                  style={{
                    fontWeight: 600,
                    textDecoration: "line-through",
                    textDecorationColor: "rgba(139,149,163,0.6)",
                  }}
                >
                  {t.title}
                </Link>
                <div className="muted" style={{ fontSize: 12 }}>
                  {t.deleted_by_name ? `${t.deleted_by_name} 님이 삭제` : "삭제"}
                  {t.deleted_at
                    ? ` · ${new Date(t.deleted_at).toLocaleString("ko-KR")}`
                    : ""}
                </div>
              </div>
              <Link className="btn btn-sm" href={`/wiki/trash/${t.id}`}>
                보기
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
