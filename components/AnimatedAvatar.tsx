"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedAvatarProps {
    name: string;
    role: string;
    accentColor: string;
    isSpeaking: boolean;
    size?: number;
}

export default function AnimatedAvatar({
    name,
    role,
    accentColor,
    isSpeaking,
    size = 56,
}: AnimatedAvatarProps) {
    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: size, height: size }}
        >
            {/* Speaking Glow */}
            {isSpeaking && (
                <motion.div
                    className="absolute inset-0 rounded-full"
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.2, opacity: 0 }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut",
                    }}
                    style={{ backgroundColor: accentColor }}
                />
            )}

            {/* Avatar Circle */}
            <div
                className="relative z-10 w-full h-full rounded-full border-2 flex items-center justify-center overflow-hidden bg-slate-800"
                style={{ borderColor: isSpeaking ? accentColor : `${accentColor}40` }}
            >
                <span className="text-xl font-bold text-white">
                    {name.charAt(0)}
                </span>

                {/* Animated Mouth Overlay for Speaking */}
                {isSpeaking && (
                    <motion.div
                        className="absolute bottom-2 w-4 h-1 bg-white rounded-full"
                        animate={{ scaleY: [1, 2, 1, 3, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    />
                )}
            </div>

            {/* Mic Indicator */}
            {isSpeaking && (
                <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-slate-900 z-20 animate-pulse"
                />
            )}
        </div>
    );
}
