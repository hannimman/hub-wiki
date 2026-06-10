"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SLOTS,
  ITEMS,
  FACE_SECTIONS,
  FACE_OPTIONS,
  findItem,
  type AvatarItem,
  type Slot,
} from "@/lib/avatar/catalog";
import {
  AvatarFullV2,
  BODY_SVG,
  type AvatarV2Data,
} from "@/lib/avatar/render";

// 고스트 몸체를 깔아주는 슬롯(착용류) — 어디에 입는지 감을 주기 위해
const GHOST_SLOTS = new Set([
  "hair", "hat", "faceAcc", "beard", "top", "bottom", "shoes", "handL", "handR",
]);

type Tab = "face" | "shop" | "inv";

export default function ShopClient({
  initialData,
  initialOwned,
  initialPoints,
}: {
  initialData: AvatarV2Data;
  initialOwned: string[];
  initialPoints: number;
}) {
  const router = useRouter();
  const [data, setData] = useState<AvatarV2Data>(initialData);
  const [owned, setOwned] = useState<Set<string>>(new Set(initialOwned));
  const [points, setPoints] = useState(initialPoints);
  const [preview, setPreview] = useState<Record<string, string | null>>({});
  const [tab, setTab] = useState<Tab>("shop");
  const [shopSlot, setShopSlot] = useState("hair");
  const [invSlot, setInvSlot] = useState("all");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const previewing = Object.keys(preview).length > 0;

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }

  // ── 인터랙션: 눈동자 마우스 추적 + 깜빡임 (무대에서만) ──
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const svg = stage.querySelector("svg");
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const faceX = rect.left + (160 / 320) * rect.width;
        const faceY = rect.top + (110 / 400) * rect.height;
        const dx = e.clientX - faceX;
        const dy = e.clientY - faceY;
        const dist = Math.hypot(dx, dy) || 1;
        const max = 3.2;
        const ox = (dx / dist) * Math.min(max, dist / 40);
        const oy = (dy / dist) * Math.min(max, dist / 40);
        svg.querySelectorAll(".pupil").forEach((p) => {
          p.setAttribute("transform", `translate(${ox.toFixed(2)} ${oy.toFixed(2)})`);
        });
      });
    };
    document.addEventListener("pointermove", onMove);

    let blinkTimer = 0;
    const blinkOnce = () => {
      const eyes = stage.querySelector("svg .eyes");
      if (eyes) {
        eyes.classList.add("blink");
        window.setTimeout(() => eyes.classList.remove("blink"), 140);
      }
      blinkTimer = window.setTimeout(blinkOnce, 2000 + Math.random() * 4000);
    };
    blinkTimer = window.setTimeout(blinkOnce, 1800);

    return () => {
      document.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(blinkTimer);
    };
  }, []);

  // ── 저장 (장착/얼굴 변경은 즉시 저장) ──
  async function save(next: AvatarV2Data) {
    setData(next);
    const res = await fetch("/api/me/avatar", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ avatar: "v2", avatarConfig: next }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      showToast(d.error ?? "저장 실패");
    } else {
      router.refresh(); // 헤더 흉상 등 서버 컴포넌트 동기화
    }
  }

  function onFacePick(part: string, optionId: string) {
    save({ ...data, face: { ...data.face, [part]: optionId } });
  }

  function onItemClick(slotId: string, item: AvatarItem) {
    if (!owned.has(item.id)) {
      // 미보유 → 입어보기 토글 (구매는 구매 버튼으로만)
      if (preview[slotId] === item.id) {
        const n = { ...preview };
        delete n[slotId];
        setPreview(n);
        showToast(`'${item.name}' 입어보기 취소`);
      } else {
        setPreview({ ...preview, [slotId]: item.id });
        showToast(`'${item.name}' 입어보는 중! 마음에 들면 구매를 눌러요 👀`);
      }
      return;
    }
    // 보유 → 장착/해제 토글
    const n = { ...preview };
    delete n[slotId];
    setPreview(n);
    const equippedNow = data.equipped[slotId] === item.id;
    save({
      ...data,
      equipped: { ...data.equipped, [slotId]: equippedNow ? null : item.id },
    });
    showToast(equippedNow ? `'${item.name}' 해제` : `'${item.name}' 장착!`);
  }

  async function onBuy(slotId: string, item: AvatarItem) {
    if (busy || owned.has(item.id)) return;
    if (points < item.price) {
      showToast(`포인트가 부족해요! (${(item.price - points).toLocaleString()}P 더 필요)`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(d.error ?? "구매 실패");
      } else {
        setOwned(new Set([...owned, item.id]));
        setPoints(d.balance ?? points - item.price);
        if (d.avatarConfig) setData(d.avatarConfig);
        const n = { ...preview };
        delete n[slotId];
        setPreview(n);
        showToast(`'${item.name}' 구매 완료! 바로 장착했어요 ✨`);
        router.refresh();
      }
    } catch {
      showToast("네트워크 오류");
    }
    setBusy(false);
  }

  // ── 카드 썸네일: 슬롯 zoom 크롭 + 고스트 몸체 ──
  function thumb(slot: Slot, item: AvatarItem) {
    const ghost = GHOST_SLOTS.has(slot.id)
      ? `<g opacity="0.22">${BODY_SVG}</g>`
      : "";
    return (
      <svg
        viewBox={slot.zoom}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: 76, display: "block" }}
        dangerouslySetInnerHTML={{ __html: ghost + item.svg }}
      />
    );
  }

  const ownedCount = (slotId: string) =>
    (ITEMS[slotId] || []).filter((i) => owned.has(i.id)).length;

  // ── 탭 본문 ──
  function renderFaceTab() {
    return FACE_SECTIONS.map((section) => (
      <div key={section.id}>
        <div className="shop-section-title">{section.name} 고르기 (무료)</div>
        <div className="shop-grid">
          {(FACE_OPTIONS[section.id] || []).map((o) => {
            const selected = data.face[section.id] === o.id;
            return (
              <div
                key={o.id}
                className={`shop-card${selected ? " selected" : ""}`}
                onClick={() => onFacePick(section.id, o.id)}
              >
                <svg
                  viewBox={section.zoom}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ width: "100%", height: 64, display: "block" }}
                  dangerouslySetInnerHTML={{
                    __html: `<circle cx="160" cy="120" r="56" fill="#ffe7cd"/>${o.svg}`,
                  }}
                />
                <div className="shop-card-name">{o.name}</div>
                <button className="shop-act free">
                  {selected ? "선택중 ✓" : "무료 선택"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    ));
  }

  function itemCard(slot: Slot, item: AvatarItem, kind: "shop" | "inv") {
    const isOwned = owned.has(item.id);
    const isEquipped = data.equipped[slot.id] === item.id;
    const isPreviewing = preview[slot.id] === item.id;
    const canBuy = points >= item.price;
    return (
      <div
        key={item.id}
        className={`shop-card${isEquipped ? " equipped" : ""}${
          isPreviewing ? " previewing" : ""
        }`}
        onClick={() => onItemClick(slot.id, item)}
      >
        {isEquipped && <span className="shop-badge on">장착중</span>}
        {!isEquipped && isPreviewing && (
          <span className="shop-badge try">입어보는 중</span>
        )}
        {!isEquipped && !isPreviewing && isOwned && (
          <span className="shop-badge own">보유</span>
        )}
        {thumb(slot, item)}
        <div className="shop-card-name">{item.name}</div>
        {kind === "shop" && !isOwned ? (
          <button
            className={`shop-act buy${canBuy ? "" : " cant"}`}
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              onBuy(slot.id, item);
            }}
          >
            🪙 {item.price.toLocaleString()}
          </button>
        ) : (
          <button className="shop-act">
            {isEquipped ? "해제하기" : "장착하기"}
          </button>
        )}
      </div>
    );
  }

  function renderShopTab() {
    const slot = SLOTS.find((s) => s.id === shopSlot) ?? SLOTS[0];
    return (
      <>
        <div className="shop-chips">
          {SLOTS.map((s) => (
            <button
              key={s.id}
              className={`shop-chip${s.id === shopSlot ? " active" : ""}`}
              onClick={() => {
                setShopSlot(s.id);
                setPreview({});
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="shop-grid">
          {(ITEMS[slot.id] || []).map((item) => itemCard(slot, item, "shop"))}
        </div>
      </>
    );
  }

  function renderInvTab() {
    const slots =
      invSlot === "all" ? SLOTS : SLOTS.filter((s) => s.id === invSlot);
    const sections = slots
      .map((slot) => {
        const items = (ITEMS[slot.id] || []).filter((i) => owned.has(i.id));
        if (items.length === 0) return null;
        return (
          <div key={slot.id}>
            <div className="shop-section-title">
              {slot.name} ({items.length})
            </div>
            <div className="shop-grid">
              {items.map((item) => itemCard(slot, item, "inv"))}
            </div>
          </div>
        );
      })
      .filter(Boolean);
    return (
      <>
        <div className="shop-chips">
          <button
            className={`shop-chip${invSlot === "all" ? " active" : ""}`}
            onClick={() => setInvSlot("all")}
          >
            전체
          </button>
          {SLOTS.filter((s) => ownedCount(s.id) > 0).map((s) => (
            <button
              key={s.id}
              className={`shop-chip${invSlot === s.id ? " active" : ""}`}
              onClick={() => setInvSlot(s.id)}
            >
              {s.name} ({ownedCount(s.id)})
            </button>
          ))}
        </div>
        {sections.length > 0 ? (
          sections
        ) : (
          <p className="muted" style={{ textAlign: "center", padding: "32px 0" }}>
            아직 보유한 아이템이 없어요.
            <br />
            🛒 상점에서 입어보고 마음에 들면 구매해 보세요!
          </p>
        )}
      </>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "face", label: "🙂 얼굴 (무료)" },
    { id: "shop", label: "🛒 상점" },
    { id: "inv", label: "🎒 인벤토리" },
  ];

  return (
    <div className="shop-wrap">
      {/* 무대 */}
      <div className="shop-stage" ref={stageRef}>
        <div className="shop-stage-points">🪙 {points.toLocaleString()}P</div>
        <AvatarFullV2
          data={data}
          width={250}
          uid="shop"
          preview={preview}
          className="stage-idle"
        />
        {previewing && (
          <div className="shop-stage-preview-note">
            👀 입어보는 중 —{" "}
            {Object.entries(preview)
              .map(([s, id]) => findItem(s, id)?.name)
              .filter(Boolean)
              .join(", ")}
            <button
              className="btn btn-sm"
              style={{ marginLeft: 8 }}
              onClick={() => setPreview({})}
            >
              벗기
            </button>
          </div>
        )}
      </div>

      {/* 패널 */}
      <div className="shop-panel">
        <div className="shop-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`shop-tab${tab === t.id ? " active" : ""}`}
              onClick={() => {
                setTab(t.id);
                setPreview({});
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="shop-body">
          {tab === "face" && renderFaceTab()}
          {tab === "shop" && renderShopTab()}
          {tab === "inv" && renderInvTab()}
        </div>
      </div>

      {toast && <div className="shop-toast">{toast}</div>}
    </div>
  );
}
