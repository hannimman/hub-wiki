import Link from "next/link";
import { getContentHealth, type HealthDoc } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";

function DocList({ docs, empty }: { docs: HealthDoc[]; empty: string }) {
  if (docs.length === 0)
    return <p className="muted" style={{ fontSize: 13 }}>{empty}</p>;
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {docs.map((d) => (
        <li
          key={d.id}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Link href={`/wiki/${d.slug}`} style={{ fontWeight: 600, flex: 1 }}>
            {d.title}
          </Link>
          <span className="muted" style={{ fontSize: 12 }}>
            마지막 수정 {new Date(d.updated_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
          </span>
        </li>
      ))}
    </ul>
  );
}

// 콘텐츠 건강 리포트 — 방치/빈/무평가 문서.
export default async function AdminContentPage() {
  const { stale, empty, unrated, staleDays } = await getContentHealth();

  return (
    <section>
      <h2 style={{ fontSize: 18 }}>🩺 콘텐츠 건강</h2>
      <p className="muted" style={{ fontSize: 13 }}>
        손볼 문서를 찾는 리포트입니다. 오래된 문서는 내용이 아직 유효한지
        확인해보세요.
      </p>

      <h3 style={{ fontSize: 15, marginTop: 20 }}>
        🕰️ {staleDays}일 이상 미수정 ({stale.length})
      </h3>
      <DocList docs={stale} empty={`${staleDays}일 넘게 방치된 문서가 없습니다. 👍`} />

      <h3 style={{ fontSize: 15, marginTop: 24 }}>
        📭 본문이 빈 문서 ({empty.length})
      </h3>
      <DocList docs={empty} empty="본문이 빈 문서가 없습니다. 👍" />

      <h3 style={{ fontSize: 15, marginTop: 24 }}>
        🫥 평가가 없는 문서 ({unrated.length})
      </h3>
      <DocList docs={unrated} empty="모든 문서가 평가를 받았습니다. 👍" />
    </section>
  );
}
