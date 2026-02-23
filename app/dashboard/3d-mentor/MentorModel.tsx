"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useFBX } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";

/* ══════════════════════════════════════════
   CONSTANTS — morph target name candidates
══════════════════════════════════════════ */
const MOUTH_TARGETS = [
  "Morpher_CC_Base_Body.Open", "mouthOpen", "jawOpen", "Mouth_Open", "JawOpen",
  "A", "viseme_aa", "viseme_AA", "mouth_open",
];

/* ── Find first existing morph index from a name priority list ── */
function findMorphIdx(dict: { [key: string]: number } | undefined, names: string[]) {
  if (!dict) return -1;
  for (const n of names) {
    if (n in dict) return dict[n];
  }
  return -1;
}

interface ModelProps {
  isSpeaking: boolean;
}

function Model({ isSpeaking }: ModelProps) {
  const fbx = useFBX("/model.fbx");
  const modelRef = useRef<THREE.Group>(null);
  const morphMeshes = useRef<THREE.Mesh[]>([]);
  const lipPhase = useRef(0);

  // Initialize morph targets
  useEffect(() => {
    if (!fbx) return;
    morphMeshes.current = [];
    fbx.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
          morphMeshes.current.push(mesh);
        }
      }
    });
  }, [fbx]);

  /* Helper — smooth-write morphs */
  const setMorphs = useCallback((targetList: string[], value: number, speed: number) => {
    morphMeshes.current.forEach((mesh) => {
      const idx = findMorphIdx(mesh.morphTargetDictionary, targetList);
      if (idx < 0) return;
      mesh.morphTargetInfluences![idx] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences![idx],
        value,
        speed
      );
    });
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // 1. Breathing: gentle scale/position bob
    if (modelRef.current) {
      modelRef.current.position.y = -1 + Math.sin(t * 0.8) * 0.05;
    }

    // 2. Head/Body sway
    if (modelRef.current) {
      modelRef.current.rotation.y = Math.sin(t * 0.4) * 0.05;
    }

    // 3. Lip Sync
    if (isSpeaking) {
      lipPhase.current += delta * 10;
      const lip = Math.max(0,
        Math.sin(lipPhase.current) * 0.5 +
        Math.sin(lipPhase.current * 1.5) * 0.25 +
        Math.sin(lipPhase.current * 0.7) * 0.15
      ) * 0.8;
      setMorphs(MOUTH_TARGETS, lip, 0.25);
    } else {
      setMorphs(MOUTH_TARGETS, 0, 0.1);
    }
  });

  return <primitive ref={modelRef} object={fbx} scale={0.02} position={[0, -1.8, 0]} />;
}

function FallbackSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div
        style={{
          width: 48,
          height: 48,
          border: "4px solid rgba(255,255,255,0.15)",
          borderTop: "4px solid #38bdf8",
          borderRadius: "50%",
          animation: "spin 0.9s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

interface MentorModelProps {
  isSpeaking?: boolean;
}

export default function MentorModel({ isSpeaking = false }: MentorModelProps) {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setWebGLSupported(!!gl);
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  if (webGLSupported === null) {
    return <FallbackSpinner />;
  }

  if (!webGLSupported) {
    return (
      <div className="flex items-center justify-center h-full text-white font-semibold">
        3D not supported on this device
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 1.45, 1.8], fov: 35 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 2, 2]} intensity={1.5} />

      <Suspense fallback={null}>
        <Model isSpeaking={isSpeaking} />
      </Suspense>

      <OrbitControls
        enableZoom
        enablePan={false}
        minDistance={1.2}
        maxDistance={2.4}
        target={[0, 1.45, 0]}
      />
    </Canvas>
  );
}