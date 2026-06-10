"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/lib/avatars";
import type { AdminUser } from "@/lib/admin";

const ROLE_LABEL: Record<string, string> = {
  super: "슈퍼",
  admin: "관리자",
  member: "사용자",
};

export default function SuperControls({
  ratingsEnabled,
  users,
  meId,
}: {
  ratingsEnabled: boolean;
  users: AdminUser[];
  meId: string;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(ratingsEnabled);
  const [busy, setBusy] = useState(false);

  async function toggleRatings() {
    const next = !enabled;
    setBusy(true);
    const res = await fetch("/api/super/ratings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "toggle", enabled: next }),
    });
    setBusy(false);
    if (res.ok) setEnabled(next);
    else alert("변경 실패");
  }

  async function resetAll() {
    if (!confirm("⚠️ 모든 문서의 점수를 초기화합니다. 되돌릴 수 없어요. 계속할까요?"))
      return;
    setBusy(true);
    const res = await fetch("/api/super/ratings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    setBusy(false);
    alert(res.ok ? "전체 점수가 초기화됐어요." : "초기화 실패");
  }

  async function updateUser(id: string, fields: Record<string, unknown>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) router.refresh();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "수정 실패");
    }
  }

  const th: React.CSSProperties = {
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "2px solid #e2e2e2",
    fontSize: 13,
    color: "#666",
  };
  const td: React.CSSProperties = {
    padding: "8px 10px",
    borderBottom: "1px solid #eee",
    fontSize: 14,
  };

  return (
    <div>
      {/* 점수 제도 */}
      <section
        style={{
          margin: "20px 0",
          padding: 16,
          border: "1px solid #e2e2e2",
          borderRadius: 12,
        }}
      >
        <h2 style={{ fontSize: 16, marginTop: 0 }}>⭐ 점수 제도</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={toggleRatings}
            disabled={busy}
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
              background: enabled ? "#22863a" : "#999",
              color: "#fff",
            }}
          >
            {enabled ? "ON" : "OFF"}
          </button>
          <span style={{ color: "#666" }}>
            {enabled ? "평가 기능이 켜져 있어요." : "평가 기능이 꺼져 있어요."}
          </span>
          <button
            onClick={resetAll}
            disabled={busy}
            style={{
              marginLeft: "auto",
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #d9534f",
              background: "#fff",
              color: "#d9534f",
              cursor: "pointer",
            }}
          >
            전체 점수 리셋
          </button>
        </div>
      </section>

      {/* 사용자 관리 */}
      <section>
        <h2 style={{ fontSize: 16 }}>👥 사용자 ({users.length})</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>사용자</th>
                <th style={th}>역할</th>
                <th style={th}>평가 가능</th>
                <th style={th}>점수 열람</th>
                <th style={th}>활성</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMe = u.id === meId;
                return (
                  <tr key={u.id}>
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar id={u.avatar} config={u.avatar_config} size={28} />
                        <div>
                          <div>
                            {u.display_name} {isMe && <span style={{ color: "#3b82f6", fontSize: 12 }}>(나)</span>}
                          </div>
                          <div style={{ color: "#999", fontSize: 12 }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={td}>
                      <select
                        value={u.role}
                        disabled={isMe}
                        onChange={(e) => updateUser(u.id, { role: e.target.value })}
                        title={isMe ? "본인 역할은 변경 불가" : ""}
                      >
                        {Object.entries(ROLE_LABEL).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={td}>
                      <input
                        type="checkbox"
                        checked={u.can_rate}
                        onChange={(e) => updateUser(u.id, { can_rate: e.target.checked })}
                      />
                    </td>
                    <td style={td}>
                      <input
                        type="checkbox"
                        checked={u.can_view_scores}
                        onChange={(e) =>
                          updateUser(u.id, { can_view_scores: e.target.checked })
                        }
                      />
                    </td>
                    <td style={td}>
                      <input
                        type="checkbox"
                        checked={u.is_active}
                        disabled={isMe}
                        onChange={(e) => updateUser(u.id, { is_active: e.target.checked })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ color: "#999", fontSize: 12, marginTop: 8 }}>
          · 평가 가능 = 글에 점수를 매길 수 있음 · 점수 열람 = 평균·개수를 볼 수 있음
        </p>
      </section>
    </div>
  );
}
