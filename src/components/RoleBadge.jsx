import { ROLE_LABELS } from '@/lib/useCurrentUser';

export default function RoleBadge({ tipo }) {
  const labels = {
    admin_acidpay: { label: 'Admin ACIDPAY', bg: '#DBEAFE', text: '#1E40AF' },
    analista_riesgos: { label: 'Analista de Riesgos', bg: '#E0E7FF', text: '#4338CA' },
    oficial_comercial: { label: 'Oficial Comercial', bg: '#FEF3C7', text: '#B45309' },
    supervisor_banco: { label: 'Supervisor de Banco', bg: '#D1FAE5', text: '#065F46' }
  };

  const p = labels[tipo] || labels.admin_acidpay;

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: p.bg, color: p.text }}
    >
      {p.label}
    </span>
  );
}