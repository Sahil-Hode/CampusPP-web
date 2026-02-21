"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Camera,
  CameraOff,
  MessageSquareText,
  Mic,
  MicOff,
  PhoneOff,
  Users,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import Image from "next/image";

type Tile = {
  id: string;
  name: string;
  role: string;
  highlight?: boolean;
};

const participants: Tile[] = [
  { id: "student", name: "You", role: "Candidate", highlight: true },
  { id: "ai-1", name: "AI Interviewer 1", role: "Technical Panel" },
  { id: "ai-2", name: "AI Interviewer 2", role: "HR Panel" },
  { id: "ai-mentor", name: "AI Mentor", role: "Live Feedback" },
];

export default function MockInterviewPage() {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceError, setDeviceError] = useState("");
  const [hasStream, setHasStream] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [userName, setUserName] = useState("You");
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  async function startLocalMedia() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setDeviceError("Camera/microphone is not supported in this browser.");
      return;
    }

    try {
      setIsConnecting(true);
      setDeviceError("");

      // Start with no active devices; user enables mic/camera manually.
      streamRef.current = new MediaStream();
      setHasStream(true);
      setIsCamOn(false);
      setIsMicOn(false);
    } catch (error) {
      console.error("Failed to access media devices", error);
      setDeviceError("Please allow camera and microphone access to continue.");
      setHasStream(false);
    } finally {
      setIsConnecting(false);
    }
  }

  function stopLocalMedia() {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setHasStream(false);
  }

  useEffect(() => {
    startLocalMedia();
    return () => stopLocalMedia();
  }, []);

  useEffect(() => {
    async function fetchProfilePhoto() {
      try {
        const res = await apiRequest("/student/profile", { method: "GET" });
        const root = (res as Record<string, unknown>) || {};
        const data = ((root.data as Record<string, unknown>) || {}) as Record<string, unknown>;
        const photo = data.profilePhoto;
        const name = data.name;

        if (typeof photo === "string" && photo.trim()) setProfilePhoto(photo);
        if (typeof name === "string" && name.trim()) setUserName(name.trim());
      } catch (error) {
        console.error("Failed to fetch profile photo", error);
      }
    }

    fetchProfilePhoto();
  }, []);

  useEffect(() => {
    if (!localVideoRef.current || !streamRef.current) return;
    localVideoRef.current.srcObject = streamRef.current;
  }, [hasStream]);

  async function toggleMic() {
    if (!streamRef.current) return;

    if (isMicOn) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      setIsMicOn(false);
      return;
    }

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = micStream.getAudioTracks()[0];
      if (!audioTrack) return;

      streamRef.current.addTrack(audioTrack);
      setIsMicOn(true);
      setDeviceError("");
    } catch (error) {
      console.error("Failed to access microphone", error);
      setDeviceError("Microphone is off. Allow microphone access and try again.");
      setIsMicOn(false);
    }
  }

  async function toggleCamera() {
    if (!streamRef.current) return;

    if (isCamOn) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      setIsCamOn(false);
      return;
    }

    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = camStream.getVideoTracks()[0];
      if (!videoTrack) return;

      streamRef.current.addTrack(videoTrack);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }
      setIsCamOn(true);
      setDeviceError("");
    } catch (error) {
      console.error("Failed to access camera", error);
      setDeviceError("Camera is off. Allow camera access and try again.");
      setIsCamOn(false);
    }
  }

  function endCall() {
    stopLocalMedia();
    setIsMicOn(false);
    setIsCamOn(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-8">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Mock Interview Room
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mt-1">
          Live simulation layout with panel view and meeting controls.
        </p>
      </div>

      <section className="relative rounded-[2rem] border-2 border-slate-200 dark:border-zinc-800 bg-slate-900 dark:bg-black p-4 md:p-5 shadow-xl">
        {(isConnecting || deviceError) && (
          <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-xs font-semibold text-slate-200 flex items-center justify-between gap-3">
            <span>{isConnecting ? "Preparing interview room..." : deviceError}</span>
            {!isConnecting && (
              <button
                onClick={startLocalMedia}
                className="px-3 py-1.5 rounded-lg bg-[#63D2F3] text-slate-900 font-black uppercase tracking-wide text-[10px]"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {participants.map((person) => (
            <div
              key={person.id}
              className={`relative overflow-hidden rounded-2xl border ${
                person.highlight
                  ? "border-[#63D2F3]/70 bg-slate-800"
                  : "border-slate-700/80 bg-slate-800/95"
              } h-44 md:h-52`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,210,243,0.18),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(246,173,85,0.14),transparent_45%)]" />

              <div className="absolute top-3 right-3">
                <span className="text-[10px] px-2 py-1 rounded-full bg-black/40 text-slate-100 font-bold uppercase tracking-wider">
                  {person.role}
                </span>
              </div>

              {person.id === "student" && hasStream ? (
                <>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`absolute inset-0 w-full h-full object-cover ${isCamOn ? "opacity-100" : "opacity-0"}`}
                  />
                  {!isCamOn && (
                    <div className="relative h-full flex flex-col items-center justify-center px-4">
                      {profilePhoto ? (
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-300/70 mb-3">
                          <Image
                            src={profilePhoto}
                            alt={`${userName} profile`}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-700 border border-slate-500 grid place-items-center mb-3">
                          <CameraOff size={28} className="text-slate-100" />
                        </div>
                      )}
                      <p className="text-sm md:text-base text-white font-bold text-center">
                        {userName}
                      </p>
                    </div>
                  )}
                  <div className="absolute left-3 bottom-3 text-[11px] px-2 py-1 rounded-md bg-black/45 text-white font-bold">
                    {userName}
                  </div>
                </>
              ) : (
                <div className="relative h-full flex flex-col items-center justify-center px-4">
                  <div className="w-16 h-16 rounded-full bg-slate-700 border border-slate-500 grid place-items-center mb-3">
                    <Bot size={28} className="text-slate-100" />
                  </div>
                  <p className="text-sm md:text-base text-white font-bold text-center">
                    {person.name}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {isParticipantsOpen && (
          <div className="absolute right-4 top-4 z-30 w-64 rounded-2xl border border-slate-600 bg-slate-800/95 backdrop-blur-sm shadow-2xl">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-slate-200">
                Participants
              </p>
              <span className="text-[10px] font-bold text-slate-400">{participants.length}</span>
            </div>
            <div className="p-2.5 space-y-2 max-h-64 overflow-y-auto">
              {participants.map((person) => {
                const isSelf = person.id === "student";
                return (
                  <div
                    key={`list-${person.id}`}
                    className={`rounded-xl px-3 py-2.5 border ${
                      isSelf
                        ? "border-[#63D2F3]/70 bg-[#63D2F3]/10"
                        : "border-slate-700 bg-slate-900/70"
                    }`}
                  >
                    <p className="text-sm font-bold text-white">
                      {isSelf ? "You" : person.name}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400">
                      {isSelf ? userName : person.role}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 md:mt-6 flex items-center justify-center gap-2 md:gap-3 flex-wrap">
          <button
            onClick={toggleMic}
            disabled={!hasStream}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-full grid place-items-center transition ${
              isMicOn ? "bg-slate-700 text-white" : "bg-red-500 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isMicOn ? "Mute mic" : "Unmute mic"}
          >
            {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          <button
            onClick={toggleCamera}
            disabled={!hasStream}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-full grid place-items-center transition ${
              isCamOn ? "bg-slate-700 text-white" : "bg-red-500 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isCamOn ? "Turn camera off" : "Turn camera on"}
          >
            {isCamOn ? <Camera size={18} /> : <CameraOff size={18} />}
          </button>

          <button
            className="w-10 h-10 md:w-11 md:h-11 rounded-full grid place-items-center bg-slate-700 text-white"
            aria-label="Open chat"
          >
            <MessageSquareText size={18} />
          </button>

          <button
            onClick={() => setIsParticipantsOpen((prev) => !prev)}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-full grid place-items-center text-white ${
              isParticipantsOpen ? "bg-[#63D2F3] text-slate-900" : "bg-slate-700"
            }`}
            aria-label="Participants"
          >
            <Users size={18} />
          </button>

          <button
            className="px-4 h-10 md:h-11 rounded-full inline-flex items-center gap-2 bg-red-500 text-white font-black text-xs uppercase tracking-wide"
            aria-label="End call"
            onClick={endCall}
          >
            <PhoneOff size={16} />
            End
          </button>
        </div>
      </section>
    </div>
  );
}
