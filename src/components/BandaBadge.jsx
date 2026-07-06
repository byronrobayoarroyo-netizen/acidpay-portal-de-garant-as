import { TARIFARIO } from '@/lib/tarifario';

export default function BandaBadge({ banda, showLabel = true, size = 'sm' }) {
  const params = TARIFARIO[banda];
  if (!params) return <span className="text-xs text-gray-400">—</span>;

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizes[size]}`}
      style={{ backgroundColor: params.bg, color: params.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: params.color }} />
      Banda {banda}
      {showLabel && <span className="font-normal opacity-75">· {params.label}</span>}
    </span>
  );
}