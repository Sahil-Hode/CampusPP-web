"use client";
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";

export interface MouthCue {
    start: number;
    end: number;
    value: string;
}

export interface LipsyncData {
    metadata: {
        soundFile: string;
        duration: number;
    };
    mouthCues: MouthCue[];
}

export interface Message {
    text: string;
    audio: string;
    animation: string;
    facialExpression: string;
    lipsync: LipsyncData | null;
    isDemoMode?: boolean;
}

interface ChatContextType {
    chat: (text: string) => Promise<void>;
    message: Message | null;
    onMessagePlayed: () => void;
    loading: boolean;
    cameraZoomed: boolean;
    setCameraZoomed: (zoomed: boolean) => void;
    isMicOn: boolean;
    setIsMicOn: (on: boolean) => void;
    liveText: string;
    backendOnline: boolean | null;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [message, setMessage] = useState<Message | null>(null);
    const [loading, setLoading] = useState(false);
    const [cameraZoomed, setCameraZoomed] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [liveText, setLiveText] = useState("");
    const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const w = window as any;
        const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0]?.transcript || "";
                if (event.results[i].isFinal) {
                    chat(transcript);
                } else {
                    interim += transcript;
                }
            }
            setLiveText(interim);
        };

        recognition.onend = () => {
            if (isMicOn) {
                try {
                    recognition.start();
                } catch (e) { }
            }
        };

        recognitionRef.current = recognition;
    }, [isMicOn]);

    useEffect(() => {
        if (!recognitionRef.current) return;
        if (isMicOn) {
            try {
                recognitionRef.current.start();
            } catch (e) { }
        } else {
            try {
                recognitionRef.current.stop();
            } catch (e) { }
        }
    }, [isMicOn]);

    const chat = useCallback(async (text: string) => {
        if (!text.trim()) return;
        setLoading(true);
        setLiveText("");

        const backendUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!backendUrl) {
            setBackendOnline(false);
            setMessage({
                text: `I'm your AI Mentor. You asked: "${text}"`,
                audio: "",
                animation: "Talking_1",
                facialExpression: "smile",
                lipsync: null,
                isDemoMode: true,
            });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
            });

            if (response.ok) {
                const data = await response.json();
                setMessage(data);
                setBackendOnline(true);
            } else {
                throw new Error("Backend offline");
            }
        } catch (error) {
            console.warn("Using demo mode because backend is unreachable:", error);
            setBackendOnline(false);
            setMessage({
                text: `I'm your AI Mentor. You asked: "${text}"`,
                audio: "",
                animation: "Talking_1",
                facialExpression: "smile",
                lipsync: null,
                isDemoMode: true,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const onMessagePlayed = useCallback(() => {
        setMessage(null);
    }, []);

    return (
        <ChatContext.Provider
            value={{
                chat,
                message,
                onMessagePlayed,
                loading,
                cameraZoomed,
                setCameraZoomed,
                isMicOn,
                setIsMicOn,
                liveText,
                backendOnline,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};
