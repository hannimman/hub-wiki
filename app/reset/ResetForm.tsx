"use client";

import { useState } from "react";
import Link from "next/link";
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
const btnStyle = (loading: boolean): React.CSSProperties => ({
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
});

export default function ResetForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<"check" | "set" | "done">("check");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1단계: 아이디 입력 → 초기화 대기 여부 자동 확인
  async function check(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "확인에 실패했습니다.");
      } else if (data.pending) {
        setPhase("set");
      } else {
        setError(
          "초기화 요청이 없는 계정입니다. 비밀번호를 잊으셨다면 관리자에게 초기화를 요청하세요."
        );
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
    setLoading(false);
  }

  // 2단계: 새 비밀번호 설정
  async function setNew(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "재설정에 실패했습니다.");
      } else {
        setPhase("done");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
    setLoading(false);
  }

  if (phase === "done") {
    return (
      <div>
        <p style={{ color: "#1b5e20" }}>
          ✓ 비밀번호가 재설정되었습니다. 새 비밀번호로 로그인하세요.
        </p>
        <button onClick={() => router.push("/login")} style={btnStyle(false)}>
          로그인하러 가기
        </button>
      </div>
    );
  }

  if (phase === "set") {
    return (
      <form onSubmit={setNew}>
        <p className="muted" style={{ fontSize: 14 }}>
          <b>@{username}</b> 계정의 새 비밀번호를 설정하세요. (8자 이상)
        </p>
        <label style={labelStyle} htmlFor="new-pw">
          새 비밀번호
        </label>
        <input
          id="new-pw"
          type="password"
          style={inputStyle}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <label style={labelStyle} htmlFor="new-pw2">
          새 비밀번호 확인
        </label>
        <input
          id="new-pw2"
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
        <button type="submit" disabled={loading} style={btnStyle(loading)}>
          {loading ? "설정 중…" : "비밀번호 설정"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={check}>
      <p className="muted" style={{ fontSize: 14 }}>
        관리자가 비밀번호를 초기화한 경우, 아이디를 입력하면 새 비밀번호를 설정할
        수 있습니다.
      </p>
      <label style={labelStyle} htmlFor="reset-username">
        아이디
      </label>
      <input
        id="reset-username"
        style={inputStyle}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        required
      />
      {error && (
        <div style={{ color: "#c62828", marginTop: 12, fontSize: 14 }}>
          {error}
        </div>
      )}
      <button type="submit" disabled={loading} style={btnStyle(loading)}>
        {loading ? "확인 중…" : "초기화 여부 확인"}
      </button>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        <Link href="/login">← 로그인으로 돌아가기</Link>
      </p>
    </form>
  );
}
