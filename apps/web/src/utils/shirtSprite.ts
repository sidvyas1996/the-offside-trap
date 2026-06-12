import * as THREE from "three";

/**
 * Procedurally renders a 3D half-sleeve football shirt to a transparent
 * PNG sprite. One offscreen WebGL render per color/texture (cached) —
 * markers then use a plain <img>, so 22 players cost a single GPU
 * context, not 22.
 *
 * Two render modes:
 *  - getShirtSprite(color):         flat-colored shirt (sync, grey default)
 *  - getTexturedShirtSprite(url):   kit texture applied (async) — expects a
 *    kit atlas in the "octa" layout (front panel + sleeve patch islands),
 *    e.g. /kits/octa-red-stripes.png
 */

export const SHIRT_GREY = "#9aa3ad";
const COLLAR_FACTOR = 0.72; // collar/trim darkening relative to body color

/* Shape-space extents used for UV projection (see buildShirtShape) */
const TORSO_X = 2.65;        // |x| beyond this is sleeve
const SLEEVE_X_MAX = 4.8;
const SHIRT_Y_MIN = -4.75;
const SHIRT_Y_MAX = 4.6;
const SLEEVE_Y_MIN = 1.2;
const SLEEVE_Y_MAX = 4.5;

/* UV islands of the "octa" kit atlas (1000×1000, v flipped for three.js) */
const KIT_ATLAS = {
  front: { u: [0.04, 0.218] as const, v: [0.138, 0.545] as const },
  sleeve: { u: [0.21, 0.46] as const, v: [0.755, 0.942] as const },
};

const colorCache = new Map<string, string>();
const textureCache = new Map<string, Promise<string>>();

function buildShirtShape(): THREE.Shape {
  const s = new THREE.Shape();
  // Front silhouette of a crew-neck half-sleeve tee (y up).
  s.moveTo(-2.4, -4.4);                          // hem left
  s.lineTo(-2.6, 1.9);                           // left side → armpit
  s.lineTo(-4.2, 1.3);                           // underarm → sleeve cuff bottom
  s.lineTo(-4.75, 3.0);                          // sleeve cuff up
  s.quadraticCurveTo(-3.5, 4.3, -2.4, 4.45);     // shoulder
  s.quadraticCurveTo(0, 3.2, 2.4, 4.45);         // crew-neck dip
  s.quadraticCurveTo(3.5, 4.3, 4.75, 3.0);       // shoulder
  s.lineTo(4.2, 1.3);                            // sleeve cuff down
  s.lineTo(2.6, 1.9);                            // underarm → armpit
  s.lineTo(2.4, -4.4);                           // right side → hem
  s.quadraticCurveTo(0, -4.75, -2.4, -4.4);      // hem curve
  return s;
}

function buildCollarCurve(depth: number): THREE.CatmullRomCurve3 {
  // Follows the neckline dip, sitting on the front face of the extrusion.
  const z = depth + 0.18;
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.35, 4.4, z * 0.55),
    new THREE.Vector3(-1.2, 3.75, z),
    new THREE.Vector3(0, 3.55, z),
    new THREE.Vector3(1.2, 3.75, z),
    new THREE.Vector3(2.35, 4.4, z * 0.55),
  ]);
}

const EXTRUDE_DEPTH = 1.1;

function buildShirtGeometry(): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(buildShirtShape(), {
    depth: EXTRUDE_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.35,
    bevelSize: 0.3,
    bevelSegments: 4,
    curveSegments: 24,
  });
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

/**
 * Planar-projects the shirt onto the kit atlas: torso vertices sample the
 * front-panel island, sleeve vertices sample the sleeve patch. Bevel and
 * side faces inherit nearby texels, which reads fine at marker size.
 * Must run BEFORE geometry.center().
 */
function remapUVsToKitAtlas(geometry: THREE.BufferGeometry): void {
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    let u: number, v: number;
    if (Math.abs(x) <= TORSO_X) {
      u = lerp(KIT_ATLAS.front.u[0], KIT_ATLAS.front.u[1], (x + TORSO_X) / (2 * TORSO_X));
      v = lerp(KIT_ATLAS.front.v[0], KIT_ATLAS.front.v[1], (y - SHIRT_Y_MIN) / (SHIRT_Y_MAX - SHIRT_Y_MIN));
    } else {
      const t = (Math.abs(x) - TORSO_X) / (SLEEVE_X_MAX - TORSO_X);
      u = lerp(KIT_ATLAS.sleeve.u[0], KIT_ATLAS.sleeve.u[1], t);
      v = lerp(KIT_ATLAS.sleeve.v[0], KIT_ATLAS.sleeve.v[1], (y - SLEEVE_Y_MIN) / (SLEEVE_Y_MAX - SLEEVE_Y_MIN));
    }
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
}

/** Shared scene assembly + offscreen render. Disposes everything it creates. */
function renderShirt(
  geometry: THREE.BufferGeometry,
  bodyMat: THREE.MeshStandardMaterial,
  collarColor: THREE.ColorRepresentation,
  size: number,
): string {
  geometry.center();

  const scene = new THREE.Scene();
  const group = new THREE.Group();
  scene.add(group);

  group.add(new THREE.Mesh(geometry, bodyMat));

  const collarGeo = new THREE.TubeGeometry(buildCollarCurve(EXTRUDE_DEPTH / 2), 32, 0.22, 10, false);
  const collarMat = new THREE.MeshStandardMaterial({ color: collarColor, roughness: 0.6, metalness: 0.05 });
  group.add(new THREE.Mesh(collarGeo, collarMat));

  // Slight tilt so the extrusion depth reads as volume
  group.rotation.x = -0.12;

  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(4, 6, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9bb4ff, 0.5);
  rim.position.set(-6, 2, -4);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.7, 16.5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(size, size);
  renderer.setClearColor(0x000000, 0);

  renderer.render(scene, camera);
  const dataUrl = renderer.domElement.toDataURL("image/png");

  // Free the GPU context — sprites live on as plain images.
  geometry.dispose();
  collarGeo.dispose();
  bodyMat.dispose();
  collarMat.dispose();
  renderer.dispose();
  renderer.forceContextLoss();

  return dataUrl;
}

export function getShirtSprite(color: string = SHIRT_GREY, size: number = 256): string {
  const key = `${color}@${size}`;
  const hit = colorCache.get(key);
  if (hit) return hit;

  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.08 });
  const collarColor = new THREE.Color(color).multiplyScalar(COLLAR_FACTOR);
  const dataUrl = renderShirt(buildShirtGeometry(), bodyMat, collarColor, size);

  colorCache.set(key, dataUrl);
  return dataUrl;
}

export function getTexturedShirtSprite(textureUrl: string, size: number = 256): Promise<string> {
  const key = `${textureUrl}@${size}`;
  const hit = textureCache.get(key);
  if (hit) return hit;

  const promise = new THREE.TextureLoader().loadAsync(textureUrl).then((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const geometry = buildShirtGeometry();
    remapUVsToKitAtlas(geometry);
    const bodyMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6, metalness: 0.04 });
    const dataUrl = renderShirt(geometry, bodyMat, "#dfe3ea", size);
    texture.dispose();
    return dataUrl;
  });

  textureCache.set(key, promise);
  promise.catch(() => textureCache.delete(key)); // allow retry after a failed load
  return promise;
}
