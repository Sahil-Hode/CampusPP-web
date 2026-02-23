"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";

/* ══════════════════════════════════════════════════════════════
   MORPH TARGET NAME CANDIDATES
══════════════════════════════════════════════════════════════ */
const MOUTH_OPEN_NAMES = [
  "viseme_aa", "viseme_AA", "viseme_O", "viseme_U", "viseme_E", "viseme_I",
  "Morpher_CC_Base_Body.Open", "Morpher_CC_Base_Teeth.Open", "CC_Base_Body.Open",
  "mouthOpen", "Mouth_Open", "jawOpen", "JawOpen", "jaw_open", "Jaw_Open",
  "A", "E", "O", "U", "mouth_open", "open_mouth", "MouthOpen",
];

const MOUTH_CLOSE_NAMES = [
  "mouthClose", "Mouth_Close", "viseme_sil", "viseme_PP",
  "Morpher_CC_Base_Body.Close", "CC_Base_Body.Close", "mouth_close", "MouthClose",
];

const JAW_BONE_NAMES = [
  "jaw", "Jaw", "JAW", "mixamorigJaw", "CC_Base_JawRoot",
  "Head_Jaw", "jaw_master", "lower_jaw", "mandible",
];

/* ══════════════════════════════════════════════════════════════
   EXPORTED TYPES
══════════════════════════════════════════════════════════════ */
export interface LipSyncAnalysis {
  mouthOpen: number;
  visemeId:  number;
}
export type LipSyncRef = React.MutableRefObject<LipSyncAnalysis>;

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
function findMorphIdx(dict: Record<string, number> | undefined, names: string[]): number {
  if (!dict) return -1;
  for (const n of names) if (n in dict) return dict[n];
  return -1;
}

function bandAvg(data: Uint8Array, start: number, end: number): number {
  let sum = 0;
  for (let i = start; i < end; i++) sum += data[i];
  return sum / Math.max(1, end - start);
}

/* ══════════════════════════════════════════════════════════════
   AUDIO LIP-SYNC HOOK
══════════════════════════════════════════════════════════════ */
export function useAudioLipSync(lipSyncRef: LipSyncRef) {
  const ctxRef       = useRef<AudioContext | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const dataRef      = useRef<Uint8Array | null>(null);
  const rafRef       = useRef<number>(0);
  const connectedRef = useRef<HTMLAudioElement | null>(null);

  const disconnectAudio = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    lipSyncRef.current = { mouthOpen: 0, visemeId: 0 };
    if (ctxRef.current?.state !== "closed") ctxRef.current?.close().catch(() => {});
    ctxRef.current = analyserRef.current = dataRef.current = connectedRef.current = null;
  }, [lipSyncRef]);

  const connectAudio = useCallback((el: HTMLAudioElement) => {
    if (connectedRef.current === el) return;
    disconnectAudio();
    try {
      const AudioCtx = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx      = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;

      const source = ctx.createMediaElementSource(el);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      const data = new Uint8Array(analyser.frequencyBinCount);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      dataRef.current = data;
      connectedRef.current = el;

      const tick = () => {
        rafRef.current = requestAnimationFrame(tick);
        if (!analyserRef.current || !dataRef.current) return;
        analyserRef.current.getByteFrequencyData(dataRef.current);
        const d = dataRef.current;

        const fund = bandAvg(d,  1,  4);
        const f1   = bandAvg(d,  4, 12);
        const f2   = bandAvg(d, 12, 28);
        const cons = bandAvg(d, 28, 70);
        const total = fund * 0.2 + f1 * 0.5 + f2 * 0.25 + cons * 0.05;
        const mouthOpen = Math.min(total / 80, 1);

        let visemeId = 0;
        if      (mouthOpen < 0.05)          visemeId = 0;
        else if (cons > f1 * 1.8)           visemeId = 4;
        else if (f1 > 70 && f2 < f1 * 0.8) visemeId = 5;
        else if (f1 > 60)                   visemeId = mouthOpen > 0.6 ? 3 : 2;
        else                                visemeId = 1;

        lipSyncRef.current = { mouthOpen, visemeId };
      };

      if (ctx.state === "suspended") ctx.resume().then(tick); else tick();
    } catch (e) { console.warn("[LipSync] AudioContext failed:", e); }
  }, [disconnectAudio, lipSyncRef]);

  useEffect(() => () => disconnectAudio(), [disconnectAudio]);
  return { connectAudio, disconnectAudio };
}

/* ══════════════════════════════════════════════════════════════
   AUTO-FIT CAMERA — positions camera so model fills view nicely
══════════════════════════════════════════════════════════════ */
function AutoFitCamera({ target }: { target: THREE.Group | null }) {
  const { camera } = useThree();
  const fitted = useRef(false);

  useEffect(() => {
    if (!target || fitted.current) return;
    fitted.current = true;

    const box    = new THREE.Box3().setFromObject(target);
    const size   = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Position camera to show upper body (head to waist)
    const height    = size.y;
    const camY      = center.y + height * 0.15;   // slightly above center
    const camZ      = Math.max(size.x, size.z) * 2.2 + height * 0.6;

    camera.position.set(0, camY, camZ);
    (camera as THREE.PerspectiveCamera).fov = 38;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [target, camera]);

  return null;
}

/* ══════════════════════════════════════════════════════════════
   3-D MODEL COMPONENT
══════════════════════════════════════════════════════════════ */
interface ModelProps {
  isSpeaking: boolean;
  lipSyncRef: LipSyncRef;
  onReady:    (group: THREE.Group) => void;
}

function Model({ isSpeaking, lipSyncRef, onReady }: ModelProps) {
  // Clone the scene so we don't mutate the cached GLTF
  const { scene, animations } = useGLTF("/model.glb");
  const clonedScene = useRef<THREE.Group | null>(null);

  const groupRef    = useRef<THREE.Group>(null);
  const mixerRef    = useRef<THREE.AnimationMixer | null>(null);
  const morphMeshes = useRef<THREE.Mesh[]>([]);
  const jawBoneRef  = useRef<THREE.Bone | null>(null);
  const hasMorphs   = useRef(false);
  const smoothOpen  = useRef(0);
  const jawRestQuat = useRef(new THREE.Quaternion());

  useEffect(() => {
    if (!scene) return;

    // Clone so we don't mutate the shared cached scene
    const cloned = scene.clone(true);
    clonedScene.current = cloned;

    morphMeshes.current = [];
    hasMorphs.current   = false;
    jawBoneRef.current  = null;
    const allMorphNames: string[] = [];

    cloned.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh && mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        // Re-clone morph influences array (clone() doesn't deep-copy these)
        mesh.morphTargetInfluences = [...mesh.morphTargetInfluences];
        morphMeshes.current.push(mesh);
        const names = Object.keys(mesh.morphTargetDictionary);
        allMorphNames.push(...names);
        if (findMorphIdx(mesh.morphTargetDictionary, MOUTH_OPEN_NAMES) >= 0) {
          hasMorphs.current = true;
        }
      }

      if ((node as THREE.Bone).isBone || node.type === "Bone") {
        if (JAW_BONE_NAMES.some(n => node.name.toLowerCase().includes(n.toLowerCase()))) {
          jawBoneRef.current = node as THREE.Bone;
          jawRestQuat.current.copy(node.quaternion);
        }
      }
    });

    // ── Normalize: center + scale to 1.6 m tall ──────────────
    const box    = new THREE.Box3().setFromObject(cloned);
    const size   = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const targetHeight = 1.6;
    const scale = size.y > 0 ? targetHeight / size.y : 1;

    // Apply scale + center via the wrapper group, not the scene itself
    if (groupRef.current) {
      groupRef.current.scale.setScalar(scale);
      groupRef.current.position.set(
        -center.x * scale,
        -(box.min.y) * scale,   // sit on y=0 floor
        -center.z * scale
      );
      onReady(groupRef.current);
    }

    // Dev log
    console.group("[MentorModel] GLB loaded");
    console.log("Morph targets:", [...new Set(allMorphNames)]);
    console.log("Mouth morphs found:", hasMorphs.current);
    console.log("Jaw bone:", jawBoneRef.current?.name ?? "none");
    console.log("Model size:", size);
    console.groupEnd();

    // Animation mixer
    if (animations && animations.length > 0) {
      const mixer  = new THREE.AnimationMixer(cloned);
      const action = mixer.clipAction(animations[0]);
      action.play();
      mixerRef.current = mixer;
      console.log("[MentorModel] Animation:", animations[0].name);
    } else {
      mixerRef.current = null;
      console.log("[MentorModel] No animations — procedural idle");
    }

    return () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
    };
  }, [scene, animations, onReady]);

  // Morph helpers
  const applyMorphOpen = useCallback((weight: number, speed: number) => {
    morphMeshes.current.forEach((mesh) => {
      const idx = findMorphIdx(mesh.morphTargetDictionary, MOUTH_OPEN_NAMES);
      if (idx < 0) return;
      mesh.morphTargetInfluences![idx] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences![idx], weight, speed
      );
    });
  }, []);

  const applyJawBone = useCallback((weight: number, speed: number) => {
    const jaw = jawBoneRef.current;
    if (!jaw) return;
    const euler = new THREE.Euler().setFromQuaternion(jawRestQuat.current);
    const tq    = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(euler.x + weight * 0.26, euler.y, euler.z)
    );
    jaw.quaternion.slerp(tq, speed);
  }, []);

  const closeMorphs = useCallback((speed: number) => {
    morphMeshes.current.forEach((mesh) => {
      [...MOUTH_OPEN_NAMES, ...MOUTH_CLOSE_NAMES].forEach((name) => {
        const idx = findMorphIdx(mesh.morphTargetDictionary, [name]);
        if (idx < 0) return;
        mesh.morphTargetInfluences![idx] = THREE.MathUtils.lerp(
          mesh.morphTargetInfluences![idx], 0, speed
        );
      });
    });
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Advance animation
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    } else if (groupRef.current) {
      // Procedural idle breathing
      const baseY = groupRef.current.userData.baseY ?? groupRef.current.position.y;
      groupRef.current.userData.baseY = baseY;
      groupRef.current.position.y = baseY + Math.sin(t * 0.7) * 0.01;
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.03;
    }

    // Lip sync
    if (isSpeaking) {
      const { mouthOpen } = lipSyncRef.current;
      smoothOpen.current = THREE.MathUtils.lerp(smoothOpen.current, mouthOpen, 0.3);
      if (hasMorphs.current) applyMorphOpen(smoothOpen.current, 0.3);
      else                   applyJawBone(smoothOpen.current, 0.25);
    } else {
      smoothOpen.current = THREE.MathUtils.lerp(smoothOpen.current, 0, 0.15);
      if (hasMorphs.current) closeMorphs(0.15);
      else {
        const jaw = jawBoneRef.current;
        if (jaw) jaw.quaternion.slerp(jawRestQuat.current, 0.15);
      }
    }
  });

  if (!clonedScene.current) return null;

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene.current} />
    </group>
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
   SCENE WRAPPER — holds ready group ref for AutoFitCamera
══════════════════════════════════════════════════════════════ */
function Scene({ isSpeaking, lipSyncRef }: { isSpeaking: boolean; lipSyncRef: LipSyncRef }) {
  const [readyGroup, setReadyGroup] = useState<THREE.Group | null>(null);

  return (
    <>
      <AutoFitCamera target={readyGroup} />
      <Model
        isSpeaking={isSpeaking}
        lipSyncRef={lipSyncRef}
        onReady={setReadyGroup}
      />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   PUBLIC COMPONENT
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
      camera={{ position: [0, 1.2, 3.5], fov: 38 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[2, 4, 3]} intensity={1.6} />
      <directionalLight position={[-2, 2, -1]} intensity={0.4} />

      <Suspense fallback={<Html center><FallbackSpinner /></Html>}>
        <Scene isSpeaking={isSpeaking} lipSyncRef={lipSyncRef} />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minDistance={1.8}
        maxDistance={1.8}
        target={[0, 0.99, 0]}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.75}
      />
    </Canvas>
  );
}

useGLTF.preload("/model.glb");
