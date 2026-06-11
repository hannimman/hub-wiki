import {
  isV2,
  AvatarBustV2,
  DEFAULT_AVATAR_V2,
  type AvatarV2Data,
} from "./avatar/render";

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
  config?: Partial<AvatarConfig> | AvatarV2Data | null;
  size?: number;
}) {
  // v2(레이어드 전신 아바타) 얼굴 크롭 흉상 — 동그라미 형태 유지.
  // 호버 풀착장 팝업은 AvatarBustV2 에 내장(모든 사용처 자동 적용).
  // 레거시 데이터(프리셋/구 커스텀)는 v2 기본 모습으로 표시.
  return (
    <AvatarBustV2 data={isV2(config) ? config : DEFAULT_AVATAR_V2} size={size} />
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
