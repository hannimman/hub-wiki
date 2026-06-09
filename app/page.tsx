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
          <Avatar id={user.avatar} size={48} />
          <div style={{ flex: 1 }}>
            <div>
              <b>{user.display_name}</b> 님 {user.role === "admin" ? "👑 관리자" : ""}
            </div>
            <div style={{ color: "#888", fontSize: 13 }}>@{user.username}</div>
          </div>
          <LogoutButton />
        </div>
      ) : (
        <p>
          <Link href="/login">로그인</Link> 후 글을 작성할 수 있어요. (읽기는
          누구나 가능)
        </p>
      )}

      <p style={{ marginTop: 24, color: "#666" }}>
        위키 기능(문서 작성·검색 등)은 다음 단계에서 추가됩니다.
      </p>
    </main>
  );
}
