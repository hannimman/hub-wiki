"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  margin: "16px 0 6px",
};

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "로그인에 실패했습니다.");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label style={labelStyle} htmlFor="username">
        아이디
      </label>
      <input
        id="username"
        style={inputStyle}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        required
      />

      <label style={labelStyle} htmlFor="password">
        비밀번호
      </label>
      <input
        id="password"
        type="password"
        style={inputStyle}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />

      {error && (
        <div style={{ color: "#c62828", marginTop: 12, fontSize: 14 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          marginTop: 20,
          padding: "12px",
          borderRadius: 8,
          border: "none",
          background: loading ? "#93c5fd" : "#3b82f6",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}
