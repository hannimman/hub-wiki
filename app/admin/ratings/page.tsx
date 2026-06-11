import Link from "next/link";
import { getRatingsOverview } from "@/lib/admin-stats";
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
const card: React.CSSProperties = {
  flex: 1,
  minWidth: 140,
  padding: "14px 16px",
  border: "1px solid var(--border)",
  borderRadius: 12,
  background: "#fbfcfd",
};

// 평가 현황 — 전체 요약 / 글별 / 사용자별(받은 점수).
export default async function AdminRatingsPage() {
  const { global, pages, users } = await getRatingsOverview();

  return (
    <section>
      <h2 style={{ fontSize: 18 }}>⭐ 평가 현황</h2>

      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div style={card}>
          <div className="muted" style={{ fontSize: 12 }}>총 평가 수</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{global.total}</div>
        </div>
        <div style={card}>
          <div className="muted" style={{ fontSize: 12 }}>전체 평균</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {global.avg != null ? `${global.avg}점` : "—"}
          </div>
        </div>
        <div style={card}>
          <div className="muted" style={{ fontSize: 12 }}>참여 평가자</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{global.raters}명</div>
        </div>
      </div>

      <h3 style={{ fontSize: 15, marginTop: 24 }}>📄 글별 점수 ({pages.length})</h3>
      {pages.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>아직 평가된 글이 없습니다.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>문서</th>
                <th style={th}>작성자</th>
                <th style={th}>평균</th>
                <th style={th}>평가 수</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id}>
                  <td style={td}>
                    <Link href={`/wiki/${p.slug}`} style={{ fontWeight: 600 }}>
                      {p.title}
                    </Link>
                  </td>
                  <td style={td}>{p.authorName ?? "—"}</td>
                  <td style={td}>
                    <b>{p.avg}점</b>
                  </td>
                  <td style={td}>{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 style={{ fontSize: 15, marginTop: 24 }}>👤 사용자별 받은 점수</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>사용자</th>
              <th style={th}>받은 평균</th>
              <th style={th}>받은 평가 수</th>
              <th style={th}>평가된 글</th>
            </tr>
          </thead>
          <tbody>
            {users.map((r) => (
              <tr key={r.user.id}>
                <td style={td}>
                  <span className="row" style={{ gap: 8 }}>
                    <Avatar
                      id={r.user.avatar}
                      config={r.user.avatar_config}
                      size={26}
                    />
                    <b>{r.user.display_name}</b>
                    {!r.user.is_active && (
                      <span className="muted" style={{ fontSize: 12 }}>
                        (비활성)
                      </span>
                    )}
                  </span>
                </td>
                <td style={td}>{r.avg != null ? `${r.avg}점` : "—"}</td>
                <td style={td}>{r.count}</td>
                <td style={td}>{r.ratedPages}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
