import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

// 내 요약 — 아바타 카드 모달에서 "본인 여부 + 보낼 수 있는 잔액" 판단용.
// 미로그인은 { id: null } (카드에서 선물 버튼 숨김).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ id: null, points: 0 });
  const points = await getPoints(user.id);
  return NextResponse.json({ id: user.id, points });
}
