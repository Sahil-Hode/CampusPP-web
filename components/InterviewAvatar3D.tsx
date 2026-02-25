"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Loader, useAnimations, useFBX, useGLTF } from "@react-three/drei";
import type { Group } from "three";

interface InterviewAvatar3DProps {
    isSpeaking: boolean;
    modelPath?: string;
    accentColor: string;
    name: string;
    role: string;
    height?: string | number;
}

interface AvatarActorProps {
    isSpeaking: boolean;
    modelPath: string;
    accentColor: string;
}

function AvatarActor({ isSpeaking, modelPath, accentColor }: AvatarActorProps) {
    const group = useRef<Group>(null);
    const { scene } = useGLTF(modelPath);

    const idleFBX = useFBX("/animations/Standing Idle.fbx");
    const talking0FBX = useFBX("/animations/Talking_0.fbx");
    const talking1FBX = useFBX("/animations/Talking_1.fbx");
    const talking2FBX = useFBX("/animations/Talking_2.fbx");

    const clips = useMemo(() => {
        const toClip = (fbx: any, name: string) => {
            const clip = fbx.animations[0];
            clip.name = name;
            clip.tracks = clip.tracks.map((track: any) => {
                track.name = track.name.replace("mixamorig", "");
                return track;
            });
            return clip;
        };

        return [
            toClip(idleFBX, "Idle"),
            toClip(talking0FBX, "Talking_0"),
            toClip(talking1FBX, "Talking_1"),
            toClip(talking2FBX, "Talking_2"),
        ];
    }, [idleFBX, talking0FBX, talking1FBX, talking2FBX]);

    const { actions } = useAnimations(clips, group);

    useEffect(() => {
        const activeName = isSpeaking
            ? (["Talking_0", "Talking_1", "Talking_2"][Math.floor(Math.random() * 3)])
            : "Idle";

        const activeAction = actions[activeName];
        if (!activeAction) return;

        activeAction.reset().fadeIn(0.35).play();
        return () => {
            activeAction.fadeOut(0.35);
        };
    }, [isSpeaking, actions]);

    return (
        <group ref={group} position={[0, -1.05, 0]} scale={1}>
            <primitive object={scene} />
            <ContactShadows opacity={0.55} blur={2.5} scale={8} far={4} />
            <Environment preset="sunset" />
            <ambientLight intensity={0.7} />
            <directionalLight position={[2.5, 4, 2]} intensity={1.1} />
            <pointLight position={[-1.5, 1.6, 2]} intensity={0.7} color={accentColor} />
        </group>
    );
}

export default function InterviewAvatar3D({
    isSpeaking,
    modelPath,
    accentColor,
    height = "100%"
}: InterviewAvatar3DProps) {
    const resolvedModelPath = modelPath || "/models/64f1a714fe61576b46f27ca2.glb";

    return (
        <div style={{ width: "100%", height, position: "relative" }}>
            <Canvas
                shadows
                camera={{ position: [0, 1.35, 2.3], fov: 32 }}
                gl={{ antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: false }}
                dpr={[1, 1.5]}
            >
                <AvatarActor isSpeaking={isSpeaking} modelPath={resolvedModelPath} accentColor={accentColor} />
            </Canvas>
            <Loader />
        </div>
    );
}

useGLTF.preload("/models/64f1a714fe61576b46f27ca2.glb");
