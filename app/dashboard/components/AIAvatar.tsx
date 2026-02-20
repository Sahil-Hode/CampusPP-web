"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const ThreeAvatar = dynamic(() => import("./ThreeAvatar"), {
  ssr: false,
});

export default function AIAvatar() {
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");

      if (!gl) setWebglSupported(false);
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  if (!webglSupported) {
    return (
      <div className="text-white text-sm p-4 text-center">
        3D Preview not supported on this device.
      </div>
    );
  }

  return <ThreeAvatar />;
}
