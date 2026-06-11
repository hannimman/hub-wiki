// 아바타 v2 렌더러 — 순수 함수 (장착 데이터 → SVG 문자열)
// 가이드(AVATAR-SYSTEM-GUIDE.md) 4절 레이어 순서 + 5.2~5.4 관절 분리를 그대로 이식.
// 전신(full): 상점 무대·마이페이지·위키 광장(걷기)용. clipPath id는 uid 접미사로 충돌 방지.
// 흉상(bust): 헤더/작성자 표시용 동그라미 — 얼굴 크롭 viewBox, clipPath 불필요(목록에 다수 렌더 안전).

import { ITEMS, FACE_OPTIONS, SLOTS, findItem, findFace } from "./catalog";

export type AvatarV2Data = {
  v: 2;
  face: { eyes: string; nose: string; mouth: string };
  equipped: Record<string, string | null>;
};

export const DEFAULT_AVATAR_V2: AvatarV2Data = {
  v: 2,
  face: { eyes: "eyes-basic", nose: "nose-dot", mouth: "mouth-smile" },
  equipped: {},
};

export function isV2(config: unknown): config is AvatarV2Data {
  return !!config && typeof config === "object" && (config as { v?: unknown }).v === 2;
}

// ── 몸체 (피부) — 데모 character.js와 동일 좌표 ──
const SKIN = "#ffd9b3";

const BODY_CORE = `
  <path d="M128 175 Q160 162 192 175 L196 265 Q160 278 124 265 Z" fill="${SKIN}"/>
  <circle cx="104" cy="122" r="9" fill="${SKIN}"/>
  <circle cx="216" cy="122" r="9" fill="${SKIN}"/>
  <circle cx="160" cy="120" r="56" fill="${SKIN}"/>
  <circle cx="128" cy="142" r="8" fill="#ffb3a7" opacity="0.55"/>
  <circle cx="192" cy="142" r="8" fill="#ffb3a7" opacity="0.55"/>`;

const LEG_L = `
  <rect x="138" y="255" width="16" height="92" rx="8" fill="${SKIN}"/>
  <ellipse cx="146" cy="350" rx="14" ry="9" fill="${SKIN}"/>`;
const LEG_R = `
  <rect x="166" y="255" width="16" height="92" rx="8" fill="${SKIN}"/>
  <ellipse cx="174" cy="350" rx="14" ry="9" fill="${SKIN}"/>`;

const ARM_L = `<path d="M133 192 Q112 215 104 250" stroke="${SKIN}" stroke-width="15" stroke-linecap="round" fill="none"/>`;
const ARM_R = `<path d="M187 192 Q208 215 216 250" stroke="${SKIN}" stroke-width="15" stroke-linecap="round" fill="none"/>`;
const HAND_L = `<circle cx="103" cy="252" r="10" fill="${SKIN}"/>`;
const HAND_R = `<circle cx="217" cy="252" r="10" fill="${SKIN}"/>`;

// 상점 카드 썸네일의 고스트 몸체 (어디에 입는 아이템인지 보여주기용)
export const BODY_SVG = `<g>${LEG_L}${LEG_R}${ARM_L}${ARM_R}${BODY_CORE}${HAND_L}${HAND_R}</g>`;

const DEFAULT_BG = `
  <rect x="0" y="0" width="320" height="356" fill="#eef4fb"/>
  <rect x="0" y="352" width="320" height="48" fill="#e2e8da"/>`;

export const VIEWBOX_FULL = "0 0 320 400";
// 흉상 크롭: 머리(160,120 r56) + 모자 여유 + 상체(어깨·가슴)까지 살짝. 동그라미 프로필용
export const VIEWBOX_BUST = "72 30 176 176";

// ── 내부 헬퍼 ──
type Equip = Record<string, string | null | undefined>;

function effective(data: AvatarV2Data, preview?: Equip): Equip {
  return preview ? { ...data.equipped, ...preview } : data.equipped;
}

function layer(slotId: string, eq: Equip): string {
  const item = findItem(slotId, eq[slotId]);
  if (!item) return "";
  return `<g class="layer" data-slot="${slotId}">${item.svg}</g>`;
}

function layerClipped(slotId: string, eq: Equip, clipId: string): string {
  const item = findItem(slotId, eq[slotId]);
  if (!item) return "";
  return `<g class="layer" data-slot="${slotId}" clip-path="url(#${clipId})">${item.svg}</g>`;
}

// 상의에서 소매(sleeve-l/r) 그룹을 추출해 몸통과 분리 — 팔 스윙과 동기화하기 위함
function topLayers(eq: Equip): { torso: string; sleeveL: string; sleeveR: string } {
  const item = findItem("top", eq["top"]);
  if (!item) return { torso: "", sleeveL: "", sleeveR: "" };
  let svg = item.svg;
  const pull = (cls: string) => {
    const re = new RegExp('<g class="' + cls + '">[\\s\\S]*?</g>', "g");
    const found = svg.match(re) ?? [];
    svg = svg.replace(re, "");
    return found.join("");
  };
  const sleeveL = pull("sleeve-l");
  const sleeveR = pull("sleeve-r");
  return { torso: `<g class="layer" data-slot="top">${svg}</g>`, sleeveL, sleeveR };
}

function faceSvg(data: AvatarV2Data, part: "eyes" | "nose" | "mouth"): string {
  return findFace(part, data.face?.[part])?.svg ?? "";
}

// ── 전신 합성 (svg 내부 마크업 반환 — <svg viewBox="0 0 320 400"> 안에 넣을 것) ──
// uid: 같은 페이지에 여러 전신을 렌더할 때 clipPath id 충돌 방지용 접미사.
export function composeFullSvg(
  data: AvatarV2Data,
  opts?: { uid?: string; preview?: Equip; noBg?: boolean }
): string {
  const uid = opts?.uid ?? "a";
  const eq = effective(data, opts?.preview);

  // noBg: 광장처럼 캐릭터를 투명 배경으로 띄울 때 (배경만 생략 — 애완동물은 함께 다닌다)
  const bgItem = findItem("background", eq["background"]);
  const bg = opts?.noBg
    ? ""
    : bgItem
    ? `<g class="layer" data-slot="background">${bgItem.svg}</g>`
    : DEFAULT_BG;

  const top = topLayers(eq);
  const bottomItem = findItem("bottom", eq["bottom"]);
  const bottomRigid = !!(bottomItem && bottomItem.rigid);

  const hipId = `clip-hip-${uid}`;
  const legLId = `clip-leg-l-${uid}`;
  const legRId = `clip-leg-r-${uid}`;

  return `
    <defs>
      <clipPath id="${hipId}"><rect x="0" y="0" width="320" height="280"/></clipPath>
      <clipPath id="${legLId}"><rect x="0" y="270" width="160" height="130"/></clipPath>
      <clipPath id="${legRId}"><rect x="160" y="270" width="160" height="130"/></clipPath>
    </defs>
    ${bg}
    ${layer("decoL", eq)}
    ${layer("decoR", eq)}
    <ellipse cx="160" cy="364" rx="84" ry="10" fill="#1d2433" opacity="0.10"/>
    <g class="char">
    <g class="char-inner">
      <g class="limb leg-l">${LEG_L}${bottomRigid ? "" : layerClipped("bottom", eq, legLId)}${layerClipped("shoes", eq, legLId)}</g>
      <g class="limb leg-r">${LEG_R}${bottomRigid ? "" : layerClipped("bottom", eq, legRId)}${layerClipped("shoes", eq, legRId)}</g>
      <g class="limb arm-l">${ARM_L}</g>
      <g class="limb arm-r">${ARM_R}</g>
      ${BODY_CORE}
      ${bottomRigid ? layer("bottom", eq) : layerClipped("bottom", eq, hipId)}
      ${top.torso}
      <g class="limb arm-l-mid">${top.sleeveL}</g>
      <g class="limb arm-r-mid">${top.sleeveR}</g>
      <g class="eyes">${faceSvg(data, "eyes")}</g>
      ${faceSvg(data, "nose")}
      ${faceSvg(data, "mouth")}
      ${layer("beard", eq)}
      ${layer("faceAcc", eq)}
      ${layer("hair", eq)}
      ${layer("hat", eq)}
      <g class="limb arm-l-front">${HAND_L}${layer("handL", eq)}</g>
      <g class="limb arm-r-front">${HAND_R}${layer("handR", eq)}</g>
    </g>
    </g>`;
}

// ── 평면 전신 합성 (정적 미리보기 전용) ──
// clipPath/defs 를 전혀 쓰지 않아 id 가 없다 → 호버 팝업처럼 한 페이지에
// 무한 복제돼도 충돌이 없다. 하의/신발은 다리 분할 없이 통짜로 그린다(움직임 없음).
export function composeFlatFullSvg(data: AvatarV2Data): string {
  const eq = data.equipped ?? {};
  const bgItem = findItem("background", eq["background"]);
  const bg = bgItem ? bgItem.svg : DEFAULT_BG;
  const top = topLayers(eq);
  return `
    ${bg}
    ${layer("decoL", eq)}
    ${layer("decoR", eq)}
    <ellipse cx="160" cy="364" rx="84" ry="10" fill="#1d2433" opacity="0.10"/>
    ${LEG_L}${LEG_R}
    ${ARM_L}${ARM_R}
    ${BODY_CORE}
    ${layer("bottom", eq)}
    ${layer("shoes", eq)}
    ${top.torso}
    ${top.sleeveL}${top.sleeveR}
    <g class="eyes">${faceSvg(data, "eyes")}</g>
    ${faceSvg(data, "nose")}
    ${faceSvg(data, "mouth")}
    ${layer("beard", eq)}
    ${layer("faceAcc", eq)}
    ${layer("hair", eq)}
    ${layer("hat", eq)}
    ${HAND_L}${layer("handL", eq)}
    ${HAND_R}${layer("handR", eq)}`;
}

// ── 흉상 합성 (동그라미 프로필) — clipPath 불필요 레이어만 ──
export function composeBustSvg(data: AvatarV2Data): string {
  const eq = data.equipped ?? {};
  const bgItem = findItem("background", eq["background"]);
  const bg = bgItem ? bgItem.svg : DEFAULT_BG;
  const top = topLayers(eq); // 어깨 라인이 살짝 보임 — 몸통만 (소매는 크롭 밖)
  return `
    ${bg}
    ${BODY_CORE}
    ${top.torso}
    <g class="eyes">${faceSvg(data, "eyes")}</g>
    ${faceSvg(data, "nose")}
    ${faceSvg(data, "mouth")}
    ${layer("beard", eq)}
    ${layer("faceAcc", eq)}
    ${layer("hair", eq)}
    ${layer("hat", eq)}`;
}

// ── React 컴포넌트 (서버/클라 공용 — 훅 없음) ──

// 흉상(동그라미 아이콘). 마우스 오버 시 풀착장(전신) 레이어 팝업 내장 —
// 어떤 화면에서 쓰든(기존·신규 전부) 자동으로 팝업이 따라온다.
// 팝업은 flat 렌더(id 미사용)라 한 페이지에 다수 복제돼도 충돌 없음.
export function AvatarBustV2({
  data,
  size = 32,
}: {
  data: AvatarV2Data;
  size?: number;
}) {
  return (
    <span className="av-hover" style={{ width: size, height: size }}>
      <svg
        viewBox={VIEWBOX_BUST}
        width={size}
        height={size}
        role="img"
        aria-label="아바타"
        style={{ borderRadius: "50%", background: "#eef4fb", flexShrink: 0 }}
        dangerouslySetInnerHTML={{ __html: composeBustSvg(data) }}
      />
      <span className="av-pop" aria-hidden>
        <svg
          viewBox={VIEWBOX_FULL}
          width={150}
          height={188}
          dangerouslySetInnerHTML={{ __html: composeFlatFullSvg(data) }}
        />
      </span>
    </span>
  );
}

export function AvatarFullV2({
  data,
  width = 240,
  uid,
  preview,
  className,
  noBg,
}: {
  data: AvatarV2Data;
  width?: number;
  uid?: string;
  preview?: Equip;
  className?: string;
  noBg?: boolean;
}) {
  return (
    <svg
      viewBox={VIEWBOX_FULL}
      width={width}
      height={(width * 400) / 320}
      role="img"
      aria-label="아바타 전신"
      className={className}
      dangerouslySetInnerHTML={{
        __html: composeFullSvg(data, { uid, preview, noBg }),
      }}
    />
  );
}

// ── 서버 저장 전 검증 ──
// face: 카탈로그에 있는 옵션이면 통과(무료). equipped: 카탈로그에 존재 + ownedSet 보유 시에만 통과.
export function sanitizeAvatarV2(
  input: unknown,
  ownedSet: Set<string>
): AvatarV2Data {
  const o = (input ?? {}) as Record<string, unknown>;
  const face = (o.face ?? {}) as Record<string, unknown>;
  const pickFace = (part: "eyes" | "nose" | "mouth") => {
    const v = face[part];
    return typeof v === "string" && findFace(part, v)
      ? v
      : DEFAULT_AVATAR_V2.face[part];
  };

  const equippedIn = (o.equipped ?? {}) as Record<string, unknown>;
  const equipped: Record<string, string | null> = {};
  for (const slot of SLOTS) {
    const v = equippedIn[slot.id];
    if (
      typeof v === "string" &&
      (ITEMS[slot.id] || []).some((it) => it.id === v) &&
      ownedSet.has(v)
    ) {
      equipped[slot.id] = v;
    } else {
      equipped[slot.id] = null;
    }
  }

  return {
    v: 2,
    face: { eyes: pickFace("eyes"), nose: pickFace("nose"), mouth: pickFace("mouth") },
    equipped,
  };
}
