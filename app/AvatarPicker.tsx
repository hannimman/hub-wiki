"use client";

import { useState } from "react";
import {
  PRESETS,
  Avatar,
  HAIR_STYLES,
  ACCESSORIES,
  HAIR_COLORS,
  SHIRT_COLORS,
  SKIN_TONES,
  BG_COLORS,
  DEFAULT_CONFIG,
  presetConfigById,
  type AvatarConfig,
} from "@/lib/avatars";

export type AvatarValue = { id: string; config: AvatarConfig | null };

function Swatch({
  color,
  active,
  onClick,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: color,
        cursor: "pointer",
        border: active ? "3px solid #3b82f6" : "2px solid #ddd",
      }}
    />
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 16,
        cursor: "pointer",
        fontSize: 13,
        background: active ? "#3b82f6" : "#fff",
        color: active ? "#fff" : "#333",
        border: active ? "1px solid #3b82f6" : "1px solid #ccc",
      }}
    >
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ margin: "12px 0" }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
    </div>
  );
}

export default function AvatarPicker({
  value,
  onChange,
}: {
  value: AvatarValue;
  onChange: (v: AvatarValue) => void;
}) {
  const [open, setOpen] = useState(value.id === "custom");

  const config: AvatarConfig =
    value.config ?? presetConfigById(value.id) ?? DEFAULT_CONFIG;

  function pickPreset(id: string) {
    onChange({ id, config: null });
  }
  function updateCustom(patch: Partial<AvatarConfig>) {
    const base = value.config ?? presetConfigById(value.id) ?? DEFAULT_CONFIG;
    onChange({ id: "custom", config: { ...base, ...patch } });
  }

  return (
    <div>
      {/* 기본 프리셋 8 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
        }}
      >
        {PRESETS.map((p) => (
          <button
            type="button"
            key={p.id}
            onClick={() => pickPreset(p.id)}
            aria-pressed={value.id === p.id}
            title={p.label}
            style={{
              padding: 6,
              borderRadius: 12,
              cursor: "pointer",
              background: "#fff",
              border:
                value.id === p.id ? "3px solid #3b82f6" : "3px solid transparent",
              outline: value.id === p.id ? "none" : "1px solid #e2e2e2",
            }}
          >
            <Avatar id={p.id} size={56} />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          marginTop: 12,
          padding: "8px 14px",
          borderRadius: 8,
          border: "1px solid #ccc",
          background: open ? "#eef4ff" : "#fff",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        {open ? "접기 ▲" : "더보기 — 직접 꾸미기 ▾"}
      </button>

      {open && (
        <div
          style={{
            marginTop: 14,
            padding: 16,
            border: "1px solid #e2e2e2",
            borderRadius: 12,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <Avatar config={config} size={96} />
            {value.id === "custom" && (
              <div style={{ color: "#3b82f6", fontSize: 12 }}>나만의 아바타</div>
            )}
          </div>

          <Row label="헤어스타일">
            {HAIR_STYLES.map((s) => (
              <Chip
                key={s.id}
                active={config.style === s.id}
                onClick={() => updateCustom({ style: s.id })}
              >
                {s.label}
              </Chip>
            ))}
          </Row>
          <Row label="머리색">
            {HAIR_COLORS.map((c) => (
              <Swatch
                key={c}
                color={c}
                active={config.hair === c}
                onClick={() => updateCustom({ hair: c })}
              />
            ))}
          </Row>
          <Row label="옷색">
            {SHIRT_COLORS.map((c) => (
              <Swatch
                key={c}
                color={c}
                active={config.shirt === c}
                onClick={() => updateCustom({ shirt: c })}
              />
            ))}
          </Row>
          <Row label="피부톤">
            {SKIN_TONES.map((c) => (
              <Swatch
                key={c}
                color={c}
                active={config.skin === c}
                onClick={() => updateCustom({ skin: c })}
              />
            ))}
          </Row>
          <Row label="악세서리">
            {ACCESSORIES.map((a) => (
              <Chip
                key={a.id}
                active={config.accessory === a.id}
                onClick={() => updateCustom({ accessory: a.id })}
              >
                {a.label}
              </Chip>
            ))}
          </Row>
          <Row label="배경">
            {BG_COLORS.map((c) => (
              <Swatch
                key={c}
                color={c}
                active={config.bg === c}
                onClick={() => updateCustom({ bg: c })}
              />
            ))}
          </Row>
        </div>
      )}
    </div>
  );
}
