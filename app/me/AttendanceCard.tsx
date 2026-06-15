"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 출석 체크 (1일 1회) — 누르면 설정된 출석 포인트 적립, 이미 했으면 안내만.
export default function AttendanceCard({
  checkedIn,
  amount,
}: {
  checkedIn: boolean;
  amount: number; // 설정된 출석 적립 포인트 (슈퍼 제어판)
}) {
  const router = useRouter();
  const [done, setDone] = useState(checkedIn);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkIn() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/attendance", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(d.error ?? "출석 처리에 실패했어요.");
      } else if (d.awarded > 0) {
        setDone(true);
        setMsg(`출석 완료! +${d.awarded}P 적립 🎉`);
        router.refresh();
      } else {
        setDone(true);
        setMsg("오늘은 이미 출석했어요. 내일 또 만나요!");
      }
    } catch {
      setMsg("네트워크 오류가 발생했어요.");
    }
    setLoading(false);
  }

  return (
    <div className="row" style={{ flexWrap: "wrap" }}>
      <button
        className={done ? "btn" : "btn btn-primary"}
        onClick={checkIn}
        disabled={loading || done}
      >
        {done
          ? "✅ 오늘 출석 완료"
          : loading
          ? "출석 중…"
          : `📅 출석 체크 (+${amount.toLocaleString()}P)`}
      </button>
      {msg && <span style={{ fontSize: 13.5 }}>{msg}</span>}
    </div>
  );
}
