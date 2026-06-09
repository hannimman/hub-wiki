import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/lib/avatars";
import MyAvatarForm from "./MyAvatarForm";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = {
  maxWidth: 520,
  margin: "40px auto",
  padding: "0 20px",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main style={wrap}>
      <Link href="/" style={{ color: "#666", fontSize: 14 }}>
        ← 홈
      </Link>
      <h1>마이페이지</h1>

      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "16px 0 28px" }}>
        <Avatar id={user.avatar} config={user.avatar_config} size={64} />
        <div>
          <div style={{ fontSize: 18 }}>
            <b>{user.display_name}</b> {user.role === "admin" ? "👑" : ""}
          </div>
          <div style={{ color: "#888", fontSize: 13 }}>@{user.username}</div>
        </div>
      </div>

      <h2 style={{ fontSize: 18 }}>아바타 변경</h2>
      <MyAvatarForm
        initialAvatar={user.avatar}
        initialConfig={user.avatar_config}
      />
    </main>
  );
}
