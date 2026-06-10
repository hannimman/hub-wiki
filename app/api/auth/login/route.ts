import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/db";
import { verifyPassword, createSession, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) throw new AuthError("잘못된 요청입니다.", 400);

    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!username || !password)
      throw new AuthError("아이디와 비밀번호를 입력하세요.", 400);

    const db = getAdminDb();
    const { data: user } = await db
      .from("users")
      .select("id, password_hash, is_active, needs_password_reset")
      .eq("username", username)
      .maybeSingle();

    // 존재하지 않거나 비번 틀리면 동일한 일반 메시지 (정보 노출 최소화)
    const ok = user ? await verifyPassword(password, user.password_hash) : false;
    if (!user || !ok)
      throw new AuthError("아이디 또는 비밀번호가 올바르지 않습니다.", 401);

    // 비밀번호 초기화 대기 계정은 기존 비번으로 로그인 불가 → 재설정 안내
    if (user.needs_password_reset)
      throw new AuthError(
        "비밀번호가 초기화되었습니다. 아래 '비밀번호 재설정'에서 새 비밀번호를 설정하세요.",
        403
      );

    // 비번이 맞아도 비활성화 계정은 차단
    if (!user.is_active)
      throw new AuthError("비활성화된 계정입니다. 관리자에게 문의하세요.", 403);

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("login error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
