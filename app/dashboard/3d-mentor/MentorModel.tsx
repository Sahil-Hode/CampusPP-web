"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, useFBX } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";

/* ══════════════════════════════════════════════════════════════
   VISEME MORPH TARGET GROUPS
   Priority-ordered name candidates per viseme shape.
   Add your model's exact morph names here if different.
══════════════════════════════════════════════════════════════ */
const VISEME_MORPHS: Record<number, string[]> = {
  // 0 = closed / silence
  0: ["mouthClose", "Mouth_Close", "viseme_sil", "Morpher_CC_Base_Body.Close"],
  // 1 = slightly open (default speech)
  1: ["mouthOpen", "Mouth_Open", "jawOpen", "JawOpen", "viseme_PP",
      "Morpher_CC_Base_Body.Open", "A", "viseme_aa", "viseme_AA", "mouth_open"],
  // 2 = mid vowel (e, i)
  2: ["viseme_aa", "viseme_AA", "mouthOpen", "Mouth_Open", "jawOpen",
      "Morpher_CC_Base_Body.Open", "A"],
  // 3 = wide open (a)
  3: ["viseme_aa", "viseme_AA", "jawOpen", "JawOpen",
      "Morpher_CC_Base_Body.Open", "A", "mouthOpen"],
  // 4 = bilabial press (p, b, m)
  4: ["viseme_PP", "mouthClose", "Mouth_Close", "Morpher_CC_Base_Body.Close"],
  // 5 = rounded (o, u)
  5: ["viseme_O", "mouthFunnel", "Mouth_O", "O"],
};

/* ══════════════════════════════════════════════════════════════
   SHARED LIP-SYNC REF TYPE
   Written every frame by the AudioContext analyser in the page,
   read every frame by Model's useFrame.
══════════════════════════════════════════════════════════════ */
export interface LipSyncAnalysis {
  mouthOpen: number;   // 0–1  normalised energy
  visemeId:  number;   // 0–5  current mouth shape
}
export type LipSyncRef = React.MutableRefObject<LipSyncAnalysis>;

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
function findMorphIdx(
  dict: Record<string, number> | undefined,
  names: string[]
): number {
  if (!dict) return -1;
  for (const n of names) if (n in dict) return dict[n];
  return -1;
}

function bandAvg(data: Uint8Array, start: number, end: number): number {
  let sum = 0;
  for (let i = start; i < end; i++) sum += data[i];
  return sum / (end - start);
}

/* ══════════════════════════════════════════════════════════════
   AUDIO → LIP-SYNC ANALYSER HOOK
   Connects an AudioContext AnalyserNode to the playing <audio>
   element and writes mouthOpen + visemeId into lipSyncRef at
   ~60 fps via requestAnimationFrame.

   Usage:
     const lipSyncRef = useRef<LipSyncAnalysis>({ mouthOpen:0, visemeId:0 });
     const { connectAudio, disconnectAudio } = useAudioLipSync(lipSyncRef);
     // call connectAudio(audioElement) when ttsAudio starts playing
     // call disconnectAudio() when it ends
══════════════════════════════════════════════════════════════ */
export function useAudioLipSync(lipSyncRef: LipSyncRef) {
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const dataRef      = useRef<Uint8Array | null>(null);
  const rafRef       = useRef<number>(0);
  const connectedRef = useRef<HTMLAudioElement | null>(null);

  const disconnectAudio = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    lipSyncRef.current = { mouthOpen: 0, visemeId: 0 };

    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current  = null;
    analyserRef.current  = null;
    dataRef.current      = null;
    connectedRef.current = null;
  }, [lipSyncRef]);

  const connectAudio = useCallback((el: HTMLAudioElement) => {
    // Don't re-connect the same element
    if (connectedRef.current === el) return;
    disconnectAudio();

    try {
      const ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;                 // 128 bins, ~375 Hz/bin @ 48 kHz
      analyser.smoothingTimeConstant = 0.55;  // mild smoothing

      const source = ctx.createMediaElementSource(el);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      const data = new Uint8Array(analyser.frequencyBinCount);

      audioCtxRef.current  = ctx;
      analyserRef.current  = analyser;
      dataRef.current      = data;
      connectedRef.current = el;

      const tick = () => {
        rafRef.current = requestAnimationFrame(tick);
        if (!analyserRef.current || !dataRef.current) return;

        analyserRef.current.getByteFrequencyData(dataRef.current);
        const d = dataRef.current;

        // Speech lives in 300–3400 Hz
        // At 48 kHz with 128 bins: bin ≈ freq / 375
        const low  = bandAvg(d, 1,  8);   // ~375–3000 Hz general energy
        const mid  = bandAvg(d, 8,  20);  // ~3000–7500 Hz vowel formants
        const high = bandAvg(d, 20, 40);  // ~7500–15000 Hz consonants

        const total     = low * 0.6 + mid * 0.3 + high * 0.1;
        const mouthOpen = Math.min(total / 70, 1);   // normalise (speech ≈ 40–90)

        // ── Classify viseme from band ratios ───────────────────────
        let visemeId = 0;
        if (mouthOpen < 0.04) {
          visemeId = 0;                                     // silence
        } else if (high > mid * 1.5) {
          visemeId = 4;                                     // consonant burst
        } else if (mid > 55) {
          visemeId = mouthOpen > 0.6 ? 3 : 2;             // wide vs mid vowel
        } else if (low > mid * 1.2 && low > 25) {
          visemeId = 5;                                     // rounded (o/u)
        } else {
          visemeId = 1;                                     // light open
        }

        lipSyncRef.current = { mouthOpen, visemeId };
      };

      if (ctx.state === "suspended") ctx.resume().then(tick);
      else tick();
    } catch (e) {
      console.warn("[LipSync] AudioContext failed:", e);
    }
  }, [disconnectAudio, lipSyncRef]);

  // Cleanup on unmount
  useEffect(() => () => disconnectAudio(), [disconnectAudio]);

  return { connectAudio, disconnectAudio };
}

/* ══════════════════════════════════════════════════════════════
   3-D MODEL INNER COMPONENT
   Reads lipSyncRef every frame — no React re-renders involved.
══════════════════════════════════════════════════════════════ */
interface ModelProps {
  isSpeaking: boolean;
  lipSyncRef: LipSyncRef;
}

function Model({ isSpeaking, lipSyncRef }: ModelProps) {
  const fbx         = useFBX("/model.fbx");
  const modelRef    = useRef<THREE.Group>(null);
  const morphMeshes = useRef<THREE.Mesh[]>([]);
  const smoothOpen  = useRef(0);
  const prevViseme  = useRef(0);

  /* Collect morph-target meshes once on load */
  useEffect(() => {
    if (!fbx) return;
    morphMeshes.current = [];
    fbx.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh && mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        morphMeshes.current.push(mesh);
        if (process.env.NODE_ENV === "development") {
          console.log(`[LipSync] mesh "${mesh.name}" morphs:`,
            Object.keys(mesh.morphTargetDictionary));
        }
      }
    });
  }, [fbx]);

  const applyViseme = useCallback(
    (id: number, weight: number, speed: number) => {
      const names = VISEME_MORPHS[id] ?? VISEME_MORPHS[1];
      morphMeshes.current.forEach((mesh) => {
        const idx = findMorphIdx(mesh.morphTargetDictionary, names);
        if (idx < 0) return;
        mesh.morphTargetInfluences![idx] = THREE.MathUtils.lerp(
          mesh.morphTargetInfluences![idx], weight, speed
        );
      });
    }, []
  );

  const clearAll = useCallback((speed: number) => {
    const allNames = Array.from(new Set(Object.values(VISEME_MORPHS).flat()));
    morphMeshes.current.forEach((mesh) => {
      allNames.forEach((name) => {
        const idx = findMorphIdx(mesh.morphTargetDictionary, [name]);
        if (idx < 0) return;
        mesh.morphTargetInfluences![idx] = THREE.MathUtils.lerp(
          mesh.morphTargetInfluences![idx], 0, speed
        );
      });
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    /* Idle body animation */
    if (modelRef.current) {
      modelRef.current.position.y = -1 + Math.sin(t * 0.8) * 0.05;
      modelRef.current.rotation.y = Math.sin(t * 0.4) * 0.05;
    }

    /* Lip sync — driven by live audio analysis */
    if (isSpeaking) {
      const { mouthOpen, visemeId } = lipSyncRef.current;

      smoothOpen.current = THREE.MathUtils.lerp(smoothOpen.current, mouthOpen, 0.28);

      if (visemeId !== prevViseme.current) {
        applyViseme(prevViseme.current, 0, 0.4);
        prevViseme.current = visemeId;
      }

      applyViseme(visemeId, smoothOpen.current, 0.3);
    } else {
      smoothOpen.current = THREE.MathUtils.lerp(smoothOpen.current, 0, 0.12);
      clearAll(0.12);
    }
  });

  return (
    <primitive ref={modelRef} object={fbx} scale={0.02} position={[0, -1.8, 0]} />
  );
}

/* ══════════════════════════════════════════════════════════════
   FALLBACK SPINNER
══════════════════════════════════════════════════════════════ */
function FallbackSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div style={{
        width: 48, height: 48,
        border: "4px solid rgba(255,255,255,0.15)",
        borderTop: "4px solid #38bdf8",
        borderRadius: "50%",
        animation: "spin 0.9s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PUBLIC COMPONENT

   Props:
     isSpeaking  — true while TTS audio is playing
     lipSyncRef  — ref written by useAudioLipSync hook in the page
══════════════════════════════════════════════════════════════ */
interface MentorModelProps {
  isSpeaking?: boolean;
  lipSyncRef:  LipSyncRef;
}

export default function MentorModel({ isSpeaking = false, lipSyncRef }: MentorModelProps) {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const c  = document.createElement("canvas");
      const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      setWebGLSupported(!!gl);
    } catch { setWebGLSupported(false); }
  }, []);

  if (webGLSupported === null) return <FallbackSpinner />;
  if (!webGLSupported) return (
    <div className="flex items-center justify-center h-full text-white font-semibold">
      3D not supported on this device
    </div>
  );

  return (
    <Canvas
      camera={{ position: [0, 1.45, 1.8], fov: 35 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 2, 2]} intensity={1.5} />
      <Suspense fallback={<Html center><FallbackSpinner /></Html>}>
        <Model isSpeaking={isSpeaking} lipSyncRef={lipSyncRef} />
      </Suspense>
      <OrbitControls
        enableZoom enablePan={false}
        minDistance={1.2} maxDistance={2.4}
        target={[0, 1.45, 0]}
      />
    </Canvas>
  );
}