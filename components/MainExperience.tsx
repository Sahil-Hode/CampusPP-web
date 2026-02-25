"use client";
import { useState } from "react";
import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Experience } from "./Experience";
import { UI } from "./UI";
import { ChatContext, ChatProvider, useChat } from "../hooks/useChat";

function ExperienceCanvas() {
    const chatContextValue = useChat();
    const [isContextLost, setIsContextLost] = useState(false);

    if (isContextLost) {
        return (
            <div className="w-full h-full grid place-items-center text-center px-6">
                <div className="rounded-2xl border border-white/15 bg-black/35 text-white/90 px-6 py-5">
                    <p className="font-semibold">3D renderer paused (WebGL context lost).</p>
                    <button
                        className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium"
                        onClick={() => window.location.reload()}
                    >
                        Reload 3D View
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Loader />
            <Leva hidden />
            <UI />
            <Canvas
                shadows={false}
                camera={{ position: [0, 0, 1], fov: 30 }}
                gl={{
                    antialias: false,
                    powerPreference: "default",
                    preserveDrawingBuffer: false
                }}
                dpr={[1, 1]}
                onCreated={({ gl }) => {
                    const canvas = gl.domElement;
                    canvas.addEventListener("webglcontextlost", (event) => {
                        event.preventDefault();
                        setIsContextLost(true);
                        console.warn("WebGL context lost. Showing fallback.");
                    });
                    canvas.addEventListener("webglcontextrestored", () => {
                        setIsContextLost(false);
                    });
                }}
            >
                <ChatContext.Provider value={chatContextValue}>
                    <Experience />
                </ChatContext.Provider>
            </Canvas>
        </>
    );
}

export default function MainExperience() {
    return (
        <ChatProvider>
            <ExperienceCanvas />
        </ChatProvider>
    );
}
