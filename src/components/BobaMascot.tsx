"use client";

import Image from "next/image";

interface BobaMascotProps {
  isSearching: boolean;
  size?: number;
}

export function BobaMascot({ isSearching, size = 48 }: BobaMascotProps) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Blue circle loader */}
      <svg
        className={`absolute inset-0 ${isSearching ? "animate-circle-progress" : "opacity-0"}`}
        viewBox="0 0 100 100"
        style={{ width: size, height: size }}
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="283"
          strokeDashoffset="283"
          className={isSearching ? "animate-circle-draw" : ""}
          style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
        />
      </svg>

      {/* Mascot image */}
      <div
        className={`relative z-10 ${isSearching ? "animate-mascot-spin" : ""}`}
        style={{ width: size, height: size }}
      >
        <Image
          src="/boba-mascot.png"
          alt="Boba mascot"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}







