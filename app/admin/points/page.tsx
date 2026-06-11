import { getPointsOverview } from "@/lib/admin-stats";
import { REASON_LABEL } from "@/lib/points-shared";
import { ITEM_INDEX } from "@/lib/avatar/catalog";
import { Avatar } from "@/lib/avatars";

export const dynamic = "force-dynamic";

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  fontSize: 13,
  color: "var(--muted)",
  borderBottom: "1px solid var(--border)",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid var(--border)",
  fontSize: 14,
};

function describeRef(reason: string, ref: string | null): string {
  if (!ref) return "";
  if (reason === "buy") return ITEM_INDEX[ref]?.item.name ?? ref;
  return ref;
}

// 포인트 현황 (읽기 전용). 지급/회수 기능 자체는 슈퍼 전용이므로 UI 에 언급하지 않는다.
export default async function AdminPointsPage() {
  const { balances, recent } = await getPointsOverview();

  return (
    <section>
      <h2 style={{ fontSize: 18 }}>🪙 포인트 현황</h2>
      <p className="muted" style={{ fontSize: 13 }}>
        포인트 잔액과 변동 내역을 확인할 수 있습니다.
      </p>

      <h3 style={{ fontSize: 15, marginTop: 18 }}>잔액 순위</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>사용자</th>
              <th style={th}>잔액</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((u, i) => (
              <tr key={u.id}>
                <td style={td}>{i + 1}</td>
                <td style={td}>
                  <span className="row" style={{ gap: 8 }}>
                    <Avatar
                      id={u.avatar}
                      config={u.avatar_config}
                      size={26}
                      ownerId={u.id}
                      ownerName={u.display_name}
                    />
                    <b>{u.display_name}</b>
                    {!u.is_active && (
                      <span className="muted" style={{ fontSize: 12 }}>
                        (비활성)
                      </span>
                    )}
                  </span>
                </td>
                <td style={td}>
                  <b>🪙 {u.points.toLocaleString()}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ fontSize: 15, marginTop: 24 }}>최근 변동 ({recent.length})</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>일시</th>
              <th style={th}>사용자</th>
              <th style={th}>변동</th>
              <th style={th}>사유</th>
              <th style={th}>내역</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((t) => (
              <tr key={t.id}>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  {new Date(t.created_at).toLocaleString("ko-KR")}
                </td>
                <td style={td}>{t.userName}</td>
                <td
                  style={{
                    ...td,
                    color: t.amount >= 0 ? "#2e7d32" : "#c62828",
                    fontWeight: 700,
                  }}
                >
                  {t.amount >= 0 ? "+" : ""}
                  {t.amount.toLocaleString()}
                </td>
                <td style={td}>
                  {REASON_LABEL[t.reason as keyof typeof REASON_LABEL] ??
                    t.reason}
                </td>
                <td style={{ ...td, fontSize: 13 }} className="muted">
                  {describeRef(t.reason, t.ref)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
