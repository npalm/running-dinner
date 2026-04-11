const EMOJIS = ['🍽️', '🥗', '🍲', '🍮', '🍴', '🥄', '🧑‍🍳', '🏃', '🍷', '🥂']

interface FloatingEmoji {
  emoji: string
  x: number      // % from left
  delay: number  // animation delay in seconds
  duration: number
  size: number   // rem
}

// Generate fixed positions so they don't shift on re-render
const FLOATERS: FloatingEmoji[] = EMOJIS.map((emoji, i) => ({
  emoji,
  x: 5 + (i * 9.5) % 90,
  delay: (i * 0.4) % 2.5,
  duration: 2.5 + (i * 0.3) % 1.5,
  size: 1.4 + (i * 0.15) % 0.8,
}))

export function MapLoadingOverlay({ label }: { label: string }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden"
      style={{ zIndex: 1000 }}
    >
      {/* Frosted backdrop */}
      <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/75 backdrop-blur-sm" />

      {/* Floating food emojis */}
      {FLOATERS.map(({ emoji, x, delay, duration, size }, i) => (
        <span
          key={i}
          className="absolute bottom-0 select-none"
          style={{
            left: `${x}%`,
            fontSize: `${size}rem`,
            animationName: 'floatUp',
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationFillMode: 'both',
            opacity: 0,
          }}
        >
          {emoji}
        </span>
      ))}

      {/* Central message */}
      <div className="relative z-10 flex flex-col items-center gap-3 rounded-2xl bg-white/90 dark:bg-gray-800/90 px-8 py-5 shadow-xl backdrop-blur-sm">
        <div className="flex gap-2 text-2xl">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🍽️</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>🏃</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🗺️</span>
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">
          {label}
        </p>
        {/* Progress bar */}
        <div className="w-40 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500"
            style={{
              animationName: 'progressPulse',
              animationDuration: '1.8s',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1);   opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(-120vh) scale(0.8); opacity: 0; }
        }
        @keyframes progressPulse {
          0%   { width: 15%; }
          50%  { width: 85%; }
          100% { width: 15%; }
        }
      `}</style>
    </div>
  )
}
