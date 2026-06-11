"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/lib/avatars";
import type { AdminUser } from "@/lib/admin";
import type { InviteRow } from "@/lib/invites";

const ROLE_LABEL: Record<string, string> = {
  super: "슈퍼",
  admin: "관리자",
  member: "사용자",
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 120,
        padding: 16,
        border: "1px solid #e2e2e2",
        borderRadius: 12,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
      <div style={{ color: "#888", fontSize: 13 }}>{label}</div>
    </div>
  );
}

export default function AdminControls({
  invites,
  users,
  stats,
  isSuper,
  meId,
}: {
  invites: InviteRow[];
  users: AdminUser[];
  stats: { users: number; pages: number; revisions: number; ratings: number };
  isSuper: boolean;
  meId: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState<"member" | "admin">("member");
  const [days, setDays] = useState(7);
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [newLink, setNewLink] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  function linkFor(token: string) {
    return `${origin}/signup?token=${token}`;
  }
  function copy(text: string) {
    navigator.clipboard?.writeText(text);
    alert("초대 링크를 복사했어요.");
  }

  async function createInvite() {
    setCreating(true);
    setNewLink(null);
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role, days, email: email || undefined }),
    });
    const data = await res.json();
    setCreating(false);
    if (res.ok) {
      setNewLink(linkFor(data.invite.token));
      setEmail("");
      router.refresh();
    } else {
      alert(data.error ?? "발급 실패");
    }
  }

  async function revoke(id: string) {
    if (!confirm("이 초대를 취소할까요?")) return;
    const res = await fetch(`/api/admin/invites/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("취소 실패");
  }

  async function toggleActive(id: string, next: boolean) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_active: next }),
    });
    if (res.ok) router.refresh();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "실패");
    }
  }

  async function resetPassword(id: string, name: string) {
    if (
      !confirm(
        `${name} 님의 비밀번호를 초기화할까요?\n이 사용자는 즉시 로그아웃되며, 로그인 화면의 '비밀번호 재설정'에서 아이디 입력 후 새 비밀번호를 설정해야 합니다.`
      )
    )
      return;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reset_password: true }),
    });
    if (res.ok) {
      alert("비밀번호를 초기화했습니다.");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "실패");
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 14,
  };
  const td: React.CSSProperties = {
    padding: "8px 10px",
    borderBottom: "1px solid #eee",
    fontSize: 14,
  };

  return (
    <div>
      {/* 분석 */}
      <section style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "20px 0" }}>
        <StatCard label="사용자" value={stats.users} />
        <StatCard label="문서" value={stats.pages} />
        <StatCard label="총 수정" value={stats.revisions} />
        <StatCard label="평가 수" value={stats.ratings} />
      </section>

      {/* 초대 발급 */}
      <section
        style={{ padding: 16, border: "1px solid #e2e2e2", borderRadius: 12, margin: "20px 0" }}
      >
        <h2 style={{ fontSize: 16, marginTop: 0 }}>✉️ 초대 발급</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={role} onChange={(e) => setRole(e.target.value as "member" | "admin")} style={inputStyle}>
            <option value="member">사용자</option>
            {isSuper && <option value="admin">관리자</option>}
          </select>
          <label style={{ fontSize: 14 }}>
            유효기간{" "}
            <input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{ ...inputStyle, width: 70 }}
            />{" "}
            일
          </label>
          <input
            placeholder="이메일(선택, 메모용)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 160 }}
          />
          <button
            onClick={createInvite}
            disabled={creating}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#3b82f6",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {creating ? "발급 중…" : "초대 링크 생성"}
          </button>
        </div>
        {newLink && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              background: "#eef6ff",
              borderRadius: 8,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <code style={{ flex: 1, wordBreak: "break-all" }}>{newLink}</code>
            <button onClick={() => copy(newLink)} style={{ ...inputStyle, cursor: "pointer" }}>
              복사
            </button>
          </div>
        )}
      </section>

      {/* 대기 중 초대 */}
      <section style={{ margin: "20px 0" }}>
        <h2 style={{ fontSize: 16 }}>대기 중 초대 ({invites.length})</h2>
        {invites.length === 0 ? (
          <p style={{ color: "#888" }}>대기 중인 초대가 없습니다.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {invites.map((iv) => (
                <tr key={iv.id}>
                  <td style={td}>{ROLE_LABEL[iv.role]}</td>
                  <td style={td}>{iv.email || "-"}</td>
                  <td style={{ ...td, color: "#999", fontSize: 12 }}>
                    만료 {new Date(iv.expires_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td style={td}>
                    <button onClick={() => copy(linkFor(iv.token))} style={{ ...inputStyle, cursor: "pointer", marginRight: 6 }}>
                      링크 복사
                    </button>
                    <button
                      onClick={() => revoke(iv.id)}
                      style={{ ...inputStyle, cursor: "pointer", color: "#c62828" }}
                    >
                      취소
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 사용자 관리 (활성/비활성) */}
      <section style={{ margin: "20px 0" }}>
        <h2 style={{ fontSize: 16 }}>👥 사용자 ({users.length})</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {users.map((u) => {
              const isMe = u.id === meId;
              // 대상이 슈퍼유저면 슈퍼만 관리 가능 (관리자는 비활성화·초기화 불가)
              const canManage = isSuper || u.role !== "super";
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
                    {ROLE_LABEL[u.role]}
                    {u.needs_password_reset && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          padding: "1px 6px",
                          borderRadius: 999,
                          background: "#fff7ed",
                          color: "#c2410c",
                          whiteSpace: "nowrap",
                        }}
                      >
                        초기화 대기
                      </span>
                    )}
                  </td>
                  <td style={td}>
                    {isMe ? (
                      <span style={{ color: "#999", fontSize: 12 }}>
                        본인 계정
                      </span>
                    ) : !canManage ? (
                      <span style={{ color: "#999", fontSize: 12 }}>
                        관리 불가
                      </span>
                    ) : (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {/* 활성/비활성: 관리자끼리는 불가 — 슈퍼만 관리자 계정을 제어 */}
                        {(isSuper || u.role === "member") &&
                          (u.is_active ? (
                            <button
                              onClick={() => toggleActive(u.id, false)}
                              style={{
                                ...inputStyle,
                                cursor: "pointer",
                                color: "#c62828",
                              }}
                            >
                              비활성화
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleActive(u.id, true)}
                              style={{
                                ...inputStyle,
                                cursor: "pointer",
                                color: "#22863a",
                              }}
                            >
                              활성화
                            </button>
                          ))}
                        {!u.needs_password_reset && (
                          <button
                            onClick={() => resetPassword(u.id, u.display_name)}
                            style={{ ...inputStyle, cursor: "pointer" }}
                          >
                            비밀번호 초기화
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
