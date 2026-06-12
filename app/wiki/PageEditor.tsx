"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import MarkdownView from "@/lib/markdown";

// ── 이미지 업로드 ──
// 무료 용량(Storage 1GB)·Netlify 페이로드 한계를 위해 업로드 전 클라에서 축소.
const IMG_MAX_DIM = 1600;
const IMG_MAX_BYTES = 5 * 1024 * 1024;

// GIF(애니메이션)는 재인코딩하면 깨지므로 원본 유지, 나머지는 큰 경우 WebP 로 축소.
async function shrinkImage(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, IMG_MAX_DIM / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size <= IMG_MAX_BYTES) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/webp", 0.92)
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // 디코딩 실패 시 원본 그대로 (서버가 최종 검증)
  }
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 16,
  boxSizing: "border-box",
};

export type ParentOption = { id: string; label: string };

export default function PageEditor({
  mode,
  pageId,
  baseRevisionId,
  initialTitle = "",
  initialContent = "",
  ratingsAllowed = false,
  initialRatingsEnabled = false,
  parentOptions = [],
  initialParentId = null,
}: {
  mode: "new" | "edit";
  pageId?: string;
  baseRevisionId?: string | null;
  initialTitle?: string;
  initialContent?: string;
  ratingsAllowed?: boolean;
  initialRatingsEnabled?: boolean;
  parentOptions?: ParentOption[];
  initialParentId?: string | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [summary, setSummary] = useState("");
  const [ratingsEnabled, setRatingsEnabled] = useState(initialRatingsEnabled);
  const [parentId, setParentId] = useState<string>(initialParentId ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");

  // 같은 /wiki/new 화면에서 다른 폴더의 "＋글"을 눌러 ?parent= 만 바뀌는 경우,
  // 컴포넌트가 재마운트되지 않으므로 상위 폴더 선택을 prop 변화에 맞춰 동기화한다.
  // (작성 중인 제목/본문은 유지)
  useEffect(() => {
    setParentId(initialParentId ?? "");
  }, [initialParentId]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── 이미지 첨부 (붙여넣기 / 드래그&드롭 / 📎 버튼) ──
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  function insertAtCursor(text: string) {
    const ta = taRef.current;
    if (!ta) {
      setContent((c) => c + text);
      return;
    }
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    setContent((c) => c.slice(0, start) + text + c.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + text.length;
    });
  }

  async function uploadImages(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    setTab("write");
    for (const f of images) {
      const token = `![업로드 중…](#up-${Math.random().toString(36).slice(2)})`;
      insertAtCursor(`${token}\n`);
      setUploadingCount((n) => n + 1);
      try {
        const blob = await shrinkImage(f);
        if (blob.size > IMG_MAX_BYTES)
          throw new Error("이미지가 5MB를 넘습니다. 더 작은 이미지를 사용해주세요.");
        const fd = new FormData();
        fd.append("file", blob, f.name || "image");
        const res = await fetch("/api/files", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "업로드 실패");
        setContent((c) => c.replace(token, `![이미지](${data.url})`));
      } catch (e) {
        setContent((c) => c.replace(`${token}\n`, "").replace(token, ""));
        alert(e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.");
      } finally {
        setUploadingCount((n) => n - 1);
      }
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    const files = Array.from(e.clipboardData?.items ?? [])
      .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
      .map((it) => it.getAsFile())
      .filter((f): f is File => !!f);
    if (files.length > 0) {
      e.preventDefault();
      uploadImages(files);
    }
  }

  function onDrop(e: React.DragEvent) {
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.some((f) => f.type.startsWith("image/"))) {
      e.preventDefault();
      uploadImages(files);
    }
  }

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
          parentId: parentId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        setLoading(false);
        return;
      }
      if (data.drop) {
        // 🎁 새 글 복권 — 이동 전에 알림 (왜 받았는지 알 수 있게 스토리텔링)
        alert(
          `🎉 새 글 복권 당첨!\n\n` +
            `방금 쓴 글에 복권이 한 장 따라왔는데... 긁어보니 당첨이에요!\n` +
            `🎁 「${data.drop.name}」 획득 — 인벤토리에 넣어드렸어요.\n\n` +
            `(정성껏 글을 쓰면 가끔 복권이 따라옵니다 ✍️🍀)`
        );
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

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          fontSize: 14,
        }}
      >
        <span style={{ color: "#555", whiteSpace: "nowrap" }}>📁 상위 폴더</span>
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          style={{ ...inputStyle, fontSize: 14, width: "auto", flex: 1 }}
        >
          <option value="">(최상위)</option>
          {parentOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <div
        style={{
          borderBottom: "1px solid #e2e2e2",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
        }}
      >
        {tabBtn("write", "작성")}
        {tabBtn("preview", "미리보기")}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="이미지 첨부 (붙여넣기/드래그도 가능)"
          style={{
            padding: "4px 10px",
            border: "1px solid #d0d7de",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
            fontSize: 13,
            marginBottom: 4,
          }}
        >
          🖼️ 이미지
          {uploadingCount > 0 ? ` (업로드 중 ${uploadingCount})` : ""}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          multiple
          hidden
          onChange={(e) => {
            uploadImages(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {tab === "write" ? (
        <textarea
          ref={taRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={onPaste}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          placeholder="마크다운으로 작성하세요. 이미지는 붙여넣기(Ctrl+V)·드래그·🖼️ 버튼으로, 코드블록에 mermaid 를 쓰면 다이어그램이 그려져요."
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
          disabled={loading || !title.trim() || uploadingCount > 0}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background:
              loading || !title.trim() || uploadingCount > 0
                ? "#93c5fd"
                : "#3b82f6",
            color: "#fff",
            fontWeight: 700,
            cursor:
              loading || !title.trim() || uploadingCount > 0
                ? "default"
                : "pointer",
          }}
        >
          {uploadingCount > 0
            ? "이미지 업로드 중…"
            : loading
            ? "저장 중…"
            : "저장"}
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
