import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getAdminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// 오늘의 한마디 저장 — 마을에서 내 아바타가 말풍선으로 말한다.
// body: { message: string } (빈 문자열 = 지우기)
export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body || typeof body.message !== "string")
      throw new AuthError("잘못된 요청입니다.", 400);

    const message = body.message.trim().slice(0, 50);
    const db = getAdminDb();
    const { error } = await db
      .from("users")
      .update({ status_message: message || null })
      .eq("id", user.id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, message: message || null });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("set status message error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
