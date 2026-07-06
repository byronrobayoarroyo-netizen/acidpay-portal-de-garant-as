import { ESTADOS_CERTIFICADO, ESTADOS_MORA, ESTADOS_LIQUIDACION } from '@/lib/tarifario';

export default function EstadoBadge({ estado, tipo = 'certificado', size = 'sm' }) {
  const map = tipo === 'mora' ? ESTADOS_MORA : tipo === 'liquidacion' ? ESTADOS_LIQUIDACION : ESTADOS_CERTIFICADO;
  const params = map[estado];
  if (!params) return <span className="text-xs text-gray-400">—</span>;

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizes[size]}`}
      style={{ backgroundColor: params.bg, color: params.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: params.color }} />
      {params.label}
    </span>
  );
}