"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerExtraItems, type AvatarItem } from "@/lib/avatar/catalog";
import { AvatarFullV2, DEFAULT_AVATAR_V2 } from "@/lib/avatar/render";

// 등록/수정 폼의 실시간 미리보기용 임시 아이템 id (저장 전엔 카탈로그에 없으므로)
const PREVIEW_ID = "cust-__preview__";

// 슈퍼 아이템 관리 — 슬롯별 목록(가격/활성 인라인 수정) + 커스텀 아이템 등록(미리보기).
type Eff = AvatarItem & { slotId: string; active: boolean; custom: boolean };

export default function SuperItemsClient({
  slots,
  bySlot,
}: {
  slots: { id: string; name: string }[];
  bySlot: Record<string, Eff[]>;
}) {
  const router = useRouter();
  const [slot, setSlot] = useState(slots[0]?.id ?? "hair");
  const [busy, setBusy] = useState<string | null>(null);
  // 가격 입력 로컬 상태 (id → 문자열)
  const [prices, setPrices] = useState<Record<string, string>>({});

  // 커스텀 등록/수정 폼
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null=신규
  const [cSlot, setCSlot] = useState("hat");
  const [cName, setCName] = useState("");
  const [cPrice, setCPrice] = useState("300");
  const [cSvg, setCSvg] = useState("");
  const [cRigid, setCRigid] = useState(false);
  const [creating, setCreating] = useState(false);
  const [walkPrev, setWalkPrev] = useState(false); // 미리보기 걷기 (rigid 확인용)

  // 입력 중인 SVG 를 임시 아이템으로 레지스트리에 등록 → 실제 렌더러로 미리보기
  if (cSvg.trim()) {
    registerExtraItems([
      { id: PREVIEW_ID, slotId: cSlot, name: "미리보기", price: 0, svg: cSvg, rigid: cRigid },
    ]);
  }

  function startEdit(it: Eff) {
    setEditingId(it.id);
    setCSlot(it.slotId);
    setCName(it.name);
    setCPrice(String(it.price));
    setCSvg(it.svg);
    setCRigid(!!it.rigid);
    setShowCreate(true);
  }

  async function post(body: Record<string, unknown>, busyKey: string) {
    setBusy(busyKey);
    const res = await fetch("/api/super/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (res.ok) {
      router.refresh();
      return true;
    }
    const d = await res.json().catch(() => ({}));
    alert(d.error ?? "저장에 실패했습니다.");
    return false;
  }

  async function savePrice(it: Eff) {
    const raw = prices[it.id];
    if (raw === undefined || raw === "") return;
    await post({ id: it.id, price: Math.trunc(Number(raw)) }, it.id);
  }

  async function createItem() {
    if (!cName.trim() || !cSvg.trim()) {
      alert("이름과 SVG 코드를 입력하세요.");
      return;
    }
    setCreating(true);
    const ok = await post(
      editingId
        ? { id: editingId, name: cName, price: cPrice, svg: cSvg, rigid: cRigid }
        : { create: true, slot: cSlot, name: cName, price: cPrice, svg: cSvg, rigid: cRigid },
      "create"
    );
    setCreating(false);
    if (ok) {
      setShowCreate(false);
      setEditingId(null);
      setCName("");
      setCSvg("");
    }
  }

  const items = bySlot[slot] ?? [];

  return (
    <div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <select
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
          style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 14 }}
        >
          {slots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({(bySlot[s.id] ?? []).length})
            </option>
          ))}
        </select>
        <button
          className="btn btn-sm"
          onClick={() => {
            if (showCreate) {
              setShowCreate(false);
              setEditingId(null);
            } else {
              setEditingId(null);
              setCName("");
              setCSvg("");
              setShowCreate(true);
            }
          }}
        >
          {showCreate ? "폼 닫기" : "＋ 커스텀 아이템 등록"}
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ margin: "12px 0", padding: 14 }}>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <select
              value={cSlot}
              onChange={(e) => setCSlot(e.target.value)}
              disabled={!!editingId}
              title={editingId ? "수정 시 슬롯은 변경할 수 없어요" : undefined}
              style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            >
              {slots.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input
              placeholder="이름"
              value={cName}
              maxLength={40}
              onChange={(e) => setCName(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            />
            <input
              type="text"
              inputMode="numeric"
              value={cPrice}
              onChange={(e) => /^\d*$/.test(e.target.value) && setCPrice(e.target.value)}
              style={{ width: 90, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, textAlign: "right" }}
            />
            <span style={{ color: "#b45309", fontWeight: 700 }}>P</span>
            <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
              <input type="checkbox" checked={cRigid} onChange={(e) => setCRigid(e.target.checked)} />
              rigid
              <span
                className="help-tip"
                data-tip={
                  "걸을 때 하의·신발류는 왼/오른다리로 반 갈라져 다리와 함께 흔들립니다.\n" +
                  "rigid를 켜면 가르지 않고 한 덩어리로 둡니다.\n" +
                  "⭕ 켜기: 치마·원피스·로브처럼 가르면 찢어져 보이는 아이템\n" +
                  "❌ 끄기(기본): 바지·반바지·신발\n" +
                  "다리와 무관한 슬롯(모자·손 등)은 영향 없음"
                }
              >
                ?
              </span>
            </label>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
            <textarea
              placeholder='SVG 조각 (viewBox 0 0 320 400 좌표계, id 속성 금지) — 예: <circle cx="160" cy="80" r="20" fill="#f00"/>'
              value={cSvg}
              onChange={(e) => setCSvg(e.target.value)}
              style={{
                flex: 1, minWidth: 280, minHeight: 140, padding: 10,
                borderRadius: 8, border: "1px solid var(--border)",
                fontFamily: "monospace", fontSize: 12,
              }}
            />
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  border: "1px dashed var(--border)",
                  borderRadius: 8,
                  background: "#fafbfc",
                  overflow: "hidden",
                }}
              >
                <AvatarFullV2
                  data={{
                    v: 2,
                    face: DEFAULT_AVATAR_V2.face,
                    equipped: cSvg.trim() ? { [cSlot]: PREVIEW_ID } : {},
                  }}
                  width={130}
                  uid="iprev"
                  noBg
                  className={walkPrev ? "av-walk" : undefined}
                />
              </div>
              <label
                style={{
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <input
                  type="checkbox"
                  checked={walkPrev}
                  onChange={(e) => setWalkPrev(e.target.checked)}
                />
                🚶 걷기 (rigid 효과 확인)
              </label>
              <div className="muted" style={{ fontSize: 11 }}>실시간 미리보기</div>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginTop: 10 }}
            onClick={createItem}
            disabled={creating}
          >
            {creating ? "저장 중…" : editingId ? "✏️ 수정 저장" : "등록"}
          </button>
          {editingId && (
            <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>
              수정 중: {editingId}
            </span>
          )}
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr>
            {["미리보기", "이름", "가격", "상태", ""].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left", padding: "8px 10px", fontSize: 13,
                  color: "var(--muted)", borderBottom: "1px solid var(--border)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} style={it.active ? undefined : { opacity: 0.5 }}>
              <td style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)" }}>
                <svg
                  viewBox="0 0 320 400"
                  width={44}
                  height={55}
                  style={{ background: "#fafbfc", borderRadius: 6 }}
                  dangerouslySetInnerHTML={{ __html: it.svg }}
                />
              </td>
              <td style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
                <b>{it.name}</b>{" "}
                {it.custom && (
                  <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 999, background: "#ede9fe", color: "#6d28d9" }}>
                    커스텀
                  </span>
                )}
                <div className="muted" style={{ fontSize: 11 }}>{it.id}</div>
              </td>
              <td style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={prices[it.id] ?? String(it.price)}
                  onChange={(e) =>
                    /^\d*$/.test(e.target.value) &&
                    setPrices((p) => ({ ...p, [it.id]: e.target.value }))
                  }
                  onBlur={() => {
                    if (prices[it.id] !== undefined && prices[it.id] !== String(it.price))
                      savePrice(it);
                  }}
                  style={{ width: 80, padding: "5px 8px", borderRadius: 7, border: "1px solid var(--border)", fontSize: 13, textAlign: "right" }}
                />{" "}
                P
              </td>
              <td style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)" }}>
                <button
                  className="btn btn-sm"
                  disabled={busy === it.id}
                  onClick={() => post({ id: it.id, active: !it.active }, it.id)}
                  style={it.active ? undefined : { color: "#c62828" }}
                >
                  {busy === it.id ? "…" : it.active ? "✅ 판매중" : "⛔ 비활성"}
                </button>
                {it.custom && (
                  <button
                    className="btn btn-sm"
                    style={{ marginLeft: 6 }}
                    onClick={() => startEdit(it)}
                  >
                    ✏️ 수정
                  </button>
                )}
              </td>
              <td style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", fontSize: 12 }} className="muted">
                {prices[it.id] !== undefined && prices[it.id] !== String(it.price)
                  ? "포커스 아웃 시 저장"
                  : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
