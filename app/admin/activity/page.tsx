import Link from "next/link";
import {
  getUserActivitySummary,
  getUserActivityDetail,
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

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString("ko-KR") : "—";
}

// 사용자별 작성·기여 활동. 행 클릭(?user=) → 하단에 작성글/기여글 목록.
export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const { user: selectedId } = await searchParams;
  const rows = await getUserActivitySummary();
  const selected = selectedId
    ? rows.find((r) => r.user.id === selectedId) ?? null
    : null;
  const detail = selected ? await getUserActivityDetail(selected.user.id) : null;

  return (
    <section>
      <h2 style={{ fontSize: 18 }}>📝 사용자별 활동</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>사용자</th>
              <th style={th}>작성 글</th>
              <th style={th}>기여 글</th>
              <th style={th}>리비전</th>
              <th style={th}>받은 평점</th>
              <th style={th}>마지막 활동</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.user.id}
                style={
                  selected?.user.id === r.user.id
                    ? { background: "#eef5ff" }
                    : undefined
                }
              >
                <td style={td}>
                  <Link
                    href={`/admin/activity?user=${r.user.id}`}
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
                </td>
                <td style={td}>{r.authored}</td>
                <td style={td}>{r.contributed}</td>
                <td style={td}>{r.revisions}</td>
                <td style={td}>
                  {r.receivedAvg != null
                    ? `${r.receivedAvg}점 (${r.receivedCount}건)`
                    : "—"}
                </td>
                <td style={td}>{fmt(r.lastActivity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && detail && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 18 }} className="row">
            <Avatar
              id={selected.user.avatar}
              config={selected.user.avatar_config}
              size={30}
            />
            <span style={{ marginLeft: 8 }}>
              {selected.user.display_name} 님의 활동
            </span>
          </h2>

          <h3 style={{ fontSize: 15, marginTop: 18 }}>
            ✍️ 작성글 ({detail.authored.length})
          </h3>
          {detail.authored.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>작성한 글이 없습니다.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {detail.authored.map((p) => (
                <li
                  key={p.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <Link href={`/wiki/${p.slug}`} style={{ fontWeight: 600, flex: 1 }}>
                    {p.title}
                  </Link>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {p.avg != null ? `⭐ ${p.avg}점 (${p.count})` : "평가 없음"}
                    {" · "}
                    {fmt(p.updated_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ fontSize: 15, marginTop: 18 }}>
            🤝 기여글 ({detail.contributed.length})
          </h3>
          {detail.contributed.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              다른 사람 글에 기여한 내역이 없습니다.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {detail.contributed.map((p) => (
                <li
                  key={p.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <Link href={`/wiki/${p.slug}`} style={{ fontWeight: 600, flex: 1 }}>
                    {p.title}
                  </Link>
                  <span className="muted" style={{ fontSize: 12 }}>
                    작성자 {p.authorName ?? "?"} · 리비전 {p.myRevisions}회 · 마지막{" "}
                    {fmt(p.lastAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!selected && (
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
          사용자를 클릭하면 작성글·기여글 목록이 아래에 표시됩니다.
        </p>
      )}
    </section>
  );
}
