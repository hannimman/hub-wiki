// 애완동물 카탈로그 — 좌(애완동물 1, x≈55) / 우(애완동물 2, x≈265) 바닥 슬롯용.
// 모든 펫은 x=60 중심·바닥 y=360 기준으로 그리고 petWrap 으로 좌/우 위치에 배치한다.
// 규칙: id 속성 금지, 단색+opacity (카탈로그 공통 규칙).

type PetDef = { key: string; name: string; price: number; svg: string };
type Item = { id: string; name: string; price: number; svg: string };

function petWrap(cx: number, inner: string): string {
  return `<g transform="translate(${cx - 60} 0)">${inner}</g>`;
}

const PET_DEFS: PetDef[] = [
  {
    key: "dog", name: "강아지", price: 220,
    svg: `<path d="M40 340 Q32 330 36 322" stroke="#c89a6b" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="58" cy="344" rx="20" ry="13" fill="#c89a6b"/>
      <rect x="46" y="350" width="7" height="10" rx="3.5" fill="#b3855a"/>
      <rect x="64" y="350" width="7" height="10" rx="3.5" fill="#b3855a"/>
      <circle cx="76" cy="330" r="12" fill="#c89a6b"/>
      <ellipse cx="68" cy="321" rx="4" ry="7.5" fill="#9a7148" transform="rotate(-22 68 321)"/>
      <ellipse cx="84" cy="321" rx="4" ry="7.5" fill="#9a7148" transform="rotate(22 84 321)"/>
      <circle cx="72.5" cy="329" r="1.8" fill="#33323e"/>
      <circle cx="80.5" cy="329" r="1.8" fill="#33323e"/>
      <ellipse cx="76.5" cy="335" rx="3" ry="2.2" fill="#6b4a2f"/>
      <path d="M72 339 Q76 342 80 339" stroke="#6b4a2f" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  },
  {
    key: "cat", name: "고양이", price: 220,
    svg: `<path d="M42 344 Q33 338 35 327" stroke="#9aa3ad" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="58" cy="346" rx="18" ry="12" fill="#9aa3ad"/>
      <circle cx="74" cy="331" r="11" fill="#9aa3ad"/>
      <polygon points="66,324 64,311 74,319" fill="#9aa3ad"/>
      <polygon points="82,324 84,311 74,319" fill="#9aa3ad"/>
      <polygon points="67,321 66,314 72,319" fill="#f2a9b8"/>
      <polygon points="81,321 82,314 76,319" fill="#f2a9b8"/>
      <circle cx="70.5" cy="330" r="1.7" fill="#33323e"/>
      <circle cx="77.5" cy="330" r="1.7" fill="#33323e"/>
      <path d="M71 336 Q74 338.5 77 336" stroke="#5d6670" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M63 333 L56 331 M63 336 L56 337" stroke="#5d6670" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M85 333 L92 331 M85 336 L92 337" stroke="#5d6670" stroke-width="1.1" stroke-linecap="round"/>`,
  },
  {
    key: "rabbit", name: "토끼", price: 180,
    svg: `<circle cx="76" cy="350" r="5.5" fill="#fff"/>
      <ellipse cx="60" cy="346" rx="15" ry="12" fill="#f5f1ea"/>
      <circle cx="58" cy="328" r="10.5" fill="#f5f1ea"/>
      <ellipse cx="53" cy="310" rx="4.2" ry="11" fill="#f5f1ea" transform="rotate(-8 53 310)"/>
      <ellipse cx="64" cy="310" rx="4.2" ry="11" fill="#f5f1ea" transform="rotate(8 64 310)"/>
      <ellipse cx="53.5" cy="311" rx="2" ry="7" fill="#f7c2cc" transform="rotate(-8 53.5 311)"/>
      <ellipse cx="63.5" cy="311" rx="2" ry="7" fill="#f7c2cc" transform="rotate(8 63.5 311)"/>
      <circle cx="54.5" cy="327" r="1.7" fill="#33323e"/>
      <circle cx="61.5" cy="327" r="1.7" fill="#33323e"/>
      <ellipse cx="58" cy="331.5" rx="2" ry="1.5" fill="#f2a9b8"/>`,
  },
  {
    key: "chick", name: "병아리", price: 120,
    svg: `<rect x="54.5" y="352" width="2.6" height="8" fill="#f59e0b"/>
      <rect x="62" y="352" width="2.6" height="8" fill="#f59e0b"/>
      <ellipse cx="60" cy="342" rx="13" ry="12" fill="#ffd84d"/>
      <circle cx="66" cy="330" r="8.5" fill="#ffd84d"/>
      <polygon points="74,329 80.5,331 74,333.5" fill="#f59e0b"/>
      <circle cx="68.5" cy="328" r="1.6" fill="#33323e"/>
      <path d="M50 340 Q44 336 48 330" stroke="#f5c93a" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M58 322 Q60 318 62 322" stroke="#f5c93a" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  },
  {
    key: "penguin", name: "펭귄", price: 260,
    svg: `<ellipse cx="54" cy="358" rx="5.5" ry="2.6" fill="#f59e0b"/>
      <ellipse cx="66" cy="358" rx="5.5" ry="2.6" fill="#f59e0b"/>
      <ellipse cx="60" cy="338" rx="14.5" ry="20" fill="#2f3a4a"/>
      <ellipse cx="60" cy="343" rx="9.5" ry="14" fill="#fff"/>
      <ellipse cx="44.5" cy="340" rx="4" ry="10" fill="#2f3a4a" transform="rotate(16 44.5 340)"/>
      <ellipse cx="75.5" cy="340" rx="4" ry="10" fill="#2f3a4a" transform="rotate(-16 75.5 340)"/>
      <circle cx="55.5" cy="326" r="2.6" fill="#fff"/>
      <circle cx="64.5" cy="326" r="2.6" fill="#fff"/>
      <circle cx="56" cy="326.5" r="1.3" fill="#1d2430"/>
      <circle cx="64" cy="326.5" r="1.3" fill="#1d2430"/>
      <polygon points="57,331 63,331 60,335" fill="#f59e0b"/>`,
  },
  {
    key: "turtle", name: "거북이", price: 200,
    svg: `<circle cx="78" cy="348" r="6.5" fill="#7cc68f"/>
      <circle cx="80" cy="346" r="1.5" fill="#33323e"/>
      <ellipse cx="48" cy="355" rx="5" ry="3" fill="#7cc68f"/>
      <ellipse cx="66" cy="355" rx="5" ry="3" fill="#7cc68f"/>
      <ellipse cx="58" cy="342" rx="17" ry="12" fill="#4a8a5e"/>
      <ellipse cx="58" cy="341" rx="11" ry="7" fill="#5ba974"/>
      <path d="M50 338 L66 338 M52 345 L64 345 M58 334 L58 348" stroke="#3d7350" stroke-width="1.4" opacity="0.6"/>`,
  },
  {
    key: "dino", name: "아기공룡", price: 350,
    svg: `<path d="M44 342 Q32 340 27 331" stroke="#6cc06c" stroke-width="7" fill="none" stroke-linecap="round"/>
      <polygon points="50,330 53,323 56,330" fill="#3f8f3f"/>
      <polygon points="58,327 61,320 64,327" fill="#3f8f3f"/>
      <ellipse cx="58" cy="340" rx="15" ry="13" fill="#6cc06c"/>
      <ellipse cx="57" cy="344" rx="8" ry="7" fill="#a8e0a0"/>
      <rect x="50" y="350" width="6.5" height="10" rx="3" fill="#5aa85a"/>
      <rect x="62" y="350" width="6.5" height="10" rx="3" fill="#5aa85a"/>
      <circle cx="72" cy="322" r="9.5" fill="#6cc06c"/>
      <polygon points="69,313 72,306 75,313" fill="#3f8f3f"/>
      <circle cx="75" cy="320" r="1.7" fill="#33323e"/>
      <path d="M78 326 Q74 328.5 70 327" stroke="#3f8f3f" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  },
  {
    key: "bracchio", name: "목긴공룡", price: 380,
    svg: `<path d="M42 346 Q30 346 26 338" stroke="#7fd4c1" stroke-width="6" fill="none" stroke-linecap="round"/>
      <ellipse cx="56" cy="344" rx="16" ry="11" fill="#7fd4c1"/>
      <rect x="46" y="350" width="6" height="9" rx="3" fill="#62b8a5"/>
      <rect x="60" y="350" width="6" height="9" rx="3" fill="#62b8a5"/>
      <path d="M67 340 Q76 326 73 311" stroke="#7fd4c1" stroke-width="9" fill="none" stroke-linecap="round"/>
      <circle cx="73" cy="308" r="6.5" fill="#7fd4c1"/>
      <circle cx="75.5" cy="306.5" r="1.4" fill="#33323e"/>
      <circle cx="52" cy="340" r="2.4" fill="#5cb3a0" opacity="0.7"/>
      <circle cx="60" cy="346" r="2" fill="#5cb3a0" opacity="0.7"/>
      <circle cx="47" cy="346" r="1.7" fill="#5cb3a0" opacity="0.7"/>`,
  },
  {
    key: "robot", name: "미니로봇", price: 450,
    svg: `<rect x="58.8" y="305" width="2.4" height="8" fill="#6b7686"/>
      <circle cx="60" cy="303.5" r="2.6" fill="#ff5e5e"/>
      <rect x="52" y="312" width="16" height="14" rx="4" fill="#aab6c8"/>
      <circle cx="56.5" cy="319" r="2.3" fill="#3ad1ff"/>
      <circle cx="63.5" cy="319" r="2.3" fill="#3ad1ff"/>
      <rect x="42" y="332" width="5" height="13" rx="2.5" fill="#aab6c8"/>
      <rect x="73" y="332" width="5" height="13" rx="2.5" fill="#aab6c8"/>
      <rect x="48" y="328" width="24" height="21" rx="5" fill="#8e9bb0"/>
      <rect x="52" y="333" width="16" height="7" rx="2" fill="#5d6b80"/>
      <circle cx="56" cy="344" r="1.6" fill="#ffd84d"/>
      <circle cx="61" cy="344" r="1.6" fill="#3ad1ff"/>
      <circle cx="54" cy="353" r="5" fill="#4a5568"/>
      <circle cx="66" cy="353" r="5" fill="#4a5568"/>
      <circle cx="54" cy="353" r="2" fill="#2d3440"/>
      <circle cx="66" cy="353" r="2" fill="#2d3440"/>`,
  },
  {
    key: "dragon", name: "아기드래곤", price: 500,
    svg: `<path d="M46 348 Q34 350 29 343" stroke="#a78bdb" stroke-width="6" fill="none" stroke-linecap="round"/>
      <polygon points="30,338 22,341 30,346" fill="#7c5fc0"/>
      <path d="M50 332 Q38 320 41 307 Q53 317 57 328 Z" fill="#c4afe8"/>
      <ellipse cx="58" cy="342" rx="14" ry="12" fill="#a78bdb"/>
      <ellipse cx="58" cy="346" rx="7.5" ry="6" fill="#d9ccf2"/>
      <rect x="50" y="350" width="6" height="9" rx="3" fill="#8d6fc9"/>
      <rect x="61" y="350" width="6" height="9" rx="3" fill="#8d6fc9"/>
      <circle cx="71" cy="326" r="9" fill="#a78bdb"/>
      <polygon points="65,319 62,310 69,315" fill="#7c5fc0"/>
      <polygon points="77,319 80,310 73,315" fill="#7c5fc0"/>
      <circle cx="74" cy="324.5" r="1.7" fill="#33323e"/>
      <path d="M77 330 Q73 332 69 331" stroke="#7c5fc0" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  },
];

// 좌측(애완동물 1) — 캐릭터 왼쪽 x≈55 에 배치
export const PETS_L: Item[] = PET_DEFS.map((p) => ({
  id: `pet-${p.key}-l`,
  name: p.name,
  price: p.price,
  svg: petWrap(55, p.svg),
}));

// 우측(애완동물 2) — 캐릭터 오른쪽 x≈265 에 배치
export const PETS_R: Item[] = PET_DEFS.map((p) => ({
  id: `pet-${p.key}-r`,
  name: p.name,
  price: p.price,
  svg: petWrap(265, p.svg),
}));
