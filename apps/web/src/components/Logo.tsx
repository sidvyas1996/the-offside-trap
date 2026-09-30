import React from "react";

interface LogoProps {
  /** Rendered size in px; the mark is square. */
  size?: number;
  /** Neo-brutalist treatment: kit-black border + hard offset shadow. */
  bordered?: boolean;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * The Offside Trap brand mark: the linesman's flag going up.
 *
 * The artwork is a transparent black cut-out, so the green tile is drawn here
 * rather than baked into the file — the mark stays legible on the dark chrome,
 * and the brand colour follows the palette instead of a re-export.
 *
 * Single source of truth for the logo; use this rather than referencing the
 * image directly so sizing and the bordered treatment stay consistent.
 */
const Logo: React.FC<LogoProps> = ({ size = 40, bordered = false, style, alt = "The Offside Trap" }) => (
  <span
    role="img"
    aria-label={alt}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      width: size,
      height: size,
      borderRadius: "22%",
      background: "var(--primary)",
      border: bordered ? "var(--border-w) solid var(--ink)" : undefined,
      boxShadow: bordered ? "var(--card-shadow)" : undefined,
      ...style,
    }}
  >
    <img
      src="/logo-flag.png"
      alt=""
      draggable={false}
      style={{ display: "block", width: "76%", height: "76%", objectFit: "contain" }}
    />
  </span>
);

export default Logo;
