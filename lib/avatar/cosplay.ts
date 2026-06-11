// 코스프레 캐릭터 세트 — 듬이(백곰)/도기(강아지)/냥이(고양이)/토리(토끼)/버리(꿀벌)
// 각 세트를 모자(귀·더듬이)/얼굴 악세서리/상의/하의/신발 5개 슬롯에 배분.
// 좌표계: viewBox 0 0 320 400 (머리 160,120 r56 / 눈 140·180,110 / 몸통 124~196).
// 규칙: id 속성 금지, 소매는 sleeve-l/sleeve-r 마커(걷기 애니메이션 호환).

type Item = { id: string; name: string; price: number; svg: string; rigid?: boolean };

const TORSO = "M124 176 Q160 164 196 176 L199 268 Q160 280 121 268 Z";

function topBase(c: string, stroke?: string): string {
  const s = stroke ? ` stroke="${stroke}" stroke-width="3"` : "";
  return `<path d="${TORSO}" fill="${c}"${s}/>
    <g class="sleeve-l"><path d="M129 178 Q112 196 106 220 L121 226 Q127 204 139 191 Z" fill="${c}"${s}/></g>
    <g class="sleeve-r"><path d="M191 178 Q208 196 214 220 L199 226 Q193 204 181 191 Z" fill="${c}"${s}/></g>`;
}
function pantsBase(c: string, stroke?: string): string {
  const s = stroke ? ` stroke="${stroke}" stroke-width="3"` : "";
  return `<path d="M125 250 Q160 262 195 250 L195 302 Q186 308 167 306 L166 285 Q160 282 154 285 L153 306 Q134 308 125 302 Z" fill="${c}"${s}/>
    <rect x="133" y="300" width="25" height="46" rx="7" fill="${c}"${s}/>
    <rect x="162" y="300" width="25" height="46" rx="7" fill="${c}"${s}/>`;
}
function shoeBase(c: string, stroke?: string): string {
  const s = stroke ? ` stroke="${stroke}" stroke-width="3"` : "";
  return `<rect x="127" y="334" width="34" height="24" rx="11" fill="${c}"${s}/>
          <rect x="159" y="334" width="34" height="24" rx="11" fill="${c}"${s}/>`;
}

// ── 팔레트 ──
const DM = { w: "#ffffff", o: "#a8d4f0", b: "#dceefb", c: "#cfe8f7" }; // 듬이
const DG = { w: "#ffffff", o: "#3a342c", br: "#b9803f" }; // 도기
const NY = { w: "#ffffff", o: "#f2b3c7", f: "#fbe3ec", n: "#e83e8c" }; // 냥이
const TR = { w: "#ffffff", o: "#1d1d1d", or: "#e84e2f", pe: "#f8d2b8" }; // 토리
const BR = { y: "#ffd23f", o: "#1d1d1d", st: "#6b4a2a", bl: "#2a9df4" }; // 버리

// ── 영포티룩 팔레트 ──
const YF = {
  black: "#1d1f24", // 볼캡·크로스백·스니커즈
  dark: "#17181c",
  gray: "#5a5d63", // SOLID 티셔츠
  grayLine: "#43464c",
  denim: "#7ba6c9", // 데님 반바지
  denimLine: "#5a85a8",
  white: "#ffffff",
  cream: "#f6f4ef", // 토트백
  orange: "#ff5a36", // 폰
};

export const COSPLAY: Record<string, Item[]> = {
  hat: [
    {
      id: "yf-cap", name: "영포티 볼캡", price: 400,
      svg: `<path d="M106 92 Q108 46 160 44 Q212 46 214 92 Q160 76 106 92 Z" fill="${YF.black}" stroke="#000" stroke-width="3"/>
        <path d="M160 44 Q158 64 157 80 M132 52 Q126 68 124 84 M188 52 Q194 68 196 84" stroke="#33363d" stroke-width="2" fill="none"/>
        <ellipse cx="160" cy="91" rx="60" ry="10" fill="#101216"/>
        <text x="160" y="80" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="bold" fill="${YF.white}">S</text>`,
    },
    {
      id: "cos-dm-ears", name: "듬이 곰귀", price: 250,
      svg: `<circle cx="115" cy="74" r="15" fill="${DM.w}" stroke="${DM.o}" stroke-width="4"/>
        <circle cx="115" cy="74" r="7" fill="${DM.b}"/>
        <circle cx="205" cy="74" r="15" fill="${DM.w}" stroke="${DM.o}" stroke-width="4"/>
        <circle cx="205" cy="74" r="7" fill="${DM.b}"/>`,
    },
    {
      id: "cos-dg-ears", name: "도기 귀", price: 250,
      svg: `<path d="M122 66 Q98 74 100 108 Q112 120 126 108 Q120 86 132 70 Z" fill="${DG.br}" stroke="${DG.o}" stroke-width="3"/>
        <path d="M198 66 Q222 74 220 108 Q208 120 194 108 Q200 86 188 70 Z" fill="${DG.br}" stroke="${DG.o}" stroke-width="3"/>`,
    },
    {
      id: "cos-ny-ears", name: "냥이 귀", price: 250,
      svg: `<polygon points="112,80 102,42 142,62" fill="${NY.w}" stroke="${NY.o}" stroke-width="4" stroke-linejoin="round"/>
        <polygon points="116,74 110,52 132,63" fill="${NY.f}"/>
        <polygon points="208,80 218,42 178,62" fill="${NY.w}" stroke="${NY.o}" stroke-width="4" stroke-linejoin="round"/>
        <polygon points="204,74 210,52 188,63" fill="${NY.f}"/>`,
    },
    {
      id: "cos-tr-ears", name: "토리 귀", price: 250,
      svg: `<path d="M133 80 Q116 34 134 18 Q152 24 151 78 Z" fill="${TR.or}" stroke="${TR.o}" stroke-width="4"/>
        <path d="M169 78 Q168 24 186 18 Q204 34 187 80 Z" fill="${TR.w}" stroke="${TR.o}" stroke-width="4"/>
        <path d="M178 70 Q176 38 186 28" stroke="${TR.o}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: "cos-br-antenna", name: "버리 더듬이", price: 250,
      svg: `<path d="M146 68 Q138 50 133 41" stroke="${BR.o}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <circle cx="132" cy="38" r="4.5" fill="${BR.o}"/>
        <path d="M174 68 Q182 50 187 41" stroke="${BR.o}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <circle cx="188" cy="38" r="4.5" fill="${BR.o}"/>`,
    },
  ],

  faceAcc: [
    {
      id: "yf-glasses", name: "영포티 안경", price: 250,
      svg: `<rect x="124" y="99" width="32" height="23" rx="8" fill="rgba(255,255,255,0.25)" stroke="#2b2b2b" stroke-width="3"/>
        <rect x="164" y="99" width="32" height="23" rx="8" fill="rgba(255,255,255,0.25)" stroke="#2b2b2b" stroke-width="3"/>
        <path d="M156 109 Q160 106 164 109" stroke="#2b2b2b" stroke-width="3" fill="none"/>
        <path d="M124 107 L107 103 M196 107 L213 103" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>`,
    },
    {
      id: "cos-dm-face", name: "듬이 볼·코", price: 200,
      svg: `<circle cx="126" cy="140" r="11" fill="${DM.c}"/>
        <circle cx="194" cy="140" r="11" fill="${DM.c}"/>
        <ellipse cx="160" cy="127" rx="6.5" ry="4.5" fill="#1d2430"/>`,
    },
    {
      id: "cos-dg-face", name: "도기 주둥이", price: 200,
      svg: `<ellipse cx="160" cy="138" rx="21" ry="14" fill="${DG.w}" stroke="${DG.o}" stroke-width="3"/>
        <ellipse cx="160" cy="131" rx="6" ry="4.5" fill="#1d2430"/>
        <path d="M160 136 V143 M160 143 Q153 148 148 144 M160 143 Q167 148 172 144" stroke="#1d2430" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <circle cx="196" cy="146" r="3" fill="#f2a9b8" opacity="0.8"/>`,
    },
    {
      id: "cos-ny-face", name: "냥이 얼굴", price: 200,
      svg: `<ellipse cx="160" cy="133" rx="22" ry="13" fill="${NY.f}"/>
        <polygon points="155,127 165,127 160,133" fill="${NY.n}"/>
        <path d="M149 141 L160 146 L171 141" stroke="#1d1d1d" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M132 130 L118 127 M132 135 L119 136" stroke="${NY.o}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M188 130 L202 127 M188 135 L201 136" stroke="${NY.o}" stroke-width="1.6" stroke-linecap="round"/>`,
    },
    {
      id: "cos-tr-face", name: "토리 볼·코", price: 200,
      svg: `<circle cx="125" cy="137" r="13" fill="${TR.pe}"/>
        <circle cx="195" cy="137" r="13" fill="${TR.pe}"/>
        <ellipse cx="160" cy="123" rx="5" ry="4" fill="${TR.o}"/>
        <path d="M160 127 V133" stroke="${TR.o}" stroke-width="2.4" stroke-linecap="round"/>`,
    },
    {
      id: "cos-br-glasses", name: "버리 안경", price: 200,
      svg: `<g stroke="${BR.bl}" stroke-width="3.5" fill="none">
        <circle cx="140" cy="110" r="13"/>
        <circle cx="180" cy="110" r="13"/>
        <path d="M153 110 H167"/>
        <path d="M127 107 L115 103"/>
        <path d="M193 107 L205 103"/></g>`,
    },
  ],

  top: [
    {
      // 회색 SOLID 티셔츠 + 검정 크로스백 (스트랩이 가슴을 가로지름)
      id: "yf-tee", name: "SOLID 티셔츠+크로스백", price: 600,
      svg: topBase(YF.gray, YF.grayLine) +
        `<text x="160" y="216" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="bold" fill="${YF.dark}" letter-spacing="1">SOLID</text>
        <path d="M184 178 L132 252" stroke="${YF.dark}" stroke-width="9" stroke-linecap="round"/>
        <rect x="166" y="196" width="12" height="7" rx="2" fill="#3a3d44" transform="rotate(-55 172 199)"/>
        <rect x="110" y="240" width="42" height="28" rx="6" fill="${YF.dark}" stroke="#000" stroke-width="2.5"/>
        <path d="M110 250 H152" stroke="#3a3d44" stroke-width="2"/>
        <rect x="126" y="246" width="10" height="8" rx="2" fill="#8e939c"/>`,
    },
    {
      id: "cos-dm-top", name: "듬이 상의", price: 350,
      svg: topBase(DM.w, DM.o) +
        `<ellipse cx="160" cy="226" rx="29" ry="26" fill="${DM.b}"/>`,
    },
    {
      id: "cos-dg-top", name: "도기 상의", price: 350,
      svg: topBase(DG.w, DG.o) +
        `<ellipse cx="160" cy="228" rx="28" ry="25" fill="${DG.br}"/>`,
    },
    {
      id: "cos-ny-top", name: "냥이 상의", price: 350,
      svg: topBase(NY.w, NY.o) +
        `<ellipse cx="160" cy="226" rx="28" ry="25" fill="${NY.f}"/>`,
    },
    {
      id: "cos-tr-top", name: "토리 상의", price: 350,
      svg: topBase(TR.w, TR.o) +
        `<ellipse cx="160" cy="226" rx="28" ry="25" fill="${TR.pe}"/>`,
    },
    {
      id: "cos-br-top", name: "버리 상의", price: 350,
      svg: topBase(BR.y) +
        `<path d="M124.5 206 Q160 198 195.5 206 L196 220 Q160 212 124 220 Z" fill="${BR.st}"/>
         <path d="M123 240 Q160 232 197 240 L197.5 254 Q160 246 122.5 254 Z" fill="${BR.st}"/>
         <ellipse cx="111" cy="196" rx="9" ry="15" fill="#fff" stroke="#d9d9d9" stroke-width="2" transform="rotate(18 111 196)"/>
         <ellipse cx="209" cy="196" rx="9" ry="15" fill="#fff" stroke="#d9d9d9" stroke-width="2" transform="rotate(-18 209 196)"/>`,
    },
  ],

  bottom: [
    {
      // 찢어진 데님 반바지 — 밑단 올풀림 + 무릎 위 찢김
      id: "yf-shorts", name: "찢어진 데님 반바지", price: 550,
      svg: `<path d="M125 250 Q160 262 195 250 L195 302 Q186 308 167 306 L166 285 Q160 282 154 285 L153 306 Q134 308 125 302 Z" fill="${YF.denim}" stroke="${YF.denimLine}" stroke-width="3"/>
        <rect x="133" y="300" width="25" height="30" rx="5" fill="${YF.denim}" stroke="${YF.denimLine}" stroke-width="3"/>
        <rect x="162" y="300" width="25" height="30" rx="5" fill="${YF.denim}" stroke="${YF.denimLine}" stroke-width="3"/>
        <path d="M134 330 l3 5 M140 331 l2 5 M147 331 l2 5 M153 330 l3 5 M163 330 l3 5 M170 331 l2 5 M177 331 l2 5 M183 330 l3 5" stroke="#e8f1f8" stroke-width="2" stroke-linecap="round"/>
        <path d="M138 312 h13 M168 318 h12" stroke="#e8f1f8" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M131 262 Q137 268 133 276 M189 262 Q183 268 187 276" stroke="${YF.denimLine}" stroke-width="2" fill="none"/>
        <path d="M150 256 L153 282 M170 256 L167 282" stroke="${YF.denimLine}" stroke-width="1.6" stroke-dasharray="3 3"/>`,
    },
    {
      id: "cos-dm-bottom", name: "듬이 하의", price: 300,
      svg: pantsBase(DM.w, DM.o),
    },
    {
      id: "cos-dg-bottom", name: "도기토리 하의", price: 300,
      svg: pantsBase(DG.w, DG.o) +
        `<path d="M196 262 Q216 254 214 234" stroke="${DG.w}" stroke-width="9" fill="none" stroke-linecap="round"/>
         <path d="M196 262 Q216 254 214 234" stroke="${DG.o}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.5"/>
`,
    },
    {
      id: "cos-ny-bottom", name: "냥이 하의", price: 300,
      svg: pantsBase(NY.w, NY.o) +
        `<path d="M197 264 Q224 262 226 242 Q226 228 212 230" stroke="${NY.o}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: "cos-br-bottom", name: "버리 하의", price: 300,
      svg: pantsBase(BR.y) +
        `<path d="M126 264 Q160 274 194 264 L194 278 Q160 288 126 278 Z" fill="${BR.st}"/>
         <polygon points="160,300 154,290 166,290" fill="${BR.o}" opacity="0.85"/>`,
    },
  ],

  handL: [
    {
      // 화이트 쇼핑 토트백 (큰 체크 로고)
      id: "yf-tote", name: "화이트 토트백", price: 450,
      svg: `<path d="M92 248 Q103 232 114 248" stroke="${YF.dark}" stroke-width="5" fill="none"/>
        <rect x="76" y="246" width="54" height="50" rx="4" fill="${YF.cream}" stroke="#cfcabe" stroke-width="2.5"/>
        <path d="M84 252 L84 290 M122 252 L122 290" stroke="#dfd9cc" stroke-width="2"/>
        <path d="M84 276 Q98 286 122 262" stroke="${YF.dark}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    },
    {
      // 주가 하락(파란) 꺾은선 화살표 — 하락이라 헐값
      id: "hand-stock-down-l", name: "주가 하락 화살표", price: 100,
      svg: `<path d="M58 212 L80 234 L90 224 L112 248" stroke="#1c5fc4" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M58 212 L80 234 L90 224 L112 248" stroke="#5b8def" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <g transform="translate(116 252) rotate(139)"><polygon points="0,-17 11,9 -11,9" fill="#1c5fc4"/></g>
        <text x="56" y="270" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="bold" fill="#1c5fc4">-15%</text>`,
    },
  ],

  handR: [
    {
      // 주황 스마트폰
      id: "yf-phone", name: "영포티 폰", price: 300,
      svg: `<g transform="rotate(12 221 249)">
        <rect x="208" y="226" width="26" height="46" rx="6" fill="${YF.orange}" stroke="#c93d20" stroke-width="2.5"/>
        <rect x="212" y="232" width="18" height="31" rx="3" fill="#ffd9cf" opacity="0.85"/>
        <circle cx="221" cy="267" r="2.2" fill="#c93d20"/>
        <circle cx="214" cy="231" r="1.8" fill="#3a2620"/>
      </g>`,
    },
    {
      // 주가 상승(빨간) 꺾은선 화살표 — 상승은 프리미엄
      id: "hand-stock-up-r", name: "주가 상승 화살표", price: 1200,
      svg: `<path d="M194 262 L214 242 L224 252 L246 226" stroke="#d62839" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M194 262 L214 242 L224 252 L246 226" stroke="#ff5a6a" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <g transform="translate(250 222) rotate(41)"><polygon points="0,-17 11,9 -11,9" fill="#d62839"/></g>
        <text x="232" y="270" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="bold" fill="#d62839">+15%</text>
        <circle cx="260" cy="200" r="2.4" fill="#ffd34d"/><circle cx="248" cy="192" r="1.8" fill="#ffd34d"/>`,
    },
    {
      id: "hand-milkt-r", name: "밀크T 태블릿", price: 550,
      svg: `<g transform="rotate(-16 230 234)">
        <rect x="198" y="208" width="66" height="52" rx="9" fill="#1e9bf0" stroke="#0c5d9e" stroke-width="3.5"/>
        <rect x="204" y="214" width="54" height="40" rx="6" fill="#3fb0ff" opacity="0.55"/>
        <path d="M204 244 L258 222 L258 254 Q258 254 210 254 Z" fill="#1577c2" opacity="0.45"/>
        <circle cx="256" cy="214.5" r="2" fill="#0c5d9e"/>
        <text x="209" y="229" font-family="Arial, Helvetica, sans-serif" font-size="10.5" font-weight="bold" fill="#ffffff" letter-spacing="0.3">milk</text>
        <rect x="232" y="219.5" width="11" height="11" rx="2.5" fill="#ffffff"/>
        <text x="235" y="228.6" font-family="Arial, Helvetica, sans-serif" font-size="9.5" font-weight="bold" fill="#1e9bf0">T</text>
      </g>`,
    },
  ],

  shoes: [
    {
      // 흰 목양말 + 검정 스니커즈 (흰 밑창·로고)
      id: "yf-sneakers", name: "스니커즈+목양말", price: 500,
      svg: `<rect x="133" y="308" width="24" height="30" rx="6" fill="${YF.white}" stroke="#d9d9d9" stroke-width="2"/>
        <rect x="163" y="308" width="24" height="30" rx="6" fill="${YF.white}" stroke="#d9d9d9" stroke-width="2"/>
        <path d="M135 314 h20 M165 314 h20" stroke="#c3cbd4" stroke-width="2"/>
        <rect x="127" y="334" width="34" height="24" rx="11" fill="${YF.black}" stroke="#000" stroke-width="3"/>
        <rect x="159" y="334" width="34" height="24" rx="11" fill="${YF.black}" stroke="#000" stroke-width="3"/>
        <path d="M127 350 Q144 356 161 350 L161 354 Q144 360 127 354 Z" fill="${YF.white}"/>
        <path d="M159 350 Q176 356 193 350 L193 354 Q176 360 159 354 Z" fill="${YF.white}"/>
        <path d="M132 345 Q140 349 152 340 M164 345 Q172 349 184 340" stroke="${YF.white}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: "cos-dm-shoes", name: "듬이 발", price: 250,
      svg: shoeBase(DM.w, DM.o) +
        `<ellipse cx="144" cy="346" rx="8" ry="5" fill="${DM.b}"/>
         <ellipse cx="176" cy="346" rx="8" ry="5" fill="${DM.b}"/>`,
    },
    {
      id: "cos-dg-shoes", name: "도기 발", price: 250,
      svg: shoeBase(DG.br, DG.o),
    },
    {
      id: "cos-ny-shoes", name: "냥이 발", price: 250,
      svg: shoeBase(NY.w, NY.o) +
        `<ellipse cx="144" cy="346" rx="7" ry="4.5" fill="${NY.f}"/>
         <ellipse cx="176" cy="346" rx="7" ry="4.5" fill="${NY.f}"/>`,
    },
    {
      id: "cos-tr-shoes", name: "토리 발", price: 250,
      svg: shoeBase(TR.w, TR.o) +
        `<path d="M136 344 H152 M168 344 H184" stroke="${TR.pe}" stroke-width="4" stroke-linecap="round"/>`,
    },
    {
      id: "cos-br-shoes", name: "버리 발", price: 250,
      svg: shoeBase(BR.o),
    },
  ],
};
