"use client";

import { useAnimations, useGLTF, useFBX } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { button, useControls } from "leva";
import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { useChat } from "../hooks/useChat";

const facialExpressions: any = {
  default: {},
  smile: {
    browInnerUp: 0.17,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.44,
    noseSneerLeft: 0.17,
    noseSneerRight: 0.14,
    mouthPressLeft: 0.61,
    mouthPressRight: 0.41,
  },
  funnyFace: {
    jawLeft: 0.63,
    mouthPucker: 0.53,
    noseSneerLeft: 1,
    noseSneerRight: 0.39,
    mouthLeft: 1,
    eyeLookUpLeft: 1,
    eyeLookUpRight: 1,
    cheekPuff: 1,
    mouthDimpleLeft: 0.41,
    mouthRollLower: 0.32,
    mouthSmileLeft: 0.35,
    mouthSmileRight: 0.35,
  },
  sad: {
    mouthFrownLeft: 1,
    mouthFrownRight: 1,
    mouthShrugLower: 0.78,
    browInnerUp: 0.45,
    eyeSquintLeft: 0.72,
    eyeSquintRight: 0.75,
    eyeLookDownLeft: 0.5,
    eyeLookDownRight: 0.5,
    jawForward: 1,
  },
  surprised: {
    eyeWideLeft: 0.5,
    eyeWideRight: 0.5,
    jawOpen: 0.35,
    mouthFunnel: 1,
    browInnerUp: 1,
  },
  angry: {
    browDownLeft: 1,
    browDownRight: 1,
    eyeSquintLeft: 1,
    eyeSquintRight: 1,
    jawForward: 1,
    jawLeft: 1,
    mouthShrugLower: 1,
    noseSneerLeft: 1,
    noseSneerRight: 0.42,
    eyeLookDownLeft: 0.16,
    eyeLookDownRight: 0.16,
    cheekSquintLeft: 1,
    cheekSquintRight: 1,
    mouthClose: 0.23,
    mouthFunnel: 0.63,
    mouthDimpleRight: 1,
  },
  crazy: {
    browInnerUp: 0.9,
    jawForward: 1,
    noseSneerLeft: 0.57,
    noseSneerRight: 0.51,
    eyeLookDownLeft: 0.39,
    eyeLookUpRight: 0.40,
    eyeLookInLeft: 0.96,
    eyeLookInRight: 0.96,
    jawOpen: 0.96,
    mouthDimpleLeft: 0.96,
    mouthDimpleRight: 0.96,
    mouthStretchLeft: 0.27,
    mouthStretchRight: 0.28,
    mouthSmileLeft: 0.55,
    mouthSmileRight: 0.38,
    tongueOut: 0.96,
  },
};

const corresponding: any = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};

export function Avatar(props: any) {
  const { nodes, materials, scene }: any = useGLTF(
    "/models/64f1a714fe61576b46f27ca2.glb"
  );

  const { message, onMessagePlayed, chat } = useChat();

  const [lipsync, setLipsync] = useState<any>();
  const demoStartRef = useRef<number | null>(null);
  const isDemoMode = useRef(false);

  // Load FBX Animations
  const angryFBX = useFBX("/animations/Angry.fbx");
  const cryingFBX = useFBX("/animations/Crying.fbx");
  const laughingFBX = useFBX("/animations/Laughing.fbx");
  const rumbaFBX = useFBX("/animations/Rumba Dancing.fbx");
  const idleFBX = useFBX("/animations/Standing Idle.fbx");
  const talking0FBX = useFBX("/animations/Talking_0.fbx");
  const talking1FBX = useFBX("/animations/Talking_1.fbx");
  const talking2FBX = useFBX("/animations/Talking_2.fbx");
  const terrifiedFBX = useFBX("/animations/Terrified.fbx");

  const animations = useMemo(() => {
    const anims = [
      { fbx: angryFBX, name: "Angry" },
      { fbx: cryingFBX, name: "Crying" },
      { fbx: laughingFBX, name: "Laughing" },
      { fbx: rumbaFBX, name: "Rumba" },
      { fbx: idleFBX, name: "Idle" },
      { fbx: talking0FBX, name: "Talking_0" },
      { fbx: talking1FBX, name: "Talking_1" },
      { fbx: talking2FBX, name: "Talking_2" },
      { fbx: terrifiedFBX, name: "Terrified" },
    ];

    return anims.map((item) => {
      const anim = item.fbx.animations[0];
      anim.name = item.name;
      // Retargeting: Strip mixamorig prefix if present
      anim.tracks.forEach((track) => {
        track.name = track.name.replace("mixamorig", "");
      });
      return anim;
    });
  }, [angryFBX, cryingFBX, laughingFBX, rumbaFBX, idleFBX, talking0FBX, talking1FBX, talking2FBX, terrifiedFBX]);

  const group = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, group);
  const [animation, setAnimation] = useState("Idle");

  // Pre-cache morph target meshes to avoid scene traversal every frame
  const morphTargetMeshes = useMemo(() => {
    const meshes: any[] = [];
    scene.traverse((child: any) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        meshes.push(child);
      }
    });
    return meshes;
  }, [scene]);

  useEffect(() => {
    if (!message) {
      setAnimation("Idle");
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      isDemoMode.current = false;
      demoStartRef.current = null;
      return;
    }

    setAnimation(message.animation || "Talking_1");
    setFacialExpression(message.facialExpression || "smile");
    setLipsync(message.lipsync);

    if (message.isDemoMode) {
      isDemoMode.current = true;
      demoStartRef.current = null;

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(message.text);
        utter.rate = 0.95;
        utter.pitch = 1.2;
        utter.volume = 1;

        const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          const pick =
            voices.find((v) => /zira|samantha|female|woman/i.test(v.name)) ||
            voices.find((v) => v.lang === "en-US") ||
            voices[0];
          if (pick) utter.voice = pick;
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        utter.onend = () => {
          isDemoMode.current = false;
          onMessagePlayed();
        };
        utter.onerror = () => {
          isDemoMode.current = false;
          onMessagePlayed();
        };

        window.speechSynthesis.speak(utter);
      } else {
        const timeout = setTimeout(onMessagePlayed, 3000);
        return () => clearTimeout(timeout);
      }
    } else {
      isDemoMode.current = false;
      demoStartRef.current = null;
      const audio = new Audio("data:audio/mp3;base64," + message.audio);
      audio.play();
      setAudio(audio);
      audio.onended = onMessagePlayed;
    }
  }, [message]);

  useEffect(() => {
    if (!actions[animation]) return;
    actions[animation]!
      .reset()
      .fadeIn(0.5)
      .play();
    return () => {
      actions[animation]?.fadeOut(0.5);
    };
  }, [animation, actions]);

  const lerpMorphTarget = (target: string, value: number, speed = 0.1) => {
    morphTargetMeshes.forEach((child: any) => {
      const index = child.morphTargetDictionary[target];
      if (
        index === undefined ||
        child.morphTargetInfluences[index] === undefined
      ) {
        return;
      }
      child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
        child.morphTargetInfluences[index],
        value,
        speed
      );
    });
  };

  const [blink, setBlink] = useState(false);
  const [winkLeft, setWinkLeft] = useState(false);
  const [winkRight, setWinkRight] = useState(false);
  const [facialExpression, setFacialExpression] = useState("");
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useFrame((state, delta) => {
    // ── Eye Blinking & Expressions ──
    Object.keys(nodes.EyeLeft.morphTargetDictionary).forEach((key) => {
      const mapping = facialExpressions[facialExpression];
      if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") return;
      if (mapping && mapping[key]) {
        lerpMorphTarget(key, mapping[key], 0.1);
      } else {
        lerpMorphTarget(key, 0, 0.1);
      }
    });

    lerpMorphTarget("eyeBlinkLeft", blink || winkLeft ? 1 : 0, 0.5);
    lerpMorphTarget("eyeBlinkRight", blink || winkRight ? 1 : 0, 0.5);

    // ── Lipsync ─────────────────────────────────────────────────────────────
    const appliedMorphTargets: string[] = [];

    if (message && (lipsync || isDemoMode.current)) {
      let currentAudioTime;

      if (isDemoMode.current) {
        if (demoStartRef.current === null) demoStartRef.current = 0;
        demoStartRef.current += delta;
        currentAudioTime = demoStartRef.current;

        if (!lipsync) {
          const procedualValue = Math.sin(currentAudioTime * 10) * 0.5 + 0.5;
          lerpMorphTarget("viseme_PP", procedualValue, 0.2);
          appliedMorphTargets.push("viseme_PP");
        }
      } else if (audio) {
        currentAudioTime = audio.currentTime;
      }

      if (lipsync && currentAudioTime !== undefined) {
        for (let i = 0; i < lipsync.mouthCues.length; i++) {
          const mouthCue = lipsync.mouthCues[i];
          if (
            currentAudioTime >= mouthCue.start &&
            currentAudioTime <= mouthCue.end
          ) {
            const target = corresponding[mouthCue.value];
            if (target) {
              appliedMorphTargets.push(target);
              lerpMorphTarget(target, 1, 0.2);
            }
            break;
          }
        }
      }
    }

    Object.values(corresponding).forEach((value: any) => {
      if (appliedMorphTargets.includes(value)) return;
      lerpMorphTarget(value, 0, 0.1);
    });
  });

  useControls("FacialExpressions", {
    chat: button(() => chat("Hello!")),
    winkLeft: button(() => {
      setWinkLeft(true);
      setTimeout(() => setWinkLeft(false), 300);
    }),
    winkRight: button(() => {
      setWinkRight(true);
      setTimeout(() => setWinkRight(false), 300);
    }),
    animation: {
      value: animation,
      options: animations.map((a) => a.name),
      onChange: (value) => setAnimation(value),
    },
    facialExpression: {
      options: Object.keys(facialExpressions),
      onChange: (value) => setFacialExpression(value),
    },
    logMorphTargetValues: button(() => {
      const emotionValues: any = {};
      Object.keys(nodes.EyeLeft.morphTargetDictionary).forEach((key) => {
        if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") return;
        const value =
          nodes.EyeLeft.morphTargetInfluences[
          nodes.EyeLeft.morphTargetDictionary[key]
          ];
        if (value > 0.01) emotionValues[key] = value;
      });
      console.log(JSON.stringify(emotionValues, null, 2));
    }),
  });

  useEffect(() => {
    let blinkTimeout: any;
    const nextBlink = () => {
      blinkTimeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          nextBlink();
        }, 200);
      }, THREE.MathUtils.randInt(1000, 5000));
    };
    nextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  return (
    <group {...props} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="Wolf3D_Body"
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Bottom"
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Footwear"
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Top"
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Hair"
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
    </group>
  );
}

useGLTF.preload("/models/64f1a714fe61576b46f27ca2.glb");
