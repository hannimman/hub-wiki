import Link from "next/link";
import {
  getRatingsOverview,
  getUserRatingsDetail,
  type UserRatingDoc,
} from "@/lib/admin-stats";
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

// 점수 분포 미니 막대 (0~100, 10점 단위 11칸) — 평가자 익명 유지, 분포만 시각화.
function DistBar({ dist, count }: { dist: number[]; count: number }) {
  const max = Math.max(1, ...dist);
  return (
    <span
      title="점수 분포 (0→100점)"
      style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 26 }}
    >
      {dist.map((c, i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: `${Math.round((c / max) * 24) + 2}px`,
            background: c ? "#3b82f6" : "#e5e9f0",
            borderRadius: 2,
            opacity: c ? 1 : 0.5,
          }}
        />
      ))}
      <span className="muted" style={{ fontSize: 11, marginLeft: 4 }}>
        {count}건
      </span>
    </span>
  );
}

// 평가 현황 — 전체 요약 / 글별 / 사용자별(받은 점수) + 사용자 클릭 시 받은 평가 상세.
export default async function AdminRatingsPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const { user: selectedId } = await searchParams;
  const { global, pages, users } = await getRatingsOverview();
  const selectedRow = selectedId
    ? users.find((r) => r.user.id === selectedId) ?? null
    : null;
  const detail = selectedRow
    ? await getUserRatingsDetail(selectedRow.user.id)
    : null;

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
              <tr
                key={r.user.id}
                style={
                  selectedRow?.user.id === r.user.id
                    ? { background: "#eef5ff" }
                    : undefined
                }
              >
                <td style={td}>
                  {r.count > 0 ? (
                    <Link
                      href={`/admin/ratings?user=${r.user.id}`}
                      className="row"
                      style={{ gap: 8, textDecoration: "none", color: "inherit" }}
                    >
                      <Avatar
                        id={r.user.avatar}
                        config={r.user.avatar_config}
                        size={26}
                        ownerId={r.user.id}
                        ownerName={r.user.display_name}
                      />
                      <b>{r.user.display_name}</b>
                      {!r.user.is_active && (
                        <span className="muted" style={{ fontSize: 12 }}>
                          (비활성)
                        </span>
                      )}
                    </Link>
                  ) : (
                    <span className="row" style={{ gap: 8 }}>
                      <Avatar
                        id={r.user.avatar}
                        config={r.user.avatar_config}
                        size={26}
                        ownerId={r.user.id}
                        ownerName={r.user.display_name}
                      />
                      <b>{r.user.display_name}</b>
                      {!r.user.is_active && (
                        <span className="muted" style={{ fontSize: 12 }}>
                          (비활성)
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td style={td}>{r.avg != null ? `${r.avg}점` : "—"}</td>
                <td style={td}>{r.count}</td>
                <td style={td}>{r.ratedPages}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRow && detail ? (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 16 }} className="row">
            <Avatar
              id={selectedRow.user.avatar}
              config={selectedRow.user.avatar_config}
              size={28}
            />
            <span style={{ marginLeft: 8 }}>
              {selectedRow.user.display_name} 님이 받은 평가
            </span>
            <span className="muted" style={{ fontSize: 13, marginLeft: 8 }}>
              평균 {detail.totalAvg != null ? `${detail.totalAvg}점` : "—"} ·{" "}
              {detail.totalCount}건 · {detail.docs.length}개 글
            </span>
            <Link
              href="/admin/ratings"
              className="muted"
              style={{ fontSize: 12, marginLeft: "auto" }}
            >
              닫기 ✕
            </Link>
          </h3>

          {detail.docs.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              이 사용자가 작성한 글에 받은 평가가 없습니다.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>문서</th>
                    <th style={th}>평균</th>
                    <th style={th}>점수 분포 (0→100)</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.docs.map((d: UserRatingDoc) => (
                    <tr key={d.id}>
                      <td style={td}>
                        <Link href={`/wiki/${d.slug}`} style={{ fontWeight: 600 }}>
                          {d.title}
                        </Link>
                      </td>
                      <td style={td}>
                        <b>{d.avg}점</b>
                      </td>
                      <td style={td}>
                        <DistBar dist={d.dist} count={d.count} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
          사용자를 클릭하면 그 사람이 받은 평가를 글별로(점수 분포 포함) 볼 수 있어요.
        </p>
      )}
    </section>
  );
}
