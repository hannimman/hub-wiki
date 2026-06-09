"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarPicker, { type AvatarValue } from "../AvatarPicker";
import type { AvatarConfig } from "@/lib/avatars";

export default function MyAvatarForm({
  initialAvatar,
  initialConfig,
}: {
  initialAvatar: string;
  initialConfig: AvatarConfig | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState<AvatarValue>({
    id: initialConfig ? "custom" : initialAvatar,
    config: initialConfig,
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/me/avatar", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ avatar: value.id, avatarConfig: value.config }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
      } else {
        setSaved(true);
        router.refresh();
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
    setLoading(false);
  }

  return (
    <div>
      <AvatarPicker
        value={value}
        onChange={(v) => {
          setValue(v);
          setSaved(false);
        }}
      />
      {error && (
        <div style={{ color: "#c62828", marginTop: 12 }}>{error}</div>
      )}
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={save}
          disabled={loading}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: loading ? "#93c5fd" : "#3b82f6",
            color: "#fff",
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "저장 중…" : "저장"}
        </button>
        {saved && <span style={{ color: "#1b5e20" }}>저장됐어요 ✓</span>}
      </div>
    </div>
  );
}
