import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getAdminDb } from "@/lib/db";
import { getEffectiveCatalog } from "@/lib/avatar/catalog-db";
import { isV2, DEFAULT_AVATAR_V2, type AvatarV2Data } from "@/lib/avatar/render";
import { buyItem, getPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

const MAX_BULK_BUY = 12; // 한 번에 구매 가능한 최대 아이템 수

// 아이템 구매 (해금형 — 1회 구매 후 영구 소유). 가격은 서버 카탈로그에서 확정.
// 단건({itemId}) / 일괄({itemIds}) 모두 지원. 성공 시 자동 장착 + 새 잔액 반환.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      throw new AuthError("잘못된 요청입니다.", 400);

    const rawList: string[] = Array.isArray(body.itemIds)
      ? body.itemIds.map((v: unknown) => String(v).trim())
      : [String(body.itemId ?? "").trim()];
    const ids = [...new Set(rawList.filter((s) => s.length > 0))];
    if (ids.length === 0) throw new AuthError("아이템을 선택해 주세요.", 400);
    if (ids.length > MAX_BULK_BUY)
      throw new AuthError(`한 번에 최대 ${MAX_BULK_BUY}개까지 구매할 수 있습니다.`, 400);

    // 가격·활성은 유효 카탈로그(기본 + DB 오버라이드/커스텀)에서 확정
    const { index } = await getEffectiveCatalog();
    const entries = ids.map((id) => {
      const entry = index[id];
      if (!entry) throw new AuthError("존재하지 않는 아이템입니다.", 404);
      if (!entry.active)
        throw new AuthError(`판매가 중단된 아이템이 있습니다. (${entry.name})`, 400);
      return { id, entry };
    });

    // 합계 잔액 선검사 — 일부만 구매되는 상황을 최대한 차단 (개별 rpc가 최종 재검사)
    const total = entries.reduce((sum, e) => sum + e.entry.price, 0);
    const before = await getPoints(user.id);
    if (before < total)
      throw new AuthError(
        `포인트가 부족합니다. (합계 ${total.toLocaleString()}P, 보유 ${before.toLocaleString()}P)`,
        400
      );

    const bought: string[] = [];
    const failed: { id: string; reason: string }[] = [];
    for (const { id, entry } of entries) {
      const result = await buyItem(user.id, id, entry.price);
      if (result === "owned") failed.push({ id, reason: "이미 보유한 아이템" });
      else if (result === "insufficient") failed.push({ id, reason: "포인트 부족" });
      else bought.push(id);
    }
    if (bought.length === 0) {
      const reason = failed[0]?.reason ?? "구매 실패";
      throw new AuthError(
        reason === "이미 보유한 아이템" ? "이미 보유한 아이템입니다." : "포인트가 부족합니다.",
        reason === "이미 보유한 아이템" ? 409 : 400
      );
    }

    // 구매 즉시 자동 장착 (레거시 아바타면 v2 기본으로 전환 후 장착)
    const base: AvatarV2Data = isV2(user.avatar_config)
      ? (user.avatar_config as AvatarV2Data)
      : { ...DEFAULT_AVATAR_V2, equipped: {} };
    const equipped = { ...base.equipped };
    for (const id of bought) equipped[index[id].slotId] = id;
    const avatarConfig: AvatarV2Data = { ...base, equipped };

    const db = getAdminDb();
    await db
      .from("users")
      .update({ avatar: "v2", avatar_config: avatarConfig })
      .eq("id", user.id);

    const balance = await getPoints(user.id);
    return NextResponse.json({ ok: true, balance, avatarConfig, bought, failed });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("shop buy error", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
