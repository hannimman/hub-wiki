"use client";

import { useEffect, useState } from "react";

type State = { status: "pending" | "ok" | "fail"; detail: string };

export default function PingTest() {
  const [state, setState] = useState<State>({ status: "pending", detail: "(요청 중)" });

  async function run() {
    setState({ status: "pending", detail: "(요청 중)" });
    try {
      const res = await fetch("/api/ping", { cache: "no-store" });
      const text = await res.text();
      if (!res.ok) throw new Error("HTTP " + res.status + "\n" + text);
      setState({ status: "ok", detail: text });
    } catch (e) {
      setState({ status: "fail", detail: String(e) });
    }
  }

  useEffect(() => {
    run();
  }, []);

  const color =
    state.status === "ok" ? "#1b5e20" : state.status === "fail" ? "#b71c1c" : "#555";
  const bg =
    state.status === "ok" ? "#e6f7e6" : state.status === "fail" ? "#fdecea" : "#f5f5f5";
  const label =
    state.status === "ok"
      ? "✅ 성공 — Next.js API까지 경로 열림"
      : state.status === "fail"
      ? "❌ 실패"
      : "테스트 중…";

  return (
    <div>
      <div
        style={{
          padding: 20,
          borderRadius: 12,
          background: bg,
          color,
          fontWeight: 700,
          textAlign: "center",
          margin: "16px 0",
        }}
      >
        {label}
      </div>
      <button onClick={run} style={{ padding: "8px 16px", borderRadius: 8 }}>
        다시 테스트
      </button>
      <pre
        style={{
          background: "#1e1e1e",
          color: "#d4d4d4",
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
          fontSize: 13,
        }}
      >
        {state.detail}
      </pre>
    </div>
  );
}
