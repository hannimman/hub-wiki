import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { diffLines } from "diff";
import { getCurrentUser } from "@/lib/auth";
import { getPageBySlug, getRevisionForDiff } from "@/lib/pages";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = {
  maxWidth: 820,
  margin: "32px auto",
  padding: "0 20px",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export default async function RevDiffPage({
  params,
}: {
  params: Promise<{ slug: string; revId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug, revId } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  const data = await getRevisionForDiff(page.id, revId);
  if (!data) notFound();
  const { cur, prev } = data;
  const parts = diffLines(prev?.content ?? "", cur.content ?? "");

  return (
    <main style={wrap}>
      <Link href={`/wiki/${slug}/history`} style={{ color: "#666", fontSize: 14 }}>
        ← 이력
      </Link>
      <h1 style={{ marginTop: 8 }}>변경 내역</h1>
      <div style={{ color: "#999", fontSize: 13, marginBottom: 4 }}>
        {new Date(cur.created_at).toLocaleString("ko-KR")}
      </div>
      {cur.summary && (
        <div style={{ marginBottom: 16 }}>요약: {cur.summary}</div>
      )}

      {prev ? (
        <div
          style={{
            border: "1px solid #e2e2e2",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {parts.flatMap((part, pi) => {
            const lines = part.value.replace(/\n$/, "").split("\n");
            const sign = part.added ? "+" : part.removed ? "-" : " ";
            const bg = part.added ? "#e6ffed" : part.removed ? "#ffeef0" : "#fff";
            const color = part.added ? "#22863a" : part.removed ? "#b31d28" : "#444";
            return lines.map((ln, li) => (
              <div
                key={`${pi}-${li}`}
                style={{
                  background: bg,
                  color,
                  whiteSpace: "pre-wrap",
                  padding: "1px 8px",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 13,
                }}
              >
                <span style={{ userSelect: "none", opacity: 0.5 }}>{sign} </span>
                {ln || " "}
              </div>
            ));
          })}
        </div>
      ) : (
        <div>
          <p style={{ color: "#888" }}>최초 버전입니다. (이전 버전 없음)</p>
          <pre
            style={{
              background: "#f6f8fa",
              padding: 16,
              borderRadius: 8,
              whiteSpace: "pre-wrap",
              fontSize: 13,
            }}
          >
            {cur.content}
          </pre>
        </div>
      )}
    </main>
  );
}
