"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownView from "@/lib/markdown";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 16,
  boxSizing: "border-box",
};

export default function PageEditor({
  mode,
  pageId,
  baseRevisionId,
  initialTitle = "",
  initialContent = "",
  ratingsAllowed = false,
  initialRatingsEnabled = false,
}: {
  mode: "new" | "edit";
  pageId?: string;
  baseRevisionId?: string | null;
  initialTitle?: string;
  initialContent?: string;
  ratingsAllowed?: boolean;
  initialRatingsEnabled?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [summary, setSummary] = useState("");
  const [ratingsEnabled, setRatingsEnabled] = useState(initialRatingsEnabled);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setError(null);
    setLoading(true);
    try {
      const url = mode === "new" ? "/api/pages" : `/api/pages/${pageId}`;
      const method = mode === "new" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          summary,
          ratingsEnabled,
          baseRevisionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        setLoading(false);
        return;
      }
      router.push(`/wiki/${data.slug}`);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  const tabBtn = (key: "write" | "preview", label: string) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      style={{
        padding: "6px 14px",
        border: "none",
        borderBottom: tab === key ? "2px solid #3b82f6" : "2px solid transparent",
        background: "none",
        fontWeight: tab === key ? 700 : 400,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <input
        style={{ ...inputStyle, fontSize: 22, fontWeight: 700, marginBottom: 14 }}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="문서 제목"
        maxLength={200}
      />

      <div style={{ borderBottom: "1px solid #e2e2e2", marginBottom: 10 }}>
        {tabBtn("write", "작성")}
        {tabBtn("preview", "미리보기")}
      </div>

      {tab === "write" ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="마크다운으로 작성하세요. 코드블록에 mermaid 를 쓰면 다이어그램이 그려져요."
          style={{
            ...inputStyle,
            minHeight: 360,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 14,
            lineHeight: 1.6,
            resize: "vertical",
          }}
        />
      ) : (
        <div
          style={{
            minHeight: 360,
            border: "1px solid #eee",
            borderRadius: 8,
            padding: 16,
          }}
        >
          {content.trim() ? (
            <MarkdownView content={content} />
          ) : (
            <span style={{ color: "#999" }}>(내용 없음)</span>
          )}
        </div>
      )}

      <input
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="변경 요약 (선택) — 무엇을 왜 바꿨는지"
        maxLength={200}
        style={{ ...inputStyle, marginTop: 12, fontSize: 14 }}
      />

      {ratingsAllowed && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
            fontSize: 14,
          }}
        >
          <input
            type="checkbox"
            checked={ratingsEnabled}
            onChange={(e) => setRatingsEnabled(e.target.checked)}
          />
          ⭐ 이 글에 평가(점수) 받기
        </label>
      )}

      {error && (
        <div style={{ color: "#c62828", marginTop: 12 }}>{error}</div>
      )}

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button
          onClick={save}
          disabled={loading || !title.trim()}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: loading || !title.trim() ? "#93c5fd" : "#3b82f6",
            color: "#fff",
            fontWeight: 700,
            cursor: loading || !title.trim() ? "default" : "pointer",
          }}
        >
          {loading ? "저장 중…" : "저장"}
        </button>
        <button
          onClick={() => router.back()}
          type="button"
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          취소
        </button>
      </div>
    </div>
  );
}
