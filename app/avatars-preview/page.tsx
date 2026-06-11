import {
  AvatarFullV2,
  AvatarBustV2,
  DEFAULT_AVATAR_V2,
  type AvatarV2Data,
} from "@/lib/avatar/render";

// 임시: 아바타 디자인 확인용 페이지. (/avatars-preview)
// v2(레이어드 전신) 렌더 검증용.

const SAMPLES: { label: string; data: AvatarV2Data }[] = [
  { label: "기본", data: DEFAULT_AVATAR_V2 },
  {
    label: "꾸민 예시 1",
    data: {
      v: 2,
      face: { eyes: "eyes-big", nose: "nose-round", mouth: "mouth-grin" },
      equipped: {
        hair: "hair-twin",
        top: "top-hoodie",
        bottom: "bottom-skirt",
        decoL: "pet-rabbit-l",
      },
    },
  },
  {
    label: "꾸민 예시 2",
    data: {
      v: 2,
      face: { eyes: "eyes-line", nose: "nose-dot", mouth: "mouth-smile" },
      equipped: {
        hat: "hat-crown",
        hair: "hair-pompadour",
        top: "top-suit",
        bottom: "bottom-jeans",
        shoes: "shoes-sneak",
        decoR: "pet-dino-r",
      },
    },
  },
  {
    label: '듬이 풀세트',
    data: {
      v: 2,
      face: { eyes: 'eyes-line', nose: 'nose-none', mouth: 'mouth-smile' },
      equipped: { hat: 'cos-dm-ears', faceAcc: 'cos-dm-face', top: 'cos-dm-top', bottom: 'cos-dm-bottom', shoes: 'cos-dm-shoes' },
    },
  },
  {
    label: '버리 풀세트',
    data: {
      v: 2,
      face: { eyes: 'eyes-basic', nose: 'nose-none', mouth: 'mouth-smile' },
      equipped: { hat: 'cos-br-antenna', faceAcc: 'cos-br-glasses', top: 'cos-br-top', bottom: 'cos-br-bottom', shoes: 'cos-br-shoes' },
    },
  },
  {
    label: '토리 풀세트',
    data: {
      v: 2,
      face: { eyes: 'eyes-basic', nose: 'nose-none', mouth: 'mouth-smile' },
      equipped: { hat: 'cos-tr-ears', faceAcc: 'cos-tr-face', top: 'cos-tr-top', bottom: 'cos-dg-bottom', shoes: 'cos-tr-shoes' },
    },
  },
];

export default function AvatarsPreviewPage() {
  return (
    <main className="container page">
      <h1>🎨 아바타 v2 미리보기</h1>

      <h2 style={{ fontSize: 18 }}>전신 (상점·광장용)</h2>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {SAMPLES.map((s, i) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <AvatarFullV2 data={s.data} width={200} uid={`pv${i}`} />
            </div>
            <div style={{ marginTop: 6, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>흉상 (헤더·작성자 동그라미)</h2>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {SAMPLES.map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <AvatarBustV2 data={s.data} size={64} />
            <div className="muted" style={{ fontSize: 12 }}>{s.label}</div>
          </div>
        ))}
        {SAMPLES.map((s) => (
          <AvatarBustV2 key={s.label + "-sm"} data={s.data} size={30} />
        ))}
      </div>
    </main>
  );
}
