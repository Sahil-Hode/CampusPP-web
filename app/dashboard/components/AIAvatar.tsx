"use client";
import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, PerspectiveCamera, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface AvatarProps {
  isTyping: boolean;
  isResponding: boolean;
}

function AIOrb({ isTyping, isResponding }: AvatarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (meshRef.current) {
      // 1. Idle Rotation (Very subtle)
      meshRef.current.rotation.y = time * 0.1;
      
      // 2. Interaction: Listening / Typing State
      if (isTyping) {
        // Faster pulse and slight scale oscillation
        const pulse = 1 + Math.sin(time * 10) * 0.05;
        meshRef.current.scale.set(pulse, pulse, pulse);
      } else if (isResponding) {
        // Wave-like movement (handled by DistortMaterial speed, but we nudge position)
        meshRef.current.position.x = Math.sin(time * 5) * 0.02;
      }
    }

    // 3. Dynamic Light Pulse
    if (lightRef.current) {
      const baseIntensity = isTyping ? 15 : 8;
      lightRef.current.intensity = baseIntensity + Math.sin(time * 3) * 5;
    }
  });

  return (
    <group>
      {/* Central Core */}
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={1}>
        <MeshDistortMaterial
          color="#1a1a1a"
          roughness={0.2}
          metalness={0.8}
          distort={isResponding ? 0.4 : 0.2} // More "fluid" when responding
          speed={isResponding ? 4 : 1.5}    // Faster waves when responding
          emissive={new THREE.Color("#63D2F3")}
          emissiveIntensity={isTyping ? 0.8 : 0.3}
        />
      </Sphere>

      {/* Floating Halo Ring */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.015, 16, 100]} />
          <meshStandardMaterial 
            color="#63D2F3" 
            emissive="#63D2F3" 
            emissiveIntensity={2} 
            transparent 
            opacity={0.4} 
          />
        </mesh>
      </Float>

      {/* Glow Point Light */}
      <pointLight ref={lightRef} position={[0, 0, 2]} color="#63D2F3" distance={10} />
    </group>
  );
}

export default function AIAvatar({ isTyping, isResponding }: AvatarProps) {
  return (
    <div className="w-full h-full min-h-[250px] cursor-pointer">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        
        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.4}>
          <AIOrb isTyping={isTyping} isResponding={isResponding} />
        </Float>

        {/* Optional: Bloom is usually handled in a post-processing effect, 
            but for performance on low-end laptops, we use high emissive values instead. */}
      </Canvas>
    </div>
  );
}   