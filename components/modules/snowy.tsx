"use client";

import React from "react";

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  opacity: number;
  size: number;
  delay: number;
  drift: number;
}

// Generate snowflakes once at module level
const generateSnowflakes = (): Snowflake[] => {
  return Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDuration: Math.random() * 3 + 2, // 2-5 seconds
    opacity: Math.random() * 0.6 + 0.4, // 0.4-1.0
    size: Math.random() * 4 + 2, // 2-6px
    delay: Math.random() * 5, // 0-5 seconds delay
    drift: Math.random() * 100 - 50, // -50 to 50px drift
  }));
};

const SNOWFLAKES = generateSnowflakes();

export function Snowy() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {SNOWFLAKES.map((flake) => (
        <div
          key={flake.id}
          className="absolute"
          style={{
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animation: `fall-${flake.id} ${flake.animationDuration}s linear infinite`,
            animationDelay: `${flake.delay}s`,
          }}
        >
          <div
            className="w-full h-full rounded-full bg-white shadow-sm"
            style={{
              boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
            }}
          />
          <style jsx>{`
            @keyframes fall-${flake.id} {
              0% {
                transform: translateY(-10vh) translateX(0);
              }
              100% {
                transform: translateY(110vh) translateX(${flake.drift}px);
              }
            }
          `}</style>
        </div>
      ))}
    </div>
  );
}
