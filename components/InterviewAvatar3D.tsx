"use client";

import { Canvas } from "@react-three/fiber";
import { Experience } from "./Experience";
import { Suspense } from "react";
import { Loader } from "@react-three/drei";

interface InterviewAvatar3DProps {
    isSpeaking: boolean;
    modelPath: string;
    accentColor: string;
    name: string;
    role: string;
    height?: string | number;
}

export default function InterviewAvatar3D({
    isSpeaking,
    modelPath,
    accentColor,
    name,
    role,
    height = "100%"
}: InterviewAvatar3DProps) {
    return (
        <div style={{ width: "100%", height, position: "relative" }}>
            <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
                <Experience />
            </Canvas>
            <Loader />
        </div>
    );
}
