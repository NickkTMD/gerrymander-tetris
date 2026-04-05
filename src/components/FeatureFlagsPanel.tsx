import type { FeatureFlags } from '../types/featureFlags';

interface FeatureFlagsPanelProps {
  flags: FeatureFlags;
  onToggle: (key: keyof FeatureFlags) => void;
  disabled?: boolean;
}

const FLAG_LABELS: Record<keyof FeatureFlags, string> = {
  periodicBottomClear: 'Clear bottom 5 rows every 5 pieces',
  sandMode: 'Sand mode: locked pieces crumble and fall',
};

export default function FeatureFlagsPanel({ flags, onToggle, disabled = false }: FeatureFlagsPanelProps) {
  return (
    <div className={`feature-flags-panel${disabled ? ' feature-flags-disabled' : ''}`}>
      <h2>Experiments</h2>
      {(Object.keys(FLAG_LABELS) as (keyof FeatureFlags)[]).map(key => (
        <label key={key} className="flag-toggle">
          <input
            type="checkbox"
            checked={flags[key]}
            onChange={() => onToggle(key)}
            disabled={disabled}
          />
          <span>{FLAG_LABELS[key]}</span>
        </label>
      ))}
    </div>
  );
}
