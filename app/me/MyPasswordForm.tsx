"use client";

import { useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 15,
  boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  margin: "14px 0 6px",
  fontSize: 14,
};

export default function MyPasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (next !== confirm) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "변경에 실패했습니다.");
      } else {
        setSaved(true);
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 420 }}>
      <label style={labelStyle} htmlFor="cur-pw">
        현재 비밀번호
      </label>
      <input
        id="cur-pw"
        type="password"
        style={inputStyle}
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        autoComplete="current-password"
        required
      />
      <label style={labelStyle} htmlFor="my-new-pw">
        새 비밀번호 (8자 이상)
      </label>
      <input
        id="my-new-pw"
        type="password"
        style={inputStyle}
        value={next}
        onChange={(e) => setNext(e.target.value)}
        autoComplete="new-password"
        required
      />
      <label style={labelStyle} htmlFor="my-new-pw2">
        새 비밀번호 확인
      </label>
      <input
        id="my-new-pw2"
        type="password"
        style={inputStyle}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
        required
      />
      {error && (
        <div style={{ color: "#c62828", marginTop: 12, fontSize: 14 }}>
          {error}
        </div>
      )}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "변경 중…" : "비밀번호 변경"}
        </button>
        {saved && <span style={{ color: "#1b5e20" }}>변경됐어요 ✓</span>}
      </div>
    </form>
  );
}
