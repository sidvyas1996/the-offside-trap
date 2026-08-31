/**
 * Viewport queries, in one place.
 *
 * The mobile studio is chosen by *width*, never by user-agent. That is
 * deliberate: the MP4/PNG exporter renders this same app in headless Chromium at
 * a fixed 1920x1080 viewport (apps/backend/src/services/video.export.service.ts),
 * so a width test keeps the export path on the landscape board by construction,
 * whereas a user-agent test would be a coin flip on whatever Playwright reports.
 *
 * The export preview routes pin their orientation explicitly anyway — belt and
 * braces — but the rule holds everywhere: width only.
 */
import { useEffect, useState } from "react";

/**
 * Below this the studio switches to the portrait board and sheet-based chrome.
 * 768 is the tablet boundary already used by `.tactics-grid` in index.css, so
 * the two do not disagree about what "mobile" means.
 */
export const MOBILE_BREAKPOINT = 768;

export const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/**
 * Subscribe to a media query.
 *
 * Initialises from `matchMedia` during the first render rather than defaulting
 * to false and correcting in an effect — the pitch reads this to pick a
 * projection, and a landscape-then-portrait flip would show a visibly wrong
 * board for a frame and re-run the ResizeObserver marker scaling for nothing.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => window.matchMedia?.(query).matches ?? false,
  );

  useEffect(() => {
    const mql = window.matchMedia?.(query);
    if (!mql) return;
    // Re-read on subscribe: the query can have changed between the initial
    // render and this effect (a resize during hydration, or `query` itself
    // changing), and the listener alone would never fire for that gap.
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** True on phone-width viewports. The studio's one orientation switch. */
export const useIsMobile = (): boolean => useMediaQuery(MOBILE_QUERY);
