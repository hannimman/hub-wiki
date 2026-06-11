import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getAdminDb } from "@/lib/db";
import { getEffectiveCatalog } from "@/lib/avatar/catalog-db";
import { isV2, DEFAULT_AVATAR_V2, type AvatarV2Data } from "@/lib/avatar/render";
import { buyItem, getPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

// 아이템 구매 (해금형 — 1회 구매 후 영구 소유). 가격은 서버 카탈로그에서 확정.
// 성공 시 자동 장착까지 해주고 새 잔액을 돌려준다.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      throw new AuthError("잘못된 요청입니다.", 400);

    const itemId = String(body.itemId ?? "").trim();
    // 가격·활성은 유효 카탈로그(기본 + DB 오버라이드/커스텀)에서 확정
    const { index } = await getEffectiveCatalog();
    const entry = index[itemId];
    if (!entry) throw new AuthError("존재하지 않는 아이템입니다.", 404);
    if (!entry.active)
      throw new AuthError("판매가 중단된 아이템입니다.", 400);

    const result = await buyItem(user.id, itemId, entry.price);
    if (result === "owned")
      throw new AuthError("이미 보유한 아이템입니다.", 409);
    if (result === "insufficient")
      throw new AuthError("포인트가 부족합니다.", 400);

    // 구매 즉시 자동 장착 (레거시 아바타면 v2 기본으로 전환 후 장착)
    const base: AvatarV2Data = isV2(user.avatar_config)
      ? (user.avatar_config as AvatarV2Data)
      : { ...DEFAULT_AVATAR_V2, equipped: {} };
    const avatarConfig: AvatarV2Data = {
      ...base,
      equipped: { ...base.equipped, [entry.slotId]: itemId },
    };

    const db = getAdminDb();
    await db
      .from("users")
      .update({ avatar: "v2", avatar_config: avatarConfig })
      .eq("id", user.id);

    const balance = await getPoints(user.id);
    return NextResponse.json({ ok: true, balance, avatarConfig });
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
