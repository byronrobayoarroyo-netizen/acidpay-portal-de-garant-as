import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser, isAdmin, isBancoUser } from '@/lib/useCurrentUser';
import { FileText, Search, Download, Building2, Filter } from 'lucide-react';
import BandaBadge from '@/components/BandaBadge';
import EstadoBadge from '@/components/EstadoBadge';
import { formatCurrency, formatDate } from '@/lib/calculos';

export default function Certificados() {
  const { user } = useCurrentUser();
  const [certificados, setCertificados] = useState([]);
  const [ifis, setIfis] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filtroIfi, setFiltroIfi] = useState('all');
  const [filtroBanda, setFiltroBanda] = useState('all');
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [filtroSegmento, setFiltroSegmento] = useState('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [certs, ifiList] = await Promise.all([
          base44.entities.Certificado.list('-fecha_emision', 200),
          isAdmin(user) ? base44.entities.IFI.list() : Promise.resolve([])
        ]);

        let filtered = certs;
        if (isBancoUser(user) && user.ifi_id) {
          filtered = certs.filter(c => c.ifi_id === user.ifi_id);
        }

        setCertificados(filtered);
        setIfis(ifiList);
      } catch (e) {
        console.error('Error loading certificados:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const filtered = certificados.filter(c => {
    if (search && !`${c.cliente_nombre} ${c.cliente_cedula} ${c.numero}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filtroIfi !== 'all' && c.ifi_id !== filtroIfi) return false;
    if (filtroBanda !== 'all' && c.banda !== filtroBanda) return false;
    if (filtroEstado !== 'all' && c.estado !== filtroEstado) return false;
    if (filtroSegmento !== 'all' && c.segmento !== filtroSegmento) return false;
    return true;
  });

  const exportCSV = () => {
    const headers = ['Número', 'IFI', 'Cliente', 'Cédula', 'Segmento', 'Monto Crédito', 'Banda', 'Monto Garantizado', 'Prima', 'Tasa Total', 'Estado', 'Fecha Emisión'];
    const rows = filtered.map(c => [
      c.numero, c.ifi_nombre, c.cliente_nombre, c.cliente_cedula, c.segmento,
      c.monto_credito, c.banda, c.monto_garantizado, c.prima_valor, c.tasa_total, c.estado, c.fecha_emision
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'certificados_acidpay.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-800 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificados</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} certificados</p>
        </div>
        <button onClick={exportCSV} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Buscar por cliente, cédula o número..." />
          </div>
          {isAdmin(user) && (
            <select value={filtroIfi} onChange={e => setFiltroIfi(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Todas las IFIs</option>
              {ifis.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
            </select>
          )}
          <select value={filtroBanda} onChange={e => setFiltroBanda(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Todas las bandas</option>
            <option value="A">Banda A</option>
            <option value="B">Banda B</option>
            <option value="C">Banda C</option>
            <option value="D">Banda D</option>
            <option value="E">Banda E</option>
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Todos los estados</option>
            <option value="vigente">Vigente</option>
            <option value="cancelado">Cancelado</option>
            <option value="en_mora">En mora</option>
            <option value="ejecutado">Ejecutado</option>
            <option value="vencido">Vencido</option>
          </select>
          <select value={filtroSegmento} onChange={e => setFiltroSegmento(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Todos los segmentos</option>
            <option value="Persona Natural">Persona Natural</option>
            <option value="PYME">PYME</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left">Número</th>
                {isAdmin(user) && <th className="px-4 py-3 text-left">IFI</th>}
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Segmento</th>
                <th className="px-4 py-3 text-right">Monto Garantizado</th>
                <th className="px-4 py-3 text-center">Banda</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isAdmin(user) ? 8 : 7} className="px-4 py-12 text-center text-gray-400">
                  <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                  No se encontraron certificados
                </td></tr>
              ) : filtered.map(cert => (
                <tr key={cert.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/certificados/${cert.id}`}>
                  <td className="px-4 py-3 font-mono text-xs text-blue-900 font-medium">{cert.numero}</td>
                  {isAdmin(user) && <td className="px-4 py-3 text-gray-600">{cert.ifi_nombre}</td>}
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{cert.cliente_nombre}</p>
                    <p className="text-xs text-gray-400">{cert.cliente_cedula}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{cert.segmento}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(cert.monto_garantizado)}</td>
                  <td className="px-4 py-3 text-center"><BandaBadge banda={cert.banda} showLabel={false} /></td>
                  <td className="px-4 py-3 text-center"><EstadoBadge estado={cert.estado} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(cert.fecha_emision)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}