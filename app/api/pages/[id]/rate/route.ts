import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { submitRating } from "@/lib/ratings";
import { award, countTodayByReason, getPointConfig } from "@/lib/points";
import { DAILY_CAP } from "@/lib/points-shared";

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
    const { authorId } = await submitRating(user, id, score);

    // 포인트 적립 (실패해도 평가 자체는 성공 처리)
    try {
      const cfg = await getPointConfig();
      // 평가 참여(평가자): 하루 캡 적용
      if (
        cfg.ratingGiven > 0 &&
        (await countTodayByReason(user.id, "rating_given")) <
          DAILY_CAP.rating_given
      ) {
        await award(user.id, cfg.ratingGiven, "rating_given", id);
      }
      // 평가 받음(작성자): 글당 1인 1회 평가라 자체 제한됨
      if (cfg.ratingReceived > 0 && authorId && authorId !== user.id) {
        await award(authorId, cfg.ratingReceived, "rating_received", id);
      }
    } catch (e) {
      console.error("rating points failed", e);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("rate error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
