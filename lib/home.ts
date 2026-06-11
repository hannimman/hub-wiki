import { getAdminDb } from "./db";
import {
  isV2,
  DEFAULT_AVATAR_V2,
  type AvatarV2Data,
} from "./avatar/render";

// 루트 "팀 마을" — 비로그인에게도 보이는 공개 화면.
// 그냥 마을이다: 멤버 아바타(이름표)만 있고 활동 통계·최근 글 같은 데이터는 싣지 않는다.

export type VillageMember = {
  id: string;
  name: string;
  data: AvatarV2Data;
  message: string | null; // 오늘의 한마디 (없으면 기본 인사말)
};

export async function getVillageMembers(): Promise<VillageMember[]> {
  const db = getAdminDb();
  const { data } = await db
    .from("users")
    .select("id, display_name, avatar_config, is_active, status_message")
    .order("created_at", { ascending: true });

  return (data ?? [])
    .filter((u) => u.is_active)
    .map((u) => ({
      id: u.id,
      name: u.display_name,
      data: isV2(u.avatar_config)
        ? (u.avatar_config as AvatarV2Data)
        : DEFAULT_AVATAR_V2,
      message: (u.status_message ?? "").trim().slice(0, 50) || null,
    }));
}

// 실제 시각(KST)·계절 → 풍경 인덱스.
// PlazaScenes 순서: 0 초원 / 1 노을 / 2 밤하늘 / 3 설원 / 4 벚꽃 / 5 바닷가
export function pickSceneByTime(now = new Date()): number {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  const h = kst.getUTCHours();
  const month = kst.getUTCMonth() + 1;
  if (h >= 20 || h < 6) return 2; // 밤
  if (h >= 17) return 1; // 노을
  if (month === 12 || month <= 2) return 3; // 겨울 낮 — 설원
  if (month >= 3 && month <= 4) return 4; // 봄 — 벚꽃
  if (month >= 7 && month <= 8) return 5; // 한여름 — 바닷가
  return 0; // 그 외 낮 — 초원
}
