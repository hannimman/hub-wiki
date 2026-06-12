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

type Tab = "face" | "shop" | "gacha" | "inv";

type GachaResult = {
  id: string;
  name: string;
  slotId: string;
  price: number;
  svg: string;
};

export default function ShopClient({
  initialData,
  initialOwned,
  initialPoints,
  catalogBySlot,
  gachaCost = 300,
}: {
  initialData: AvatarV2Data;
  initialOwned: string[];
  initialPoints: number;
  // 유효 카탈로그(기본 + DB 오버라이드/커스텀). 비활성 아이템은 보유자만 인벤토리에서 봄.
  catalogBySlot?: Record<string, (AvatarItem & { active?: boolean })[]>;
  gachaCost?: number; // 가챠 1회 비용 (슈퍼 설정)
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

  // 슬롯별 유효 아이템 (prop 미전달 시 기본 카탈로그 폴백)
  const effItems = (slotId: string): (AvatarItem & { active?: boolean })[] =>
    catalogBySlot?.[slotId] ?? ITEMS[slotId] ?? [];

  // 유효 카탈로그 우선 조회 (DB 가격 오버라이드 반영) → 기본 카탈로그 폴백
  const lookupEff = (slotId: string, itemId: string) =>
    effItems(slotId).find((i) => i.id === itemId) ?? findItem(slotId, itemId);

  // 입어보는 중인 미보유 아이템 = 장바구니
  const cart = Object.entries(preview)
    .map(([slotId, id]) => (id ? { slotId, item: lookupEff(slotId, id) } : null))
    .filter(
      (e): e is { slotId: string; item: AvatarItem & { active?: boolean } } =>
        !!e?.item && !owned.has(e.item.id)
    );
  const cartTotal = cart.reduce((sum, e) => sum + e.item.price, 0);

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

  // ── 한번에 구매: 입어보는 중인 미보유 아이템 전부 일괄 구매 + 자동 장착 ──
  async function onBuyAll() {
    if (busy || cart.length === 0) return;
    if (points < cartTotal) {
      showToast(
        `포인트가 부족해요! (${(cartTotal - points).toLocaleString()}P 더 필요)`
      );
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemIds: cart.map((e) => e.item.id) }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(d.error ?? "구매 실패");
      } else {
        const boughtIds: string[] = d.bought ?? [];
        setOwned(new Set([...owned, ...boughtIds]));
        setPoints(d.balance ?? points);
        if (d.avatarConfig) setData(d.avatarConfig);
        setPreview((prev) => {
          const n = { ...prev };
          for (const e of cart)
            if (boughtIds.includes(e.item.id)) delete n[e.slotId];
          return n;
        });
        showToast(
          d.failed?.length
            ? `${boughtIds.length}개 구매 완료, ${d.failed.length}개는 실패했어요`
            : `${boughtIds.length}개 한번에 구매 완료! 바로 장착했어요 ✨`
        );
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
    effItems(slotId).filter((i) => owned.has(i.id)).length;

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
              onClick={() => setShopSlot(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="shop-grid">
          {effItems(slot.id)
            .filter((i) => i.active !== false || owned.has(i.id))
            .map((item) => itemCard(slot, item, "shop"))}
        </div>
      </>
    );
  }

  function renderInvTab() {
    const slots =
      invSlot === "all" ? SLOTS : SLOTS.filter((s) => s.id === invSlot);
    const sections = slots
      .map((slot) => {
        const items = effItems(slot.id).filter((i) => owned.has(i.id));
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

  // ── 가챠 ──
  const [spinning, setSpinning] = useState(false);
  const [gachaResult, setGachaResult] = useState<GachaResult | null>(null);

  async function pullGacha() {
    if (spinning) return;
    setGachaResult(null);
    setSpinning(true);
    const res = await fetch("/api/shop/gacha", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    // 캡슐 연출 시간 확보
    window.setTimeout(() => {
      setSpinning(false);
      if (res.ok) {
        setGachaResult(d.item as GachaResult);
        setOwned((prev) => new Set(prev).add(d.item.id));
        setPoints(d.balance);
        router.refresh(); // 헤더 잔액 갱신
      } else {
        showToast(d.error ?? "가챠에 실패했습니다.");
      }
    }, 1300);
  }

  function renderGachaTab() {
    return (
      <div style={{ textAlign: "center", padding: "18px 0" }}>
        <div
          style={{
            fontSize: 84,
            lineHeight: 1,
            display: "inline-block",
            animation: spinning ? "gachaShake 0.18s linear infinite" : undefined,
          }}
          aria-hidden
        >
          🎰
        </div>
        <p className="muted" style={{ fontSize: 13, margin: "10px 0 14px" }}>
          1회 <b style={{ color: "#b45309" }}>🪙 {gachaCost.toLocaleString()}P</b>
          {" — "}미보유 아이템 중 하나가 무작위로! <b>비쌀수록 희귀</b>해요. (중복 없음)
        </p>
        <button
          className="btn btn-primary"
          onClick={pullGacha}
          disabled={spinning || points < gachaCost}
          style={{ fontSize: 16, padding: "10px 26px" }}
        >
          {spinning
            ? "두근두근…"
            : points < gachaCost
            ? `포인트 부족 (${gachaCost.toLocaleString()}P 필요)`
            : `🎰 가챠 돌리기 — ${gachaCost.toLocaleString()}P`}
        </button>

        {gachaResult && !spinning && (
          <div
            className="card"
            style={{ maxWidth: 260, margin: "18px auto 0", textAlign: "center" }}
          >
            <div style={{ fontSize: 22 }}>🎉</div>
            <svg
              viewBox="0 0 320 400"
              width={120}
              height={150}
              style={{ display: "block", margin: "6px auto", background: "#fafbfc", borderRadius: 10 }}
              dangerouslySetInnerHTML={{ __html: gachaResult.svg }}
            />
            <div style={{ fontWeight: 800, fontSize: 16 }}>{gachaResult.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              정가 🪙 {gachaResult.price.toLocaleString()}P — 인벤토리에 추가됐어요!
            </div>
          </div>
        )}
      </div>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "face", label: "🙂 얼굴 (무료)" },
    { id: "shop", label: "🛒 상점" },
    { id: "gacha", label: "🎰 가챠" },
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
            <div>
              👀 입어보는 중 —{" "}
              {cart
                .map(
                  (e) => `${e.item.name} ${e.item.price.toLocaleString()}P`
                )
                .join(" · ")}
            </div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                gap: 8,
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {cart.length > 0 && (
                <button
                  className="btn btn-sm btn-primary"
                  disabled={busy || points < cartTotal}
                  onClick={onBuyAll}
                >
                  {points < cartTotal
                    ? `포인트 부족 — 합계 🪙 ${cartTotal.toLocaleString()}P`
                    : `🛒 한번에 구매 — 🪙 ${cartTotal.toLocaleString()}P${
                        cart.length > 1 ? ` (${cart.length}개)` : ""
                      }`}
                </button>
              )}
              <button className="btn btn-sm" onClick={() => setPreview({})}>
                벗기
              </button>
            </div>
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
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="shop-body">
          {tab === "face" && renderFaceTab()}
          {tab === "shop" && renderShopTab()}
          {tab === "gacha" && renderGachaTab()}
          {tab === "inv" && renderInvTab()}
        </div>
      </div>

      {toast && <div className="shop-toast">{toast}</div>}
    </div>
  );
}
