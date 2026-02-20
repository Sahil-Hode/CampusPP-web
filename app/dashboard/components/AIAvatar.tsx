"use client";

interface AIAvatarProps {
  isTyping?: boolean;
  isResponding?: boolean;
}

export default function AIAvatar({ isTyping, isResponding }: AIAvatarProps) {
  const status = isResponding
    ? "Responding"
    : isTyping
      ? "Listening"
      : "Ready";

  return (
    <div className="flex h-full w-full items-center justify-center rounded-3xl bg-gradient-to-br from-[#63D2F3] to-[#48BBDB] p-6">
      <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white/20 text-white">
        <span className="text-3xl font-black">AI</span>
        <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em]">
          {status}
        </span>
      </div>
    </div>
  );
}
