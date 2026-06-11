import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listUnread } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// 미읽음 알림 조회 — GiftAlert 가 페이지 이동/주기 폴링으로 호출.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [] });
  const items = await listUnread(user.id);
  return NextResponse.json({ items });
}
