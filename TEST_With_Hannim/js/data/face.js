// 얼굴 커스터마이징 옵션 (무료) — 눈 / 코 / 입
// 좌표계: 전체 캐릭터 viewBox 0 0 320 400 기준
//   눈: (140,110), (180,110) / 코: (160,126) / 입: (160,146)

const FACE_SECTIONS = [
  { id: "eyes", name: "눈", zoom: "112 88 96 44" },
  { id: "nose", name: "코", zoom: "136 106 48 36" },
  { id: "mouth", name: "입", zoom: "128 126 64 40" },
];

const FACE_OPTIONS = {
  eyes: [
    {
      id: "eyes-basic", name: "기본 눈",
      svg: `<circle cx="140" cy="110" r="10" fill="#fff"/><circle cx="180" cy="110" r="10" fill="#fff"/>
        <g class="pupil"><circle cx="140" cy="110" r="4.6" fill="#33323e"/><circle cx="142" cy="108" r="1.6" fill="#fff"/></g>
        <g class="pupil"><circle cx="180" cy="110" r="4.6" fill="#33323e"/><circle cx="182" cy="108" r="1.6" fill="#fff"/></g>`,
    },
    {
      id: "eyes-big", name: "왕눈이",
      svg: `<circle cx="140" cy="110" r="13.5" fill="#fff"/><circle cx="180" cy="110" r="13.5" fill="#fff"/>
        <g class="pupil"><circle cx="140" cy="110" r="6.6" fill="#4a3528"/><circle cx="143" cy="107" r="2.4" fill="#fff"/><circle cx="137" cy="113" r="1.3" fill="#fff"/></g>
        <g class="pupil"><circle cx="180" cy="110" r="6.6" fill="#4a3528"/><circle cx="183" cy="107" r="2.4" fill="#fff"/><circle cx="177" cy="113" r="1.3" fill="#fff"/></g>`,
    },
    {
      id: "eyes-sleepy", name: "졸린 눈",
      svg: `<path d="M129 108 Q140 115 151 108" stroke="#33323e" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M169 108 Q180 115 191 108" stroke="#33323e" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M133 118 Q140 121 147 118" stroke="#e8b88a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M173 118 Q180 121 187 118" stroke="#e8b88a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: "eyes-star", name: "별눈",
      svg: `<polygon points="140,99 142.6,106.4 150.5,106.6 144.2,111.4 146.5,118.9 140,114.4 133.5,118.9 135.8,111.4 129.5,106.6 137.4,106.4" fill="#ffcf4d" stroke="#e0a92e" stroke-width="1.5"/>
        <polygon points="180,99 182.6,106.4 190.5,106.6 184.2,111.4 186.5,118.9 180,114.4 173.5,118.9 175.8,111.4 169.5,106.6 177.4,106.4" fill="#ffcf4d" stroke="#e0a92e" stroke-width="1.5"/>`,
    },
    {
      id: "eyes-heart", name: "하트눈",
      svg: `<path d="M140 119 C129 109 131 98 137 99 C139 99.6 140 102 140 103 C140 102 141 99.6 143 99 C149 98 151 109 140 119 Z" fill="#ff5e8a"/>
        <path d="M180 119 C169 109 171 98 177 99 C179 99.6 180 102 180 103 C180 102 181 99.6 183 99 C189 98 191 109 180 119 Z" fill="#ff5e8a"/>`,
    },
    {
      id: "eyes-line", name: "방긋 실눈",
      svg: `<path d="M130 112 Q140 102 150 112" stroke="#33323e" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M170 112 Q180 102 190 112" stroke="#33323e" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: "eyes-wink", name: "윙크",
      svg: `<path d="M130 112 Q140 103 150 112" stroke="#33323e" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <circle cx="180" cy="110" r="10" fill="#fff"/>
        <g class="pupil"><circle cx="180" cy="110" r="4.6" fill="#33323e"/><circle cx="182" cy="108" r="1.6" fill="#fff"/></g>`,
    },
    {
      id: "eyes-anime", name: "또렷한 눈",
      svg: `<ellipse cx="140" cy="110" rx="9" ry="12.5" fill="#fff"/><ellipse cx="180" cy="110" rx="9" ry="12.5" fill="#fff"/>
        <g class="pupil"><ellipse cx="140" cy="111" rx="5.4" ry="8.2" fill="#5b3b22"/><circle cx="137.5" cy="105" r="2.5" fill="#fff"/><circle cx="142.5" cy="115" r="1.3" fill="#fff"/></g>
        <g class="pupil"><ellipse cx="180" cy="111" rx="5.4" ry="8.2" fill="#5b3b22"/><circle cx="177.5" cy="105" r="2.5" fill="#fff"/><circle cx="182.5" cy="115" r="1.3" fill="#fff"/></g>`,
    },
  ],

  nose: [
    { id: "nose-dot", name: "점코", svg: `<circle cx="160" cy="127" r="2.8" fill="#e8a87c"/>` },
    { id: "nose-round", name: "동글코", svg: `<circle cx="160" cy="127" r="5.5" fill="#f4b98a"/><circle cx="162" cy="125" r="1.6" fill="#ffd9b3"/>` },
    { id: "nose-tri", name: "세모코", svg: `<polygon points="160,119 154,131 166,131" fill="#f0a878" stroke="#e8966a" stroke-width="1" stroke-linejoin="round"/>` },
    { id: "nose-long", name: "길쭉코", svg: `<ellipse cx="160" cy="127" rx="3.6" ry="8" fill="#f4b98a"/>` },
    { id: "nose-pig", name: "돼지코", svg: `<ellipse cx="160" cy="127" rx="9" ry="6.5" fill="#f7a8b0"/><circle cx="156.5" cy="127" r="1.8" fill="#c96b78"/><circle cx="163.5" cy="127" r="1.8" fill="#c96b78"/>` },
    { id: "nose-hook", name: "ㄱ자코", svg: `<path d="M160 118 L160 130 L155 132" stroke="#e8a87c" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` },
    { id: "nose-bean", name: "콩알코", svg: `<ellipse cx="160" cy="128" rx="2.2" ry="1.6" fill="#d99368"/>` },
    { id: "nose-none", name: "코 없음", svg: `` },
  ],

  mouth: [
    { id: "mouth-smile", name: "미소", svg: `<path d="M148 144 Q160 154 172 144" stroke="#a3553a" stroke-width="3.5" fill="none" stroke-linecap="round"/>` },
    {
      id: "mouth-grin", name: "활짝 웃음",
      svg: `<path d="M144 142 Q160 163 176 142 Z" fill="#7c3b2d"/><path d="M150 150 Q160 160 170 150 Q160 154 150 150 Z" fill="#ff7d6e"/>`,
    },
    { id: "mouth-flat", name: "무표정", svg: `<path d="M149 146 H171" stroke="#a3553a" stroke-width="3.5" stroke-linecap="round"/>` },
    { id: "mouth-o", name: "놀람", svg: `<ellipse cx="160" cy="148" rx="6" ry="8" fill="#7c3b2d"/>` },
    {
      id: "mouth-cat", name: "고양이 입",
      svg: `<path d="M146 144 Q153 152 160 144 Q167 152 174 144" stroke="#a3553a" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: "mouth-tongue", name: "메롱",
      svg: `<path d="M148 144 H172" stroke="#a3553a" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M158 146 Q167 145 167 154 Q167 162 159 160 Q153 158 155 149 Z" fill="#ff7d6e"/>`,
    },
    { id: "mouth-sad", name: "시무룩", svg: `<path d="M148 151 Q160 142 172 151" stroke="#a3553a" stroke-width="3.5" fill="none" stroke-linecap="round"/>` },
    {
      id: "mouth-whistle", name: "휘파람",
      svg: `<ellipse cx="161" cy="147" rx="4.5" ry="6.5" fill="#7c3b2d"/>
        <circle cx="184" cy="138" r="3" fill="#5a8ad9"/><path d="M187 138 V125 q6 2 6 6" stroke="#5a8ad9" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    },
  ],
};
