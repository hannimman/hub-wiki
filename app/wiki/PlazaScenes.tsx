// 미니 광장 배경 풍경 6종 (문서 보기 상단 — 조회마다 랜덤).
// viewBox 800×150, preserveAspectRatio slice 로 컨테이너를 꽉 채운다.
// 지면 경계는 y≈105 (캐릭터 발이 지면 위에 오도록 기존 광장 70% 라인과 동일).
// 페이지당 한 번만 렌더되므로 그라디언트 id 는 pscn- 접두사로 고정해도 안전.

const SVG_PROPS = {
  viewBox: "0 0 800 150",
  preserveAspectRatio: "xMidYMax slice",
} as const;

function Cloud({ x, y, s = 1, o = 0.92 }: { x: number; y: number; s?: number; o?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity={o}>
      <ellipse cx="0" cy="0" rx="26" ry="11" />
      <ellipse cx="18" cy="-6" rx="18" ry="10" />
      <ellipse cx="-20" cy="-4" rx="15" ry="8" />
    </g>
  );
}

function Tree({ x, y = 105, s = 1 }: { x: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-4" y="-22" width="8" height="24" rx="3" fill="#8a5a35" />
      <circle cx="0" cy="-34" r="17" fill="#3e8e41" />
      <circle cx="-13" cy="-26" r="12" fill="#4caf50" />
      <circle cx="13" cy="-26" r="12" fill="#45a049" />
    </g>
  );
}

const MEADOW = (
  <svg {...SVG_PROPS}>
    <defs>
      <linearGradient id="pscn-sky-m" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a8d8ff" />
        <stop offset="1" stopColor="#e6f6ff" />
      </linearGradient>
      <linearGradient id="pscn-grs-m" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8cc63f" />
        <stop offset="1" stopColor="#5fa12e" />
      </linearGradient>
    </defs>
    <rect width="800" height="150" fill="url(#pscn-sky-m)" />
    <circle cx="706" cy="30" r="26" fill="#ffe27a" opacity="0.5" />
    <circle cx="706" cy="30" r="17" fill="#ffd34d" />
    <Cloud x={150} y={34} />
    <Cloud x={430} y={22} s={0.8} />
    <Cloud x={620} y={52} s={0.65} o={0.8} />
    <ellipse cx="180" cy="118" rx="240" ry="34" fill="#79b837" opacity="0.55" />
    <ellipse cx="640" cy="122" rx="280" ry="40" fill="#6fae31" opacity="0.5" />
    <rect y="105" width="800" height="45" fill="url(#pscn-grs-m)" />
    <Tree x={70} />
    <Tree x={745} s={0.8} />
    {[120, 250, 410, 560, 700].map((x, i) => (
      <g key={x} transform={`translate(${x} ${128 + (i % 2) * 8})`}>
        <circle r="3.2" fill={["#ff8fb1", "#ffd34d", "#ff7e67"][i % 3]} />
        <circle r="1.2" fill="#fff" opacity="0.85" />
      </g>
    ))}
  </svg>
);

const SUNSET = (
  <svg {...SVG_PROPS}>
    <defs>
      <linearGradient id="pscn-sky-s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ff9e5e" />
        <stop offset="0.7" stopColor="#ffd9a0" />
        <stop offset="1" stopColor="#ffe9c4" />
      </linearGradient>
    </defs>
    <rect width="800" height="150" fill="url(#pscn-sky-s)" />
    <circle cx="400" cy="98" r="34" fill="#ff8a4d" opacity="0.45" />
    <circle cx="400" cy="98" r="23" fill="#ff6b35" />
    <Cloud x={170} y={30} o={0.55} />
    <Cloud x={600} y={44} s={0.75} o={0.5} />
    <path d="M0 105 L120 62 L235 105 Z" fill="#7a5577" opacity="0.85" />
    <path d="M150 105 L300 48 L460 105 Z" fill="#69486b" opacity="0.9" />
    <path d="M520 105 L660 58 L800 105 Z" fill="#7a5577" opacity="0.85" />
    {[
      [230, 34],
      [262, 26],
      [294, 38],
    ].map(([x, y]) => (
      <path
        key={x}
        d={`M${x - 8} ${y} q8 -7 16 0`}
        stroke="#5c4150"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
    ))}
    <rect y="105" width="800" height="45" fill="#5d7a4a" />
    <rect y="105" width="800" height="6" fill="#6f8d58" />
  </svg>
);

const NIGHT = (
  <svg {...SVG_PROPS}>
    <defs>
      <linearGradient id="pscn-sky-n" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#16233f" />
        <stop offset="1" stopColor="#31486f" />
      </linearGradient>
    </defs>
    <rect width="800" height="150" fill="url(#pscn-sky-n)" />
    {[
      [60, 22, 1.6], [140, 48, 1.1], [225, 14, 1.4], [310, 40, 1], [395, 18, 1.7],
      [470, 55, 1.1], [545, 28, 1.4], [625, 12, 1.1], [700, 42, 1.6], [770, 24, 1.1],
    ].map(([x, y, r]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#fff" opacity="0.9" />
    ))}
    <circle cx="660" cy="34" r="20" fill="#fff3c4" />
    <circle cx="669" cy="29" r="17" fill="#22335a" />
    <g transform="translate(90 105)">
      <rect x="-4" y="-24" width="8" height="26" rx="3" fill="#1c2a24" />
      <circle cx="0" cy="-36" r="18" fill="#1f3a2e" />
      <circle cx="-14" cy="-27" r="12" fill="#234234" />
      <circle cx="14" cy="-27" r="12" fill="#1f3a2e" />
    </g>
    <rect y="105" width="800" height="45" fill="#27413a" />
    <rect y="105" width="800" height="5" fill="#2f4d44" />
    {[260, 420, 580, 720].map((x, i) => (
      <circle key={x} cx={x} cy={92 - (i % 2) * 14} r="2.4" fill="#ffe98a" opacity="0.85" />
    ))}
  </svg>
);

const SNOW = (
  <svg {...SVG_PROPS}>
    <defs>
      <linearGradient id="pscn-sky-w" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d7e5f4" />
        <stop offset="1" stopColor="#f3f8fd" />
      </linearGradient>
    </defs>
    <rect width="800" height="150" fill="url(#pscn-sky-w)" />
    {[
      [90, 30], [200, 60], [320, 20], [450, 48], [570, 16], [680, 52], [760, 30], [150, 92], [520, 84],
    ].map(([x, y]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill="#fff" opacity="0.95" />
    ))}
    <rect y="105" width="800" height="45" fill="#ffffff" />
    <ellipse cx="400" cy="108" rx="430" ry="10" fill="#e7eef6" />
    {[
      [70, 1], [126, 0.72], [724, 0.9],
    ].map(([x, s]) => (
      <g key={x} transform={`translate(${x} 105) scale(${s})`}>
        <polygon points="0,-58 -20,-26 20,-26" fill="#2f6b4f" />
        <polygon points="0,-40 -24,-4 24,-4" fill="#377a5b" />
        <polygon points="0,-58 -8,-45 8,-45" fill="#fff" opacity="0.85" />
        <rect x="-4" y="-6" width="8" height="10" fill="#7c5638" />
      </g>
    ))}
    <g transform="translate(620 104)">
      <circle cy="-12" r="13" fill="#fff" stroke="#dbe6ef" strokeWidth="1.5" />
      <circle cy="-32" r="9" fill="#fff" stroke="#dbe6ef" strokeWidth="1.5" />
      <circle cx="-3" cy="-34" r="1.3" fill="#39424c" />
      <circle cx="3" cy="-34" r="1.3" fill="#39424c" />
      <polygon points="0,-31 9,-29 0,-27" fill="#ff8c42" />
      <path d="M-9 -36 L-18 -44 M9 -36 L18 -44" stroke="#8a5a35" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  </svg>
);

const BLOSSOM = (
  <svg {...SVG_PROPS}>
    <defs>
      <linearGradient id="pscn-sky-b" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe4ef" />
        <stop offset="1" stopColor="#fff8fb" />
      </linearGradient>
    </defs>
    <rect width="800" height="150" fill="url(#pscn-sky-b)" />
    <Cloud x={320} y={26} o={0.8} />
    <Cloud x={560} y={44} s={0.7} o={0.7} />
    {[
      [86, 1.05], [738, 0.85],
    ].map(([x, s]) => (
      <g key={x} transform={`translate(${x} 105) scale(${s})`}>
        <path d="M-3 0 Q-5 -20 -14 -30 M-3 0 Q0 -22 10 -34" stroke="#8d6748" strokeWidth="7" fill="none" strokeLinecap="round" />
        <circle cx="-18" cy="-36" r="15" fill="#ffb7d0" />
        <circle cx="12" cy="-42" r="17" fill="#ff9cbd" />
        <circle cx="-2" cy="-50" r="14" fill="#ffd0e0" />
      </g>
    ))}
    {[180, 270, 380, 470, 600, 690].map((x, i) => (
      <ellipse
        key={x}
        cx={x}
        cy={36 + ((i * 23) % 58)}
        rx="3.4"
        ry="2"
        fill="#ffaac6"
        opacity="0.9"
        transform={`rotate(${(i * 40) % 360} ${x} ${36 + ((i * 23) % 58)})`}
      />
    ))}
    <rect y="105" width="800" height="45" fill="#a5d48e" />
    <rect y="105" width="800" height="6" fill="#b4dd9e" />
  </svg>
);

const BEACH = (
  <svg {...SVG_PROPS}>
    <defs>
      <linearGradient id="pscn-sky-h" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9cdcf5" />
        <stop offset="1" stopColor="#e8f8ff" />
      </linearGradient>
    </defs>
    <rect width="800" height="150" fill="url(#pscn-sky-h)" />
    <circle cx="92" cy="28" r="16" fill="#ffd34d" />
    <Cloud x={300} y={28} s={0.85} />
    <Cloud x={640} y={20} s={0.7} o={0.85} />
    <rect y="78" width="800" height="34" fill="#58b7d8" />
    {[60, 220, 380, 540, 700].map((x, i) => (
      <path
        key={x}
        d={`M${x} ${90 + (i % 2) * 9} q10 -5 20 0 q10 5 20 0`}
        stroke="#8fd3ea"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    ))}
    <g transform="translate(560 84)">
      <path d="M-20 0 Q0 12 22 0 Z" fill="#b05b3b" />
      <path d="M2 -2 L2 -30 L20 -6 Z" fill="#fff" stroke="#d9d9d9" strokeWidth="1" />
    </g>
    <path d="M0 112 Q400 100 800 114 L800 150 L0 150 Z" fill="#f2e0b3" />
    <g transform="translate(720 112)">
      <path d="M0 0 Q6 -26 0 -44" stroke="#9a6b42" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M0 -44 Q-22 -52 -34 -42 Q-16 -44 0 -38 M0 -44 Q20 -56 36 -46 Q18 -46 2 -38 M0 -44 Q-4 -60 -16 -64 Q-4 -56 1 -42" fill="#3f9d4f" />
    </g>
    <ellipse cx="180" cy="132" rx="10" ry="4" fill="#e3cf9e" />
    <ellipse cx="430" cy="138" rx="8" ry="3.4" fill="#e3cf9e" />
  </svg>
);

export const SCENES = [MEADOW, SUNSET, NIGHT, SNOW, BLOSSOM, BEACH];
export const SCENE_COUNT = SCENES.length;
