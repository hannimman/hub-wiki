"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FaceOnboard, { type FaceValue } from "./FaceOnboard";
import { DEFAULT_AVATAR_V2 } from "@/lib/avatar/render";

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

export default function SignupForm({
  token,
  role,
}: {
  token: string;
  role: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [face, setFace] = useState<FaceValue>(DEFAULT_AVATAR_V2.face);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          displayName,
          username,
          password,
          avatar: "v2",
          avatarConfig: { v: 2, face, equipped: {} },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "가입에 실패했습니다.");
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
      {role === "admin" && (
        <div
          style={{
            background: "#fff7e0",
            border: "1px solid #f0d68a",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 8,
            fontSize: 14,
          }}
        >
          👑 <b>관리자</b>로 가입합니다.
        </div>
      )}

      <label style={labelStyle}>내 캐릭터 얼굴 만들기</label>
      <FaceOnboard value={face} onChange={setFace} />

      <label style={labelStyle} htmlFor="displayName">
        이름
      </label>
      <input
        id="displayName"
        style={inputStyle}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="홍길동"
        maxLength={30}
        required
      />

      <label style={labelStyle} htmlFor="username">
        로그인 아이디
      </label>
      <input
        id="username"
        style={inputStyle}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="영문 소문자/숫자 3~20자"
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
        placeholder="8자 이상"
        autoComplete="new-password"
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
        {loading ? "가입 중…" : "가입하기"}
      </button>
    </form>
  );
}
