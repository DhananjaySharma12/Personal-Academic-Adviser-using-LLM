/**
 * Aurora background component (ReactBits-style).
 * Renders an animated radial gradient aurora effect behind hero sections.
 * Pure CSS animation — no canvas needed.
 */
export default function AuroraBackground({ children, className = '' }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Animated aurora blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full opacity-35 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #84A282 0%, transparent 70%)',
            animation: 'aurora1 8s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute -top-20 right-1/4 h-[500px] w-[500px] rounded-full opacity-30 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #B8CFB3 0%, transparent 70%)',
            animation: 'aurora2 10s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute top-40 left-1/2 h-[450px] w-[450px] -translate-x-1/2 rounded-full opacity-40 blur-[90px]"
          style={{
            background: 'radial-gradient(circle, #F6E2E9 0%, transparent 70%)',
            animation: 'aurora3 6s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      {children}

      <style>{`
        @keyframes aurora1 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(80px, -40px) scale(1.15); }
        }
        @keyframes aurora2 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-60px, 60px) scale(1.2); }
        }
        @keyframes aurora3 {
          0%   { transform: translateX(-50%) scale(1); }
          100% { transform: translateX(-50%) scale(1.3) translateY(-20px); }
        }
        @media (prefers-reduced-motion: reduce) {
          div[style*="aurora"] { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
