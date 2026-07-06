import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/calculos';

const IFI_COLORS = ['#0A2342', '#1B4F8A', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#1E40AF', '#1E3A8A'];

export default function GarantizadoPorMesChart({ certificados }) {
  // Build data grouped by month and IFI
  const mesesSet = new Set();
  const ifiSet = new Set();
  const dataMap = {};

  certificados.forEach(c => {
    if (!c || !c.mes_liquidacion) return;
    const mes = c.mes_liquidacion;
    const ifi = c.ifi_nombre || 'Sin IFI';
    mesesSet.add(mes);
    ifiSet.add(ifi);

    if (!dataMap[mes]) dataMap[mes] = { mes };
    dataMap[mes][ifi] = (dataMap[mes][ifi] || 0) + (c.monto_garantizado || 0);
  });

  const meses = [...mesesSet].sort();
  const ifis = [...ifiSet];

  const data = meses.map(m => ({
    ...dataMap[m],
    mesLabel: getMesLabel(m),
  }));

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
        <p className="text-sm text-gray-400">No hay datos de certificados para graficar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Monto Garantizado por Mes e IFI</h2>
        <p className="text-xs text-gray-500 mt-0.5">Volumen de negocio emitido (USD)</p>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mesLabel" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {ifis.map((ifi, idx) => (
              <Bar key={ifi} dataKey={ifi} stackId="a" fill={IFI_COLORS[idx % IFI_COLORS.length]} radius={idx === ifis.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function getMesLabel(mes) {
  const [year, month] = mes.split('-');
  const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const idx = parseInt(month) - 1;
  return `${names[idx] || month} ${year.slice(2)}`;
}