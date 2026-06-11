import {
  isV2,
  AvatarBustV2,
  DEFAULT_AVATAR_V2,
  type AvatarV2Data,
} from "./avatar/render";

// 아바타 표시 진입점.
//  * v2(레이어드 전신 아바타, {v:2, face, equipped})가 현행 형식.
//  * DB의 users.avatar_config 에는 v1(레거시 파라미터 아바타) 데이터가
//    남아있을 수 있어 느슨한 타입으로 받고, v2가 아니면 기본 모습으로 표시한다.

export type AvatarConfig = AvatarV2Data | Record<string, unknown>;

export function Avatar({
  id,
  config,
  size = 96,
  ownerId,
  ownerName,
}: {
  id?: string | null;
  config?: AvatarConfig | null;
  size?: number;
  ownerId?: string | null; // 있으면 클릭 시 아바타 카드(+포인트 선물) 모달
  ownerName?: string | null;
}) {
  // v2 얼굴 크롭 흉상 — 동그라미 형태 유지.
  // 호버 풀착장 팝업은 AvatarBustV2 에 내장(모든 사용처 자동 적용).
  void id; // 레거시 프리셋 id — 더 이상 모양에 영향 없음
  return (
    <AvatarBustV2
      data={isV2(config) ? config : DEFAULT_AVATAR_V2}
      size={size}
      ownerId={ownerId}
      ownerName={ownerName}
    />
  );
}
