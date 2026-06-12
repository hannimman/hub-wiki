import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getPoints, listOwned, getPointConfig } from "@/lib/points";
import {
  isV2,
  DEFAULT_AVATAR_V2,
  type AvatarV2Data,
} from "@/lib/avatar/render";
import { getEffectiveCatalog } from "@/lib/avatar/catalog-db";
import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [points, owned, catalog, pointCfg] = await Promise.all([
    getPoints(user.id),
    listOwned(user.id),
    getEffectiveCatalog(), // 기본 + DB 오버라이드/커스텀 병합본
    getPointConfig(),
  ]);

  // 레거시 아바타 유저는 v2 기본값으로 시작 (저장하면 v2 로 전환)
  const data: AvatarV2Data = isV2(user.avatar_config)
    ? (user.avatar_config as AvatarV2Data)
    : DEFAULT_AVATAR_V2;

  return (
    <main className="container page">
      <div className="row-between">
        <h1 style={{ margin: 0 }}>🛍️ 아바타 상점</h1>
        <Link href="/me" className="btn btn-sm">
          ← 마이페이지
        </Link>
      </div>
      <p className="muted" style={{ margin: "6px 0 16px" }}>
        카드를 누르면 <b>무료로 입어볼 수</b> 있어요. 마음에 들면 구매! (구매한
        아이템은 영구 소유)
      </p>
      <ShopClient
        initialData={data}
        initialOwned={owned}
        initialPoints={points}
        catalogBySlot={catalog.bySlot}
        gachaCost={pointCfg.gachaCost}
      />
    </main>
  );
}
