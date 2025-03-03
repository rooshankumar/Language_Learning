"use client";

import React from "react";

interface AnimatedBackgroundProps {
  variant?: 'default' | 'purple' | 'pink' | 'blue'
  opacity?: number
  children?: React.ReactNode
  videoSrc?: string
  fallbackImage?: string
}

export function AnimatedBackground({ 
  variant = 'pink', 
  opacity = 0.3,
  children,
  videoSrc = "https://assets.mixkit.co/videos/preview/mixkit-night-sky-with-stars-at-a-calm-lake-time-lapse-53-large.mp4",
  fallbackImage = "/placeholder.jpg"
}: AnimatedBackgroundProps) {
  const getGradient = () => {
    switch (variant) {
      case 'purple':
        return 'bg-gradient-to-br from-indigo-900/40 to-purple-900/70'
      case 'blue':
        return 'bg-gradient-to-br from-blue-900/40 to-cyan-900/70'
      case 'pink':
        return 'bg-gradient-to-br from-pink-900/40 to-gray-900/70'
      default:
        return 'bg-gradient-to-br from-pink-900/40 to-gray-900/70'
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className={`absolute min-h-full min-w-full object-cover`}
          style={{ opacity: opacity }}
          poster={fallbackImage}
        >
          <source 
            src={videoSrc}
            type="video/mp4" 
          />
        </video>
        <div className={`absolute inset-0 ${getGradient()} backdrop-blur-sm`}></div>
      </div>
      {children}
    </>
  )
}