import { NextResponse } from "next/server";
import { requireSuper, AuthError } from "@/lib/auth";
import { setRatingsEnabled, resetRatings } from "@/lib/ratings";

export const dynamic = "force-dynamic";

// 슈퍼 전용: 점수 제도 on/off + 리셋
export async function POST(req: Request) {
  try {
    await requireSuper();
    const body = await req.json().catch(() => null);
    const action = body?.action;

    if (action === "toggle") {
      await setRatingsEnabled(!!body.enabled);
    } else if (action === "reset") {
      await resetRatings(body.pageId ? String(body.pageId) : undefined);
    } else {
      throw new AuthError("알 수 없는 작업입니다.", 400);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("super ratings error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
