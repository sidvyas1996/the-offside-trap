import React from "react";

/** Natural aspect ratio of the logo artwork (1464 x 1370). */
const ASPECT = 1464 / 1370;
/** Corner radius already baked into the artwork, as a fraction of its width. */
const BAKED_RADIUS = "7%";

interface LogoProps {
  /** Rendered height in px; width follows the artwork's aspect ratio. */
  size?: number;
  /** Neo-brutalist treatment: kit-black border + hard offset shadow. */
  bordered?: boolean;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * The Offside Trap brand mark.
 * Single source of truth for the logo; use this rather than referencing the
 * image directly so sizing and the bordered treatment stay consistent.
 */
const Logo: React.FC<LogoProps> = ({ size = 40, bordered = false, style, alt = "The Offside Trap" }) => (
  <img
    src="/logo-mark.png"
    alt={alt}
    width={Math.round(size * ASPECT)}
    height={size}
    style={{
      display: "block",
      flexShrink: 0,
      height: size,
      width: size * ASPECT,
      // matches the artwork's own corners so the border traces its edge
      borderRadius: BAKED_RADIUS,
      border: bordered ? "var(--border-w) solid var(--ink)" : undefined,
      boxShadow: bordered ? "var(--card-shadow)" : undefined,
      ...style,
    }}
  />
);

export default Logo;
