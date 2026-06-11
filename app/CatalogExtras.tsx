"use client";

import { registerExtraItems, type ExtraItem } from "@/lib/avatar/catalog";

// DB 커스텀 아이템을 클라이언트 카탈로그 레지스트리에 주입.
// 루트 layout 에서 children 보다 먼저 렌더되므로(트리 순서), 광장/마을/상점의
// 클라이언트 합성에서도 커스텀 아이템이 보인다. 등록은 멱등.
export default function CatalogExtras({ items }: { items: ExtraItem[] }) {
  registerExtraItems(items);
  return null;
}
