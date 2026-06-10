// 상점 아이템 카탈로그 — 12개 슬롯 x 10개 = 120개
// 좌표계: viewBox 0 0 320 400 (캐릭터 머리 중심 160,120 r56 / 손 좌(103,252) 우(217,252) / 바닥 y=360)
// 주의: 아이템 svg 안에는 id 속성을 쓰지 않는다 (미리보기 카드마다 복제되므로 중복 id 방지)

const SLOTS = [
  { id: "hair", name: "헤어", zoom: "88 30 144 130" },
  { id: "hat", name: "모자", zoom: "88 6 144 110" },
  { id: "faceAcc", name: "얼굴 악세서리", zoom: "98 78 124 88" },
  { id: "beard", name: "수염", zoom: "108 110 104 100" },
  { id: "top", name: "상의", zoom: "94 156 132 130" },
  { id: "bottom", name: "하의", zoom: "104 242 112 116" },
  { id: "shoes", name: "신발", zoom: "112 316 96 64" },
  { id: "handL", name: "왼손 아이템", zoom: "44 180 116 124" },
  { id: "handR", name: "오른손 아이템", zoom: "160 180 116 124" },
  { id: "decoL", name: "좌측 바닥 장식", zoom: "8 268 100 104" },
  { id: "decoR", name: "우측 바닥 장식", zoom: "212 268 100 104" },
  { id: "background", name: "배경", zoom: "0 0 320 400" },
];

// ---------- 공용 도형 헬퍼 ----------
function hairCap(c) {
  return `<path d="M103 120 Q100 56 160 52 Q220 56 217 120 Q204 88 160 86 Q116 88 103 120 Z" fill="${c}"/>`;
}
const TORSO_PATH = "M124 176 Q160 164 196 176 L199 268 Q160 280 121 268 Z";
// 소매는 sleeve-l/sleeve-r 그룹으로 감싼다 — 걷기 모드에서 팔과 함께 회전시키기 위해
// character.js가 이 그룹을 추출해 팔 스윙 그룹으로 옮긴다
function topBase(c) {
  return `<path d="${TORSO_PATH}" fill="${c}"/>
    <g class="sleeve-l"><path d="M129 178 Q112 196 106 220 L121 226 Q127 204 139 191 Z" fill="${c}"/></g>
    <g class="sleeve-r"><path d="M191 178 Q208 196 214 220 L199 226 Q193 204 181 191 Z" fill="${c}"/></g>`;
}
function shortsBase(c) {
  return `<path d="M125 250 Q160 262 195 250 L195 302 Q186 308 167 306 L166 285 Q160 282 154 285 L153 306 Q134 308 125 302 Z" fill="${c}"/>`;
}
function pantsBase(c) {
  return shortsBase(c) +
    `<rect x="133" y="300" width="25" height="46" rx="7" fill="${c}"/>
     <rect x="162" y="300" width="25" height="46" rx="7" fill="${c}"/>`;
}
function shoeBase(c) {
  return `<rect x="127" y="334" width="34" height="24" rx="11" fill="${c}"/>
          <rect x="159" y="334" width="34" height="24" rx="11" fill="${c}"/>`;
}

const ITEMS = {
  // ==================== 헤어 (10) ====================
  hair: [
    {
      id: "hair-bob", name: "단발머리", price: 120,
      svg: hairCap("#6b4a35") +
        `<path d="M103 112 Q97 148 106 160 Q116 156 117 148 Q109 130 110 106 Z" fill="#6b4a35"/>
         <path d="M217 112 Q223 148 214 160 Q204 156 203 148 Q211 130 210 106 Z" fill="#6b4a35"/>`,
    },
    {
      id: "hair-curly", name: "곱슬머리", price: 150,
      svg: `<circle cx="116" cy="94" r="14" fill="#4a3327"/><circle cx="134" cy="74" r="14" fill="#4a3327"/>
        <circle cx="158" cy="64" r="15" fill="#4a3327"/><circle cx="182" cy="72" r="14" fill="#4a3327"/>
        <circle cx="202" cy="92" r="14" fill="#4a3327"/><circle cx="146" cy="84" r="13" fill="#4a3327"/>
        <circle cx="174" cy="84" r="13" fill="#4a3327"/><circle cx="108" cy="112" r="10" fill="#4a3327"/>
        <circle cx="212" cy="112" r="10" fill="#4a3327"/>`,
    },
    {
      id: "hair-pony", name: "포니테일", price: 180,
      svg: hairCap("#e0995a") +
        `<path d="M212 80 Q252 98 246 152 Q236 158 230 148 Q238 110 206 90 Z" fill="#e0995a"/>
         <circle cx="213" cy="82" r="6" fill="#d24f7c"/>`,
    },
    {
      id: "hair-mohawk", name: "모히칸", price: 220,
      svg: `<polygon points="144,76 149,28 154,70 160,16 166,70 171,26 176,76" fill="#ef4f8e"/>
        <path d="M140 80 Q160 66 180 80 L177 90 Q160 78 143 90 Z" fill="#ef4f8e"/>`,
    },
    {
      id: "hair-afro", name: "아프로", price: 260,
      svg: `<circle cx="160" cy="68" r="50" fill="#33271f"/>
        <circle cx="118" cy="92" r="22" fill="#33271f"/><circle cx="202" cy="92" r="22" fill="#33271f"/>`,
    },
    {
      id: "hair-twin", name: "트윈테일", price: 200,
      svg: hairCap("#f2a0c4") +
        `<path d="M106 100 Q68 122 78 170 Q90 176 96 166 Q92 128 116 108 Z" fill="#f2a0c4"/>
         <path d="M214 100 Q252 122 242 170 Q230 176 224 166 Q228 128 204 108 Z" fill="#f2a0c4"/>
         <circle cx="110" cy="103" r="5.5" fill="#ffd24d"/><circle cx="210" cy="103" r="5.5" fill="#ffd24d"/>`,
    },
    {
      id: "hair-long", name: "긴 생머리", price: 240,
      svg: hairCap("#f5d76e") +
        `<path d="M103 110 Q93 170 103 210 Q117 215 122 202 Q112 160 112 108 Z" fill="#f5d76e"/>
         <path d="M217 110 Q227 170 217 210 Q203 215 198 202 Q208 160 208 108 Z" fill="#f5d76e"/>`,
    },
    {
      id: "hair-bangs", name: "가르마 앞머리", price: 160,
      svg: `<path d="M158 54 Q114 60 105 110 Q134 80 158 78 Z" fill="#2c2c34"/>
        <path d="M162 54 Q206 60 215 110 Q186 80 162 78 Z" fill="#2c2c34"/>
        <path d="M120 64 Q160 44 200 64 Q180 52 160 52 Q140 52 120 64 Z" fill="#2c2c34"/>`,
    },
    {
      id: "hair-spiky", name: "삐죽머리", price: 210,
      svg: `<polygon points="104,112 110,66 126,88 140,52 152,80 160,42 170,80 182,52 196,88 210,66 216,112 188,92 160,88 132,92" fill="#2bb3a3"/>`,
    },
    {
      id: "hair-pompadour", name: "리젠트", price: 300,
      svg: `<path d="M108 96 Q104 46 152 36 Q198 28 213 62 Q221 84 214 100 Q198 68 168 64 Q124 62 108 96 Z" fill="#26211e"/>
        <path d="M126 58 Q152 44 184 50" stroke="#4a4440" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    },
  ],

  // ==================== 모자 (10) ====================
  hat: [
    {
      id: "hat-straw", name: "밀짚모자", price: 150,
      svg: `<ellipse cx="160" cy="80" rx="66" ry="13" fill="#e3b95c" stroke="#c79a3e" stroke-width="2"/>
        <path d="M120 78 Q120 38 160 38 Q200 38 200 78 Z" fill="#ecc56f"/>
        <rect x="120" y="68" width="80" height="10" fill="#d2483e"/>`,
    },
    {
      id: "hat-crown", name: "황금 왕관", price: 900,
      svg: `<polygon points="122,82 122,46 140,64 160,38 180,64 198,46 198,82" fill="#ffcf4d" stroke="#e0a92e" stroke-width="3" stroke-linejoin="round"/>
        <rect x="120" y="76" width="80" height="10" rx="4" fill="#ffcf4d" stroke="#e0a92e" stroke-width="2"/>
        <circle cx="140" cy="72" r="4" fill="#e2536b"/><circle cx="160" cy="66" r="4.5" fill="#4a90e2"/><circle cx="180" cy="72" r="4" fill="#4caf7d"/>`,
    },
    {
      id: "hat-wizard", name: "마법사 모자", price: 420,
      svg: `<polygon points="160,4 126,78 194,78" fill="#6c5ce7"/>
        <ellipse cx="160" cy="80" rx="50" ry="10" fill="#5a4bd1"/>
        <circle cx="160" cy="40" r="4" fill="#ffe27a"/><circle cx="148" cy="58" r="3" fill="#ffe27a"/><circle cx="172" cy="62" r="3.5" fill="#ffe27a"/>`,
    },
    {
      id: "hat-cap", name: "야구캡", price: 180,
      svg: `<path d="M114 84 Q114 40 160 40 Q206 40 206 84 Z" fill="#4a90e2"/>
        <ellipse cx="160" cy="86" rx="54" ry="10" fill="#3a73b5"/>
        <circle cx="160" cy="42" r="4" fill="#3a73b5"/>
        <path d="M138 46 Q160 36 182 46 L178 60 Q160 52 142 60 Z" fill="#fff" opacity="0.85"/>`,
    },
    {
      id: "hat-beret", name: "베레모", price: 200,
      svg: `<ellipse cx="152" cy="62" rx="46" ry="21" fill="#d63d54" transform="rotate(-8 152 62)"/>
        <path d="M112 74 Q152 88 196 70" stroke="#a82940" stroke-width="6" fill="none" stroke-linecap="round"/>
        <circle cx="150" cy="42" r="5" fill="#a82940"/>`,
    },
    {
      id: "hat-santa", name: "산타 모자", price: 260,
      svg: `<path d="M118 76 Q160 56 202 76 L224 28 Q180 40 118 76 Z" fill="#e2362f"/>
        <polygon points="118,76 202,76 224,28" fill="#e2362f"/>
        <rect x="112" y="70" width="98" height="15" rx="7" fill="#fff"/>
        <circle cx="226" cy="26" r="9" fill="#fff"/>`,
    },
    {
      id: "hat-cowboy", name: "카우보이 모자", price: 320,
      svg: `<path d="M96 78 Q96 94 160 94 Q224 94 224 78 Q200 68 160 68 Q120 68 96 78 Z" fill="#a96f3a"/>
        <path d="M128 74 Q128 36 160 36 Q192 36 192 74 Z" fill="#b87f48"/>
        <rect x="128" y="64" width="64" height="9" fill="#6d4525"/>`,
    },
    {
      id: "hat-party", name: "고깔모자", price: 140,
      svg: `<polygon points="160,16 134,80 186,80" fill="#ff8fb1"/>
        <circle cx="150" cy="56" r="3.5" fill="#fff"/><circle cx="166" cy="42" r="3" fill="#fff"/><circle cx="160" cy="68" r="3.5" fill="#fff"/>
        <circle cx="160" cy="15" r="7" fill="#ffd24d"/>`,
    },
    {
      id: "hat-viking", name: "바이킹 헬멧", price: 520,
      svg: `<path d="M114 84 Q114 44 160 44 Q206 44 206 84 Z" fill="#97a3b3"/>
        <rect x="112" y="76" width="96" height="10" rx="5" fill="#7b8896"/>
        <path d="M116 70 Q92 64 86 38 Q106 46 120 58 Z" fill="#f1e9d6" stroke="#d9cdb4" stroke-width="2"/>
        <path d="M204 70 Q228 64 234 38 Q214 46 200 58 Z" fill="#f1e9d6" stroke="#d9cdb4" stroke-width="2"/>`,
    },
    {
      id: "hat-propeller", name: "프로펠러 모자", price: 380,
      svg: `<path d="M118 82 Q118 40 160 40 L160 82 Z" fill="#4a90e2"/>
        <path d="M202 82 Q202 40 160 40 L160 82 Z" fill="#e2536b"/>
        <rect x="158" y="28" width="4" height="14" fill="#5a5346"/>
        <ellipse cx="138" cy="26" rx="19" ry="6" fill="#ffd24d"/>
        <ellipse cx="182" cy="26" rx="19" ry="6" fill="#6fd66f"/>
        <circle cx="160" cy="26" r="4" fill="#5a5346"/>`,
    },
    // --- 코스프레 세트 ---
    {
      id: "hat-doraemon", name: "도라에몽 머리", price: 450,
      svg: `<path d="M102 126 Q98 54 160 50 Q222 54 218 126 Q214 92 196 80 Q160 66 124 80 Q106 92 102 126 Z" fill="#1f9de0"/>
        <path d="M102 126 Q96 150 104 162 Q114 158 115 148 Q108 134 109 118 Z" fill="#1f9de0"/>
        <path d="M218 126 Q224 150 216 162 Q206 158 205 148 Q212 134 211 118 Z" fill="#1f9de0"/>
        <path d="M122 70 Q140 58 162 58" stroke="#5fc0f0" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: "hat-pikachu", name: "피카츄 귀 머리띠", price: 420,
      svg: `<path d="M112 92 Q160 70 208 92" stroke="#e3b81f" stroke-width="5" fill="none"/>
        <path d="M116 88 Q108 30 128 16 Q146 26 138 86 Z" fill="#ffd93b" stroke="#e3b81f" stroke-width="2"/>
        <path d="M112 42 Q110 22 128 16 Q138 22 136 44 Q124 32 112 42 Z" fill="#2b2b30"/>
        <path d="M204 88 Q212 30 192 16 Q174 26 182 86 Z" fill="#ffd93b" stroke="#e3b81f" stroke-width="2"/>
        <path d="M208 42 Q210 22 192 16 Q182 22 184 44 Q196 32 208 42 Z" fill="#2b2b30"/>`,
    },
    {
      id: "hat-mickey", name: "동글 귀 머리띠", price: 400,
      svg: `<path d="M118 86 Q160 64 202 86" stroke="#1d1d22" stroke-width="5" fill="none"/>
        <circle cx="118" cy="62" r="23" fill="#1d1d22"/>
        <circle cx="202" cy="62" r="23" fill="#1d1d22"/>
        <path d="M108 52 Q112 46 120 44" stroke="#3a3a44" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: "hat-donald", name: "세일러 모자", price: 380,
      svg: `<ellipse cx="160" cy="76" rx="46" ry="13" fill="#fdfdfb" stroke="#d8dee6" stroke-width="2"/>
        <path d="M122 74 Q122 44 160 42 Q198 44 198 74 Z" fill="#fdfdfb" stroke="#d8dee6" stroke-width="2"/>
        <rect x="122" y="66" width="76" height="8" rx="4" fill="#23252b"/>
        <path d="M196 74 Q212 80 210 94" stroke="#23252b" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: "hat-sponge", name: "스폰지 머리", price: 550,
      svg: `<path d="M102 120 L102 60 Q102 52 112 52 L208 52 Q218 52 218 60 L218 120 Q200 86 160 84 Q120 86 102 120 Z" fill="#f7e34d" stroke="#d9c52e" stroke-width="2"/>
        <circle cx="118" cy="68" r="5" fill="#d9c52e"/><circle cx="150" cy="60" r="4" fill="#d9c52e"/>
        <circle cx="182" cy="66" r="6" fill="#d9c52e"/><circle cx="206" cy="80" r="4" fill="#d9c52e"/>
        <circle cx="110" cy="96" r="4" fill="#d9c52e"/><circle cx="166" cy="74" r="3" fill="#d9c52e"/>`,
    },
  ],

  // ==================== 얼굴 악세서리 (10) ====================
  faceAcc: [
    {
      id: "acc-glasses", name: "동그란 안경", price: 160,
      svg: `<circle cx="140" cy="110" r="13" fill="rgba(255,255,255,0.25)" stroke="#2f2f38" stroke-width="3"/>
        <circle cx="180" cy="110" r="13" fill="rgba(255,255,255,0.25)" stroke="#2f2f38" stroke-width="3"/>
        <path d="M153 110 Q160 104 167 110" stroke="#2f2f38" stroke-width="3" fill="none"/>
        <path d="M127 110 L106 116 M193 110 L214 116" stroke="#2f2f38" stroke-width="3"/>`,
    },
    {
      id: "acc-sunglasses", name: "선글라스", price: 220,
      svg: `<rect x="125" y="100" width="30" height="21" rx="9" fill="#20242c"/>
        <rect x="165" y="100" width="30" height="21" rx="9" fill="#20242c"/>
        <path d="M155 107 H165" stroke="#20242c" stroke-width="4"/>
        <path d="M125 108 L106 114 M195 108 L214 114" stroke="#20242c" stroke-width="3.5"/>
        <path d="M131 105 L139 105" stroke="#5a6478" stroke-width="2.5" stroke-linecap="round"/>`,
    },
    {
      id: "acc-clown", name: "삐에로 코", price: 90,
      svg: `<circle cx="160" cy="128" r="10" fill="#ff3b30"/><circle cx="163" cy="124" r="3" fill="#ff8d85"/>`,
    },
    {
      id: "acc-monocle", name: "외알 안경", price: 300,
      svg: `<circle cx="180" cy="110" r="13" fill="rgba(255,255,255,0.25)" stroke="#caa44a" stroke-width="3"/>
        <path d="M188 121 Q198 142 194 160" stroke="#caa44a" stroke-width="2" fill="none" stroke-dasharray="4 3"/>`,
    },
    {
      id: "acc-eyepatch", name: "안대", price: 180,
      svg: `<circle cx="140" cy="110" r="12.5" fill="#23252b"/>
        <path d="M106 100 L128 104 M152 104 L214 96" stroke="#23252b" stroke-width="4" stroke-linecap="round"/>`,
    },
    {
      id: "acc-mask", name: "가면무도회 가면", price: 350,
      svg: `<path d="M118 96 Q160 86 202 96 Q207 116 184 123 Q170 125 160 116 Q150 125 136 123 Q113 116 118 96 Z" fill="#8e6cf0" stroke="#6c4fd1" stroke-width="2"/>
        <ellipse cx="140" cy="107" rx="8" ry="6" fill="#3a2a66"/>
        <ellipse cx="180" cy="107" rx="8" ry="6" fill="#3a2a66"/>
        <circle cx="160" cy="96" r="3" fill="#ffd24d"/>`,
    },
    {
      id: "acc-goggles", name: "스팀펑크 고글", price: 330,
      svg: `<rect x="104" y="102" width="112" height="13" rx="6" fill="#5b4632"/>
        <circle cx="140" cy="110" r="14" fill="#ffb74d" stroke="#6d5230" stroke-width="4.5"/>
        <circle cx="180" cy="110" r="14" fill="#ffb74d" stroke="#6d5230" stroke-width="4.5"/>
        <circle cx="140" cy="98" r="2" fill="#caa44a"/><circle cx="180" cy="98" r="2" fill="#caa44a"/>
        <path d="M134 105 L140 109" stroke="#fff" stroke-width="2.5" opacity="0.7" stroke-linecap="round"/>`,
    },
    {
      id: "acc-heart", name: "하트 안경", price: 210,
      svg: `<path d="M140 122 C124 110 127 95 136 96 C139 96.5 140 100 140 101 C140 100 141 96.5 144 96 C153 95 156 110 140 122 Z" fill="#ff7da3" stroke="#e84d8a" stroke-width="2"/>
        <path d="M180 122 C164 110 167 95 176 96 C179 96.5 180 100 180 101 C180 100 181 96.5 184 96 C193 95 196 110 180 122 Z" fill="#ff7da3" stroke="#e84d8a" stroke-width="2"/>
        <path d="M152 106 H168" stroke="#e84d8a" stroke-width="3"/>`,
    },
    {
      id: "acc-sticker", name: "별 스티커", price: 80,
      svg: `<polygon points="194,134 195.8,139 201,139.2 196.9,142.4 198.4,147.4 194,144.4 189.6,147.4 191.1,142.4 187,139.2 192.2,139" fill="#ffd24d" stroke="#e0a92e" stroke-width="1"/>
        <polygon points="125,142 126.2,145.3 129.7,145.5 127,147.6 128,150.9 125,148.9 122,150.9 123,147.6 120.3,145.5 123.8,145.3" fill="#7ec8e3"/>`,
    },
    {
      id: "acc-facemask", name: "마스크", price: 120,
      svg: `<rect x="132" y="118" width="56" height="34" rx="15" fill="#fff" stroke="#d8dee6" stroke-width="2"/>
        <path d="M138 128 H182 M138 136 H182 M140 144 H180" stroke="#e8edf2" stroke-width="2"/>
        <path d="M132 126 L106 120 M188 126 L214 120" stroke="#d8dee6" stroke-width="3"/>`,
    },
    // --- 코스프레 세트 ---
    {
      id: "acc-doraemon", name: "도라에몽 코·수염", price: 300,
      svg: `<circle cx="160" cy="125" r="8" fill="#e23b2e"/><circle cx="163" cy="122" r="2.5" fill="#ff8d85"/>
        <path d="M160 133 V150" stroke="#5a4636" stroke-width="2"/>
        <path d="M118 122 L146 130 M118 134 L146 137 M120 146 L146 143" stroke="#5a4636" stroke-width="2" stroke-linecap="round"/>
        <path d="M214 122 L186 130 M214 134 L186 137 M212 146 L186 143" stroke="#5a4636" stroke-width="2" stroke-linecap="round"/>`,
    },
    {
      id: "acc-pikachu", name: "피카츄 볼터치", price: 250,
      svg: `<circle cx="126" cy="142" r="11" fill="#e84d3a"/><circle cx="194" cy="142" r="11" fill="#e84d3a"/>
        <polygon points="160,123 156,128 164,128" fill="#2b2b30"/>`,
    },
    {
      id: "acc-mickey", name: "까만 동글코", price: 220,
      svg: `<ellipse cx="160" cy="128" rx="9" ry="7" fill="#1d1d22"/>
        <ellipse cx="163" cy="125" rx="2.5" ry="2" fill="#4a4a52"/>`,
    },
    {
      id: "acc-donald", name: "오리 부리", price: 320,
      svg: `<path d="M126 128 Q160 116 194 128 Q196 142 160 144 Q124 142 126 128 Z" fill="#f7a823" stroke="#dd8d12" stroke-width="2"/>
        <path d="M134 142 Q160 158 186 142 Q182 154 160 156 Q138 154 134 142 Z" fill="#eb9714"/>
        <circle cx="148" cy="127" r="2" fill="#b96e08"/><circle cx="172" cy="127" r="2" fill="#b96e08"/>`,
    },
    {
      id: "acc-sponge", name: "주근깨와 앞니", price: 280,
      svg: `<g fill="#d9a13b"><circle cx="130" cy="136" r="1.6"/><circle cx="137" cy="142" r="1.6"/><circle cx="125" cy="144" r="1.6"/>
        <circle cx="190" cy="136" r="1.6"/><circle cx="183" cy="142" r="1.6"/><circle cx="195" cy="144" r="1.6"/></g>
        <rect x="150" y="148" width="9" height="11" rx="2" fill="#fff" stroke="#d8dee6" stroke-width="1"/>
        <rect x="161" y="148" width="9" height="11" rx="2" fill="#fff" stroke="#d8dee6" stroke-width="1"/>`,
    },
  ],

  // ==================== 수염 (10) ====================
  beard: [
    {
      id: "beard-must", name: "클래식 콧수염", price: 100,
      svg: `<path d="M160 136 Q150 130 142 135 Q136 139 130 136 Q138 146 150 142 Q156 140 160 137 Q164 140 170 142 Q182 146 190 136 Q184 139 178 135 Q170 130 160 136 Z" fill="#4a3327"/>`,
    },
    {
      id: "beard-full", name: "풍성한 턱수염", price: 180,
      svg: `<path d="M114 132 Q118 196 160 199 Q202 196 206 132 Q197 142 184 147 Q160 170 136 147 Q123 142 114 132 Z" fill="#5a4232"/>`,
    },
    {
      id: "beard-goatee", name: "염소수염", price: 130,
      svg: `<path d="M150 162 Q160 168 170 162 L166 186 Q160 192 154 186 Z" fill="#4a3327"/>`,
    },
    {
      id: "beard-handlebar", name: "카이젤 수염", price: 220,
      svg: `<path d="M160 136 Q148 129 138 134 Q130 138 126 132 Q128 144 140 142 Q152 140 160 137 Q168 140 180 142 Q192 144 194 132 Q190 138 182 134 Q172 129 160 136 Z" fill="#33271f"/>
        <circle cx="125" cy="131" r="4.5" fill="#33271f"/><circle cx="195" cy="131" r="4.5" fill="#33271f"/>`,
    },
    {
      id: "beard-santa", name: "산타 수염", price: 400,
      svg: `<path d="M110 128 Q112 200 160 224 Q208 200 210 128 Q198 142 184 146 Q160 168 136 146 Q122 142 110 128 Z" fill="#f4f4f6"/>
        <circle cx="128" cy="182" r="10" fill="#f4f4f6"/><circle cx="192" cy="182" r="10" fill="#f4f4f6"/>
        <circle cx="146" cy="204" r="9" fill="#f4f4f6"/><circle cx="174" cy="204" r="9" fill="#f4f4f6"/>
        <path d="M150 138 Q160 132 170 138 Q165 142 160 141 Q155 142 150 138 Z" fill="#fff"/>`,
    },
    {
      id: "beard-side", name: "구레나룻", price: 150,
      svg: `<path d="M108 110 Q106 146 118 162 Q126 158 126 148 Q118 132 119 110 Z" fill="#4a3327"/>
        <path d="M212 110 Q214 146 202 162 Q194 158 194 148 Q202 132 201 110 Z" fill="#4a3327"/>`,
    },
    {
      id: "beard-stubble", name: "까칠 수염", price: 90,
      svg: `<g fill="#7a6a58" opacity="0.8">
        <circle cx="138" cy="158" r="1.4"/><circle cx="146" cy="164" r="1.4"/><circle cx="155" cy="168" r="1.4"/>
        <circle cx="165" cy="168" r="1.4"/><circle cx="174" cy="164" r="1.4"/><circle cx="182" cy="158" r="1.4"/>
        <circle cx="142" cy="170" r="1.4"/><circle cx="152" cy="175" r="1.4"/><circle cx="162" cy="176" r="1.4"/>
        <circle cx="172" cy="173" r="1.4"/><circle cx="160" cy="160" r="1.4"/><circle cx="148" cy="156" r="1.4"/>
        <circle cx="172" cy="156" r="1.4"/></g>`,
    },
    {
      id: "beard-pencil", name: "멋쟁이 일자수염", price: 160,
      svg: `<path d="M144 137 Q160 142 176 137" stroke="#33271f" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: "beard-soul", name: "소울 패치", price: 70,
      svg: `<path d="M155 158 Q160 162 165 158 L163 167 Q160 170 157 167 Z" fill="#33271f"/>`,
    },
    {
      id: "beard-pirate", name: "해적 수염", price: 450,
      svg: `<path d="M118 130 Q122 188 160 196 Q198 188 202 130 Q193 142 182 146 Q160 166 138 146 Q127 142 118 130 Z" fill="#2c2620"/>
        <path d="M142 192 L140 214 M160 198 L160 222 M178 192 L180 214" stroke="#2c2620" stroke-width="6" stroke-linecap="round"/>
        <circle cx="140" cy="216" r="3.5" fill="#caa44a"/><circle cx="160" cy="224" r="3.5" fill="#caa44a"/><circle cx="180" cy="216" r="3.5" fill="#caa44a"/>`,
    },
  ],

  // ==================== 상의 (10) ====================
  top: [
    {
      id: "top-tee", name: "민트 티셔츠", price: 150,
      svg: topBase("#4ecdc4") + `<path d="M146 172 Q160 182 174 172" stroke="#3cb5ac" stroke-width="4" fill="none"/>`,
    },
    {
      id: "top-armor", name: "기사 갑옷", price: 600,
      svg: topBase("#aeb8c4") +
        `<circle cx="129" cy="184" r="11" fill="#8d99a8"/><circle cx="191" cy="184" r="11" fill="#8d99a8"/>
         <path d="M138 205 H182 M134 228 H186" stroke="#8d99a8" stroke-width="4"/>
         <rect x="124" y="252" width="73" height="12" rx="5" fill="#6d5230"/>
         <rect x="153" y="251" width="14" height="14" rx="3" fill="#ffd24d"/>`,
    },
    {
      id: "top-suit", name: "턱시도", price: 450,
      svg: topBase("#2e3440") +
        `<polygon points="150,174 160,196 170,174" fill="#fff"/>
         <path d="M150 174 L143 192 L156 200 Z M170 174 L177 192 L164 200 Z" fill="#1d222c"/>
         <path d="M154 177 L160 181 L166 177 L163 184 L157 184 Z" fill="#d23f3f"/>
         <circle cx="160" cy="210" r="2" fill="#aab3c0"/><circle cx="160" cy="226" r="2" fill="#aab3c0"/>`,
    },
    {
      id: "top-hanbok", name: "한복 저고리", price: 380,
      svg: topBase("#f6c1cf") +
        `<path d="M146 172 L160 202 L174 172" stroke="#d96a86" stroke-width="6" fill="none" stroke-linecap="round"/>
         <path d="M157 204 L149 248" stroke="#d23f63" stroke-width="9" stroke-linecap="round"/>
         <path d="M163 204 L166 242" stroke="#d23f63" stroke-width="6" stroke-linecap="round"/>
         <g class="sleeve-l"><path d="M108 218 Q124 212 122 224 L107 224 Z" fill="#d96a86"/></g>
         <g class="sleeve-r"><path d="M212 218 Q196 212 198 224 L213 224 Z" fill="#d96a86"/></g>`,
    },
    {
      id: "top-space", name: "우주복", price: 700,
      svg: topBase("#e8ecf2") +
        `<ellipse cx="160" cy="176" rx="22" ry="8" fill="#aab3c0"/>
         <rect x="144" y="204" width="32" height="22" rx="4" fill="#8d99a8"/>
         <circle cx="152" cy="211" r="3" fill="#e2536b"/><circle cx="161" cy="211" r="3" fill="#4caf7d"/><circle cx="170" cy="211" r="3" fill="#4a90e2"/>
         <rect x="146" y="218" width="28" height="4" rx="2" fill="#6b7280"/>
         <g class="sleeve-l"><path d="M124 200 Q112 214 116 232" stroke="#aab3c0" stroke-width="5" fill="none"/></g>
         <circle cx="184" cy="190" r="6" fill="#4a90e2"/>`,
    },
    {
      id: "top-hoodie", name: "후드티", price: 260,
      svg: topBase("#8d9aa8") +
        `<path d="M124 186 Q160 212 196 186 Q196 170 160 164 Q124 170 124 186 Z" fill="#7b8896"/>
         <path d="M150 196 L148 218 M170 196 L172 218" stroke="#e8ecf2" stroke-width="3" stroke-linecap="round"/>
         <circle cx="148" cy="220" r="2.5" fill="#e8ecf2"/><circle cx="172" cy="220" r="2.5" fill="#e8ecf2"/>
         <path d="M140 240 Q160 234 180 240 L180 262 Q160 268 140 262 Z" fill="#7b8896"/>`,
    },
    {
      id: "top-stripe", name: "줄무늬 티", price: 180,
      svg: topBase("#fdfdfb") +
        `<rect x="126" y="190" width="68" height="8" fill="#e2536b"/>
         <rect x="125" y="210" width="70" height="8" fill="#e2536b"/>
         <rect x="124" y="230" width="72" height="8" fill="#e2536b"/>
         <rect x="123" y="250" width="74" height="8" fill="#e2536b"/>`,
    },
    {
      id: "top-shirt", name: "셔츠 + 넥타이", price: 300,
      svg: topBase("#fdfdfb") +
        `<polygon points="146,172 158,184 150,192" fill="#e8e2d6"/><polygon points="174,172 162,184 170,192" fill="#e8e2d6"/>
         <polygon points="160,184 152,192 158,226 160,240 162,226 168,192" fill="#d23f3f"/>
         <circle cx="160" cy="250" r="2" fill="#c9bfa9"/><circle cx="160" cy="260" r="2" fill="#c9bfa9"/>`,
    },
    {
      id: "top-leather", name: "가죽 자켓", price: 520,
      svg: topBase("#2b2b30") +
        `<path d="M160 176 V266" stroke="#9aa3ad" stroke-width="3" stroke-dasharray="5 4"/>
         <polygon points="146,172 158,182 144,190" fill="#1d1d22"/><polygon points="174,172 162,182 176,190" fill="#1d1d22"/>
         <circle cx="132" cy="196" r="2" fill="#9aa3ad"/><circle cx="188" cy="196" r="2" fill="#9aa3ad"/>
         <path d="M128 244 L146 244 M174 244 L192 244" stroke="#44444c" stroke-width="4"/>`,
    },
    {
      id: "top-jersey", name: "축구 유니폼 7번", price: 340,
      svg: topBase("#3ec46d") +
        `<g class="sleeve-l"><path d="M129 178 Q112 196 106 220 L121 226 Q127 204 139 191 Z" fill="#fff"/></g>
         <g class="sleeve-r"><path d="M191 178 Q208 196 214 220 L199 226 Q193 204 181 191 Z" fill="#fff"/></g>
         <text x="160" y="236" text-anchor="middle" font-size="38" font-weight="800" fill="#fff" font-family="sans-serif">7</text>`,
    },
    // --- 코스프레 세트 ---
    {
      id: "top-doraemon", name: "도라에몽 몸통", price: 500,
      svg: topBase("#1f9de0") +
        `<ellipse cx="160" cy="228" rx="33" ry="37" fill="#fff"/>
         <path d="M138 228 H182 Q182 254 160 254 Q138 254 138 228 Z" fill="#f5f1ea" stroke="#c9bfa9" stroke-width="2"/>
         <path d="M138 174 Q160 184 182 174 L182 182 Q160 192 138 182 Z" fill="#d23f3f"/>
         <circle cx="160" cy="194" r="7" fill="#ffd24d" stroke="#e0a92e" stroke-width="1.5"/>
         <path d="M153 193 H167" stroke="#e0a92e" stroke-width="1.5"/><circle cx="160" cy="198" r="1.5" fill="#8a6510"/>`,
    },
    {
      id: "top-pikachu", name: "피카츄 상의", price: 450,
      svg: topBase("#ffd93b") +
        `<path d="M126 240 Q160 252 194 240 L194 250 Q160 262 126 250 Z" fill="#b9803c"/>
         <path d="M128 222 Q160 234 192 222 L192 231 Q160 243 128 231 Z" fill="#b9803c"/>`,
    },
    {
      id: "top-mickey", name: "까만 상의", price: 300,
      svg: topBase("#1d1d22") +
        `<path d="M146 172 Q160 181 174 172" stroke="#3a3a44" stroke-width="3" fill="none"/>`,
    },
    {
      id: "top-donald", name: "세일러 셔츠", price: 480,
      svg: topBase("#3a78c9") +
        `<path d="M138 176 L160 200 L182 176 L182 185 L160 210 L138 185 Z" fill="#fff"/>
         <path d="M126 190 H146 M174 190 H194" stroke="#fff" stroke-width="3"/>
         <path d="M153 208 L160 214 L167 208 L164 218 L156 218 Z" fill="#d23f3f"/>
         <g class="sleeve-l"><path d="M108 216 L122 222" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>
         <g class="sleeve-r"><path d="M212 216 L198 222" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>`,
    },
    {
      id: "top-sponge", name: "스폰지 셔츠", price: 450,
      svg: topBase("#fdfdfb") +
        `<g class="sleeve-l"><path d="M129 178 Q112 196 106 220 L121 226 Q127 204 139 191 Z" fill="#f7e34d"/><circle cx="113" cy="210" r="3" fill="#d9c52e"/></g>
         <g class="sleeve-r"><path d="M191 178 Q208 196 214 220 L199 226 Q193 204 181 191 Z" fill="#f7e34d"/><circle cx="207" cy="210" r="3" fill="#d9c52e"/></g>
         <polygon points="146,172 158,182 150,190" fill="#e8e2d6"/><polygon points="174,172 162,182 170,190" fill="#e8e2d6"/>
         <polygon points="160,182 154,189 158,216 160,226 162,216 166,189" fill="#d23f3f"/>`,
    },
  ],

  // ==================== 하의 (10) ====================
  bottom: [
    {
      id: "bottom-jeans", name: "청바지", price: 200,
      svg: pantsBase("#3b5b8c") +
        `<path d="M136 308 H155 M165 308 H184" stroke="#6f8cba" stroke-width="2" stroke-dasharray="3 2"/>
         <path d="M130 262 Q138 270 146 264 M174 264 Q182 270 190 262" stroke="#6f8cba" stroke-width="2" fill="none"/>`,
    },
    {
      id: "bottom-shorts", name: "주황 반바지", price: 150,
      svg: shortsBase("#e07b39") + `<path d="M128 296 H152 M168 296 H192" stroke="#c4632a" stroke-width="3"/>`,
    },
    {
      id: "bottom-skirt", name: "플레어 치마", price: 220, rigid: true,
      svg: `<path d="M128 252 Q160 264 192 252 L204 306 Q160 320 116 306 Z" fill="#d94f6e"/>
        <path d="M134 258 L126 302 M148 262 L144 310 M160 263 L160 312 M172 262 L176 310 M186 258 L194 302" stroke="#c43d5c" stroke-width="2"/>`,
    },
    {
      id: "bottom-armor", name: "갑옷 하의", price: 500,
      svg: pantsBase("#9aa7b5") +
        `<circle cx="145" cy="322" r="7" fill="#7f8d9d"/><circle cx="174" cy="322" r="7" fill="#7f8d9d"/>
         <path d="M126 268 Q160 280 194 268" stroke="#7f8d9d" stroke-width="4" fill="none"/>`,
    },
    {
      id: "bottom-jogger", name: "츄리닝", price: 210,
      svg: pantsBase("#3a3f4a") +
        `<rect x="136" y="300" width="4" height="44" fill="#fff" opacity="0.85"/>
         <rect x="180" y="300" width="4" height="44" fill="#fff" opacity="0.85"/>
         <path d="M150 258 Q155 264 152 270" stroke="#fff" stroke-width="2" fill="none"/>`,
    },
    {
      id: "bottom-slacks", name: "정장 바지", price: 320,
      svg: pantsBase("#23262e") + `<path d="M145 302 V344 M174 302 V344" stroke="#3a3f4a" stroke-width="2"/>`,
    },
    {
      id: "bottom-pajama", name: "도트 파자마", price: 180,
      svg: pantsBase("#a8d8ef") +
        `<g fill="#5a9ec4"><circle cx="140" cy="266" r="3"/><circle cx="162" cy="260" r="3"/><circle cx="184" cy="268" r="3"/>
         <circle cx="144" cy="316" r="3"/><circle cx="150" cy="334" r="3"/><circle cx="170" cy="312" r="3"/><circle cx="178" cy="332" r="3"/></g>`,
    },
    {
      id: "bottom-hanbok", name: "한복 바지", price: 330,
      svg: `<path d="M126 252 Q160 264 194 252 L208 330 Q188 342 170 334 L166 300 Q160 296 154 300 L150 334 Q132 342 112 330 Z" fill="#9fd6c9"/>
        <path d="M114 326 L142 332 M206 326 L178 332" stroke="#5fae9e" stroke-width="4" stroke-linecap="round"/>`,
    },
    {
      id: "bottom-cargo", name: "카고 바지", price: 280,
      svg: pantsBase("#5c6b46") +
        `<rect x="133" y="312" width="13" height="12" rx="2" fill="#465434"/>
         <rect x="174" y="312" width="13" height="12" rx="2" fill="#465434"/>
         <path d="M126 270 Q160 282 194 270" stroke="#465434" stroke-width="3" fill="none"/>`,
    },
    {
      id: "bottom-tights", name: "줄무늬 스타킹", price: 240,
      svg: pantsBase("#eceae4") +
        `<g fill="#e2536b">
         <rect x="133" y="306" width="25" height="7"/><rect x="133" y="320" width="25" height="7"/><rect x="133" y="334" width="25" height="7"/>
         <rect x="162" y="306" width="25" height="7"/><rect x="162" y="320" width="25" height="7"/><rect x="162" y="334" width="25" height="7"/></g>`,
    },
    // --- 코스프레 세트 ---
    {
      id: "bottom-doraemon", name: "도라에몽 하의", price: 350,
      svg: pantsBase("#1f9de0") +
        `<path d="M126 254 Q160 266 194 254" stroke="#fff" stroke-width="4" fill="none" opacity="0.5"/>`,
    },
    {
      id: "bottom-pikachu", name: "피카츄 하의 + 꼬리", price: 480,
      svg: pantsBase("#ffd93b") +
        `<path d="M192 288 L220 284 L210 268 L246 250 L237 274 L254 270 L224 310 L229 288 Z" fill="#ffd93b" stroke="#e3b81f" stroke-width="2" stroke-linejoin="round"/>
         <path d="M192 288 L204 282 L200 292 Z" fill="#b9803c"/>`,
    },
    {
      id: "bottom-mickey", name: "빨간 단추 반바지", price: 380,
      svg: shortsBase("#e23b2e") +
        `<circle cx="146" cy="272" r="5.5" fill="#fff"/><circle cx="174" cy="272" r="5.5" fill="#fff"/>`,
    },
    {
      id: "bottom-donald", name: "보송 깃털 반바지", price: 300,
      svg: shortsBase("#fdfdfb") +
        `<g fill="#fff" stroke="#e3e6ea" stroke-width="1.5"><circle cx="130" cy="300" r="6"/><circle cx="142" cy="304" r="6"/>
         <circle cx="154" cy="302" r="5"/><circle cx="166" cy="302" r="5"/><circle cx="178" cy="304" r="6"/><circle cx="190" cy="300" r="6"/></g>`,
    },
    {
      id: "bottom-sponge", name: "갈색 네모 바지", price: 400,
      svg: `<path d="M124 248 L196 248 L196 302 L168 302 L168 286 L152 286 L152 302 L124 302 Z" fill="#9c6f44"/>
        <rect x="124" y="248" width="72" height="6" fill="#fff"/>
        <path d="M124 294 H152 M168 294 H196" stroke="#23252b" stroke-width="3"/>`,
    },
  ],

  // ==================== 신발 (10) ====================
  shoes: [
    {
      id: "shoes-sneak", name: "운동화", price: 220,
      svg: shoeBase("#fdfdfb") +
        `<rect x="127" y="352" width="34" height="7" rx="3" fill="#e3e6ea"/><rect x="159" y="352" width="34" height="7" rx="3" fill="#e3e6ea"/>
         <path d="M131 344 Q140 338 152 343 M163 344 Q172 338 184 343" stroke="#e2536b" stroke-width="3" fill="none" stroke-linecap="round"/>
         <path d="M136 338 H148 M168 338 H180" stroke="#c9cdd4" stroke-width="2"/>`,
    },
    {
      id: "shoes-boots", name: "가죽 부츠", price: 300,
      svg: `<rect x="129" y="314" width="30" height="44" rx="9" fill="#8a5a3a"/>
        <rect x="161" y="314" width="30" height="44" rx="9" fill="#8a5a3a"/>
        <rect x="129" y="314" width="30" height="10" rx="5" fill="#a9744d"/>
        <rect x="161" y="314" width="30" height="10" rx="5" fill="#a9744d"/>
        <rect x="127" y="352" width="34" height="7" rx="3" fill="#5e3c25"/><rect x="159" y="352" width="34" height="7" rx="3" fill="#5e3c25"/>`,
    },
    {
      id: "shoes-slipper", name: "슬리퍼", price: 90,
      svg: `<rect x="128" y="346" width="33" height="12" rx="6" fill="#7ec8e3"/>
        <rect x="159" y="346" width="33" height="12" rx="6" fill="#7ec8e3"/>
        <path d="M132 348 Q144 338 157 348 M163 348 Q175 338 188 348" stroke="#5aa8c6" stroke-width="5" fill="none"/>`,
    },
    {
      id: "shoes-dress", name: "반짝 구두", price: 280,
      svg: shoeBase("#23252b") +
        `<ellipse cx="138" cy="340" rx="5" ry="2.5" fill="#fff" opacity="0.6"/>
         <ellipse cx="170" cy="340" rx="5" ry="2.5" fill="#fff" opacity="0.6"/>`,
    },
    {
      id: "shoes-rocket", name: "로켓 신발", price: 800,
      svg: shoeBase("#b7c2cd") +
        `<circle cx="144" cy="344" r="5" fill="#7ec8e3" stroke="#8d99a8" stroke-width="2"/>
         <circle cx="176" cy="344" r="5" fill="#7ec8e3" stroke="#8d99a8" stroke-width="2"/>
         <polygon points="136,358 144,376 152,358" fill="#ff8c3a"/><polygon points="140,358 144,368 148,358" fill="#ffd76e"/>
         <polygon points="168,358 176,376 184,358" fill="#ff8c3a"/><polygon points="172,358 176,368 180,358" fill="#ffd76e"/>`,
    },
    {
      id: "shoes-rain", name: "노란 장화", price: 180,
      svg: `<rect x="129" y="318" width="30" height="40" rx="8" fill="#ffd24d"/>
        <rect x="161" y="318" width="30" height="40" rx="8" fill="#ffd24d"/>
        <rect x="127" y="352" width="34" height="7" rx="3" fill="#e0a92e"/><rect x="159" y="352" width="34" height="7" rx="3" fill="#e0a92e"/>
        <path d="M134 324 V344" stroke="#fff" stroke-width="3" opacity="0.55" stroke-linecap="round"/>
        <path d="M166 324 V344" stroke="#fff" stroke-width="3" opacity="0.55" stroke-linecap="round"/>`,
    },
    {
      id: "shoes-sandal", name: "샌들", price: 120,
      svg: `<rect x="128" y="350" width="33" height="8" rx="4" fill="#c49a6c"/>
        <rect x="159" y="350" width="33" height="8" rx="4" fill="#c49a6c"/>
        <path d="M134 351 L144 342 L154 351 M144 342 V351" stroke="#8a5a3a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M166 351 L176 342 L186 351 M176 342 V351" stroke="#8a5a3a" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: "shoes-skate", name: "아이스 스케이트", price: 460,
      svg: shoeBase("#f0f0f4") +
        `<path d="M132 362 H158 M164 362 H190" stroke="#8d99a8" stroke-width="3" stroke-linecap="round"/>
         <path d="M138 358 V362 M152 358 V362 M170 358 V362 M184 358 V362" stroke="#8d99a8" stroke-width="2.5"/>
         <path d="M133 340 L143 346 M165 340 L175 346" stroke="#c9cdd4" stroke-width="2"/>`,
    },
    {
      id: "shoes-heel", name: "빨간 하이힐", price: 350,
      svg: `<path d="M129 342 Q148 332 158 346 L156 356 L131 356 Z" fill="#d23f5e"/>
        <rect x="151" y="354" width="5" height="6" fill="#d23f5e"/>
        <path d="M161 342 Q180 332 190 346 L188 356 L163 356 Z" fill="#d23f5e"/>
        <rect x="183" y="354" width="5" height="6" fill="#d23f5e"/>`,
    },
    {
      id: "shoes-soccer", name: "축구화", price: 330,
      svg: shoeBase("#23252b") +
        `<path d="M131 344 Q142 337 154 342 M163 344 Q174 337 186 342" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
         <g fill="#44444c"><circle cx="134" cy="360" r="2"/><circle cx="144" cy="361" r="2"/><circle cx="154" cy="360" r="2"/>
         <circle cx="166" cy="360" r="2"/><circle cx="176" cy="361" r="2"/><circle cx="186" cy="360" r="2"/></g>`,
    },
    // --- 코스프레 세트 ---
    {
      id: "shoes-doraemon", name: "도라에몽 둥근 발", price: 300,
      svg: `<ellipse cx="144" cy="348" rx="19" ry="12" fill="#fff" stroke="#d8dee6" stroke-width="2"/>
        <ellipse cx="176" cy="348" rx="19" ry="12" fill="#fff" stroke="#d8dee6" stroke-width="2"/>`,
    },
    {
      id: "shoes-pikachu", name: "피카츄 발", price: 280,
      svg: `<ellipse cx="144" cy="349" rx="17" ry="11" fill="#ffd93b" stroke="#e3b81f" stroke-width="2"/>
        <ellipse cx="176" cy="349" rx="17" ry="11" fill="#ffd93b" stroke="#e3b81f" stroke-width="2"/>
        <path d="M138 344 V352 M150 344 V352 M170 344 V352 M182 344 V352" stroke="#e3b81f" stroke-width="1.5"/>`,
    },
    {
      id: "shoes-mickey", name: "노란 왕신발", price: 350,
      svg: `<ellipse cx="142" cy="346" rx="21" ry="14" fill="#ffd24d" stroke="#e0a92e" stroke-width="2"/>
        <ellipse cx="178" cy="346" rx="21" ry="14" fill="#ffd24d" stroke="#e0a92e" stroke-width="2"/>
        <path d="M126 340 Q134 334 144 336 M162 340 Q170 334 180 336" stroke="#e0a92e" stroke-width="2" fill="none"/>`,
    },
    {
      id: "shoes-donald", name: "주황 물갈퀴 발", price: 320,
      svg: `<ellipse cx="143" cy="350" rx="19" ry="9" fill="#f7a823"/>
        <path d="M136 343 V357 M150 343 V357" stroke="#dd8d12" stroke-width="2"/>
        <ellipse cx="177" cy="350" rx="19" ry="9" fill="#f7a823"/>
        <path d="M170 343 V357 M184 343 V357" stroke="#dd8d12" stroke-width="2"/>`,
    },
    {
      id: "shoes-sponge", name: "구두와 줄무늬 양말", price: 330,
      svg: `<rect x="135" y="318" width="22" height="22" rx="6" fill="#fff"/>
        <rect x="163" y="318" width="22" height="22" rx="6" fill="#fff"/>
        <path d="M135 324 H157 M163 324 H185" stroke="#d23f3f" stroke-width="3"/>
        <path d="M135 330 H157 M163 330 H185" stroke="#3a78c9" stroke-width="3"/>` +
        shoeBase("#23252b") +
        `<ellipse cx="138" cy="340" rx="4" ry="2" fill="#fff" opacity="0.5"/><ellipse cx="170" cy="340" rx="4" ry="2" fill="#fff" opacity="0.5"/>`,
    },
  ],

  // ==================== 왼손 아이템 (10) ====================
  handL: [
    {
      id: "hl-shield", name: "용사의 방패", price: 450,
      svg: `<path d="M70 220 L120 220 L120 262 Q120 288 95 296 Q70 288 70 262 Z" fill="#7d8ca3" stroke="#5a6478" stroke-width="4"/>
        <path d="M95 232 L95 282 M78 252 L112 252" stroke="#f0c95c" stroke-width="6" stroke-linecap="round"/>`,
    },
    {
      id: "hl-flower", name: "꽃다발", price: 260,
      svg: `<polygon points="88,246 118,246 103,284" fill="#f7e3c8" stroke="#e0c49a" stroke-width="2"/>
        <path d="M95 244 L92 234 M103 244 L103 228 M111 244 L114 234" stroke="#4caf7d" stroke-width="2.5"/>
        <circle cx="90" cy="230" r="7.5" fill="#ff7da3"/><circle cx="103" cy="221" r="8" fill="#ffd24d"/>
        <circle cx="116" cy="230" r="7.5" fill="#e2536b"/><circle cx="96" cy="240" r="6" fill="#b48ae0"/>
        <circle cx="110" cy="240" r="6" fill="#7ec8e3"/>
        <circle cx="90" cy="230" r="2.5" fill="#fff"/><circle cx="103" cy="221" r="2.5" fill="#e0a92e"/><circle cx="116" cy="230" r="2.5" fill="#fff"/>`,
    },
    {
      id: "hl-coffee", name: "따뜻한 커피", price: 120,
      svg: `<rect x="88" y="238" width="27" height="27" rx="4" fill="#fdfdfb" stroke="#c8b8a8" stroke-width="2"/>
        <rect x="88" y="247" width="27" height="9" fill="#b98a5f"/>
        <rect x="85" y="233" width="33" height="6" rx="3" fill="#8d93a1"/>
        <path d="M96 226 Q94 220 97 215 M106 226 Q104 220 107 215" stroke="#b9c2cc" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: "hl-book", name: "마법서", price: 160,
      svg: `<g transform="rotate(-14 100 244)">
        <rect x="80" y="228" width="40" height="31" rx="3" fill="#5a8ad9"/>
        <rect x="84" y="232" width="32" height="23" rx="2" fill="#f4f0e6"/>
        <path d="M89 238 H111 M89 244 H111 M89 250 H103" stroke="#c9bfa9" stroke-width="2"/>
        <polygon points="100,228 100,238 104,234 108,238 108,228" fill="#ffd24d"/></g>`,
    },
    {
      id: "hl-balloon", name: "빨간 풍선", price: 140,
      svg: `<path d="M103 250 Q92 215 89 192" stroke="#9aa3ad" stroke-width="2" fill="none"/>
        <ellipse cx="88" cy="166" rx="20" ry="25" fill="#ff6b6b"/>
        <ellipse cx="81" cy="156" rx="6" ry="9" fill="#ff9b9b"/>
        <polygon points="84,190 93,190 88,197" fill="#e05252"/>`,
    },
    {
      id: "hl-icecream", name: "아이스크림", price: 180,
      svg: `<polygon points="93,250 113,250 103,282" fill="#e0a96b"/>
        <path d="M95 256 L111 256 M97 263 L109 263 M99 270 L107 270" stroke="#c98c4e" stroke-width="1.5"/>
        <circle cx="97" cy="240" r="10" fill="#f7c9d8"/><circle cx="109" cy="238" r="10" fill="#fff2cc"/>
        <circle cx="103" cy="227" r="9" fill="#c5e8c9"/><circle cx="103" cy="217" r="3.5" fill="#d23f3f"/>`,
    },
    {
      id: "hl-mirror", name: "손거울", price: 200,
      svg: `<circle cx="100" cy="226" r="17" fill="#cfe7f0" stroke="#d98fb0" stroke-width="5"/>
        <path d="M93 220 L101 228" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
        <rect x="97" y="242" width="7" height="16" rx="3" fill="#d98fb0"/>`,
    },
    {
      id: "hl-lantern", name: "등불", price: 310,
      svg: `<path d="M94 228 Q103 216 112 228" stroke="#8d6a3f" stroke-width="3" fill="none"/>
        <circle cx="103" cy="245" r="17" fill="#ffe9a8" opacity="0.4"/>
        <rect x="90" y="228" width="26" height="32" rx="7" fill="#d24f3f" stroke="#a83a2c" stroke-width="2"/>
        <rect x="96" y="234" width="14" height="20" rx="4" fill="#ffe9a8"/>
        <circle cx="103" cy="244" r="4" fill="#ffd24d"/>
        <rect x="98" y="224" width="10" height="5" rx="2" fill="#8d6a3f"/>`,
    },
    {
      id: "hl-pizza", name: "피자 한 조각", price: 150,
      svg: `<g transform="rotate(10 103 248)">
        <polygon points="85,228 121,228 103,268" fill="#f7d36b"/>
        <path d="M85 228 Q103 219 121 228 L119 235 Q103 227 87 235 Z" fill="#d96a4a"/>
        <circle cx="97" cy="240" r="4" fill="#d23f3f"/><circle cx="109" cy="241" r="4" fill="#d23f3f"/><circle cx="103" cy="252" r="3.5" fill="#d23f3f"/></g>`,
    },
    {
      id: "hl-watergun", name: "물총", price: 280,
      svg: `<rect x="76" y="238" width="42" height="15" rx="7" fill="#3bb8c4"/>
        <rect x="70" y="241" width="10" height="8" rx="3" fill="#f0c95c"/>
        <circle cx="108" cy="231" r="9" fill="#8fd6e0" stroke="#3bb8c4" stroke-width="2"/>
        <rect x="96" y="251" width="9" height="14" rx="3" fill="#2c97a3"/>
        <circle cx="60" cy="240" r="2.5" fill="#5ab8e8"/><circle cx="53" cy="247" r="2" fill="#5ab8e8"/><circle cx="48" cy="238" r="1.6" fill="#5ab8e8"/>`,
    },
    // --- 코스프레 세트 ---
    {
      id: "hl-dorayaki", name: "도라야끼", price: 180,
      svg: `<ellipse cx="100" cy="240" rx="17" ry="6" fill="#6d4525"/>
        <ellipse cx="100" cy="234" rx="18" ry="8" fill="#d9a958"/>
        <ellipse cx="100" cy="231" rx="14" ry="5" fill="#e3b974"/>
        <ellipse cx="100" cy="245" rx="18" ry="8" fill="#c98c4e"/>`,
    },
    {
      id: "hl-glove", name: "흰 장갑 (왼손)", price: 150,
      svg: `<circle cx="96" cy="243" r="6" fill="#fff" stroke="#d8dee6" stroke-width="1.5"/>
        <circle cx="104" cy="240" r="6" fill="#fff" stroke="#d8dee6" stroke-width="1.5"/>
        <circle cx="111" cy="245" r="5.5" fill="#fff" stroke="#d8dee6" stroke-width="1.5"/>
        <circle cx="103" cy="252" r="12" fill="#fff" stroke="#d8dee6" stroke-width="2"/>
        <path d="M94 260 Q103 266 112 260" stroke="#d8dee6" stroke-width="2" fill="none"/>`,
    },
  ],

  // ==================== 오른손 아이템 (10) ====================
  handR: [
    {
      id: "hr-sword", name: "용사의 검", price: 700,
      svg: `<polygon points="215,240 223,240 222,172 219,162 216,172" fill="#cfd6dd" stroke="#9aa4ad" stroke-width="1.5"/>
        <path d="M219 170 V234" stroke="#fff" stroke-width="1.5" opacity="0.7"/>
        <rect x="206" y="238" width="26" height="7" rx="3" fill="#d9a441"/>
        <rect x="215" y="245" width="8" height="18" rx="3" fill="#7a4a2b"/>
        <circle cx="219" cy="265" r="4" fill="#d9a441"/>`,
    },
    {
      id: "hr-staff", name: "마법 지팡이", price: 650,
      svg: `<circle cx="228" cy="153" r="18" fill="#7ee0d2" opacity="0.3"/>
        <path d="M217 256 L228 162" stroke="#8a5a3a" stroke-width="6" stroke-linecap="round"/>
        <circle cx="229" cy="152" r="11" fill="#7ee0d2" stroke="#46b8a8" stroke-width="3"/>
        <circle cx="226" cy="148" r="3" fill="#fff" opacity="0.8"/>
        <path d="M220 200 L226 204 M222 220 L228 224" stroke="#caa44a" stroke-width="3" stroke-linecap="round"/>`,
    },
    {
      id: "hr-umbrella", name: "빨간 우산", price: 240,
      svg: `<path d="M217 254 L224 178" stroke="#6b7280" stroke-width="4"/>
        <path d="M217 254 Q215 266 206 263" stroke="#6b7280" stroke-width="4" fill="none"/>
        <path d="M180 180 Q224 132 268 180 Q257 171 246 180 Q235 169 224 180 Q213 169 202 180 Q191 171 180 180 Z" fill="#e2536b" stroke="#c43d5c" stroke-width="2"/>
        <path d="M224 142 V132" stroke="#6b7280" stroke-width="3" stroke-linecap="round"/>`,
    },
    {
      id: "hr-rod", name: "낚싯대", price: 380,
      svg: `<path d="M212 260 L286 166" stroke="#8a5a3a" stroke-width="4" stroke-linecap="round"/>
        <circle cx="225" cy="245" r="6" fill="#4a4f59"/><path d="M225 245 L232 250" stroke="#4a4f59" stroke-width="3"/>
        <path d="M286 166 V238" stroke="#9aa3ad" stroke-width="1.5"/>
        <path d="M286 238 Q281 246 287 248" stroke="#9aa3ad" stroke-width="2" fill="none"/>`,
    },
    {
      id: "hr-mic", name: "마이크", price: 300,
      svg: `<g transform="rotate(-16 221 240)">
        <rect x="214" y="232" width="14" height="36" rx="6" fill="#3a3f4a"/>
        <circle cx="221" cy="221" r="15" fill="#8d93a1"/>
        <path d="M209 216 H233 M209 222 H233 M211 228 H231" stroke="#6b7280" stroke-width="1.5"/>
        <rect x="217" y="248" width="8" height="3" fill="#e2536b"/></g>`,
    },
    {
      id: "hr-hammer", name: "뿅망치", price: 220,
      svg: `<path d="M217 254 L231 192" stroke="#e0b34d" stroke-width="7" stroke-linecap="round"/>
        <g transform="rotate(12 232 180)">
        <rect x="206" y="166" width="52" height="28" rx="14" fill="#e2536b"/>
        <circle cx="208" cy="180" r="13" fill="#ffd24d"/><circle cx="256" cy="180" r="13" fill="#ffd24d"/>
        <path d="M224 168 V192 M240 168 V192" stroke="#c43d5c" stroke-width="3"/></g>`,
    },
    {
      id: "hr-torch", name: "횃불", price: 330,
      svg: `<path d="M217 254 L225 204" stroke="#8a5a3a" stroke-width="7" stroke-linecap="round"/>
        <path d="M214 204 Q208 198 218 194 L232 194 Q242 198 236 204 Z" fill="#6d4525"/>
        <path d="M213 196 Q208 174 225 158 Q242 174 237 196 Z" fill="#ff8c3a"/>
        <path d="M218 196 Q216 182 225 172 Q234 182 232 196 Z" fill="#ffd76e"/>`,
    },
    {
      id: "hr-bat", name: "야구 방망이", price: 260,
      svg: `<g transform="rotate(18 217 250)">
        <path d="M212 254 L208 198 Q206 178 218 170 Q230 178 228 198 L224 254 Z" fill="#d9a958"/>
        <rect x="209" y="248" width="18" height="9" rx="4" fill="#8a5a3a"/>
        <path d="M211 200 Q218 196 225 200" stroke="#c0903f" stroke-width="2" fill="none"/></g>`,
    },
    {
      id: "hr-fan", name: "전통 부채", price: 210,
      svg: `<g>
        <polygon points="217,248 178,226 196,210" fill="#f7c9d8"/>
        <polygon points="217,248 196,210 218,204" fill="#fdfdfb"/>
        <polygon points="217,248 218,204 240,211" fill="#f7c9d8"/>
        <polygon points="217,248 240,211 256,228" fill="#fdfdfb"/>
        <path d="M217 248 L186 219 M217 248 L207 207 M217 248 L229 207 M217 248 L249 220" stroke="#d98fb0" stroke-width="1.5"/>
        <circle cx="217" cy="248" r="4" fill="#8a5a3a"/></g>`,
    },
    {
      id: "hr-carrot", name: "당근", price: 90,
      svg: `<g transform="rotate(16 217 248)">
        <polygon points="209,226 225,226 218,272" fill="#f08c3a"/>
        <path d="M211 236 H222 M212 246 H221 M214 256 H220" stroke="#d97426" stroke-width="1.5"/>
        <ellipse cx="212" cy="218" rx="4" ry="9" fill="#4caf7d" transform="rotate(-22 212 218)"/>
        <ellipse cx="221" cy="218" rx="4" ry="9" fill="#5fc28f" transform="rotate(20 221 218)"/></g>`,
    },
    // --- 코스프레 세트 ---
    {
      id: "hr-glove", name: "흰 장갑 (오른손)", price: 150,
      svg: `<circle cx="224" cy="243" r="6" fill="#fff" stroke="#d8dee6" stroke-width="1.5"/>
        <circle cx="216" cy="240" r="6" fill="#fff" stroke="#d8dee6" stroke-width="1.5"/>
        <circle cx="209" cy="245" r="5.5" fill="#fff" stroke="#d8dee6" stroke-width="1.5"/>
        <circle cx="217" cy="252" r="12" fill="#fff" stroke="#d8dee6" stroke-width="2"/>
        <path d="M208 260 Q217 266 226 260" stroke="#d8dee6" stroke-width="2" fill="none"/>`,
    },
  ],

  // ==================== 좌측 바닥 장식 (10) ====================
  decoL: [
    {
      id: "dl-cat", name: "회색 고양이", price: 320,
      svg: `<path d="M72 350 Q88 346 84 328" stroke="#8d93a1" stroke-width="7" fill="none" stroke-linecap="round"/>
        <ellipse cx="55" cy="342" rx="19" ry="18" fill="#8d93a1"/>
        <circle cx="55" cy="316" r="14" fill="#8d93a1"/>
        <polygon points="44,310 46,295 56,305" fill="#8d93a1"/><polygon points="66,310 64,295 54,305" fill="#8d93a1"/>
        <circle cx="50" cy="314" r="1.8" fill="#33323e"/><circle cx="60" cy="314" r="1.8" fill="#33323e"/>
        <path d="M53 319 Q55 321 57 319" stroke="#33323e" stroke-width="1.5" fill="none"/>
        <ellipse cx="55" cy="348" rx="10" ry="8" fill="#aab3c0"/>`,
    },
    {
      id: "dl-lamp", name: "가로등", price: 280,
      svg: `<rect x="52" y="256" width="6" height="100" fill="#4a4f59"/>
        <path d="M38 256 Q55 238 72 256 Z" fill="#3a3f4a"/>
        <circle cx="55" cy="260" r="16" fill="#ffe9a8" opacity="0.35"/>
        <circle cx="55" cy="259" r="9" fill="#ffe9a8"/>
        <rect x="42" y="354" width="26" height="6" rx="3" fill="#4a4f59"/>`,
    },
    {
      id: "dl-sign", name: "상점 표지판", price: 180,
      svg: `<rect x="52" y="312" width="6" height="48" fill="#8a6a48"/>
        <rect x="27" y="296" width="56" height="30" rx="6" fill="#d9b873" stroke="#b3935a" stroke-width="2"/>
        <text x="55" y="316" text-anchor="middle" font-size="13" font-weight="800" fill="#6a4e30" font-family="sans-serif">SHOP</text>`,
    },
    {
      id: "dl-snowman", name: "눈사람", price: 260,
      svg: `<circle cx="55" cy="340" r="20" fill="#fff" stroke="#dde6ee" stroke-width="2"/>
        <circle cx="55" cy="310" r="14" fill="#fff" stroke="#dde6ee" stroke-width="2"/>
        <circle cx="50" cy="307" r="1.8" fill="#33323e"/><circle cx="60" cy="307" r="1.8" fill="#33323e"/>
        <polygon points="55,311 68,313 55,316" fill="#f08c3a"/>
        <path d="M37 322 L25 312 M73 322 L85 312" stroke="#8a5a3a" stroke-width="3" stroke-linecap="round"/>
        <circle cx="55" cy="334" r="2" fill="#33323e"/><circle cx="55" cy="343" r="2" fill="#33323e"/>`,
    },
    {
      id: "dl-mailbox", name: "빨간 우체통", price: 300,
      svg: `<rect x="52" y="330" width="6" height="30" fill="#6d4525"/>
        <rect x="34" y="304" width="42" height="28" rx="13" fill="#e2536b"/>
        <path d="M38 312 H58" stroke="#c43d5c" stroke-width="3"/>
        <rect x="62" y="310" width="4" height="10" fill="#ffd24d"/>`,
    },
    {
      id: "dl-tree", name: "사과나무", price: 350,
      svg: `<rect x="50" y="318" width="10" height="42" rx="3" fill="#8a5a3a"/>
        <circle cx="55" cy="292" r="26" fill="#5fae6e"/>
        <circle cx="36" cy="306" r="16" fill="#6fbd7d"/><circle cx="74" cy="306" r="16" fill="#6fbd7d"/>
        <circle cx="46" cy="290" r="4" fill="#e2536b"/><circle cx="66" cy="298" r="4" fill="#e2536b"/><circle cx="58" cy="280" r="4" fill="#e2536b"/>`,
    },
    {
      id: "dl-flower", name: "튤립 꽃", price: 200,
      svg: `<path d="M55 360 V322" stroke="#4caf7d" stroke-width="4"/>
        <path d="M55 344 Q42 340 40 330 Q52 332 55 344 Z" fill="#5fc28f"/>
        <g fill="#ff7da3"><circle cx="55" cy="304" r="8"/><circle cx="64" cy="311" r="8"/><circle cx="61" cy="322" r="8"/><circle cx="49" cy="322" r="8"/><circle cx="46" cy="311" r="8"/></g>
        <circle cx="55" cy="313" r="7" fill="#ffd24d"/>`,
    },
    {
      id: "dl-books", name: "책 더미", price: 160,
      svg: `<rect x="32" y="346" width="46" height="13" rx="3" fill="#d96a5a"/>
        <rect x="36" y="333" width="40" height="13" rx="3" fill="#5a8ad9"/>
        <rect x="40" y="320" width="36" height="13" rx="3" fill="#e0b34d"/>
        <path d="M36 352 H74 M40 339 H72 M44 326 H72" stroke="#fff" stroke-width="1.5" opacity="0.6"/>`,
    },
    {
      id: "dl-penguin", name: "펭귄", price: 400,
      svg: `<ellipse cx="55" cy="334" rx="19" ry="26" fill="#2e3440"/>
        <ellipse cx="55" cy="341" rx="12" ry="17" fill="#f4f4f6"/>
        <circle cx="49" cy="318" r="2" fill="#fff"/><circle cx="61" cy="318" r="2" fill="#fff"/>
        <circle cx="49" cy="318" r="1" fill="#1d222c"/><circle cx="61" cy="318" r="1" fill="#1d222c"/>
        <polygon points="55,321 62,325 55,328" fill="#f0a330"/>
        <ellipse cx="47" cy="359" rx="7" ry="3.5" fill="#f0a330"/><ellipse cx="63" cy="359" rx="7" ry="3.5" fill="#f0a330"/>
        <path d="M37 326 Q32 338 38 348" stroke="#2e3440" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: "dl-rabbit", name: "토끼", price: 380,
      svg: `<ellipse cx="55" cy="342" rx="16" ry="17" fill="#f5f1ea"/>
        <circle cx="55" cy="316" r="12" fill="#f5f1ea"/>
        <ellipse cx="48" cy="296" rx="5" ry="14" fill="#f5f1ea"/><ellipse cx="62" cy="296" rx="5" ry="14" fill="#f5f1ea"/>
        <ellipse cx="48" cy="298" rx="2.5" ry="9" fill="#f7c9d8"/><ellipse cx="62" cy="298" rx="2.5" ry="9" fill="#f7c9d8"/>
        <circle cx="50" cy="314" r="1.7" fill="#33323e"/><circle cx="60" cy="314" r="1.7" fill="#33323e"/>
        <circle cx="55" cy="319" r="2" fill="#f7a8b0"/>
        <ellipse cx="55" cy="350" rx="8" ry="6" fill="#fff"/>`,
    },
    // --- 코스프레 세트 ---
    {
      id: "dl-gary", name: "분홍 달팽이", price: 500,
      svg: `<path d="M32 358 Q28 344 44 346 L72 346 Q82 348 80 358 Z" fill="#7ec8e3"/>
        <path d="M38 346 Q36 330 41 322 M48 346 Q47 330 51 322" stroke="#7ec8e3" stroke-width="4" fill="none" stroke-linecap="round"/>
        <circle cx="41" cy="319" r="4.5" fill="#7ec8e3"/><circle cx="51" cy="319" r="4.5" fill="#7ec8e3"/>
        <circle cx="41" cy="319" r="1.8" fill="#d23f3f"/><circle cx="51" cy="319" r="1.8" fill="#d23f3f"/>
        <circle cx="62" cy="330" r="17" fill="#f2a0c4"/>
        <path d="M62 330 q9 -2 8 7 q-2 8 -10 5 q-7 -3 -3 -9 q3 -4 5 -3" stroke="#d24f7c" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="70" cy="318" r="3" fill="#d24f7c"/><circle cx="52" cy="338" r="2.5" fill="#d24f7c"/>`,
    },
  ],

  // ==================== 우측 바닥 장식 (10) ====================
  decoR: [
    {
      id: "dr-plant", name: "화분", price: 250,
      svg: `<polygon points="250,336 280,336 276,360 254,360" fill="#c46a4a"/>
        <rect x="248" y="332" width="34" height="7" rx="3" fill="#a85538"/>
        <path d="M265 332 Q265 310 252 300 M265 332 Q265 306 278 298 M265 332 Q263 302 265 290" stroke="#4caf7d" stroke-width="5" fill="none" stroke-linecap="round"/>
        <ellipse cx="251" cy="299" rx="6" ry="9" fill="#5fc28f" transform="rotate(-30 251 299)"/>
        <ellipse cx="279" cy="297" rx="6" ry="9" fill="#5fc28f" transform="rotate(28 279 297)"/>
        <ellipse cx="265" cy="288" rx="6" ry="10" fill="#6fd66f"/>`,
    },
    {
      id: "dr-dog", name: "강아지", price: 330,
      svg: `<path d="M248 352 Q236 348 240 336" stroke="#b98a5f" stroke-width="7" fill="none" stroke-linecap="round"/>
        <ellipse cx="265" cy="342" rx="19" ry="18" fill="#b98a5f"/>
        <circle cx="265" cy="315" r="14" fill="#b98a5f"/>
        <ellipse cx="253" cy="306" rx="5" ry="10" fill="#9c6f44" transform="rotate(-22 253 306)"/>
        <ellipse cx="277" cy="306" rx="5" ry="10" fill="#9c6f44" transform="rotate(22 277 306)"/>
        <circle cx="260" cy="313" r="1.8" fill="#33323e"/><circle cx="270" cy="313" r="1.8" fill="#33323e"/>
        <circle cx="265" cy="318" r="2.5" fill="#33323e"/>
        <path d="M265 321 Q266 326 270 326 Q268 330 264 327 Z" fill="#ff7d6e"/>
        <ellipse cx="265" cy="349" rx="10" ry="8" fill="#d9b48a"/>`,
    },
    {
      id: "dr-chest", name: "보물상자", price: 600,
      svg: `<rect x="243" y="330" width="44" height="28" rx="4" fill="#8a5a3a" stroke="#6d4525" stroke-width="2"/>
        <path d="M243 330 Q265 310 287 330 Z" fill="#a9744d" stroke="#6d4525" stroke-width="2"/>
        <rect x="261" y="328" width="8" height="12" rx="2" fill="#ffd24d" stroke="#e0a92e" stroke-width="1.5"/>
        <circle cx="255" cy="326" r="4" fill="#ffd24d"/><circle cx="273" cy="324" r="4" fill="#ffd24d"/><circle cx="265" cy="320" r="3.5" fill="#ffe27a"/>
        <polygon points="290,308 291.4,312 295.5,312.2 292.2,314.7 293.4,318.7 290,316.3 286.6,318.7 287.8,314.7 284.5,312.2 288.6,312" fill="#ffe27a"/>`,
    },
    {
      id: "dr-fire", name: "모닥불", price: 280,
      svg: `<rect x="246" y="350" width="38" height="7" rx="3.5" fill="#8a5a3a" transform="rotate(-12 265 353)"/>
        <rect x="246" y="350" width="38" height="7" rx="3.5" fill="#6d4525" transform="rotate(12 265 353)"/>
        <path d="M251 350 Q248 322 265 305 Q282 322 279 350 Z" fill="#ff8c3a"/>
        <path d="M257 350 Q255 332 265 320 Q275 332 273 350 Z" fill="#ffd76e"/>
        <circle cx="250" cy="300" r="2.5" fill="#ff8c3a" opacity="0.8"/><circle cx="279" cy="294" r="2" fill="#ffb36b" opacity="0.8"/>`,
    },
    {
      id: "dr-mushroom", name: "점박이 버섯", price: 200,
      svg: `<rect x="258" y="332" width="14" height="28" rx="6" fill="#f3e8d8"/>
        <path d="M242 338 Q265 300 288 338 Z" fill="#e2536b"/>
        <circle cx="255" cy="326" r="4" fill="#fff"/><circle cx="272" cy="322" r="5" fill="#fff"/><circle cx="264" cy="332" r="3" fill="#fff"/>`,
    },
    {
      id: "dr-cactus", name: "선인장", price: 240,
      svg: `<polygon points="252,342 278,342 275,360 255,360" fill="#c46a4a"/>
        <rect x="258" y="296" width="14" height="48" rx="7" fill="#4caf7d"/>
        <path d="M258 318 Q244 316 244 304 Q252 304 258 310 Z" fill="#4caf7d"/>
        <path d="M272 326 Q286 324 286 312 Q278 312 272 318 Z" fill="#4caf7d"/>
        <circle cx="265" cy="294" r="5" fill="#ff7da3"/>
        <path d="M262 306 H268 M261 320 H269 M262 334 H268" stroke="#3a8a5f" stroke-width="1.5"/>`,
    },
    {
      id: "dr-robot", name: "미니 로봇", price: 550,
      svg: `<rect x="249" y="322" width="32" height="26" rx="5" fill="#9aa7b5"/>
        <rect x="254" y="302" width="22" height="17" rx="4" fill="#aeb8c4"/>
        <path d="M265 302 V294" stroke="#6b7280" stroke-width="2"/><circle cx="265" cy="292" r="3" fill="#e2536b"/>
        <rect x="258" y="307" width="5" height="5" rx="1" fill="#5ce0e8"/><rect x="267" y="307" width="5" height="5" rx="1" fill="#5ce0e8"/>
        <path d="M249 330 L240 340 M281 330 L290 340" stroke="#8d99a8" stroke-width="4" stroke-linecap="round"/>
        <circle cx="256" cy="352" r="6" fill="#4a4f59"/><circle cx="274" cy="352" r="6" fill="#4a4f59"/>
        <rect x="256" y="330" width="18" height="4" rx="2" fill="#7b8896"/>`,
    },
    {
      id: "dr-rock", name: "이끼 바위", price: 120,
      svg: `<path d="M244 360 Q241 334 263 330 Q286 328 287 360 Z" fill="#9aa1ab"/>
        <path d="M252 340 L260 346" stroke="#c9cdd4" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="251" cy="333" r="5" fill="#7fb069"/><circle cx="261" cy="329" r="4" fill="#94c47d"/><circle cx="272" cy="330" r="4.5" fill="#7fb069"/>`,
    },
    {
      id: "dr-flag", name: "승리의 깃발", price: 180,
      svg: `<rect x="262" y="278" width="5" height="82" fill="#6b7280"/>
        <circle cx="264.5" cy="276" r="3.5" fill="#ffd24d"/>
        <polygon points="267,282 302,292 267,302" fill="#e2536b"/>
        <rect x="252" y="356" width="26" height="5" rx="2.5" fill="#6b7280"/>`,
    },
    {
      id: "dr-slime", name: "슬라임 친구", price: 420,
      svg: `<path d="M244 360 Q241 328 265 326 Q289 328 286 360 Z" fill="#6fd66f" opacity="0.92"/>
        <ellipse cx="254" cy="336" rx="5" ry="7" fill="#fff" opacity="0.5"/>
        <circle cx="258" cy="344" r="2.5" fill="#2e5c2e"/><circle cx="272" cy="344" r="2.5" fill="#2e5c2e"/>
        <path d="M261 351 Q265 355 269 351" stroke="#2e5c2e" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    },
  ],

  // ==================== 배경 (10) ====================
  background: [
    {
      id: "bg-sky", name: "맑은 하늘", price: 200,
      svg: `<rect x="0" y="0" width="320" height="356" fill="#c2e7ff"/>
        <circle cx="268" cy="54" r="24" fill="#ffd76e"/>
        <g fill="#fff"><ellipse cx="78" cy="72" rx="26" ry="12"/><ellipse cx="98" cy="64" rx="18" ry="10"/>
        <ellipse cx="186" cy="38" rx="22" ry="10"/><ellipse cx="202" cy="32" rx="14" ry="8"/></g>
        <rect x="0" y="352" width="320" height="48" fill="#aed581"/>
        <path d="M30 352 L33 344 L36 352 M280 352 L283 345 L286 352" stroke="#8fbf5f" stroke-width="2" fill="none"/>`,
    },
    {
      id: "bg-night", name: "별이 빛나는 밤", price: 350,
      svg: `<rect x="0" y="0" width="320" height="356" fill="#1c2444"/>
        <circle cx="262" cy="58" r="20" fill="#f4e8b8"/>
        <circle cx="255" cy="52" r="4" fill="#e3d6a2"/><circle cx="268" cy="64" r="3" fill="#e3d6a2"/>
        <g fill="#fff"><circle cx="40" cy="40" r="2"/><circle cx="90" cy="80" r="1.5"/><circle cx="140" cy="36" r="2"/>
        <circle cx="200" cy="100" r="1.5"/><circle cx="60" cy="140" r="1.8"/><circle cx="300" cy="140" r="2"/>
        <circle cx="170" cy="70" r="1.3"/><circle cx="30" cy="220" r="1.6"/><circle cx="290" cy="240" r="1.4"/><circle cx="110" cy="190" r="1.5"/></g>
        <polygon points="120,120 121.6,124.5 126.5,124.7 122.7,127.5 124,132 120,129.3 116,132 117.3,127.5 113.5,124.7 118.4,124.5" fill="#ffe27a"/>
        <rect x="0" y="352" width="320" height="48" fill="#2c3a55"/>`,
    },
    {
      id: "bg-sunset", name: "노을", price: 400,
      svg: `<rect x="0" y="0" width="320" height="150" fill="#ffb36b"/>
        <rect x="0" y="150" width="320" height="110" fill="#ff8d6b"/>
        <rect x="0" y="260" width="320" height="96" fill="#d96a8a"/>
        <circle cx="95" cy="330" r="38" fill="#ffe27a"/>
        <path d="M180 90 q6 -6 12 0 q6 -6 12 0 M230 120 q5 -5 10 0 q5 -5 10 0" stroke="#a8533f" stroke-width="2" fill="none"/>
        <rect x="0" y="352" width="320" height="48" fill="#5a3b5e"/>`,
    },
    {
      id: "bg-forest", name: "숲속", price: 380,
      svg: `<rect x="0" y="0" width="320" height="356" fill="#d8efd0"/>
        <g fill="#5a8a62"><circle cx="40" cy="290" r="40"/><circle cx="120" cy="300" r="34"/><circle cx="230" cy="292" r="42"/><circle cx="300" cy="300" r="34"/></g>
        <g fill="#4a7852"><circle cx="80" cy="310" r="30"/><circle cx="180" cy="312" r="32"/><circle cx="270" cy="314" r="28"/></g>
        <circle cx="70" cy="80" r="3" fill="#fff" opacity="0.6"/><circle cx="240" cy="60" r="2.5" fill="#fff" opacity="0.6"/>
        <rect x="0" y="352" width="320" height="48" fill="#7fb069"/>`,
    },
    {
      id: "bg-sea", name: "바닷가", price: 450,
      svg: `<rect x="0" y="0" width="320" height="240" fill="#c2e7ff"/>
        <circle cx="60" cy="50" r="20" fill="#ffd76e"/>
        <ellipse cx="230" cy="60" rx="24" ry="10" fill="#fff"/>
        <rect x="0" y="240" width="320" height="112" fill="#4aa3df"/>
        <path d="M0 252 q20 -8 40 0 q20 -8 40 0 q20 -8 40 0 q20 -8 40 0 q20 -8 40 0 q20 -8 40 0 q20 -8 40 0 q20 -8 40 0" stroke="#fff" stroke-width="2" fill="none" opacity="0.6"/>
        <polygon points="250,236 250,206 272,236" fill="#fff"/><rect x="248" y="236" width="34" height="7" rx="3" fill="#d96a4a"/>
        <rect x="0" y="352" width="320" height="48" fill="#f0dcab"/>`,
    },
    {
      id: "bg-space", name: "우주", price: 800,
      svg: `<rect x="0" y="0" width="320" height="356" fill="#0b0e1f"/>
        <g fill="#fff"><circle cx="30" cy="50" r="1.6"/><circle cx="80" cy="120" r="1.3"/><circle cx="150" cy="40" r="2"/>
        <circle cx="210" cy="140" r="1.5"/><circle cx="290" cy="60" r="1.8"/><circle cx="50" cy="200" r="1.4"/>
        <circle cx="260" cy="220" r="1.6"/><circle cx="120" cy="180" r="1.2"/><circle cx="180" cy="250" r="1.5"/><circle cx="20" cy="300" r="1.5"/></g>
        <circle cx="250" cy="84" r="28" fill="#e0935a"/>
        <path d="M250 76 q14 4 22 12 M242 96 q12 6 24 4" stroke="#c47a44" stroke-width="3" fill="none"/>
        <ellipse cx="250" cy="88" rx="44" ry="9" fill="none" stroke="#d9b48a" stroke-width="3" opacity="0.8"/>
        <circle cx="68" cy="148" r="13" fill="#46b8a8"/>
        <path d="M120 280 L160 300" stroke="#fff" stroke-width="1.5" opacity="0.7"/><circle cx="118" cy="279" r="2.5" fill="#fff"/>
        <rect x="0" y="352" width="320" height="48" fill="#1d2438"/>`,
    },
    {
      id: "bg-city", name: "도시의 밤", price: 500,
      svg: `<rect x="0" y="0" width="320" height="356" fill="#f9c8a8"/>
        <g fill="#5a6478"><rect x="10" y="190" width="50" height="166"/><rect x="130" y="160" width="56" height="196"/><rect x="260" y="200" width="50" height="156"/></g>
        <g fill="#48506a"><rect x="66" y="230" width="58" height="126"/><rect x="192" y="220" width="62" height="136"/></g>
        <g fill="#ffe27a"><rect x="20" y="202" width="8" height="8"/><rect x="38" y="202" width="8" height="8"/><rect x="20" y="222" width="8" height="8"/>
        <rect x="140" y="174" width="9" height="9"/><rect x="158" y="174" width="9" height="9"/><rect x="140" y="196" width="9" height="9"/><rect x="158" y="220" width="9" height="9"/>
        <rect x="78" y="244" width="8" height="8"/><rect x="98" y="244" width="8" height="8"/><rect x="78" y="266" width="8" height="8"/>
        <rect x="204" y="234" width="8" height="8"/><rect x="224" y="234" width="8" height="8"/><rect x="224" y="258" width="8" height="8"/>
        <rect x="270" y="214" width="8" height="8"/><rect x="288" y="236" width="8" height="8"/></g>
        <rect x="0" y="352" width="320" height="48" fill="#3a3f4a"/>
        <path d="M20 376 H60 M100 376 H140 M180 376 H220 M260 376 H300" stroke="#ffd24d" stroke-width="3"/>`,
    },
    {
      id: "bg-desert", name: "사막", price: 320,
      svg: `<rect x="0" y="0" width="320" height="356" fill="#ffe2b8"/>
        <circle cx="60" cy="60" r="26" fill="#ff9d4d"/>
        <path d="M0 300 Q80 270 160 300 Q240 330 320 296 L320 356 L0 356 Z" fill="#ecc56f"/>
        <path d="M0 330 Q100 310 200 332 Q270 346 320 330 L320 356 L0 356 Z" fill="#d9a958"/>
        <rect x="282" y="276" width="8" height="26" rx="4" fill="#4caf7d"/>
        <path d="M282 288 Q272 286 272 278 Q278 278 282 283 Z" fill="#4caf7d"/>
        <rect x="0" y="352" width="320" height="48" fill="#d9a958"/>`,
    },
    {
      id: "bg-snow", name: "설원", price: 360,
      svg: `<rect x="0" y="0" width="320" height="356" fill="#dfe9f5"/>
        <path d="M0 320 Q90 280 180 316 Q260 344 320 312 L320 356 L0 356 Z" fill="#fff"/>
        <g fill="#fff"><circle cx="50" cy="60" r="3"/><circle cx="120" cy="100" r="2.5"/><circle cx="200" cy="50" r="3"/>
        <circle cx="270" cy="110" r="2.5"/><circle cx="80" cy="170" r="2.8"/><circle cx="240" cy="190" r="2.5"/>
        <circle cx="160" cy="140" r="2.2"/><circle cx="30" cy="240" r="2.8"/><circle cx="300" cy="230" r="2.5"/></g>
        <polygon points="60,310 75,278 90,310" fill="#3a6b52"/><polygon points="63,294 75,268 87,294" fill="#46805f"/>
        <polygon points="240,300 252,274 264,300" fill="#3a6b52"/>
        <rect x="0" y="352" width="320" height="48" fill="#fff"/>
        <path d="M40 372 H80 M180 380 H230" stroke="#dfe9f5" stroke-width="3" stroke-linecap="round"/>`,
    },
    {
      id: "bg-sakura", name: "벚꽃 길", price: 600,
      svg: `<rect x="0" y="0" width="320" height="356" fill="#ffe1ec"/>
        <path d="M0 30 Q60 50 110 36 Q160 24 200 44" stroke="#8a5a4a" stroke-width="9" fill="none" stroke-linecap="round"/>
        <path d="M110 38 Q120 60 112 78" stroke="#8a5a4a" stroke-width="6" fill="none" stroke-linecap="round"/>
        <g fill="#ffb3cd"><circle cx="40" cy="34" r="12"/><circle cx="80" cy="46" r="14"/><circle cx="130" cy="32" r="13"/>
        <circle cx="178" cy="42" r="12"/><circle cx="112" cy="74" r="10"/><circle cx="210" cy="52" r="10"/></g>
        <g fill="#ff8fb1"><circle cx="60" cy="38" r="5"/><circle cx="105" cy="40" r="5"/><circle cx="155" cy="36" r="5"/><circle cx="196" cy="48" r="4"/></g>
        <g fill="#ffb3cd"><ellipse cx="50" cy="150" rx="4" ry="2.5" transform="rotate(30 50 150)"/><ellipse cx="140" cy="190" rx="4" ry="2.5" transform="rotate(-20 140 190)"/>
        <ellipse cx="250" cy="140" rx="4" ry="2.5" transform="rotate(40 250 140)"/><ellipse cx="290" cy="250" rx="4" ry="2.5" transform="rotate(-30 290 250)"/>
        <ellipse cx="80" cy="260" rx="4" ry="2.5" transform="rotate(15 80 260)"/></g>
        <rect x="0" y="352" width="320" height="48" fill="#cdebb0"/>
        <ellipse cx="60" cy="358" rx="10" ry="3" fill="#ffb3cd" opacity="0.7"/><ellipse cx="230" cy="362" rx="8" ry="3" fill="#ffb3cd" opacity="0.7"/>`,
    },
  ],
};
