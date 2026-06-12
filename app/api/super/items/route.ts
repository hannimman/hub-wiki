import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireSuper, AuthError } from "@/lib/auth";
import { getAdminDb } from "@/lib/db";
import { ITEM_INDEX, SLOT_IDS } from "@/lib/avatar/catalog";
import { invalidateItemCache } from "@/lib/avatar/catalog-db";

export const dynamic = "force-dynamic";

const clampPrice = (v: unknown) =>
  Math.max(0, Math.min(1000000, Math.trunc(Number(v)) || 0));

// 슈퍼 전용 아이템 관리.
//  * 기본 아이템 오버라이드: { id(기본 아이템), price?, active?, name? }
//  * 커스텀 등록:           { create: true, slot, name, price, svg, rigid? }
//  * 커스텀 수정:           { id(cust-*), price?, active?, name?, svg? }
export async function POST(req: Request) {
  try {
    await requireSuper();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      throw new AuthError("잘못된 요청입니다.", 400);

    const db = getAdminDb();

    // ── 커스텀 등록 ──
    if (body.create === true) {
      const slot = String(body.slot ?? "");
      const name = String(body.name ?? "").trim().slice(0, 40);
      const svg = String(body.svg ?? "").trim();
      if (!SLOT_IDS.includes(slot))
        throw new AuthError("슬롯이 올바르지 않습니다.", 400);
      if (!name) throw new AuthError("이름을 입력하세요.", 400);
      if (!svg || svg.length > 20000)
        throw new AuthError("SVG 코드가 비었거나 너무 깁니다(20KB 제한).", 400);
      if (/\bid\s*=/.test(svg))
        throw new AuthError(
          "SVG 에 id 속성을 쓸 수 없습니다(중복 렌더 충돌). 가이드 문서를 참고하세요.",
          400
        );
      if (/<\s*(script|foreignObject)|on[a-z]+\s*=|javascript:/i.test(svg))
        throw new AuthError("허용되지 않는 SVG 내용이 있습니다.", 400);

      const id = `cust-${randomUUID().slice(0, 8)}`;
      const { error } = await db.from("shop_items").insert({
        id,
        slot,
        name,
        price: clampPrice(body.price),
        svg,
        rigid: body.rigid === true,
        active: true,
        custom: true,
      });
      if (error) throw new Error(error.message);
      invalidateItemCache();
      return NextResponse.json({ ok: true, id });
    }

    // ── 오버라이드/수정 ──
    const id = String(body.id ?? "").trim();
    if (!id) throw new AuthError("아이템 id가 없습니다.", 400);

    const fields: Record<string, unknown> = {};
    if (body.price !== undefined) fields.price = clampPrice(body.price);
    if (typeof body.active === "boolean") fields.active = body.active;
    if (typeof body.name === "string" && body.name.trim())
      fields.name = body.name.trim().slice(0, 40);

    if (id.startsWith("cust-")) {
      // 커스텀 아이템 직접 수정 (svg/rigid 교체 허용)
      if (typeof body.rigid === "boolean") fields.rigid = body.rigid;
      if (typeof body.svg === "string" && body.svg.trim()) {
        const svg = body.svg.trim();
        if (svg.length > 20000 || /\bid\s*=/.test(svg) ||
            /<\s*(script|foreignObject)|on[a-z]+\s*=|javascript:/i.test(svg))
          throw new AuthError("SVG 가 규칙에 어긋납니다.", 400);
        fields.svg = svg;
      }
      const { error } = await db.from("shop_items").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      // 기본 아이템 오버라이드 행 upsert
      const builtin = ITEM_INDEX[id];
      if (!builtin) throw new AuthError("존재하지 않는 아이템입니다.", 404);
      const { error } = await db.from("shop_items").upsert({
        id,
        slot: builtin.slotId,
        custom: false,
        svg: null,
        ...fields,
      });
      if (error) throw new Error(error.message);
    }

    invalidateItemCache();
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("super items error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
