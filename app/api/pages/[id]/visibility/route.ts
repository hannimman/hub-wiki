import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { setPagePrivacy } from "@/lib/pages";

export const dynamic = "force-dynamic";

// 비공개 전환/해제 — 작성자 본인만. body: { private: boolean }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body.private !== "boolean")
      throw new AuthError("잘못된 요청입니다.", 400);

    await setPagePrivacy(user.id, id, body.private);
    return NextResponse.json({ ok: true, private: body.private });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("set page privacy error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
