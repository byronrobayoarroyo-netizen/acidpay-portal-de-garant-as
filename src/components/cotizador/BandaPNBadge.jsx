import { COLORES_BANDA, getBandaConfig } from '@/lib/tarifarioPN';

/**
 * Muestra siempre la LETRA de la banda y su etiqueta de riesgo en texto.
 * El color nunca es el único portador de significado.
 */
export default function BandaPNBadge({ banda, size = 'sm' }) {
  const cfg = getBandaConfig(banda);
  const c = COLORES_BANDA[banda];
  if (!cfg || !c) return <span className="text-xs text-gray-500">—</span>;

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizes[size]}`}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
      Banda {cfg.banda}
      <span className="font-normal">· {cfg.etiqueta_riesgo}</span>
    </span>
  );
}