import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getAdminDb } from "@/lib/db";
import { getVillageMembers } from "@/lib/home";
import { rankMemberIds } from "@/lib/race-sim";
import { getPoints } from "@/lib/points";
import { RACE_BET, racePayout } from "@/lib/points-shared";

export const dynamic = "force-dynamic";

// 달리기 경주 베팅 — 서버가 시드를 쥐고 등수를 확정·정산한 뒤, 그제서야
// 시드를 돌려준다. 클라는 같은 시드로 재생만 하므로 결과 미리보기·재굴림이 불가능.
// 선택한 선수가 1·2·3등이면 차등 배당(racePayout), 4등 이하면 판돈 잃음.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      throw new AuthError("잘못된 요청입니다.", 400);

    const pickId = String(body.pickUserId ?? "").trim();
    const stake = Math.trunc(Number(body.stake));
    if (!Number.isFinite(stake) || stake <= 0)
      throw new AuthError("판돈을 확인해 주세요.", 400);
    if (stake > RACE_BET.maxStake)
      throw new AuthError(`1회 최대 ${RACE_BET.maxStake}P 까지 베팅할 수 있어요.`, 400);

    const members = await getVillageMembers();
    if (members.length < RACE_BET.minRunners)
      throw new AuthError(
        `베팅은 ${RACE_BET.minRunners}명 이상 출전할 때만 가능해요.`,
        400
      );
    const pick = members.find((m) => m.id === pickId);
    if (!pick) throw new AuthError("선수를 선택해 주세요.", 400);

    // 서버가 시드를 쥔다 (정산 끝나야 클라에 반환)
    const seed = `bet-${user.id}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const order = rankMemberIds(members, seed);
    const place = order.indexOf(pickId) + 1; // 1-based 등수 (0 = 못 찾음, 안전상 미적중 처리)
    const n = members.length;
    const payout = racePayout(place, n, stake);

    const betRef = pick.name;
    const winRef = `${pick.name} ${place || "?"}위 적중`;

    const db = getAdminDb();
    const { data, error } = await db.rpc("settle_race_bet", {
      p_user: user.id,
      p_stake: stake,
      p_payout: payout,
      p_bet_ref: betRef,
      p_win_ref: winRef,
      p_max_stake: RACE_BET.maxStake,
      p_daily_count: RACE_BET.dailyCount,
      p_daily_total: RACE_BET.dailyTotal,
    });
    if (error) {
      console.error("settle_race_bet rpc error", error);
      throw new AuthError("정산 중 오류가 발생했어요.", 500);
    }
    const status = data as string;
    if (status === "invalid") throw new AuthError("판돈을 확인해 주세요.", 400);
    if (status === "insufficient")
      throw new AuthError("포인트가 부족합니다.", 400);
    if (status === "limit_count")
      throw new AuthError(
        `오늘 베팅 횟수를 모두 사용했어요. (하루 ${RACE_BET.dailyCount}회)`,
        400
      );
    if (status === "limit_total")
      throw new AuthError(
        `오늘 베팅 한도를 초과했어요. (하루 합계 ${RACE_BET.dailyTotal}P)`,
        400
      );
    if (status !== "ok") throw new AuthError("베팅을 처리하지 못했어요.", 400);

    const balance = await getPoints(user.id);
    // 클라가 동일 시드로 경주를 재생할 수 있게 시드 + 라인업을 반환
    return NextResponse.json({
      ok: true,
      seed,
      memberIds: members.map((m) => m.id),
      pickId,
      place,
      payout,
      stake,
      balance,
      won: payout > 0,
    });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("race bet error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
