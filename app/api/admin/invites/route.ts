import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { createInvite } from "@/lib/invites";

export const dynamic = "force-dynamic";

// 초대 발급 (관리자 이상). admin 역할 초대는 createInvite 내부에서 슈퍼만 허용.
export async function POST(req: Request) {
  try {
    const actor = await requireAdmin();
    const body = await req.json().catch(() => null);
    const role = body?.role === "admin" ? "admin" : "member";
    const days = Number(body?.days) || 7;
    const email = body?.email ? String(body.email).slice(0, 200) : undefined;

    const invite = await createInvite(actor, role, days, email);
    return NextResponse.json({ ok: true, invite });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("create invite error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
