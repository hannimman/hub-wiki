import { getAdminDb } from "../db";
import {
  ITEMS,
  SLOTS,
  registerExtraItems,
  type AvatarItem,
  type ExtraItem,
} from "./catalog";

// 유효 카탈로그 = 코드 기본 아이템 + DB 오버라이드(가격/활성/이름) + DB 커스텀 아이템.
// 아바타 렌더는 모든 페이지에서 일어나므로 60초 TTL 메모리 캐시로 DB 부하를 막는다.
// 슈퍼가 아이템을 수정하면 invalidateItemCache() 로 즉시 반영.

export type ShopItemRow = {
  id: string;
  slot: string;
  name: string | null;
  price: number | null;
  svg: string | null;
  rigid: boolean;
  active: boolean;
  custom: boolean;
};

export type EffectiveItem = AvatarItem & {
  slotId: string;
  active: boolean;
  custom: boolean;
};

let cache: { at: number; rows: ShopItemRow[] } | null = null;
const TTL_MS = 60_000;

async function loadRows(force = false): Promise<ShopItemRow[]> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.rows;
  const db = getAdminDb();
  const { data, error } = await db
    .from("shop_items")
    .select("id, slot, name, price, svg, rigid, active, custom")
    .limit(2000);
  if (error) {
    // 0015 미적용 등 — 기본 카탈로그만으로 동작 (기능 저하일 뿐 장애 아님)
    console.error("shop_items load failed", error.message);
    return cache?.rows ?? [];
  }
  cache = { at: Date.now(), rows: (data ?? []) as ShopItemRow[] };
  return cache.rows;
}

export function invalidateItemCache(): void {
  cache = null;
}

// opts.fresh: TTL 캐시를 건너뛰고 항상 DB에서 읽는다.
// (관리 화면용 — dev/서버리스에서 라우트별 모듈 인스턴스가 분리되면
//  invalidateItemCache 가 다른 인스턴스의 캐시를 못 비우기 때문)
export async function getEffectiveCatalog(opts?: { fresh?: boolean }): Promise<{
  bySlot: Record<string, EffectiveItem[]>;
  index: Record<string, EffectiveItem>;
}> {
  const rows = await loadRows(opts?.fresh === true);
  const overrides = new Map(rows.filter((r) => !r.custom).map((r) => [r.id, r]));

  const bySlot: Record<string, EffectiveItem[]> = {};
  for (const s of SLOTS) {
    bySlot[s.id] = (ITEMS[s.id] || []).map((it) => {
      const o = overrides.get(it.id);
      return {
        ...it,
        name: o?.name ?? it.name,
        price: o?.price ?? it.price,
        slotId: s.id,
        active: o?.active ?? true,
        custom: false,
      };
    });
  }
  for (const r of rows) {
    if (!r.custom || !r.svg) continue;
    (bySlot[r.slot] = bySlot[r.slot] || []).push({
      id: r.id,
      name: r.name ?? r.id,
      price: r.price ?? 0,
      svg: r.svg,
      rigid: r.rigid,
      slotId: r.slot,
      active: r.active,
      custom: true,
    });
  }

  const index: Record<string, EffectiveItem> = {};
  for (const items of Object.values(bySlot))
    for (const it of items) index[it.id] = it;
  return { bySlot, index };
}

// 커스텀 아이템을 렌더 레지스트리에 등록하고(서버), 클라 전달용으로 반환.
// 루트 layout 과 아바타 저장 API(sanitize 전)에서 호출한다.
export async function loadAndRegisterExtras(): Promise<ExtraItem[]> {
  const rows = await loadRows();
  const extras: ExtraItem[] = rows
    .filter((r) => r.custom && r.svg)
    .map((r) => ({
      id: r.id,
      slotId: r.slot,
      name: r.name ?? r.id,
      price: r.price ?? 0,
      svg: r.svg!,
      rigid: r.rigid,
    }));
  registerExtraItems(extras);
  return extras;
}
