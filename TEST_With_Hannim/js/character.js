// SVG 캐릭터 합성 렌더러 (관절 분리 버전)
// 팔/다리를 별도 그룹으로 분리해 걷기 모드에서 회전(스윙)시킨다.
// 하의/신발 아이템은 clipPath로 왼다리/오른다리 영역을 잘라 각 다리 그룹에 포함
// → 옷을 입은 채로 다리가 움직인다.

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

// 상점 미리보기 고스트용 전신
const BODY_SVG = `<g>${LEG_L}${LEG_R}${ARM_L}${ARM_R}${BODY_CORE}${HAND_L}${HAND_R}</g>`;

const DEFAULT_BG = `
  <rect x="0" y="0" width="320" height="356" fill="#eef4fb"/>
  <rect x="0" y="352" width="320" height="48" fill="#e2e8da"/>`;

function findItem(slotId, itemId) {
  if (!itemId) return null;
  return (ITEMS[slotId] || []).find((it) => it.id === itemId) || null;
}

function equippedOrPreview(slotId) {
  return State.preview[slotId] ?? State.data.equipped[slotId];
}

function layerSvg(slotId) {
  const item = findItem(slotId, equippedOrPreview(slotId));
  if (!item) return "";
  return `<g class="layer" data-slot="${slotId}">${item.svg}</g>`;
}

// 아이템을 특정 clipPath 영역만 잘라서 그린다 (다리별 분할용)
function layerSvgClipped(slotId, clipId) {
  const item = findItem(slotId, equippedOrPreview(slotId));
  if (!item) return "";
  return `<g class="layer" data-slot="${slotId}" clip-path="url(#${clipId})">${item.svg}</g>`;
}

// 상의에서 소매(sleeve-l/r) 그룹을 추출해 몸통과 분리
// → 소매는 팔 스윙 그룹에 넣어 걷기 모드에서 팔과 함께 회전
function topLayers() {
  const item = findItem("top", equippedOrPreview("top"));
  if (!item) return { torso: "", sleeveL: "", sleeveR: "" };
  let svg = item.svg;
  const pull = (cls) => {
    const re = new RegExp('<g class="' + cls + '">[\\s\\S]*?</g>', "g");
    const found = svg.match(re) || [];
    svg = svg.replace(re, "");
    return found.join("");
  };
  const sleeveL = pull("sleeve-l");
  const sleeveR = pull("sleeve-r");
  return {
    torso: `<g class="layer" data-slot="top">${svg}</g>`,
    sleeveL,
    sleeveR,
  };
}

function faceSvg(part) {
  const id = State.data.face[part];
  const opt = (FACE_OPTIONS[part] || []).find((o) => o.id === id);
  return opt ? opt.svg : "";
}

function renderCharacter() {
  const svg = document.getElementById("stage-svg");
  const bgItem = findItem("background", equippedOrPreview("background"));
  const bg = bgItem
    ? `<g class="layer" data-slot="background">${bgItem.svg}</g>`
    : DEFAULT_BG;
  const top = topLayers();
  // rigid 하의(치마 등)는 좌우로 쪼개지 않고 통째로 몸통에 고정
  const bottomItem = findItem("bottom", equippedOrPreview("bottom"));
  const bottomRigid = !!(bottomItem && bottomItem.rigid);

  svg.innerHTML = `
    <defs>
      <!-- 다리 분할선 y=270(허벅지) / 엉덩이 띠는 y<280까지 덮어 이음새를 가린다 -->
      <clipPath id="clip-hip"><rect x="0" y="0" width="320" height="280"/></clipPath>
      <clipPath id="clip-leg-l"><rect x="0" y="270" width="160" height="130"/></clipPath>
      <clipPath id="clip-leg-r"><rect x="160" y="270" width="160" height="130"/></clipPath>
    </defs>
    ${bg}
    ${layerSvg("decoL")}
    ${layerSvg("decoR")}
    <ellipse cx="160" cy="364" rx="84" ry="10" fill="#1d2433" opacity="0.10"/>
    <g id="char">
    <g id="char-inner">
      <g class="limb leg-l">${LEG_L}${bottomRigid ? "" : layerSvgClipped("bottom", "clip-leg-l")}${layerSvgClipped("shoes", "clip-leg-l")}</g>
      <g class="limb leg-r">${LEG_R}${bottomRigid ? "" : layerSvgClipped("bottom", "clip-leg-r")}${layerSvgClipped("shoes", "clip-leg-r")}</g>
      <g class="limb arm-l">${ARM_L}</g>
      <g class="limb arm-r">${ARM_R}</g>
      ${BODY_CORE}
      ${bottomRigid ? layerSvg("bottom") : layerSvgClipped("bottom", "clip-hip")}
      ${top.torso}
      <g class="limb arm-l-mid">${top.sleeveL}</g>
      <g class="limb arm-r-mid">${top.sleeveR}</g>
      <g class="eyes">${faceSvg("eyes")}</g>
      ${faceSvg("nose")}
      ${faceSvg("mouth")}
      ${layerSvg("beard")}
      ${layerSvg("faceAcc")}
      ${layerSvg("hair")}
      ${layerSvg("hat")}
      <g class="limb arm-l-front">${HAND_L}${layerSvg("handL")}</g>
      <g class="limb arm-r-front">${HAND_R}${layerSvg("handR")}</g>
    </g>
    </g>`;
}

// 장착 직후 해당 레이어에 팝 애니메이션 (다리 분할로 여러 개일 수 있음)
function popLayer(slotId) {
  const els = document.querySelectorAll(`#stage-svg .layer[data-slot="${slotId}"]`);
  els.forEach((el) => {
    el.classList.remove("pop");
    requestAnimationFrame(() => el.classList.add("pop"));
  });
}
