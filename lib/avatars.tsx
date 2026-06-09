import type { ReactNode } from "react";

// 파라미터 기반 아바타.
//  * 기본 8종은 PRESETS(고정 설정)로 제공.
//  * "더보기" 커스터마이징: 헤어스타일 / 머리색 / 옷색 / 피부톤 / 악세서리 / 배경.
//  * DB 저장: 프리셋이면 avatar=프리셋id, avatar_config=null.
//             커스텀이면 avatar='custom', avatar_config=AvatarConfig(JSON).

export type HairStyle =
  | "short"
  | "buzz"
  | "long"
  | "bun"
  | "ponytail"
  | "wavy"
  | "bald";

export type Accessory = "none" | "glasses" | "sunglasses" | "beard";

export type AvatarConfig = {
  skin: string;
  shirt: string;
  hair: string;
  style: HairStyle;
  accessory: Accessory;
  bg: string;
};

// 커스터마이저 UI용 팔레트/옵션
export const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: "short", label: "단정" },
  { id: "buzz", label: "짧게" },
  { id: "long", label: "긴머리" },
  { id: "bun", label: "번" },
  { id: "ponytail", label: "포니테일" },
  { id: "wavy", label: "웨이브" },
  { id: "bald", label: "민머리" },
];
export const ACCESSORIES: { id: Accessory; label: string }[] = [
  { id: "none", label: "없음" },
  { id: "glasses", label: "안경" },
  { id: "sunglasses", label: "선글라스" },
  { id: "beard", label: "수염" },
];
export const HAIR_COLORS = [
  "#1c1c1c", "#3a2a1a", "#7a4a22", "#c9a227",
  "#b23b2e", "#6b6b6b", "#d46aa0", "#4a6fa5",
];
export const SHIRT_COLORS = [
  "#5b8def", "#e26d9e", "#58b368", "#f2a154",
  "#7d6bd6", "#4ea0a0", "#d9534f", "#708090",
];
export const SKIN_TONES = ["#f3c9a8", "#e7b393", "#d99a66", "#c68642", "#fadcbf"];
export const BG_COLORS = [
  "#ffd1dc", "#cfe3ff", "#e7d9ff", "#d7f0d8",
  "#fff1c2", "#c9efe9", "#ffe0c2", "#e3e3e8",
];

export const DEFAULT_CONFIG: AvatarConfig = {
  skin: "#f3c9a8",
  shirt: "#5b8def",
  hair: "#1c1c1c",
  style: "short",
  accessory: "none",
  bg: "#cfe3ff",
};

export const PRESETS: { id: string; label: string; config: AvatarConfig }[] = [
  { id: "f1", label: "긴 머리", config: { skin: "#f3c9a8", shirt: "#e26d9e", hair: "#7a4a22", style: "long", accessory: "none", bg: "#ffd1dc" } },
  { id: "m1", label: "단정한 머리", config: { skin: "#f3c9a8", shirt: "#5b8def", hair: "#1c1c1c", style: "short", accessory: "none", bg: "#cfe3ff" } },
  { id: "f2", label: "번 머리", config: { skin: "#e7b393", shirt: "#7d6bd6", hair: "#3a2a1a", style: "bun", accessory: "none", bg: "#e7d9ff" } },
  { id: "m2", label: "수염", config: { skin: "#e7b393", shirt: "#58b368", hair: "#7a4a22", style: "short", accessory: "beard", bg: "#d7f0d8" } },
  { id: "f3", label: "포니테일", config: { skin: "#f3c9a8", shirt: "#f2a154", hair: "#c9a227", style: "ponytail", accessory: "none", bg: "#fff1c2" } },
  { id: "m3", label: "짧은 머리", config: { skin: "#d99a66", shirt: "#4ea0a0", hair: "#1c1c1c", style: "buzz", accessory: "none", bg: "#c9efe9" } },
  { id: "f4", label: "웨이브", config: { skin: "#f3c9a8", shirt: "#d9534f", hair: "#b23b2e", style: "wavy", accessory: "none", bg: "#ffe0c2" } },
  { id: "m4", label: "안경", config: { skin: "#e7b393", shirt: "#708090", hair: "#6b6b6b", style: "short", accessory: "glasses", bg: "#e3e3e8" } },
];

// 하위호환 별칭 (기존 avatars-preview 등에서 사용)
export const AVATARS = PRESETS;

function hairShape(style: HairStyle, color: string): ReactNode {
  switch (style) {
    case "bald":
      return null;
    case "buzz":
      return <path d="M30 47 Q30 28 50 28 Q70 28 70 47 Q62 40 50 39 Q38 40 30 47 Z" fill={color} />;
    case "long":
      return (
        <>
          <path d="M27 50 Q24 74 31 84 L37 82 Q31 64 34 50 Z" fill={color} />
          <path d="M73 50 Q76 74 69 84 L63 82 Q69 64 66 50 Z" fill={color} />
          <path d="M28 50 Q28 25 50 25 Q72 25 72 50 Q66 38 50 37 Q34 38 28 50 Z" fill={color} />
        </>
      );
    case "bun":
      return (
        <>
          <circle cx="50" cy="22" r="7.5" fill={color} />
          <path d="M29 49 Q29 27 50 27 Q71 27 71 49 Q64 38 50 37 Q36 38 29 49 Z" fill={color} />
        </>
      );
    case "ponytail":
      return (
        <>
          <path d="M70 42 Q84 50 80 70 Q75 58 67 52 Z" fill={color} />
          <path d="M28 49 Q28 26 50 26 Q72 26 72 49 Q66 38 50 37 Q34 38 28 49 Z" fill={color} />
        </>
      );
    case "wavy":
      return (
        <>
          <path d="M26 48 Q22 60 28 66 Q24 74 32 82 L38 80 Q32 66 35 50 Z" fill={color} />
          <path d="M74 48 Q78 60 72 66 Q76 74 68 82 L62 80 Q68 66 65 50 Z" fill={color} />
          <path d="M28 50 Q28 24 50 24 Q72 24 72 50 Q66 37 50 36 Q34 37 28 50 Z" fill={color} />
        </>
      );
    case "short":
    default:
      return <path d="M29 48 Q29 26 50 26 Q71 26 71 48 Q64 37 50 36 Q36 37 29 48 Z" fill={color} />;
  }
}

function accessoryShape(acc: Accessory, hairColor: string): ReactNode {
  switch (acc) {
    case "glasses":
      return (
        <g stroke="#333" strokeWidth="2" fill="none">
          <circle cx="42.5" cy="48" r="6.5" />
          <circle cx="57.5" cy="48" r="6.5" />
          <path d="M49 48 H51" />
          <path d="M36 47 L31 45" />
          <path d="M64 47 L69 45" />
        </g>
      );
    case "sunglasses":
      return (
        <g>
          <circle cx="42.5" cy="48" r="6.5" fill="#222" />
          <circle cx="57.5" cy="48" r="6.5" fill="#222" />
          <path d="M49 48 H51" stroke="#222" strokeWidth="2" />
          <path d="M36 47 L31 45" stroke="#222" strokeWidth="2" />
          <path d="M64 47 L69 45" stroke="#222" strokeWidth="2" />
        </g>
      );
    case "beard":
      return (
        <path
          d="M30 52 Q32 70 50 71 Q68 70 70 52 Q64 62 50 61 Q36 62 30 52 Z"
          fill={hairColor}
        />
      );
    case "none":
    default:
      return null;
  }
}

function renderBody(c: AvatarConfig): ReactNode {
  return (
    <>
      {/* 어깨/상의 */}
      <path d="M16 100 Q16 74 50 74 Q84 74 84 100 Z" fill={c.shirt} />
      {/* 귀 */}
      <circle cx="27" cy="50" r="4.5" fill={c.skin} />
      <circle cx="73" cy="50" r="4.5" fill={c.skin} />
      {/* 머리통 */}
      <circle cx="50" cy="48" r="22" fill={c.skin} />
      {/* 눈 */}
      <circle cx="42.5" cy="48" r="2.6" fill="#3a3a3a" />
      <circle cx="57.5" cy="48" r="2.6" fill="#3a3a3a" />
      {/* 볼터치 */}
      <circle cx="38" cy="54" r="3" fill="#ff9eb0" opacity="0.5" />
      <circle cx="62" cy="54" r="3" fill="#ff9eb0" opacity="0.5" />
      {/* 미소 */}
      <path d="M44 57 Q50 62 56 57" stroke="#c0705a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* 머리 */}
      {hairShape(c.style, c.hair)}
      {/* 악세서리 */}
      {accessoryShape(c.accessory, c.hair)}
    </>
  );
}

export function presetConfigById(id?: string | null): AvatarConfig | null {
  return PRESETS.find((p) => p.id === id)?.config ?? null;
}

// avatar(텍스트) + avatar_config(JSON) → 최종 설정으로 해석
export function resolveConfig(
  id?: string | null,
  config?: Partial<AvatarConfig> | null
): AvatarConfig {
  if (config && typeof config === "object" && config.style) {
    return { ...DEFAULT_CONFIG, ...config };
  }
  return presetConfigById(id) ?? DEFAULT_CONFIG;
}

export function Avatar({
  id,
  config,
  size = 96,
}: {
  id?: string | null;
  config?: Partial<AvatarConfig> | null;
  size?: number;
}) {
  const c = resolveConfig(id, config);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="아바타">
      <circle cx="50" cy="50" r="50" fill={c.bg} />
      {renderBody(c)}
    </svg>
  );
}

// 커스텀 설정만으로 렌더 (커스터마이저 미리보기용)
export function AvatarFromConfig({
  config,
  size = 96,
}: {
  config: AvatarConfig;
  size?: number;
}) {
  return <Avatar config={config} size={size} />;
}

export const PRESET_IDS = PRESETS.map((p) => p.id);

// 서버 저장 전 검증: 허용된 팔레트/옵션 값만 통과시켜 임의 값 주입을 막는다.
export function sanitizeConfig(input: unknown): AvatarConfig {
  const o = (input ?? {}) as Record<string, unknown>;
  const pick = (v: unknown, allowed: string[], def: string) =>
    typeof v === "string" && allowed.includes(v) ? v : def;
  return {
    skin: pick(o.skin, SKIN_TONES, DEFAULT_CONFIG.skin),
    shirt: pick(o.shirt, SHIRT_COLORS, DEFAULT_CONFIG.shirt),
    hair: pick(o.hair, HAIR_COLORS, DEFAULT_CONFIG.hair),
    style: (HAIR_STYLES.some((s) => s.id === o.style)
      ? o.style
      : DEFAULT_CONFIG.style) as HairStyle,
    accessory: (ACCESSORIES.some((a) => a.id === o.accessory)
      ? o.accessory
      : DEFAULT_CONFIG.accessory) as Accessory,
    bg: pick(o.bg, BG_COLORS, DEFAULT_CONFIG.bg),
  };
}
