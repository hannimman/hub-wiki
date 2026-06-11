import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/db";
import { verifyPassword, createSession, AuthError } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// 미존재 계정도 같은 시간이 걸리도록 비교에 쓰는 더미 해시 (타이밍 기반 계정 열거 방지)
const DUMMY_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) throw new AuthError("잘못된 요청입니다.", 400);

    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!username || !password)
      throw new AuthError("아이디와 비밀번호를 입력하세요.", 400);

    // 무차별 대입 완화: IP 기준 + 계정 기준 5분당 10회
    const ip = clientIp(req);
    const byIp = rateLimit(`login:ip:${ip}`, 10, 5 * 60_000);
    const byUser = rateLimit(`login:user:${username}`, 10, 5 * 60_000);
    if (!byIp.ok || !byUser.ok) {
      const retry = Math.max(byIp.retryAfterSec, byUser.retryAfterSec);
      throw new AuthError(
        `시도가 너무 많습니다. ${retry}초 후 다시 시도하세요.`,
        429
      );
    }

    const db = getAdminDb();
    const { data: user } = await db
      .from("users")
      .select("id, password_hash, is_active, needs_password_reset")
      .eq("username", username)
      .maybeSingle();

    // 존재하지 않거나 비번 틀리면 동일한 일반 메시지 (정보 노출 최소화).
    // 미존재 시에도 더미 해시 비교로 응답 시간을 맞춘다.
    const ok = await verifyPassword(
      password,
      user?.password_hash ?? DUMMY_HASH
    );
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
