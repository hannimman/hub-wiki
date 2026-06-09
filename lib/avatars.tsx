import type { ReactNode } from "react";

// 위키 사용자 아바타 (SVG, 8종). 순수 표현 컴포넌트라 서버/클라이언트 어디서나 사용 가능.
// DB에는 avatar id(예: "f1")만 저장하고, 렌더링은 <Avatar id=... /> 로 한다.

export type AvatarDef = {
  id: string;
  label: string;
  bg: string; // 배경 원 색
  body: ReactNode; // 어깨 + 얼굴 + 머리 등
};

// 공통 얼굴(어깨·귀·머리통·눈·미소). 머리/장식은 children 으로 위에 덧그림.
function Base({
  skin = "#f3c9a8",
  shirt = "#5b8def",
  children,
}: {
  skin?: string;
  shirt?: string;
  children?: ReactNode;
}) {
  return (
    <>
      {/* 어깨/상의 */}
      <path d="M16 100 Q16 74 50 74 Q84 74 84 100 Z" fill={shirt} />
      {/* 귀 */}
      <circle cx="27" cy="50" r="4.5" fill={skin} />
      <circle cx="73" cy="50" r="4.5" fill={skin} />
      {/* 머리통 */}
      <circle cx="50" cy="48" r="22" fill={skin} />
      {/* 눈 */}
      <circle cx="42.5" cy="48" r="2.6" fill="#3a3a3a" />
      <circle cx="57.5" cy="48" r="2.6" fill="#3a3a3a" />
      {/* 볼터치 */}
      <circle cx="38" cy="54" r="3" fill="#ff9eb0" opacity="0.5" />
      <circle cx="62" cy="54" r="3" fill="#ff9eb0" opacity="0.5" />
      {/* 미소 */}
      <path
        d="M44 57 Q50 62 56 57"
        stroke="#c0705a"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      {children}
    </>
  );
}

export const AVATARS: AvatarDef[] = [
  {
    id: "f1",
    label: "긴 머리",
    bg: "#ffd1dc",
    body: (
      <Base skin="#f3c9a8" shirt="#e26d9e">
        <path d="M27 50 Q24 74 31 84 L37 82 Q31 64 34 50 Z" fill="#7a4a22" />
        <path d="M73 50 Q76 74 69 84 L63 82 Q69 64 66 50 Z" fill="#7a4a22" />
        <path d="M28 50 Q28 25 50 25 Q72 25 72 50 Q66 38 50 37 Q34 38 28 50 Z" fill="#7a4a22" />
      </Base>
    ),
  },
  {
    id: "m1",
    label: "단정한 머리",
    bg: "#cfe3ff",
    body: (
      <Base skin="#f3c9a8" shirt="#5b8def">
        <path d="M29 48 Q29 26 50 26 Q71 26 71 48 Q64 37 50 36 Q36 37 29 48 Z" fill="#1c1c1c" />
      </Base>
    ),
  },
  {
    id: "f2",
    label: "번 머리",
    bg: "#e7d9ff",
    body: (
      <Base skin="#e7b393" shirt="#7d6bd6">
        <circle cx="50" cy="22" r="7.5" fill="#3a2a1a" />
        <path d="M29 49 Q29 27 50 27 Q71 27 71 49 Q64 38 50 37 Q36 38 29 49 Z" fill="#3a2a1a" />
      </Base>
    ),
  },
  {
    id: "m2",
    label: "수염",
    bg: "#d7f0d8",
    body: (
      <Base skin="#e7b393" shirt="#58b368">
        <path d="M29 48 Q29 26 50 26 Q71 26 71 48 Q64 37 50 36 Q36 37 29 48 Z" fill="#7a4a22" />
        {/* 수염: 턱 둘레 */}
        <path
          d="M30 52 Q32 70 50 71 Q68 70 70 52 Q64 62 50 61 Q36 62 30 52 Z"
          fill="#7a4a22"
        />
      </Base>
    ),
  },
  {
    id: "f3",
    label: "포니테일",
    bg: "#fff1c2",
    body: (
      <Base skin="#f3c9a8" shirt="#f2a154">
        <path d="M70 42 Q84 50 80 70 Q75 58 67 52 Z" fill="#c9a227" />
        <path d="M28 49 Q28 26 50 26 Q72 26 72 49 Q66 38 50 37 Q34 38 28 49 Z" fill="#c9a227" />
      </Base>
    ),
  },
  {
    id: "m3",
    label: "짧은 머리",
    bg: "#c9efe9",
    body: (
      <Base skin="#d99a66" shirt="#4ea0a0">
        <path d="M30 47 Q30 28 50 28 Q70 28 70 47 Q62 40 50 39 Q38 40 30 47 Z" fill="#1c1c1c" />
      </Base>
    ),
  },
  {
    id: "f4",
    label: "웨이브",
    bg: "#ffe0c2",
    body: (
      <Base skin="#f3c9a8" shirt="#d9534f">
        <path
          d="M26 48 Q22 60 28 66 Q24 74 32 82 L38 80 Q32 66 35 50 Z"
          fill="#b23b2e"
        />
        <path
          d="M74 48 Q78 60 72 66 Q76 74 68 82 L62 80 Q68 66 65 50 Z"
          fill="#b23b2e"
        />
        <path d="M28 50 Q28 24 50 24 Q72 24 72 50 Q66 37 50 36 Q34 37 28 50 Z" fill="#b23b2e" />
      </Base>
    ),
  },
  {
    id: "m4",
    label: "안경",
    bg: "#e3e3e8",
    body: (
      <Base skin="#e7b393" shirt="#708090">
        <path d="M29 48 Q29 27 50 27 Q71 27 71 48 Q64 38 50 37 Q36 38 29 48 Z" fill="#6b6b6b" />
        {/* 안경 */}
        <g stroke="#333" strokeWidth="2" fill="none">
          <circle cx="42.5" cy="48" r="6.5" />
          <circle cx="57.5" cy="48" r="6.5" />
          <path d="M49 48 H51" />
          <path d="M36 47 L31 45" />
          <path d="M64 47 L69 45" />
        </g>
      </Base>
    ),
  },
];

export function getAvatar(id: string | null | undefined): AvatarDef {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

export function Avatar({
  id,
  size = 96,
}: {
  id: string | null | undefined;
  size?: number;
}) {
  const a = getAvatar(id);
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`아바타: ${a.label}`}
    >
      <circle cx="50" cy="50" r="50" fill={a.bg} />
      {a.body}
    </svg>
  );
}
