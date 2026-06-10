"use client";

import { useMemo, useState } from "react";
import {
  FACE_SECTIONS,
  FACE_OPTIONS,
  type FaceSection,
} from "@/lib/avatar/catalog";
import {
  AvatarFullV2,
  DEFAULT_AVATAR_V2,
  type AvatarV2Data,
} from "@/lib/avatar/render";

export type FaceValue = { eyes: string; nose: string; mouth: string };

// 가입 온보딩: 기본(무료) 얼굴 선택만 — 눈/코/입. 아이템 꾸미기는 가입 후 상점에서.
export default function FaceOnboard({
  value,
  onChange,
}: {
  value: FaceValue;
  onChange: (v: FaceValue) => void;
}) {
  const [section, setSection] = useState<FaceSection["id"]>("eyes");

  const data: AvatarV2Data = useMemo(
    () => ({ ...DEFAULT_AVATAR_V2, face: value }),
    [value]
  );

  const opts = FACE_OPTIONS[section] ?? [];
  const zoom = FACE_SECTIONS.find((s) => s.id === section)?.zoom ?? "0 0 320 400";

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <AvatarFullV2 data={data} width={150} uid="onb" />
      </div>

      <div style={{ flex: 1, minWidth: 230 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {FACE_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`btn btn-sm${section === s.id ? " btn-primary" : ""}`}
              onClick={() => setSection(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 6,
          }}
        >
          {opts.map((o) => {
            const selected = value[section] === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => onChange({ ...value, [section]: o.id })}
                title={o.name}
                style={{
                  border: selected
                    ? "2px solid var(--primary)"
                    : "1px solid var(--border)",
                  borderRadius: 10,
                  background: selected ? "#eff6ff" : "#fff",
                  padding: 4,
                  cursor: "pointer",
                }}
              >
                <svg
                  viewBox={zoom}
                  width="100%"
                  style={{ display: "block", aspectRatio: "1.6" }}
                  dangerouslySetInnerHTML={{
                    __html: `<circle cx="160" cy="120" r="56" fill="#ffe7cd"/>${o.svg}`,
                  }}
                />
                <div style={{ fontSize: 11, marginTop: 2 }}>{o.name}</div>
              </button>
            );
          })}
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          얼굴은 언제든 무료로 바꿀 수 있어요. 옷·모자 같은 아이템은 가입 후{" "}
          <b>마이페이지 → 아바타 상점</b>에서!
        </p>
      </div>
    </div>
  );
}
