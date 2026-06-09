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
}: {
  pageId: string;
  slug: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

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
