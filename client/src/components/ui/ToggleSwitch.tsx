'use client'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (val: boolean) => void
  label: string
  description?: string
}

export default function ToggleSwitch({ checked, onChange, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-bg-border/60 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && (
          <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-10 h-5 rounded-full transition-all duration-200 focus:outline-none ${
          checked ? 'bg-brand glow-brand-sm' : 'bg-bg-border'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5 bg-bg-base' : 'translate-x-0 bg-text-tertiary'
          }`}
        />
      </button>
    </div>
  )
}
