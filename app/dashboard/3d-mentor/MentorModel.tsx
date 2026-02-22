"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense } from "react";

function Model() {
  const { scene } = useGLTF("/model.glb");
  return <primitive object={scene} scale={2} />;
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

export default function MentorModel() {
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
    // Not yet determined (SSR / first paint) — show nothing or a lightweight spinner
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
      camera={{ position: [0, 1.2, 3] }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 2, 2]} intensity={1.5} />

      <Suspense fallback={null}>
        <Model />
      </Suspense>

      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}