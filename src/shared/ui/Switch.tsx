import { FOCUS_RING } from './control-class';

type SwitchProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

export function Switch({ checked, label, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${FOCUS_RING} ${checked ? 'bg-success' : 'bg-line-strong'}`}
    >
      <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-xs transition-transform duration-200 ease-out ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}
