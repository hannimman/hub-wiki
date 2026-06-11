import { NextResponse } from "next/server";
import { requireSuper, AuthError } from "@/lib/auth";
import { setPointConfig, type PointConfig } from "@/lib/points";

export const dynamic = "force-dynamic";

// 슈퍼 전용: 항목별 지급 포인트 설정 저장
export async function POST(req: Request) {
  try {
    await requireSuper();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || typeof body.config !== "object")
      throw new AuthError("잘못된 요청입니다.", 400);

    const next = await setPointConfig(body.config as Partial<PointConfig>);
    return NextResponse.json({ ok: true, config: next });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("point config error", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
