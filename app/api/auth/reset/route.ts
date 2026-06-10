import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/db";
import { hashPassword, passwordError, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 비밀번호 자가 재설정 (관리자가 먼저 "초기화"를 트리거한 계정만 가능).
//  - body { username }            → { pending: boolean }  (초기화 대기 여부 자동 확인)
//  - body { username, password }  → 새 비밀번호 설정 + 플래그 해제
// 보안: 초기화는 관리자/슈퍼만 트리거할 수 있으므로 임의 재설정은 불가하다.
//       미존재/비대기 계정은 pending=false 로 동일 응답해 정보 노출을 줄인다.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      throw new AuthError("잘못된 요청입니다.", 400);

    const username = String(body.username ?? "").trim().toLowerCase();
    if (!username) throw new AuthError("아이디를 입력하세요.", 400);

    const db = getAdminDb();
    const { data: user } = await db
      .from("users")
      .select("id, is_active, needs_password_reset")
      .eq("username", username)
      .maybeSingle();

    const pending = !!(user && user.is_active && user.needs_password_reset);

    // 1단계: 초기화 대기 여부만 확인
    if (body.password === undefined || body.password === null) {
      return NextResponse.json({ pending });
    }

    // 2단계: 실제 재설정
    if (!pending)
      throw new AuthError(
        "초기화 요청이 없는 계정입니다. 관리자에게 문의하세요.",
        400
      );

    const password = String(body.password ?? "");
    const pwErr = passwordError(password);
    if (pwErr) throw new AuthError(pwErr, 400);

    const password_hash = await hashPassword(password);
    // needs_password_reset=true 조건부 갱신으로 경합/중복 처리 방지
    const { data: updated, error } = await db
      .from("users")
      .update({ password_hash, needs_password_reset: false })
      .eq("id", user!.id)
      .eq("needs_password_reset", true)
      .select("id")
      .maybeSingle();

    if (error) throw new AuthError("재설정 처리 중 오류가 발생했습니다.", 500);
    if (!updated)
      throw new AuthError("이미 재설정되었거나 유효하지 않습니다.", 400);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("reset error", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
