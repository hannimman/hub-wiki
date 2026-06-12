import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  isV2,
  DEFAULT_AVATAR_V2,
  AvatarFullV2,
  type AvatarV2Data,
} from "@/lib/avatar/render";
import {
  getPoints,
  hasCheckedInToday,
  listTransactions,
  resolveUserNames,
} from "@/lib/points";
import { listMyPrivatePages } from "@/lib/pages";
import AttendanceCard from "./AttendanceCard";
import PointHistoryButton from "./PointHistoryButton";
import MyPasswordForm from "./MyPasswordForm";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  super: "🦸 슈퍼",
  admin: "👑 관리자",
  member: "",
};

export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [points, checkedIn, rawTxs, privatePages] = await Promise.all([
    getPoints(user.id),
    hasCheckedInToday(user.id),
    listTransactions(user.id, 30),
    listMyPrivatePages(user.id),
  ]);

  // 선물 이력의 ref(상대 uuid)를 이름으로 바꿔 표시
  const giftIds = [
    ...new Set(
      rawTxs
        .filter((t) => t.reason === "gift_sent" || t.reason === "gift_received")
        .map((t) => t.ref)
        .filter((v): v is string => !!v)
    ),
  ];
  const names = await resolveUserNames(giftIds);
  const txs = rawTxs.map((t) =>
    (t.reason === "gift_sent" || t.reason === "gift_received") && t.ref
      ? { ...t, ref: names[t.ref] ?? t.ref }
      : t
  );

  const avatarData: AvatarV2Data = isV2(user.avatar_config)
    ? (user.avatar_config as AvatarV2Data)
    : DEFAULT_AVATAR_V2;

  return (
    <main className="container page" style={{ maxWidth: 760 }}>
      <h1>마이페이지</h1>

      <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
          flexWrap: "wrap",
          margin: "16px 0 24px",
        }}
      >
        {/* 내 캐릭터 (전신) */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <AvatarFullV2 data={avatarData} width={180} uid="me" />
          </div>
          <Link
            href="/me/shop"
            className="btn btn-primary"
            style={{ marginTop: 10, width: "100%", justifyContent: "center" }}
          >
            🛍️ 아바타 상점 · 꾸미기
          </Link>
        </div>

        {/* 프로필 + 포인트 */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 20 }}>
            <b>{user.display_name}</b>{" "}
            {ROLE_LABEL[user.role] && (
              <span className="role-badge">{ROLE_LABEL[user.role]}</span>
            )}
          </div>
          <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
            @{user.username}
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div
              className="row"
              style={{ marginBottom: 10, flexWrap: "wrap" }}
            >
              <span style={{ fontSize: 15 }}>
                내 포인트:{" "}
                <b style={{ color: "#b45309" }}>
                  🪙 {points.toLocaleString()}P
                </b>
              </span>
              <PointHistoryButton txs={txs} />
            </div>
            <AttendanceCard checkedIn={checkedIn} />
          </div>
        </div>
      </div>

      {privatePages.length > 0 && (
        <>
          <h2
            style={{
              fontSize: 18,
              marginTop: 36,
              paddingTop: 24,
              borderTop: "1px solid var(--border)",
            }}
          >
            🔒 내 비공개 글 ({privatePages.length})
          </h2>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            모든 목록에서 숨겨진 글입니다. 본인만 볼 수 있으며, 글에서 공개로
            전환할 수 있어요.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {privatePages.map((p) => (
              <li
                key={p.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "9px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span>🔒</span>
                <Link href={`/wiki/${p.slug}`} style={{ fontWeight: 600, flex: 1 }}>
                  {p.title}
                </Link>
                <span className="muted" style={{ fontSize: 12 }}>
                  {new Date(p.updated_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2
        style={{
          fontSize: 18,
          marginTop: 36,
          paddingTop: 24,
          borderTop: "1px solid var(--border)",
        }}
      >
        비밀번호 변경
      </h2>
      <MyPasswordForm />
    </main>
  );
}
