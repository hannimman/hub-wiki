import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/db";
import {
  requireUser,
  verifyPassword,
  hashPassword,
  passwordError,
  AuthError,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

// 본인 비밀번호 변경. 현재 비밀번호 확인 후 새 비밀번호로 교체.
export async function POST(req: Request) {
  try {
    const me = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      throw new AuthError("잘못된 요청입니다.", 400);

    const current = String(body.currentPassword ?? "");
    const next = String(body.newPassword ?? "");

    const pwErr = passwordError(next);
    if (pwErr) throw new AuthError(pwErr, 400);
    if (current === next)
      throw new AuthError("새 비밀번호가 현재 비밀번호와 같습니다.", 400);

    const db = getAdminDb();
    const { data: user } = await db
      .from("users")
      .select("password_hash")
      .eq("id", me.id)
      .maybeSingle();
    if (!user) throw new AuthError("사용자를 찾을 수 없습니다.", 404);

    const ok = await verifyPassword(current, user.password_hash);
    if (!ok) throw new AuthError("현재 비밀번호가 올바르지 않습니다.", 400);

    const password_hash = await hashPassword(next);
    const { error } = await db
      .from("users")
      .update({ password_hash })
      .eq("id", me.id);
    if (error) throw new AuthError("변경 처리 중 오류가 발생했습니다.", 500);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("change password error", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
