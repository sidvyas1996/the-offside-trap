import { describe, expect, it } from "vitest";
import { bendFromDrag, bendSideOf, curveControl, longBallSide } from "../arrow-geometry";

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

describe("bendFromDrag", () => {
  const start = { x: 20, y: 50 }, end = { x: 60, y: 50 };

  it("bends to the side the drag swung, matching curveControl's sign", () => {
    for (const swingY of [40, 60]) {
      const side = bendFromDrag(start, end, [{ x: 40, y: swingY }, end]);
      const { cy } = curveControl(start.x, start.y, end.x, end.y, side);
      // The bow lands on the same side of the chord the pointer went.
      expect(Math.sign(cy - 50)).toBe(Math.sign(swingY - 50));
    }
  });

  it("follows the furthest swing, not the last wobble", () => {
    expect(bendFromDrag(start, end, [{ x: 35, y: 40 }, { x: 55, y: 51 }])).toBe(
      bendFromDrag(start, end, [{ x: 35, y: 40 }]),
    );
  });

  it("leaves a straight drag to the default", () => {
    expect(bendFromDrag(start, end, [{ x: 40, y: 50.5 }])).toBeUndefined();
    expect(bendFromDrag(start, start, [{ x: 30, y: 30 }])).toBeUndefined();
  });
});

describe("bendSideOf", () => {
  it("uses the drawn side when there is one", () => {
    expect(bendSideOf({ type: "curved-run", points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], bend: -1 })).toBe(-1);
  });

  it("keeps the old defaults for arrows saved without one", () => {
    const from = { x: 20, y: 83 }, to = { x: 45, y: 35 };
    expect(bendSideOf({ type: "long-ball", points: [from, to] })).toBe(longBallSide(from, to));
    expect(bendSideOf({ type: "curved-run", points: [from, to] })).toBe(1);
  });
});
