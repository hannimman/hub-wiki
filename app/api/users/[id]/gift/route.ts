import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getAdminDb } from "@/lib/db";
import { giftPoints } from "@/lib/points";
import { addNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// 포인트 선물 — 본인 잔액에서 차감해 대상에게 지급. body: { amount, memo? }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: toId } = await params;
    const body = await req.json().catch(() => null);
    if (!body) throw new AuthError("잘못된 요청입니다.", 400);

    const amount = Math.trunc(Number(body.amount));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000)
      throw new AuthError("선물 금액은 1~100,000P 사이여야 합니다.", 400);
    const memo = String(body.memo ?? "").trim().slice(0, 50);

    const db = getAdminDb();
    const { data: target } = await db
      .from("users")
      .select("id, is_active")
      .eq("id", toId)
      .maybeSingle();
    if (!target || !target.is_active)
      throw new AuthError("선물할 대상을 찾을 수 없습니다.", 404);

    const result = await giftPoints(user.id, toId, amount);
    if (result === "insufficient")
      throw new AuthError("포인트가 부족합니다.", 400);
    if (result === "self")
      throw new AuthError("자신에게는 선물할 수 없습니다.", 400);
    if (result !== "ok")
      throw new AuthError("선물 금액이 올바르지 않습니다.", 400);

    // 수신 알림 (실패해도 선물 자체는 완료)
    await addNotification(toId, "gift", {
      from_name: user.display_name,
      amount,
      memo: memo || null,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("gift points error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
