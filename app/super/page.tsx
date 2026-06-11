import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getRatingsEnabled } from "@/lib/ratings";
import { getPointConfig } from "@/lib/points";
import { listUsers } from "@/lib/admin";
import SuperControls from "./SuperControls";

export const dynamic = "force-dynamic";

export default async function SuperPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super") redirect("/");

  const ratingsEnabled = await getRatingsEnabled();
  const users = await listUsers();
  const pointConfig = await getPointConfig();

  return (
    <main className="container page">
      <h1>🦸 슈퍼 제어판</h1>
      <p style={{ margin: "0 0 16px" }}>
        <Link
          href="/super/items"
          style={{
            display: "inline-block",
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #ccc",
            textDecoration: "none",
            color: "#333",
            marginRight: 8,
          }}
        >
          🎒 아이템 관리 (등록 · 비활성 · 가격) →
        </Link>
        <Link
          href="/admin"
          style={{
            display: "inline-block",
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #ccc",
            textDecoration: "none",
            color: "#333",
          }}
        >
          🛡️ 관리자 화면 (초대 발급 · 사용자 · 분석) →
        </Link>
      </p>
      <SuperControls
        ratingsEnabled={ratingsEnabled}
        users={users}
        meId={user.id}
        pointConfig={pointConfig}
      />
    </main>
  );
}
