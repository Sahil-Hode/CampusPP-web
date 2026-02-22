"use client";

import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface AnimatedAvatarProps {
    /** Avatar name shown below (e.g. "AI Interviewer 1") */
    name?: string;
    /** Role label shown in badge (e.g. "Technical Panel") */
    role?: string;
    /** Color accent for ring / glow. Defaults to cyan (#63D2F3) */
    accentColor?: string;
    /** When true the avatar animates mouth, glows, and zooms slightly */
    isSpeaking: boolean;
    /** Optional avatar image URL. Falls back to a generated SVG face. */
    avatarUrl?: string;
    /** Size in pixels of the avatar circle. Defaults to 96 */
    size?: number;
}

/* ─────────────────────────────────────────────
   INLINE SVG FACE (fallback — no external img)
   A clean, gender-neutral humanoid AI face.
───────────────────────────────────────────── */
function AIFaceSVG({ size = 96 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {/* Head */}
            <circle cx="50" cy="50" r="46" fill="url(#faceGrad)" />
            {/* Neck */}
            <rect x="41" y="88" width="18" height="12" rx="6" fill="#60a5fa" opacity="0.6" />
            {/* Hair */}
            <ellipse cx="50" cy="18" rx="28" ry="14" fill="#1e40af" />
            <rect x="22" y="18" width="8" height="18" rx="4" fill="#1e40af" />
            <rect x="70" y="18" width="8" height="18" rx="4" fill="#1e40af" />
            {/* Eyes container */}
            <g className="avatar-eye-left">
                <ellipse cx="35" cy="46" rx="7" ry="8" fill="white" />
                <circle cx="35" cy="47" r="4.5" fill="#1e3a5f" />
                <circle cx="35" cy="47" r="2.5" fill="#0c1a2e" />
                <circle cx="37" cy="45" r="1.2" fill="white" />
            </g>
            <g className="avatar-eye-right">
                <ellipse cx="65" cy="46" rx="7" ry="8" fill="white" />
                <circle cx="65" cy="47" r="4.5" fill="#1e3a5f" />
                <circle cx="65" cy="47" r="2.5" fill="#0c1a2e" />
                <circle cx="67" cy="45" r="1.2" fill="white" />
            </g>
            {/* Eyebrows */}
            <path d="M29 36 Q35 33 41 36" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M59 36 Q65 33 71 36" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Nose */}
            <path d="M50 52 Q47 60 50 63 Q53 60 50 52" stroke="#93c5fd" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            {/* Mouth — animated via CSS class when speaking */}
            <g id="avatar-mouth">
                <path
                    d="M40 72 Q50 78 60 72"
                    stroke="#93c5fd"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                />
            </g>
            {/* Cheeks */}
            <ellipse cx="28" cy="60" rx="7" ry="4" fill="#bfdbfe" opacity="0.35" />
            <ellipse cx="72" cy="60" rx="7" ry="4" fill="#bfdbfe" opacity="0.35" />
            {/* Collar / shirt */}
            <path d="M25 96 Q30 88 42 91 L50 95 L58 91 Q70 88 75 96" fill="#1d4ed8" opacity="0.8" />
            {/* Gradient def */}
            <defs>
                <radialGradient id="faceGrad" cx="40%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#dbeafe" />
                    <stop offset="70%" stopColor="#93c5fd" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </radialGradient>
            </defs>
        </svg>
    );
}

/* ─────────────────────────────────────────────
   MOUTH WAVE — animated bar equalizer
   shown below the avatar when isSpeaking
───────────────────────────────────────────── */
function MouthWave({ isSpeaking }: { isSpeaking: boolean }) {
    const bars = [3, 6, 10, 7, 4, 8, 5];
    return (
        <div
            className="flex items-end gap-[2px] h-5 justify-center"
            aria-hidden="true"
            style={{ opacity: isSpeaking ? 1 : 0.3, transition: "opacity 0.4s ease" }}
        >
            {bars.map((baseH, i) => (
                <div
                    key={i}
                    style={{
                        width: 3,
                        height: isSpeaking ? undefined : 4,
                        borderRadius: 99,
                        background: "linear-gradient(to top, #38bdf8, #818cf8)",
                        animation: isSpeaking
                            ? `avatarBar${(i % 3) + 1} ${0.5 + i * 0.07}s ease-in-out infinite alternate`
                            : "none",
                        minHeight: 4,
                        maxHeight: 20,
                    }}
                />
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function AnimatedAvatar({
    name = "AI Interviewer",
    role = "Panel",
    accentColor = "#63D2F3",
    isSpeaking,
    avatarUrl,
    size = 96,
}: AnimatedAvatarProps) {
    /* Auto-blink every 3–4 seconds */
    const [isBlinking, setIsBlinking] = useState(false);
    const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        function scheduleBlink() {
            const delay = 3000 + Math.random() * 1500; // 3–4.5 s
            blinkTimer.current = setTimeout(() => {
                setIsBlinking(true);
                setTimeout(() => {
                    setIsBlinking(false);
                    scheduleBlink();
                }, 140); // blink duration
            }, delay);
        }
        scheduleBlink();
        return () => {
            if (blinkTimer.current) clearTimeout(blinkTimer.current);
        };
    }, []);

    /* Glow color with opacity variants */
    const glowShadow = isSpeaking
        ? `0 0 0 3px ${accentColor}55, 0 0 24px 6px ${accentColor}44, 0 0 48px 12px ${accentColor}22`
        : `0 0 0 2px ${accentColor}30`;

    return (
        <div className="flex flex-col items-center gap-2 select-none">
            {/* Floating + scale wrapper */}
            <div
                style={{
                    animation: "avatarFloat 3.6s ease-in-out infinite",
                    transform: isSpeaking ? "scale(1.045)" : "scale(1)",
                    transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                }}
            >
                {/* Glow ring */}
                <div
                    style={{
                        borderRadius: "50%",
                        boxShadow: glowShadow,
                        transition: "box-shadow 0.5s ease",
                        padding: 4,
                        background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
                    }}
                >
                    {/* Avatar image or SVG face */}
                    <div
                        style={{
                            width: size,
                            height: size,
                            borderRadius: "50%",
                            overflow: "hidden",
                            position: "relative",
                            background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
                            border: `2px solid ${accentColor}50`,
                        }}
                    >
                        {/* Blink overlay */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
                                zIndex: 10,
                                borderRadius: "50%",
                                opacity: isBlinking ? 1 : 0,
                                transition: "opacity 0.06s linear",
                                pointerEvents: "none",
                            }}
                        />

                        {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={avatarUrl}
                                alt={name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "100%",
                                    height: "100%",
                                }}
                            >
                                <AIFaceSVG size={size - 4} />
                            </div>
                        )}

                        {/* Speaking shimmer sweep */}
                        {isSpeaking && (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                        "linear-gradient(120deg, transparent 30%, rgba(99,210,243,0.18) 50%, transparent 70%)",
                                    animation: "avatarShimmer 1.6s linear infinite",
                                    borderRadius: "50%",
                                    pointerEvents: "none",
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Mouth wave / equalizer */}
            <MouthWave isSpeaking={isSpeaking} />

            {/* Mic status dot */}
            <div className="flex items-center gap-1.5">
                <span
                    style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: isSpeaking ? "#22c55e" : "#71717a",
                        boxShadow: isSpeaking ? "0 0 8px 2px #22c55e88" : "none",
                        transition: "background 0.3s, box-shadow 0.3s",
                        animation: isSpeaking ? "micPulse 1s ease-in-out infinite" : "none",
                    }}
                />
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: isSpeaking ? "#22c55e" : "#71717a",
                        transition: "color 0.3s",
                        letterSpacing: "0.03em",
                    }}
                >
                    {isSpeaking ? "Speaking" : "Silent"}
                </span>
            </div>

            {/* Name & role */}
            <div className="text-center leading-tight">
                <p
                    style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "white",
                        margin: 0,
                    }}
                >
                    {name}
                </p>
                <p
                    style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#94a3b8",
                        margin: 0,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                    }}
                >
                    {role}
                </p>
            </div>
        </div>
    );
}
