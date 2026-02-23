"use client";

/**
 * InterviewAvatar3D
 * ──────────────────────────────────────────────────────────────────
 * Upper-body 3D AI Interviewer avatar powered by @react-three/fiber.
 *
 * GLB MODEL EXPECTATIONS (works with Ready Player Me / Mixamo / VRM):
 *   Morph targets (any subset, gracefully skipped if absent):
 *     • Mouth open  : "mouthOpen" | "jawOpen" | "Mouth_Open" | "A" | "viseme_aa"
 *     • Blink left  : "eyeBlinkLeft"  | "EyeBlinkLeft"  | "Blink_Left"
 *     • Blink right : "eyeBlinkRight" | "EyeBlinkRight" | "Blink_Right"
 *
 *   Bones (any subset, gracefully skipped if absent):
 *     Head, Neck, Spine / Chest / Spine1,
 *     RightHand / hand_R, LeftHand / hand_L
 *
 * SAFE IMPORT PATTERN (avoids Turbopack next/dynamic bug):
 *   const InterviewAvatar3D = lazy(() => import('@/components/InterviewAvatar3D'));
 *   <Suspense fallback={<Spinner />}><InterviewAvatar3D isSpeaking={…} /></Suspense>
 * ──────────────────────────────────────────────────────────────────
 */

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/* ══════════════════════════════════════════
   CONSTANTS — morph target name candidates
══════════════════════════════════════════ */
const MOUTH_TARGETS = [
    "mouthOpen", "jawOpen", "Mouth_Open", "JawOpen",
    "A", "viseme_aa", "viseme_AA", "mouth_open",
];
const BLINK_L_TARGETS = [
    "eyeBlinkLeft", "EyeBlinkLeft", "Blink_Left", "blink_L",
    "eyesClosed", "EyesClosed",
];
const BLINK_R_TARGETS = [
    "eyeBlinkRight", "EyeBlinkRight", "Blink_Right", "blink_R",
    "eyesClosed", "EyesClosed",
];

/* ── Find first existing morph index from a name priority list ── */
function findMorphIdx(dict, names) {
    if (!dict) return -1;
    for (const n of names) {
        if (n in dict) return dict[n];
    }
    return -1;
}

/* ── Find a bone whose name contains any of the given tokens ── */
function findBone(scene, ...tokens) {
    let found = null;
    scene.traverse((node) => {
        if (found) return;
        if (node.isObject3D && node.name) {
            const lower = node.name.toLowerCase();
            if (tokens.some((t) => lower.includes(t.toLowerCase()))) {
                found = node;
            }
        }
    });
    return found;
}

/* ══════════════════════════════════════════
   AVATAR MODEL  (runs inside <Canvas>)
══════════════════════════════════════════ */
function AvatarModel({ isSpeaking, modelPath }) {
    const { scene } = useGLTF(modelPath);

    const rootRef = useRef(null);
    const morphMeshes = useRef([]);

    // Bone refs
    const headBone = useRef(null);
    const neckBone = useRef(null);
    const spineBone = useRef(null);
    const rHandBone = useRef(null);
    const lHandBone = useRef(null);

    // Animation state
    const blinkTimer = useRef(3 + Math.random() * 2); // secs until next blink
    const blinkActive = useRef(false);
    const lipPhase = useRef(0);
    const gesturePhase = useRef(0);

    /* ── One-time setup: find bones & morph meshes ── */
    useEffect(() => {
        if (!scene) return;

        morphMeshes.current = [];

        scene.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                if (node.morphTargetDictionary && node.morphTargetInfluences) {
                    morphMeshes.current.push(node);
                }
            }
        });

        headBone.current = findBone(scene, "head", "Head");
        neckBone.current = findBone(scene, "neck", "Neck");
        spineBone.current = findBone(scene, "spine", "Spine", "chest", "Chest");
        rHandBone.current = findBone(scene, "righthand", "right_hand", "hand_r");
        lHandBone.current = findBone(scene, "lefthand", "left_hand", "hand_l");

        // Snapshot original rotations so we can animate relative to them
        [headBone, neckBone, spineBone, rHandBone, lHandBone].forEach((ref) => {
            if (ref.current) {
                ref.current.userData.origRot = ref.current.rotation.clone();
            }
        });
    }, [scene]);

    /* Helper — smooth-write morphs */
    const setMorphs = useCallback((targetList, value, speed) => {
        morphMeshes.current.forEach((mesh) => {
            const idx = findMorphIdx(mesh.morphTargetDictionary, targetList);
            if (idx < 0) return;
            mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
                mesh.morphTargetInfluences[idx],
                value,
                speed,
            );
        });
    }, []);

    /* ── Per-frame animation ── */
    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;

        /* — Breathing: gentle Y bob on root — */
        if (rootRef.current) {
            rootRef.current.position.y = Math.sin(t * 0.75) * 0.005;
        }

        /* — Subtle spine lean — */
        if (spineBone.current) {
            const orig = spineBone.current.userData.origRot;
            spineBone.current.rotation.z = (orig?.z ?? 0) + Math.sin(t * 0.75) * 0.006;
            spineBone.current.rotation.x = (orig?.x ?? 0) + Math.sin(t * 0.5) * 0.004;
        }

        /* — Head sway — */
        if (headBone.current) {
            const orig = headBone.current.userData.origRot;
            headBone.current.rotation.y = (orig?.y ?? 0) + Math.sin(t * 0.38) * 0.04;
            headBone.current.rotation.z = (orig?.z ?? 0) + Math.sin(t * 0.27) * 0.012;
        }

        /* — Blinking — */
        blinkTimer.current -= delta;
        if (blinkTimer.current <= 0 && !blinkActive.current) {
            blinkActive.current = true;
            blinkTimer.current = 3 + Math.random() * 2;
            setTimeout(() => { blinkActive.current = false; }, 130);
        }
        const blinkVal = blinkActive.current ? 1 : 0;
        setMorphs(BLINK_L_TARGETS, blinkVal, 0.35);
        setMorphs(BLINK_R_TARGETS, blinkVal, 0.35);

        /* — Lip sync & hand gestures when speaking — */
        if (isSpeaking) {
            lipPhase.current += delta * 9;
            gesturePhase.current += delta;

            // Irregular mouth motion for natural speech rhythm
            const lip = Math.max(0,
                Math.sin(lipPhase.current) * 0.45 +
                Math.sin(lipPhase.current * 1.7) * 0.28 +
                Math.sin(lipPhase.current * 0.6) * 0.17,
            ) * 0.72;
            setMorphs(MOUTH_TARGETS, lip, 0.22);

            // Right hand gesture
            if (rHandBone.current) {
                const orig = rHandBone.current.userData.origRot;
                rHandBone.current.rotation.z = (orig?.z ?? 0) +
                    Math.sin(gesturePhase.current * 1.1) * 0.18;
                rHandBone.current.rotation.x = (orig?.x ?? 0) +
                    Math.sin(gesturePhase.current * 0.7) * 0.10;
            }
            // Left hand (opposing phase)
            if (lHandBone.current) {
                const orig = lHandBone.current.userData.origRot;
                lHandBone.current.rotation.z = (orig?.z ?? 0) +
                    Math.sin(gesturePhase.current * 0.9 + Math.PI) * 0.14;
            }

        } else {
            /* — Smoothly return mouth + hands to rest — */
            setMorphs(MOUTH_TARGETS, 0, 0.08);

            if (rHandBone.current) {
                const orig = rHandBone.current.userData.origRot;
                rHandBone.current.rotation.z = THREE.MathUtils.lerp(
                    rHandBone.current.rotation.z, orig?.z ?? 0, 0.06);
                rHandBone.current.rotation.x = THREE.MathUtils.lerp(
                    rHandBone.current.rotation.x, orig?.x ?? 0, 0.06);
            }
            if (lHandBone.current) {
                const orig = lHandBone.current.userData.origRot;
                lHandBone.current.rotation.z = THREE.MathUtils.lerp(
                    lHandBone.current.rotation.z, orig?.z ?? 0, 0.06);
            }
        }
    });

    return (
        <group ref={rootRef}>
            <primitive object={scene} />
        </group>
    );
}

/* ══════════════════════════════════════════
   CAMERA RIG — subtle push when speaking
══════════════════════════════════════════ */
function CameraRig({ isSpeaking }) {
    const { camera } = useThree();
    const targetZ = useRef(2.6);

    useFrame((_, delta) => {
        targetZ.current = isSpeaking ? 2.35 : 2.6;
        camera.position.z = THREE.MathUtils.lerp(
            camera.position.z, targetZ.current, delta * 2.5,
        );
        // keepLookAt upper-chest area
        camera.lookAt(0, 1.25, 0);
    });

    return null;
}

/* ══════════════════════════════════════════
   LOADING SPINNER  (shown while GLB loads)
══════════════════════════════════════════ */
function GLBLoader({ accentColor }) {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
            }}
        >
            <div
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: `3px solid ${accentColor}30`,
                    borderTop: `3px solid ${accentColor}`,
                    animation: "spin 0.85s linear infinite",
                }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: 11, color: accentColor, fontWeight: 700, letterSpacing: "0.08em" }}>
                Loading avatar…
            </span>
        </div>
    );
}

/* ══════════════════════════════════════════
   ERROR FALLBACK
══════════════════════════════════════════ */
function AvatarError({ name, role, accentColor }) {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
            }}
        >
            {/* Minimal SVG head */}
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
                <circle cx="36" cy="36" r="34" fill={`${accentColor}22`} stroke={`${accentColor}60`} strokeWidth="2" />
                <circle cx="36" cy="30" r="14" fill={`${accentColor}40`} />
                <ellipse cx="36" cy="58" rx="18" ry="10" fill={`${accentColor}30`} />
            </svg>
            <p style={{ fontWeight: 800, color: "white", fontSize: 13, margin: 0 }}>{name}</p>
            <p style={{ fontWeight: 600, color: "#94a3b8", fontSize: 10, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{role}</p>
        </div>
    );
}

/* ══════════════════════════════════════════
   GLOW RING OVERLAY  (outside Canvas)
══════════════════════════════════════════ */
function GlowRing({ isSpeaking, accentColor }) {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                pointerEvents: "none",
                boxShadow: isSpeaking
                    ? `inset 0 0 0 2px ${accentColor}90, 0 0 32px 8px ${accentColor}40, 0 0 64px 16px ${accentColor}20`
                    : `inset 0 0 0 1px ${accentColor}35`,
                transition: "box-shadow 0.5s ease",
                zIndex: 2,
            }}
        />
    );
}

/* ══════════════════════════════════════════
   SPEAKING INDICATOR BAR
══════════════════════════════════════════ */
function SpeakingBar({ isSpeaking, accentColor }) {
    const bars = [4, 7, 12, 9, 5, 10, 6, 8, 4, 11];
    return (
        <div
            style={{
                position: "absolute",
                bottom: 14,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "flex-end",
                gap: 2,
                height: 20,
                zIndex: 5,
                opacity: isSpeaking ? 1 : 0.25,
                transition: "opacity 0.4s ease",
            }}
            aria-hidden="true"
        >
            {bars.map((_, i) => (
                <div
                    key={i}
                    style={{
                        width: 3,
                        borderRadius: 99,
                        background: `linear-gradient(to top, ${accentColor}, ${accentColor}80)`,
                        minHeight: 4,
                        maxHeight: 20,
                        animation: isSpeaking
                            ? `avatarBar${(i % 3) + 1} ${0.48 + i * 0.06}s ease-in-out infinite alternate`
                            : "none",
                        height: 4,
                    }}
                />
            ))}
        </div>
    );
}

/* ══════════════════════════════════════════
   NAME BADGE
══════════════════════════════════════════ */
function NameBadge({ name, role, isSpeaking, accentColor }) {
    return (
        <div
            style={{
                position: "absolute",
                bottom: 42,
                left: 12,
                zIndex: 5,
                display: "flex",
                flexDirection: "column",
                gap: 1,
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(8px)",
                    padding: "4px 10px",
                    borderRadius: 8,
                    border: `1px solid ${accentColor}30`,
                }}
            >
                {/* Speaking dot */}
                <span
                    style={{
                        display: "inline-block",
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: isSpeaking ? "#22c55e" : "#52525b",
                        boxShadow: isSpeaking ? "0 0 8px #22c55e" : "none",
                        transition: "background 0.3s, box-shadow 0.3s",
                        animation: isSpeaking ? "micPulse 1s ease-in-out infinite" : "none",
                        flexShrink: 0,
                    }}
                />
                <span style={{ fontSize: 12, fontWeight: 800, color: "white", letterSpacing: "0.01em" }}>
                    {name}
                </span>
                <span
                    style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: accentColor,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        opacity: 0.9,
                    }}
                >
                    {isSpeaking ? "Speaking" : role}
                </span>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════ */
export default function InterviewAvatar3D({
    isSpeaking = false,
    modelPath = null,
    accentColor = "#63D2F3",
    name = "AI Interviewer",
    role = "Technical Panel",
    height = "100%",
}) {
    const [webGLOk, setWebGLOk] = useState(null);  // null = not checked yet
    const [hasError, setHasError] = useState(false);

    /* WebGL availability check — runs only in browser */
    useEffect(() => {
        try {
            const canvas = document.createElement("canvas");
            const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            setWebGLOk(!!gl);
        } catch {
            setWebGLOk(false);
        }
    }, []);

    /* Preload model on mount */
    useEffect(() => {
        if (!modelPath) return;
        try { useGLTF.preload(modelPath); } catch { /* non-fatal */ }
    }, [modelPath]);

    const containerStyle = {
        position: "relative",
        width: "100%",
        height,
        borderRadius: "inherit",
        overflow: "hidden",
        background: "linear-gradient(160deg, #0d1b2e 0%, #0a0f1e 50%, #0d1425 100%)",
    };

    /* ── State: checking ── */
    if (webGLOk === null) {
        return (
            <div style={containerStyle}>
                <GLBLoader accentColor={accentColor} />
            </div>
        );
    }

    /* ── State: WebGL not supported ── */
    if (!webGLOk || hasError) {
        return (
            <div style={containerStyle}>
                <AvatarError name={name} role={role} accentColor={accentColor} />
                <GlowRing isSpeaking={isSpeaking} accentColor={accentColor} />
                <SpeakingBar isSpeaking={isSpeaking} accentColor={accentColor} />
                <NameBadge name={name} role={role} isSpeaking={isSpeaking} accentColor={accentColor} />
            </div>
        );
    }

    /* ── State: full 3D ── */
    return (
        <div style={containerStyle}>
            {/* Ambient background gradient blobs */}
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
                background: `
          radial-gradient(ellipse 60% 40% at 50% 0%, ${accentColor}12 0%, transparent 70%),
          radial-gradient(ellipse 40% 60% at 80% 80%, #818cf810 0%, transparent 60%)
        `,
            }} />

            <Canvas
                camera={{ position: [0, 1.4, 2.6], fov: 34 }}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                shadows
                gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                onError={() => setHasError(true)}
            >
                {/* ── Lighting ── */}
                {/* Key light — warm from upper-left */}
                <directionalLight
                    position={[1.5, 4, 3]}
                    intensity={1.4}
                    color="#f0f8ff"
                    castShadow
                    shadow-mapSize-width={512}
                    shadow-mapSize-height={512}
                />
                {/* Fill light — cool from right */}
                <directionalLight position={[-2, 2, 1]} intensity={0.55} color="#60a5fa" />
                {/* Rim light — from behind for depth */}
                <directionalLight position={[0, 3, -2]} intensity={0.3} color={accentColor} />
                {/* Soft ambient */}
                <ambientLight intensity={0.65} color="#dbeafe" />
                {/* Studio point */}
                <pointLight position={[0, 6, 2]} intensity={0.4} color="#f0f9ff" />

                {/* Ground shadow */}
                <ContactShadows
                    position={[0, -1.2, 0]}
                    opacity={0.35}
                    scale={4}
                    blur={2.5}
                    far={2}
                    color="#000000"
                />

                {/* ── Avatar model (optional) ── */}
                {modelPath ? (
                    <Suspense fallback={null}>
                        <AvatarModel
                            isSpeaking={isSpeaking}
                            modelPath={modelPath}
                        />
                    </Suspense>
                ) : null}

                {/* ── Camera push on speak ── */}
                <CameraRig isSpeaking={isSpeaking} />
            </Canvas>

            {/* ── Overlays (sit on top of Canvas) ── */}
            <GlowRing isSpeaking={isSpeaking} accentColor={accentColor} />
            <SpeakingBar isSpeaking={isSpeaking} accentColor={accentColor} />
            <NameBadge name={name} role={role} isSpeaking={isSpeaking} accentColor={accentColor} />
        </div>
    );
}
