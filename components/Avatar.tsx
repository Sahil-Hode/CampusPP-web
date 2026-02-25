"use client";

import { Html, useFBX } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";

const animationsMap = {
  idle: "Standing Idle",
  talk1: "Talking",
  talk2: "Talking_01",
  talk3: "Talking_1",
  talk4: "Talking_2",
  angry: "Angry",
  sad: "Crying",
  happy: "Laughing",
  scared: "Terrified",
  dance: "Rumba Dancing",
} as const;

type AnimationKey = keyof typeof animationsMap;

const TALK_STATES: AnimationKey[] = ["talk1", "talk2", "talk3", "talk4"];

function normalizeTrackName(name: string) {
  return name
    .replace(/mixamo\.com/gi, "")
    .replace(/mixamorig/gi, "")
    .replace(/^Armature\|/gi, "")
    .trim();
}

function clipFromFBX(
  fbx: THREE.Group,
  clipName: string,
  nodeNames: Set<string>,
  warnRef: React.MutableRefObject<Set<string>>
) {
  const source = fbx.animations?.[0];
  if (!source) {
    if (!warnRef.current.has(`${clipName}:missing`)) {
      warnRef.current.add(`${clipName}:missing`);
      console.warn(`[mentor-anim] Missing clip data for ${clipName}`);
    }
    return null;
  }

  const cloned = source.clone();
  cloned.name = clipName;

  const filteredTracks = cloned.tracks
    .map((track) => {
      const t = track.clone();
      t.name = normalizeTrackName(t.name);
      return t;
    })
    .filter((track) => {
      const targetNode = track.name.split(".")[0];
      const exists = nodeNames.has(targetNode);
      if (!exists && !warnRef.current.has(`${clipName}:${targetNode}`)) {
        warnRef.current.add(`${clipName}:${targetNode}`);
        console.warn(
          `[mentor-anim] Skeleton mismatch for ${clipName}. Missing target node: ${targetNode}`
        );
      }
      return exists;
    });

  if (filteredTracks.length === 0) {
    if (!warnRef.current.has(`${clipName}:empty`)) {
      warnRef.current.add(`${clipName}:empty`);
      console.warn(`[mentor-anim] No compatible tracks for ${clipName}`);
    }
    return null;
  }

  return new THREE.AnimationClip(cloned.name, cloned.duration, filteredTracks);
}

export function Avatar() {
  const baseModel = useFBX("/models/3d mentor big.fbx");
  const model = useMemo(() => skeletonClone(baseModel), [baseModel]);

  const idleFBX = useFBX("/animations/Standing Idle.fbx");
  const talkFBX = useFBX("/animations/Talking.fbx");
  const talk01FBX = useFBX("/animations/Talking_01.fbx");
  const talk1FBX = useFBX("/animations/Talking_1.fbx");
  const talk2FBX = useFBX("/animations/Talking_2.fbx");
  const angryFBX = useFBX("/animations/Angry.fbx");
  const sadFBX = useFBX("/animations/Crying.fbx");
  const happyFBX = useFBX("/animations/Laughing.fbx");
  const scaredFBX = useFBX("/animations/Terrified.fbx");
  const danceFBX = useFBX("/animations/Rumba Dancing.fbx");

  const [activeAnimation, setActiveAnimation] = useState<AnimationKey>("idle");

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const currentNameRef = useRef<AnimationKey>("idle");
  const warnRef = useRef<Set<string>>(new Set());

  const jawBoneRef = useRef<THREE.Bone | null>(null);
  const headBoneRef = useRef<THREE.Bone | null>(null);
  const baseJawXRef = useRef(0);
  const baseHeadXRef = useRef(0);

  const morphRef = useRef<{
    mesh: THREE.Mesh;
    index: number;
  } | null>(null);

  const nodeNames = useMemo(() => {
    const names = new Set<string>();
    model.traverse((obj) => {
      if (obj.name) names.add(obj.name);

      if (!jawBoneRef.current && obj instanceof THREE.Bone && /jaw/i.test(obj.name)) {
        jawBoneRef.current = obj;
        baseJawXRef.current = obj.rotation.x;
      }

      if (!headBoneRef.current && obj instanceof THREE.Bone && /head/i.test(obj.name)) {
        headBoneRef.current = obj;
        baseHeadXRef.current = obj.rotation.x;
      }

      if (!morphRef.current && (obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const dict = (mesh as THREE.Mesh & {
          morphTargetDictionary?: Record<string, number>;
          morphTargetInfluences?: number[];
        }).morphTargetDictionary;
        const influences = (mesh as THREE.Mesh & {
          morphTargetInfluences?: number[];
        }).morphTargetInfluences;

        if (dict && influences) {
          const candidates = [
            "jawOpen",
            "mouthOpen",
            "viseme_aa",
            "viseme_AA",
            "viseme_O",
            "viseme_PP",
          ];
          const found = candidates.find((key) => dict[key] !== undefined);
          if (found) {
            morphRef.current = { mesh, index: dict[found] };
          }
        }
      }
    });
    return names;
  }, [model]);

  const clips = useMemo(() => {
    const map: Partial<Record<AnimationKey, THREE.AnimationClip>> = {};

    const definitions: Array<[AnimationKey, THREE.Group]> = [
      ["idle", idleFBX],
      ["talk1", talkFBX],
      ["talk2", talk01FBX],
      ["talk3", talk1FBX],
      ["talk4", talk2FBX],
      ["angry", angryFBX],
      ["sad", sadFBX],
      ["happy", happyFBX],
      ["scared", scaredFBX],
      ["dance", danceFBX],
    ];

    for (const [key, fbx] of definitions) {
      const clip = clipFromFBX(fbx, animationsMap[key], nodeNames, warnRef);
      if (clip) map[key] = clip;
    }

    return map;
  }, [
    nodeNames,
    idleFBX,
    talkFBX,
    talk01FBX,
    talk1FBX,
    talk2FBX,
    angryFBX,
    sadFBX,
    happyFBX,
    scaredFBX,
    danceFBX,
  ]);

  const playAnimation = useCallback((name: AnimationKey) => {
    const actionName = animationsMap[name];
    const nextAction = actionsRef.current[actionName];
    if (!nextAction) {
      if (!warnRef.current.has(`action:${actionName}`)) {
        warnRef.current.add(`action:${actionName}`);
        console.warn(`[mentor-anim] Action not found: ${actionName}`);
      }
      return;
    }

    const current = currentActionRef.current;
    if (current && current !== nextAction) {
      current.fadeOut(0.3);
    }

    if (name === "dance") {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    } else {
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
      nextAction.clampWhenFinished = false;
    }

    nextAction.reset();
    nextAction.fadeIn(0.3);
    nextAction.play();

    currentActionRef.current = nextAction;
    currentNameRef.current = name;
    setActiveAnimation(name);
  }, []);

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(model);
    mixerRef.current = mixer;
    actionsRef.current = {};
    currentActionRef.current = null;

    (Object.keys(animationsMap) as AnimationKey[]).forEach((key) => {
      const clip = clips[key];
      if (!clip) return;
      const action = mixer.clipAction(clip, model);
      actionsRef.current[clip.name] = action;
    });

    playAnimation("idle");

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      actionsRef.current = {};
      currentActionRef.current = null;
      mixerRef.current = null;
    };
  }, [model, clips, playAnimation]);

  useEffect(() => {
    const timers: number[] = [];

    timers.push(window.setTimeout(() => playAnimation("idle"), 200));
    timers.push(window.setTimeout(() => playAnimation("talk1"), 3200));
    timers.push(window.setTimeout(() => playAnimation("happy"), 6200));
    timers.push(window.setTimeout(() => playAnimation("idle"), 9200));

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [playAnimation]);

  useFrame((state, delta) => {
    mixerRef.current?.update(delta);

    const isTalking = TALK_STATES.includes(currentNameRef.current);
    const t = state.clock.getElapsedTime();

    if (isTalking) {
      const pulse = (Math.sin(t * 10) + 1) * 0.5;

      if (morphRef.current) {
        const influences = (morphRef.current.mesh as THREE.Mesh & {
          morphTargetInfluences?: number[];
        }).morphTargetInfluences;
        if (influences) {
          influences[morphRef.current.index] = THREE.MathUtils.lerp(
            influences[morphRef.current.index] ?? 0,
            pulse * 0.85,
            0.35
          );
        }
      } else if (jawBoneRef.current) {
        jawBoneRef.current.rotation.x = baseJawXRef.current + pulse * 0.25;
      } else if (headBoneRef.current) {
        headBoneRef.current.rotation.x = baseHeadXRef.current + Math.sin(t * 6) * 0.07;
      }
    } else {
      if (morphRef.current) {
        const influences = (morphRef.current.mesh as THREE.Mesh & {
          morphTargetInfluences?: number[];
        }).morphTargetInfluences;
        if (influences) {
          influences[morphRef.current.index] = THREE.MathUtils.lerp(
            influences[morphRef.current.index] ?? 0,
            0,
            0.25
          );
        }
      }

      if (jawBoneRef.current) {
        jawBoneRef.current.rotation.x = THREE.MathUtils.lerp(
          jawBoneRef.current.rotation.x,
          baseJawXRef.current,
          0.2
        );
      }

      if (headBoneRef.current) {
        headBoneRef.current.rotation.x = THREE.MathUtils.lerp(
          headBoneRef.current.rotation.x,
          baseHeadXRef.current,
          0.2
        );
      }
    }
  });

  return (
    <group>
      <primitive object={model} />
      <Html fullscreen>
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-24">
          <div className="pointer-events-auto rounded-xl border border-white/20 bg-black/50 backdrop-blur px-3 py-2 flex flex-wrap gap-2 max-w-[92%]">
            <button className="px-3 py-1.5 rounded-md bg-white/10 text-white text-sm" onClick={() => playAnimation("idle")}>Idle</button>
            <button className="px-3 py-1.5 rounded-md bg-white/10 text-white text-sm" onClick={() => playAnimation("talk1")}>Talk 1</button>
            <button className="px-3 py-1.5 rounded-md bg-white/10 text-white text-sm" onClick={() => playAnimation("talk2")}>Talk 2</button>
            <button className="px-3 py-1.5 rounded-md bg-white/10 text-white text-sm" onClick={() => playAnimation("angry")}>Angry</button>
            <button className="px-3 py-1.5 rounded-md bg-white/10 text-white text-sm" onClick={() => playAnimation("sad")}>Sad</button>
            <button className="px-3 py-1.5 rounded-md bg-white/10 text-white text-sm" onClick={() => playAnimation("happy")}>Happy</button>
            <button className="px-3 py-1.5 rounded-md bg-white/10 text-white text-sm" onClick={() => playAnimation("scared")}>Scared</button>
            <button className="px-3 py-1.5 rounded-md bg-white/10 text-white text-sm" onClick={() => playAnimation("dance")}>Dance</button>
          </div>
        </div>
      </Html>
    </group>
  );
}

useFBX.preload("/models/3d mentor big.fbx");
useFBX.preload("/animations/Standing Idle.fbx");
useFBX.preload("/animations/Talking.fbx");
useFBX.preload("/animations/Talking_01.fbx");
useFBX.preload("/animations/Talking_1.fbx");
useFBX.preload("/animations/Talking_2.fbx");
useFBX.preload("/animations/Angry.fbx");
useFBX.preload("/animations/Crying.fbx");
useFBX.preload("/animations/Laughing.fbx");
useFBX.preload("/animations/Terrified.fbx");
useFBX.preload("/animations/Rumba Dancing.fbx");
