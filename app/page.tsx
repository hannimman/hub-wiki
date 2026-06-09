import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/lib/avatars";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = {
  maxWidth: 680,
  margin: "40px auto",
  padding: "0 20px",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  lineHeight: 1.6,
};

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main style={wrap}>
      <h1>📚 팀 위키</h1>

      {user ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            border: "1px solid #e2e2e2",
            borderRadius: 12,
          }}
        >
          <Avatar id={user.avatar} config={user.avatar_config} size={48} />
          <div style={{ flex: 1 }}>
            <div>
              <b>{user.display_name}</b> 님 {user.role === "admin" ? "👑 관리자" : ""}
            </div>
            <div style={{ color: "#888", fontSize: 13 }}>@{user.username}</div>
          </div>
          <Link
            href="/me"
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              textDecoration: "none",
              color: "#333",
            }}
          >
            마이페이지
          </Link>
          <LogoutButton />
        </div>
      ) : (
        <p>
          <Link href="/login">로그인</Link> 후 글을 작성할 수 있어요. (읽기는
          누구나 가능)
        </p>
      )}

      <div style={{ marginTop: 28 }}>
        {user ? (
          <Link
            href="/wiki"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: 10,
              background: "#3b82f6",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            📖 위키 문서 보기
          </Link>
        ) : (
          <p style={{ color: "#666" }}>
            로그인하면 위키 문서를 보고 작성할 수 있어요.
          </p>
        )}
      </div>
    </main>
  );
}
