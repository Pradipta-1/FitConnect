"use client";

import React from "react";

export default function LiveNeonBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Base Gym Scene: Rich, atmospheric and dark gym environment */}
      <img
        src="/hero-bg.jpg"
        alt="Gym Atmosphere Background"
        className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.82] contrast-[1.04]"
      />

      {/* Subtle darkening tint overlay to deepen the background atmosphere */}
      <div className="absolute inset-0 bg-[#060907]/25 pointer-events-none" />

      {/* 2. Ceiling Neon Tubes (Geometric overhead light frames) */}
      <img
        src="/neon-ceiling-glow.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center mix-blend-screen neon-layer-ceiling"
      />

      {/* 3. PERFORMANCE ACADEMY (Electric Cyan Neon Sign) */}
      {/* Tube blackout / dip mask */}
      <img
        src="/neon-pa-dim.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center neon-dim-pa"
      />
      {/* Radiant glow & flare overlay */}
      <img
        src="/neon-pa-glow.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center mix-blend-screen neon-glow-pa"
      />

      {/* 4. THE GRIND (Intense Lime Green Neon Sign) */}
      {/* Tube blackout / dip mask */}
      <img
        src="/neon-grind-dim.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center neon-dim-grind"
      />
      {/* Radiant glow & flare overlay */}
      <img
        src="/neon-grind-glow.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center mix-blend-screen neon-glow-grind"
      />

      {/* 5. STRENGTH & CONDITIONING (Vibrant Green Neon Sign) */}
      {/* Tube blackout / dip mask */}
      <img
        src="/neon-sc-dim.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center neon-dim-sc"
      />
      {/* Radiant glow & flare overlay */}
      <img
        src="/neon-sc-glow.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center mix-blend-screen neon-glow-sc"
      />
    </div>
  );
}
