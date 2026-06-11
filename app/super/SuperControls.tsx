"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/lib/avatars";
import type { AdminUser } from "@/lib/admin";
import {
  POINT_CONFIG_LABEL,
  NEGATIVE_ALLOWED,
  type PointConfig,
} from "@/lib/points-shared";

const ROLE_LABEL: Record<string, string> = {
  super: "슈퍼",
  admin: "관리자",
  member: "사용자",
};

export default function SuperControls({
  ratingsEnabled,
  users,
  meId,
  pointConfig,
}: {
  ratingsEnabled: boolean;
  users: AdminUser[];
  meId: string;
  pointConfig: PointConfig;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(ratingsEnabled);
  const [busy, setBusy] = useState(false);

  // ── 포인트: 항목별 지급 설정 ──
  const [cfg, setCfg] = useState<PointConfig>(pointConfig);
  const [cfgSaved, setCfgSaved] = useState(false);

  async function saveConfig() {
    setBusy(true);
    setCfgSaved(false);
    const res = await fetch("/api/super/point-config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ config: cfg }),
    });
    setBusy(false);
    if (res.ok) {
      const d = await res.json();
      if (d.config) setCfg(d.config);
      setCfgSaved(true);
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "설정 저장 실패");
    }
  }

  // ── 포인트: 지급 (전체 / 선택) ──
  const [grantScope, setGrantScope] = useState<"all" | "selected">("all");
  const [grantAmount, setGrantAmount] = useState(100);
  const [grantNote, setGrantNote] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function grant() {
    if (!grantAmount) {
      alert("지급할 포인트를 입력하세요.");
      return;
    }
    if (grantScope === "selected" && selected.size === 0) {
      alert("지급할 유저를 선택하세요.");
      return;
    }
    const who =
      grantScope === "all" ? "활성 유저 전원" : `선택한 ${selected.size}명`;
    if (
      !confirm(
        `${who}에게 ${grantAmount.toLocaleString()}P를 지급할까요?${
          grantAmount < 0 ? "\n(음수 = 회수)" : ""
        }`
      )
    )
      return;
    setBusy(true);
    const res = await fetch("/api/super/points", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scope: grantScope,
        userIds: grantScope === "selected" ? [...selected] : undefined,
        amount: grantAmount,
        note: grantNote,
      }),
    });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      alert(`✅ ${d.affected}명에게 지급 완료!`);
      setSelected(new Set());
      setGrantNote("");
      router.refresh();
    } else {
      alert(d.error ?? "지급 실패");
    }
  }

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

      {/* 포인트 */}
      <section
        style={{
          margin: "20px 0",
          padding: 16,
          border: "1px solid #e2e2e2",
          borderRadius: 12,
        }}
      >
        <h2 style={{ fontSize: 16, marginTop: 0 }}>💰 포인트</h2>

        {/* 항목별 지급 포인트 설정 */}
        <div style={{ fontWeight: 700, fontSize: 14, margin: "4px 0 8px" }}>
          항목별 지급 포인트
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: 8,
          }}
        >
          {(Object.keys(POINT_CONFIG_LABEL) as (keyof PointConfig)[]).map(
            (k) => (
              <label
                key={k}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "6px 10px",
                }}
              >
                <span style={{ flex: 1 }}>{POINT_CONFIG_LABEL[k]}</span>
                <input
                  type="number"
                  min={NEGATIVE_ALLOWED.has(k) ? -100000 : 0}
                  max={100000}
                  value={cfg[k]}
                  onChange={(e) => {
                    setCfgSaved(false);
                    setCfg({ ...cfg, [k]: Number(e.target.value) });
                  }}
                  style={{
                    width: 80,
                    padding: "4px 6px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    textAlign: "right",
                  }}
                />
                <span style={{ color: "#b45309", fontWeight: 700 }}>P</span>
              </label>
            )
          )}
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button
            onClick={saveConfig}
            disabled={busy}
            className="btn btn-primary btn-sm"
          >
            설정 저장
          </button>
          {cfgSaved && <span style={{ color: "#1b5e20", fontSize: 13 }}>저장됐어요 ✓</span>}
        </div>

        {/* 지급 */}
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            margin: "18px 0 8px",
            paddingTop: 14,
            borderTop: "1px solid var(--border)",
          }}
        >
          포인트 지급 {grantAmount < 0 ? "(음수 = 회수)" : ""}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={grantScope}
            onChange={(e) => setGrantScope(e.target.value as "all" | "selected")}
            style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }}
          >
            <option value="all">🎉 전체 (이벤트)</option>
            <option value="selected">👤 선택한 유저</option>
          </select>
          <input
            type="number"
            value={grantAmount}
            onChange={(e) => setGrantAmount(Math.trunc(Number(e.target.value)))}
            style={{ width: 110, padding: "7px 10px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14, textAlign: "right" }}
          />
          <span style={{ color: "#b45309", fontWeight: 700 }}>P</span>
          <input
            placeholder="메모 (선택) — 이력에 표시"
            value={grantNote}
            onChange={(e) => setGrantNote(e.target.value)}
            maxLength={100}
            style={{ flex: 1, minWidth: 160, padding: "7px 10px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }}
          />
          <button onClick={grant} disabled={busy} className="btn btn-primary btn-sm">
            {busy ? "처리 중…" : "지급"}
          </button>
        </div>
        {grantScope === "selected" && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            {users
              .filter((u) => u.is_active)
              .map((u) => (
                <label
                  key={u.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    border: selected.has(u.id)
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                    background: selected.has(u.id) ? "#eff6ff" : "#fff",
                    borderRadius: 999,
                    padding: "4px 10px 4px 5px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(u.id)}
                    onChange={() => toggleSelect(u.id)}
                    style={{ display: "none" }}
                  />
                  <Avatar id={u.avatar} config={u.avatar_config} size={22} />
                  {u.display_name}
                </label>
              ))}
          </div>
        )}
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
