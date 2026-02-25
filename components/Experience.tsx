"use client";
import {
  CameraControls,
  ContactShadows,
  Environment,
  Text,
} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { Avatar } from "./Avatar";

const Dots = (props: any) => {
  const { loading } = useChat();
  const [loadingText, setLoadingText] = useState("");
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingText((loadingText) => {
          if (loadingText.length > 2) {
            return ".";
          }
          return loadingText + ".";
        });
      }, 800);
      return () => clearInterval(interval);
    } else {
      setLoadingText("");
    }
  }, [loading]);
  if (!loading) return null;
  return (
    <group {...props}>
      <Text fontSize={0.14} anchorX={"left"} anchorY={"bottom"}>
        {loadingText}
        <meshBasicMaterial attach="material" color="black" />
      </Text>
    </group>
  );
};

export const Experience = () => {
  const cameraControls = useRef<CameraControls>(null!);
  const { cameraZoomed } = useChat();

  useEffect(() => {
    // Initial view: Full body
    if (cameraControls.current) {
      cameraControls.current.setLookAt(0, 1.9, 3.2, 0, 1.62, 0, true);
    }
  }, []);

  useEffect(() => {
    if (cameraControls.current) {
      if (cameraZoomed) {
        // Zoomed view: Upper body/Face
        cameraControls.current.setLookAt(0, 2.08, 1.3, 0, 1.9, 0, true);
      } else {
        // Normal view: Full body
        cameraControls.current.setLookAt(0, 1.9, 3.2, 0, 1.62, 0, true);
      }
    }
  }, [cameraZoomed]);

  return (
    <>
      <CameraControls ref={cameraControls} />
      <Environment preset="sunset" />
      <Suspense>
        <Dots position-y={1.75} position-x={-0.02} />
      </Suspense>
      <group position-y={0.08}>
        <Avatar />
      </group>
      <ContactShadows opacity={0.7} />
    </>
  );
};
