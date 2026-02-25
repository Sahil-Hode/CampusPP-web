"use client";
import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Experience } from "./Experience";
import { UI } from "./UI";
import { ChatContext, ChatProvider, useChat } from "../hooks/useChat";

function ExperienceCanvas() {
    const chatContextValue = useChat();

    return (
        <>
            <Loader />
            <Leva hidden />
            <UI />
            <Canvas
                shadows
                camera={{ position: [0, 0, 1], fov: 30 }}
                gl={{
                    antialias: false,
                    powerPreference: "high-performance",
                    preserveDrawingBuffer: false
                }}
                dpr={[1, 1.5]}
                onCreated={({ gl }) => {
                    gl.domElement.addEventListener("webglcontextlost", (event) => {
                        event.preventDefault();
                        console.error("WebGL context lost");
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
