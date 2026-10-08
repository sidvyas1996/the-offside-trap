import { describe, expect, it } from "vitest";
import { curveControl, longBallSide } from "../arrow-geometry";

describe("longBallSide", () => {
  it("bows a long ball out towards the passer's own touchline", () => {
    // From the right flank (y > 50) up to the striker: the bow sits below the chord.
    const right = { x: 20, y: 83 }, target = { x: 45, y: 35 };
    const r = curveControl(right.x, right.y, target.x, target.y, longBallSide(right, target));
    expect(r.cy).toBeGreaterThan((right.y + target.y) / 2);

    // Its mirror from the left flank bows the other way.
    const left = { x: 20, y: 17 }, mirror = { x: 45, y: 65 };
    const l = curveControl(left.x, left.y, mirror.x, mirror.y, longBallSide(left, mirror));
    expect(l.cy).toBeLessThan((left.y + mirror.y) / 2);
  });

  it("mirrors exactly across the pitch's long axis", () => {
    const a = longBallSide({ x: 30, y: 80 }, { x: 70, y: 40 });
    const b = longBallSide({ x: 30, y: 20 }, { x: 70, y: 60 });
    expect(a).toBe(-b);
  });

  it("keeps the default from the middle or straight across", () => {
    expect(longBallSide({ x: 30, y: 50 }, { x: 70, y: 20 })).toBe(1);
    expect(longBallSide({ x: 40, y: 85 }, { x: 40, y: 15 })).toBe(1);
  });
});
