import { NextResponse } from "next/server";
import { requireSuper, AuthError } from "@/lib/auth";
import { grantToAll, grantToUsers } from "@/lib/points";

export const dynamic = "force-dynamic";

// 슈퍼 포인트 지급 (전체 이벤트 / 선택 유저). amount 음수면 회수.
export async function POST(req: Request) {
  try {
    await requireSuper();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      throw new AuthError("잘못된 요청입니다.", 400);

    const amount = Math.trunc(Number(body.amount));
    if (!Number.isFinite(amount) || amount === 0)
      throw new AuthError("지급할 포인트를 입력하세요.", 400);
    if (Math.abs(amount) > 1000000)
      throw new AuthError("포인트 값이 너무 큽니다.", 400);
    const note = String(body.note ?? "").trim().slice(0, 100);

    let affected = 0;
    if (body.scope === "all") {
      affected = await grantToAll(amount, note);
    } else if (body.scope === "selected") {
      const userIds = Array.isArray(body.userIds)
        ? body.userIds.map((x: unknown) => String(x)).filter(Boolean)
        : [];
      if (userIds.length === 0)
        throw new AuthError("지급할 유저를 선택하세요.", 400);
      affected = await grantToUsers(userIds, amount, note);
    } else {
      throw new AuthError("지급 범위가 올바르지 않습니다.", 400);
    }

    return NextResponse.json({ ok: true, affected });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("grant points error", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
