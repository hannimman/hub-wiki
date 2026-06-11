import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getEffectiveCatalog } from "@/lib/avatar/catalog-db";
import { SLOTS } from "@/lib/avatar/catalog";
import SuperItemsClient from "./SuperItemsClient";

export const dynamic = "force-dynamic";

// 아이템 관리 (슈퍼 전용) — 가격 조정 / 활성·비활성 / 커스텀 아이템 등록.
export default async function SuperItemsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super") redirect("/");

  const { bySlot } = await getEffectiveCatalog();

  return (
    <main className="container page">
      <div className="row-between">
        <h1 style={{ margin: 0 }}>🎒 아이템 관리</h1>
        <Link href="/super" className="btn btn-sm">
          ← 슈퍼 제어판
        </Link>
      </div>
      <p className="muted" style={{ margin: "6px 0 16px" }}>
        가격을 바꾸거나 판매를 중단(비활성)할 수 있어요. 비활성 아이템은
        상점에서 숨겨지지만 이미 보유한 사람은 계속 착용합니다. 새 아이템 제작
        규칙은 <code>docs/ITEM-AUTHORING-GUIDE.md</code> 참고.
      </p>
      <SuperItemsClient
        slots={SLOTS.map((s) => ({ id: s.id, name: s.name }))}
        bySlot={bySlot}
      />
    </main>
  );
}
