import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getAdminDb } from "@/lib/db";
import { createPage } from "@/lib/pages";
import { award, countTodayByReason, getPointConfig, listOwned } from "@/lib/points";
import { DAILY_CAP } from "@/lib/points-shared";
import { getEffectiveCatalog } from "@/lib/avatar/catalog-db";

// 적립 최소 본문 길이 — 빈 글 도배로 포인트 버는 것 방지
const EARN_MIN_CONTENT = 100;

export const dynamic = "force-dynamic";

// 문서 생성 (로그인 활성 사용자만)
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body) throw new AuthError("잘못된 요청입니다.", 400);

    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "");
    const summary = String(body.summary ?? "").trim().slice(0, 200);
    const ratingsEnabled = !!body.ratingsEnabled;
    const parentId = body.parentId ? String(body.parentId) : null;

    if (title.length < 1 || title.length > 200)
      throw new AuthError("제목은 1~200자여야 합니다.", 400);
    if (content.length > 200000)
      throw new AuthError("본문이 너무 깁니다.", 400);

    const slug = await createPage(
      user.id,
      title,
      content,
      summary,
      ratingsEnabled,
      parentId
    );

    // 포인트 적립 (실패해도 문서 생성은 성공 처리): 본문 100자 이상 + 하루 캡
    try {
      const cfg = await getPointConfig();
      if (
        cfg.newDoc > 0 &&
        content.trim().length >= EARN_MIN_CONTENT &&
        (await countTodayByReason(user.id, "new_doc")) < DAILY_CAP.new_doc
      ) {
        await award(user.id, cfg.newDoc, "new_doc", slug);
      }
    } catch (e) {
      console.error("new doc points failed", e);
    }

    // 🎁 아이템 드롭 — 낮은 확률(슈퍼 설정 %), 하루 1회, 본문 100자 이상만
    let drop: { id: string; name: string; svg: string } | null = null;
    try {
      const cfg = await getPointConfig();
      if (
        cfg.dropRate > 0 &&
        content.trim().length >= EARN_MIN_CONTENT &&
        Math.random() * 100 < cfg.dropRate &&
        (await countTodayByReason(user.id, "item_drop")) < 1
      ) {
        const [{ index }, ownedArr] = await Promise.all([
          getEffectiveCatalog(),
          listOwned(user.id),
        ]);
        const owned = new Set(ownedArr);
        const pool = Object.values(index).filter(
          (it) => it.active && it.price > 0 && !owned.has(it.id)
        );
        if (pool.length > 0) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          const db = getAdminDb();
          const { error } = await db
            .from("owned_items")
            .insert({ user_id: user.id, item_key: pick.id });
          if (!error) {
            // 이력(amount 0) — 표시 + 하루 1회 캡 집계용
            await award(user.id, 0, "item_drop", pick.id);
            drop = { id: pick.id, name: pick.name, svg: pick.svg };
          }
        }
      }
    } catch (e) {
      console.error("item drop failed", e);
    }

    return NextResponse.json({ ok: true, slug, drop });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("create page error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
