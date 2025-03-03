
"use client";

import React from "react";

interface AnimatedBackgroundProps {
  videoSrc: string;
  fallbackImage?: string;
  opacity?: number;
}

export function AnimatedBackground({ 
  videoSrc, 
  fallbackImage = "/placeholder.jpg",
  opacity = 0.2
}: AnimatedBackgroundProps) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className={`absolute min-h-full min-w-full object-cover opacity-${opacity * 100}`}
        poster={fallbackImage}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm"></div>
    </div>
  );
}
