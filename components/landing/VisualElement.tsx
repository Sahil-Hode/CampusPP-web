"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function ParticleCloud() {
  const ref = useRef<THREE.Points>(null!);
  
  // Create points manually to ensure they exist without external helper issues
  const [sphere] = useState(() => {
    const arr = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      const i3 = i * 3;
      // High-performance sphere distribution
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 1.5; // Radius of the cloud
      arr[i3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i3 + 2] = r * Math.cos(phi);
    }
    return arr;
  });

  useFrame((state, delta) => {
    // Gentle rotation
    ref.current.rotation.x -= delta / 15;
    ref.current.rotation.y -= delta / 20;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#63D2F3"
          size={0.006}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.4} // Low opacity for a subtle "brain/neural" look
        />
      </Points>
    </group>
  );
}

export default function VisualElement() {
  return (
    // CRITICAL: The wrapper must be absolute and cover the background
    <div className="absolute inset-0 -z-10 w-full h-full min-h-[600px]">
      <Canvas 
        camera={{ position: [0, 0, 1.2] }}
        gl={{ antialias: true, alpha: true }} // Alpha true allows the background color to show through
      >
        <ambientLight intensity={0.5} />
        <ParticleCloud />
      </Canvas>
    </div>
  );
}