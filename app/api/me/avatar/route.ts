import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getAdminDb } from "@/lib/db";
import { sanitizeConfig, PRESET_IDS } from "@/lib/avatars";
import { sanitizeAvatarV2, type AvatarV2Data } from "@/lib/avatar/render";
import { listOwned } from "@/lib/points";

export const dynamic = "force-dynamic";

// 내 아바타 변경 (로그인 활성 사용자만, 본인만)
// v2: face 는 무료, equipped 는 "보유한 아이템"만 통과(서버 게이팅).
export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body) throw new AuthError("잘못된 요청입니다.", 400);

    let avatar = String(body.avatar ?? "v2").trim();
    let avatarConfig:
      | ReturnType<typeof sanitizeConfig>
      | AvatarV2Data
      | null = null;

    if (avatar === "v2") {
      const owned = new Set(await listOwned(user.id));
      avatarConfig = sanitizeAvatarV2(body.avatarConfig, owned);
    } else if (avatar === "custom") {
      avatarConfig = sanitizeConfig(body.avatarConfig);
    } else if (!PRESET_IDS.includes(avatar)) {
      avatar = "m1";
    }

    const db = getAdminDb();
    const { error } = await db
      .from("users")
      .update({ avatar, avatar_config: avatarConfig })
      .eq("id", user.id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, avatarConfig });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("update avatar error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
