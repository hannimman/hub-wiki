import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { checkIn, getPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

// 출석 (1일 1회). awarded=0 이면 오늘 이미 출석.
export async function POST() {
  try {
    const user = await requireUser();
    const awarded = await checkIn(user.id);
    const balance = await getPoints(user.id);
    return NextResponse.json({ ok: true, awarded, balance });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("attendance error", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
