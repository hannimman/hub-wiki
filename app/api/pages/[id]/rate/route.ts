import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { submitRating } from "@/lib/ratings";

export const dynamic = "force-dynamic";

// 문서 평가 점수 제출 (로그인 + 평가권한 + 작성자 아님, 1회·수정불가)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const score = Number(body?.score);
    await submitRating(user, id, score);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("rate error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
