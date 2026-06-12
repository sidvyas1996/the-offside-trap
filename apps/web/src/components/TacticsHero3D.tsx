import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/**
 * Interactive isometric tactics board for the landing hero.
 * - Pieces bob idly and lift/glow when hovered directly.
 * - When `active` (cursor inside the hero), the home team presses
 *   into an attacking shape and the away team drops off.
 * - The whole board parallaxes gently toward the cursor.
 */

const HOME_BODY = "#ffffff";
const HOME_DOME = "#18181b";
const HOME_RING = "#0fa45f";
const AWAY_BODY = "#ff9ad5";
const AWAY_ACCENT = "#ffffff";
const AWAY_RING = "#f25daf";
const LINE = "#ffffff";

type XZ = [number, number];

/* Home 4-3-3: resting shape → attacking press */
const HOME_BASE: XZ[] = [
  [-5.2, 0],
  [-3.6, -2.7], [-3.7, -0.95], [-3.7, 0.95], [-3.6, 2.7],
  [-1.4, -1.9], [-1.6, 0], [-1.4, 1.9],
  [0.9, -2.5], [1.2, 0], [0.9, 2.5],
];
const HOME_ATTACK: XZ[] = [
  [-4.9, 0],
  [-2.0, -3.0], [-2.4, -1.05], [-2.4, 1.05], [-2.0, 3.0],
  [0.6, -2.1], [0.2, 0.2], [0.6, 2.1],
  [3.4, -2.7], [3.8, 0.3], [3.4, 2.7],
];

/* Away 4-4-2: resting shape → dropping into a low block */
const AWAY_BASE: XZ[] = [
  [5.3, 0],
  [3.8, -2.6], [3.9, -0.9], [3.9, 0.9], [3.8, 2.6],
  [2.3, -2.9], [2.5, -1.0], [2.5, 1.0], [2.3, 2.9],
  [0.5, -0.85], [0.5, 0.85],
];
const AWAY_DROP: XZ[] = [
  [5.5, 0],
  [4.6, -2.4], [4.7, -0.85], [4.7, 0.85], [4.6, 2.4],
  [3.3, -2.8], [3.5, -0.95], [3.5, 0.95], [3.3, 2.8],
  [1.8, -0.8], [1.8, 0.8],
];

const BALL_BASE: XZ = [1.7, 0.5];
const BALL_ATTACK: XZ = [4.5, 0.7];

interface PieceProps {
  base: XZ;
  attack: XZ;
  body: string;
  dome: string;
  ring: string;
  phase: number;
  active: boolean;
}

const Piece: React.FC<PieceProps> = ({ base, attack, body, dome, ring, phase, active }) => {
  const group = useRef<THREE.Group>(null);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const target = active ? attack : base;
    g.position.x = THREE.MathUtils.damp(g.position.x, target[0], 2.2, delta);
    g.position.z = THREE.MathUtils.damp(g.position.z, target[1], 2.2, delta);
    const bob = Math.sin(state.clock.elapsedTime * 1.7 + phase) * 0.025;
    const lift = hovered ? 0.42 : 0;
    g.position.y = THREE.MathUtils.damp(g.position.y, bob + lift, 9, delta);
    const s = THREE.MathUtils.damp(g.scale.x, hovered ? 1.16 : 1, 9, delta);
    g.scale.setScalar(s);
    if (ringMat.current) {
      ringMat.current.opacity = THREE.MathUtils.damp(ringMat.current.opacity, hovered ? 0.95 : 0, 8, delta);
    }
  });

  return (
    <group
      ref={group}
      position={[base[0], 0, base[1]]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.3, 0.36, 0.18, 32]} />
        <meshStandardMaterial color={body} roughness={0.25} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.27, 0]} scale={[1, 0.92, 1]}>
        <sphereGeometry args={[0.155, 24, 24]} />
        <meshStandardMaterial color={dome} roughness={0.2} metalness={0.4} />
      </mesh>
      {/* hover halo */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.48, 0.028, 12, 40]} />
        <meshStandardMaterial ref={ringMat} color={ring} emissive={ring} emissiveIntensity={2.2} transparent opacity={0} />
      </mesh>
    </group>
  );
};

const Ball: React.FC<{ active: boolean }> = ({ active }) => {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const t = active ? BALL_ATTACK : BALL_BASE;
    g.position.x = THREE.MathUtils.damp(g.position.x, t[0], 2.0, delta);
    g.position.z = THREE.MathUtils.damp(g.position.z, t[1], 2.0, delta);
  });
  return (
    <group ref={group} position={[BALL_BASE[0], 0, BALL_BASE[1]]}>
      <Float speed={4.5} rotationIntensity={0.6} floatIntensity={0.25}>
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.1} emissive="#ffffff" emissiveIntensity={0.15} />
        </mesh>
      </Float>
    </group>
  );
};

/* Thin white marking on the pitch surface */
const Marking: React.FC<{ pos: XZ; size: XZ }> = ({ pos, size }) => (
  <mesh position={[pos[0], 0.012, pos[1]]}>
    <boxGeometry args={[size[0], 0.02, size[1]]} />
    <meshStandardMaterial color={LINE} emissive={LINE} emissiveIntensity={0.12} roughness={0.6} />
  </mesh>
);

const GoalFrame: React.FC<{ x: number }> = ({ x }) => (
  <group position={[x, 0, 0]}>
    <mesh position={[0, 0.45, 0]}>
      <boxGeometry args={[0.05, 0.05, 1.6]} />
      <meshStandardMaterial color="#ffffff" roughness={0.4} />
    </mesh>
    {[-0.8, 0.8].map(z => (
      <mesh key={z} position={[0, 0.225, z]}>
        <boxGeometry args={[0.05, 0.45, 0.05]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
    ))}
  </group>
);

const Pitch: React.FC = () => {
  const stripes = useMemo(() => Array.from({ length: 8 }, (_, i) => -5.25 + i * 1.5), []);
  return (
    <group>
      {/* plinth */}
      <RoundedBox args={[13, 1.1, 9.1]} radius={0.14} smoothness={4} position={[0, -0.59, 0]}>
        <meshStandardMaterial color="#fdfbf5" roughness={0.85} metalness={0.02} />
      </RoundedBox>

      {/* mown stripes */}
      {stripes.map((x, i) => (
        <mesh key={i} position={[x, -0.04, 0]}>
          <boxGeometry args={[1.5, 0.08, 8.2]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#46d683" : "#3bc975"} roughness={0.85} />
        </mesh>
      ))}

      {/* touchlines + goal lines + halfway line */}
      <Marking pos={[0, -4]} size={[12.06, 0.06]} />
      <Marking pos={[0, 4]} size={[12.06, 0.06]} />
      <Marking pos={[-6, 0]} size={[0.06, 8.06]} />
      <Marking pos={[6, 0]} size={[0.06, 8.06]} />
      <Marking pos={[0, 0]} size={[0.06, 8.06]} />

      {/* centre circle + spot */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.15, 0.03, 8, 48]} />
        <meshStandardMaterial color={LINE} emissive={LINE} emissiveIntensity={0.12} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.022, 16]} />
        <meshStandardMaterial color={LINE} roughness={0.6} />
      </mesh>

      {/* penalty + six-yard boxes, both ends */}
      {[-1, 1].map(side => (
        <group key={side} scale={[side, 1, 1]}>
          <Marking pos={[6 - 1.8, 0]} size={[0.06, 4.46]} />
          <Marking pos={[6 - 0.9, -2.2]} size={[1.8, 0.06]} />
          <Marking pos={[6 - 0.9, 2.2]} size={[1.8, 0.06]} />
          <Marking pos={[6 - 0.8, 0]} size={[0.06, 2.26]} />
          <Marking pos={[6 - 0.4, -1.1]} size={[0.8, 0.06]} />
          <Marking pos={[6 - 0.4, 1.1]} size={[0.8, 0.06]} />
          <mesh position={[6 - 1.2, 0.012, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.022, 16]} />
            <meshStandardMaterial color={LINE} roughness={0.6} />
          </mesh>
        </group>
      ))}

      <GoalFrame x={-6.2} />
      <GoalFrame x={6.2} />
    </group>
  );
};

/* Eases the whole board toward the cursor for a parallax feel */
const Rig: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<THREE.Group>(null);
  const reduced = useMemo(
    () => typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false),
    [],
  );
  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    const ty = reduced ? 0 : state.pointer.x * 0.14;
    const tx = reduced ? 0 : -state.pointer.y * 0.05;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ty, 2.2, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, tx, 2.2, delta);
  });
  return <group ref={ref}>{children}</group>;
};

const TacticsHero3D: React.FC<{ active: boolean }> = ({ active }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [8.2, 7.6, 9.6], fov: 35 }}
      onCreated={({ camera }) => camera.lookAt(0, 1.1, 0)}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <fog attach="fog" args={["#ffffff", 20, 38]} />
      <ambientLight intensity={1.0} />
      <directionalLight position={[6, 12, 4]} intensity={1.1} />
      <pointLight position={[-10, 6, -8]} intensity={70} color="#ff9ad5" />
      <pointLight position={[10, 5, 8]} intensity={50} color="#9a94ff" />

      <Rig>
        <group position={[0, -1.7, 0]}>
          <Pitch />
          {HOME_BASE.map((base, i) => (
            <Piece
              key={`h${i}`}
              base={base}
              attack={HOME_ATTACK[i]}
              body={HOME_BODY}
              dome={HOME_DOME}
              ring={HOME_RING}
              phase={i * 0.7}
              active={active}
            />
          ))}
          {AWAY_BASE.map((base, i) => (
            <Piece
              key={`a${i}`}
              base={base}
              attack={AWAY_DROP[i]}
              body={AWAY_BODY}
              dome={AWAY_ACCENT}
              ring={AWAY_RING}
              phase={i * 0.9 + 0.4}
              active={active}
            />
          ))}
          <Ball active={active} />
          <ContactShadows position={[0, 0.02, 0]} scale={[15, 11]} blur={2.4} far={3} opacity={0.3} color="#564f7a" />
        </group>
      </Rig>
    </Canvas>
  );
};

export default TacticsHero3D;
