import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getEffectiveCatalog } from "@/lib/avatar/catalog-db";
import { gachaPull, getPoints, getPointConfig, listOwned } from "@/lib/points";

export const dynamic = "force-dynamic";

// 가챠 — 비용(슈퍼 설정)을 내고 미보유 활성 아이템 중 하나를 무작위 획득.
// 비쌀수록 희귀: 가중치 = 1000 / (가격 + 100). 풀에서 보유 아이템은 제외라 중복 없음.
export async function POST() {
  try {
    const user = await requireUser();
    const cfg = await getPointConfig();
    const cost = Math.max(0, cfg.gachaCost);

    const [{ index }, ownedArr] = await Promise.all([
      getEffectiveCatalog(),
      listOwned(user.id),
    ]);
    const owned = new Set(ownedArr);
    const pool = Object.values(index).filter(
      (it) => it.active && it.price > 0 && !owned.has(it.id)
    );
    if (pool.length === 0)
      throw new AuthError("획득할 수 있는 아이템이 없어요. 이미 다 모았어요! 🎉", 400);

    // 가중 추첨 (가격 반비례)
    const weights = pool.map((it) => 1000 / (it.price + 100));
    const total = weights.reduce((s, w) => s + w, 0);
    let pick = pool[pool.length - 1];
    let roll = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        pick = pool[i];
        break;
      }
    }

    const result = await gachaPull(user.id, pick.id, cost);
    if (result === "insufficient")
      throw new AuthError("포인트가 부족합니다.", 400);
    if (result === "owned")
      throw new AuthError("잠시 후 다시 시도해주세요.", 409); // 경합 — 풀이 이미 제외하므로 희귀

    const balance = await getPoints(user.id);
    return NextResponse.json({
      ok: true,
      balance,
      item: {
        id: pick.id,
        name: pick.name,
        slotId: pick.slotId,
        price: pick.price,
        svg: pick.svg,
      },
    });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("gacha error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
