"use client";
import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Experience } from "./Experience";
import { UI } from "./UI";
import { ChatProvider } from "../hooks/useChat";

export default function MainExperience() {
    return (
        <ChatProvider>
            <Loader />
            <Leva hidden />
            <UI />
            <Canvas
                shadows
                camera={{ position: [0, 0, 1], fov: 30 }}
                gl={{
                    antialias: false,
                    powerPreference: "high-performance",
                    preserveDrawingBuffer: true
                }}
                dpr={[1, 2]} // Limit pixel ratio for performance
            >
                <Experience />
            </Canvas>
        </ChatProvider>
    );
}
