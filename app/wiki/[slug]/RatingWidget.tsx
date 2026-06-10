"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RatingWidget({
  pageId,
  isAuthor,
  myScore,
  canRate,
  canView,
  avg,
  count,
}: {
  pageId: string;
  isAuthor: boolean;
  myScore: number | null;
  canRate: boolean;
  canView: boolean;
  avg: number | null;
  count: number | null;
}) {
  const router = useRouter();
  const [score, setScore] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 보여줄 게 없으면 위젯 자체를 숨김
  if (!canView && !canRate && myScore === null) return null;

  async function submit() {
    if (
      !confirm(
        `이 문서에 ${score}점을 매깁니다.\n⚠️ 한 번 저장하면 수정할 수 없습니다. 계속할까요?`
      )
    )
      return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pages/${pageId}/rate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ score }),
      });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        setError(data.error ?? "저장 실패");
        setLoading(false);
      }
    } catch {
      setError("네트워크 오류");
      setLoading(false);
    }
  }

  const options = [];
  for (let v = 0; v <= 100; v += 10) options.push(v);

  return (
    <div
      style={{
        marginTop: 32,
        padding: 16,
        border: "1px solid #e2e2e2",
        borderRadius: 12,
        background: "#fafbfc",
      }}
    >
      <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>⭐ 평가</h3>

      {canView && count !== null && (
        <div style={{ marginBottom: 12 }}>
          평균{" "}
          <b style={{ fontSize: 18 }}>{count ? avg : "-"}</b>점{" "}
          <span style={{ color: "#888" }}>
            {count ? `(${count}명 평가)` : "(아직 평가 없음)"}
          </span>
        </div>
      )}

      {isAuthor ? (
        <div style={{ color: "#888" }}>본인이 작성한 문서는 평가할 수 없어요.</div>
      ) : myScore !== null ? (
        <div>
          내 점수: <b style={{ fontSize: 18 }}>{myScore}</b>점{" "}
          <span style={{ color: "#c62828", fontSize: 13 }}>(수정 불가)</span>
        </div>
      ) : canRate ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 15 }}
          >
            {options.map((v) => (
              <option key={v} value={v}>
                {v}점
              </option>
            ))}
          </select>
          <button
            onClick={submit}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: loading ? "#93c5fd" : "#3b82f6",
              color: "#fff",
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "저장 중…" : "점수 저장"}
          </button>
          {error && <span style={{ color: "#c62828" }}>{error}</span>}
        </div>
      ) : null}
    </div>
  );
}
