'use client';

import React from 'react';

interface WheelPointerProps {
  /** Current deflection angle from physics simulation (degrees) */
  angle?: number;
}

export function WheelPointer({ angle = 0 }: WheelPointerProps) {
  return (
    <div
      className="absolute top-0 left-1/2 z-20"
      style={{
        transform: `translateX(-50%) translateY(-32px) rotate(${angle}deg)`,
        transformOrigin: 'center top',
        transition: 'none',
        willChange: 'transform',
      }}
    >
      <svg
        width="32"
        height="40"
        viewBox="0 0 32 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Pointer body gradient */}
          <linearGradient id="pointerBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3a3a48" />
            <stop offset="50%" stopColor="#2a2a35" />
            <stop offset="100%" stopColor="#1a1a24" />
          </linearGradient>
          {/* Jewel radial gradient */}
          <radialGradient id="jewel" cx="40%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#4a4a58" />
            <stop offset="60%" stopColor="#2a2a35" />
            <stop offset="100%" stopColor="#1a1a24" />
          </radialGradient>
        </defs>

        {/* Shadow layer */}
        <path
          d="M16 40 L5 9 Q7.5 2.5 16 0.5 Q24.5 2.5 27 9 Z"
          fill="rgba(0,0,0,0.18)"
          transform="translate(0.5, 0.5)"
        />

        {/* Pointer body */}
        <path
          d="M16 40 L5 9 Q7.5 2.5 16 0.5 Q24.5 2.5 27 9 Z"
          fill="url(#pointerBody)"
          stroke="#1a1a24"
          strokeWidth="0.5"
        />

        {/* Edge highlight */}
        <path
          d="M14 9 Q15 3 16 0.5 Q7.5 2.5 5 9 L16 40 Z"
          fill="rgba(255,255,255,0.06)"
        />

        {/* Decorative center score line */}
        <line
          x1="16"
          y1="12"
          x2="16"
          y2="34"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.5"
        />

        {/* Purple jewel at pivot */}
        <circle cx="16" cy="5" r="4.5" fill="url(#jewel)" stroke="#1a1a24" strokeWidth="0.5" />
        {/* Jewel specular highlight */}
        <circle cx="15" cy="3.8" r="1.8" fill="rgba(255,255,255,0.35)" />
        {/* Jewel catchlight */}
        <circle cx="14.5" cy="3.2" r="0.7" fill="rgba(255,255,255,0.6)" />
      </svg>
    </div>
  );
}
