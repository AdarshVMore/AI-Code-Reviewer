export function AmbientGlow({ variant = 'default' }: { variant?: 'default' | 'live' }) {
  return (
    <div className="ambient-glow-layer" aria-hidden="true">
      <div
        className="ambient-blob ambient-blob--brand ambient-blob--a"
        style={{ width: 520, height: 520, top: '-8%', left: '8%' }}
      />
      <div
        className="ambient-blob ambient-blob--brand ambient-blob--b"
        style={{ width: 460, height: 460, top: '45%', right: '4%', opacity: 0.7 }}
      />
      {variant === 'live' && (
        <div
          className="ambient-blob ambient-blob--pulse ambient-blob--a"
          style={{ width: 380, height: 380, bottom: '-10%', left: '35%', opacity: 0.6 }}
        />
      )}
    </div>
  )
}
