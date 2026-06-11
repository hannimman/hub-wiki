"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const linkStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  textDecoration: "none",
  color: "#333",
  fontSize: 14,
  background: "#fff",
};

export default function PageActions({
  pageId,
  slug,
  isAuthor = false,
  isPrivate = false,
}: {
  pageId: string;
  slug: string;
  isAuthor?: boolean;
  isPrivate?: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  // 비공개 전환/해제 — 작성자 본인만 버튼이 보인다.
  async function togglePrivacy() {
    const next = !isPrivate;
    if (
      next &&
      !confirm(
        "이 글을 비공개로 전환할까요?\n모든 목록·검색에서 숨겨지고 본인만 볼 수 있습니다.\n(마이페이지의 '내 비공개 글'에서 다시 찾을 수 있어요)"
      )
    )
      return;
    setToggling(true);
    const res = await fetch(`/api/pages/${pageId}/visibility`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ private: next }),
    });
    setToggling(false);
    if (res.ok) router.refresh();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "전환에 실패했습니다.");
    }
  }

  async function del() {
    if (!confirm("이 문서를 삭제할까요? (이력은 보존됩니다)")) return;
    setDeleting(true);
    const res = await fetch(`/api/pages/${pageId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/wiki");
      router.refresh();
    } else {
      alert("삭제에 실패했습니다.");
      setDeleting(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Link href={`/wiki/${slug}/edit`} style={linkStyle}>
        수정
      </Link>
      <Link href={`/wiki/${slug}/history`} style={linkStyle}>
        이력
      </Link>
      {isAuthor && (
        <button
          onClick={togglePrivacy}
          disabled={toggling}
          title={
            isPrivate
              ? "공개로 전환하면 모든 목록에 다시 보입니다"
              : "비공개로 전환하면 모든 목록에서 숨겨집니다"
          }
          style={{ ...linkStyle, cursor: "pointer" }}
        >
          {toggling ? "…" : isPrivate ? "🌐 공개 전환" : "🔒 비공개 전환"}
        </button>
      )}
      <button
        onClick={del}
        disabled={deleting}
        style={{ ...linkStyle, color: "#c62828", cursor: "pointer" }}
      >
        삭제
      </button>
    </div>
  );
}
