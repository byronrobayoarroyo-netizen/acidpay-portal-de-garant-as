import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser, isAdmin, isBancoUser } from '@/lib/useCurrentUser';
import { Building2, Users, Shield, Plus, Save, X, Edit3, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/calculos';

export default function Configuracion() {
  const { user } = useCurrentUser();
  const [ifis, setIfis] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ifis');
  const [editingIfi, setEditingIfi] = useState(null);
  const [savingIfi, setSavingIfi] = useState(false);

  // New IFI form
  const blankIfi = { nombre: '', codigo: '', tipo: 'Banco', estado: 'activa', cupo_garantia: '', tasa_base: '', fecha_adhesion: '', logo_iniciales: '', color_hex: '#1B4F8A' };
  const [ifiForm, setIfiForm] = useState(blankIfi);

  useEffect(() => {
    async function loadData() {
      try {
        const [ifiList, userList] = await Promise.all([
          base44.entities.IFI.list(),
          base44.entities.User.list()
        ]);
        setIfis(ifiList);
        setUsers(userList);
      } catch (e) {
        console.error('Error loading config:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveIfi = async () => {
    if (!ifiForm.nombre || !ifiForm.codigo) return;
    setSavingIfi(true);
    try {
      const data = {
        ...ifiForm,
        cupo_garantia: parseFloat(ifiForm.cupo_garantia) || 0,
        tasa_base: parseFloat(ifiForm.tasa_base) || 12,
        logo_iniciales: ifiForm.logo_iniciales || ifiForm.nombre.substring(0, 2).toUpperCase()
      };
      if (editingIfi) {
        await base44.entities.IFI.update(editingIfi, data);
      } else {
        await base44.entities.IFI.create(data);
      }
      const list = await base44.entities.IFI.list();
      setIfis(list);
      setIfiForm(blankIfi);
      setEditingIfi(null);
    } catch (e) {
      console.error('Error saving IFI:', e);
    } finally {
      setSavingIfi(false);
    }
  };

  const handleEditIfi = (ifi) => {
    setEditingIfi(ifi.id);
    setIfiForm({
      nombre: ifi.nombre || '',
      codigo: ifi.codigo || '',
      tipo: ifi.tipo || 'Banco',
      estado: ifi.estado || 'activa',
      cupo_garantia: ifi.cupo_garantia?.toString() || '',
      tasa_base: ifi.tasa_base?.toString() || '',
      fecha_adhesion: ifi.fecha_adhesion || '',
      logo_iniciales: ifi.logo_iniciales || '',
      color_hex: ifi.color_hex || '#1B4F8A'
    });
  };

  const handleUpdateUserRole = async (userId, tipoUsuario, ifiId) => {
    try {
      await base44.entities.User.update(userId, {
        tipo_usuario: tipoUsuario,
        ifi_id: ifiId || null,
        ifi_nombre: ifis.find(i => i.id === ifiId)?.nombre || null
      });
      const list = await base44.entities.User.list();
      setUsers(list);
    } catch (e) {
      console.error('Error updating user:', e);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-800 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">Gestión de IFIs y usuarios</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-lg border border-gray-100 p-1 w-fit">
        <button onClick={() => setTab('ifis')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'ifis' ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Building2 size={14} className="inline mr-1.5" /> IFIs
        </button>
        <button onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'users' ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Users size={14} className="inline mr-1.5" /> Usuarios
        </button>
      </div>

      {tab === 'ifis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* IFI Form */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 text-sm">{editingIfi ? 'Editar IFI' : 'Nueva IFI'}</h2>
              {editingIfi && (
                <button onClick={() => { setEditingIfi(null); setIfiForm(blankIfi); }} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input value={ifiForm.nombre} onChange={e => setIfiForm({ ...ifiForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
                <input value={ifiForm.codigo} onChange={e => setIfiForm({ ...ifiForm, codigo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="BP" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                  <select value={ifiForm.tipo} onChange={e => setIfiForm({ ...ifiForm, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Banco</option>
                    <option>Tarjeta de Crédito</option>
                    <option>Cooperativa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                  <select value={ifiForm.estado} onChange={e => setIfiForm({ ...ifiForm, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="activa">Activa</option>
                    <option value="suspendida">Suspendida</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cupo garantía (USD)</label>
                  <input type="number" value={ifiForm.cupo_garantia} onChange={e => setIfiForm({ ...ifiForm, cupo_garantia: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="5000000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tasa base (%)</label>
                  <input type="number" step="0.01" value={ifiForm.tasa_base} onChange={e => setIfiForm({ ...ifiForm, tasa_base: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="12.00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha adhesión</label>
                <input type="date" value={ifiForm.fecha_adhesion} onChange={e => setIfiForm({ ...ifiForm, fecha_adhesion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={handleSaveIfi} disabled={!ifiForm.nombre || !ifiForm.codigo || savingIfi}
                className="w-full py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
                {savingIfi ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Guardando...</> : <><Save size={14} /> {editingIfi ? 'Actualizar' : 'Crear'} IFI</>}
              </button>
            </div>
          </div>

          {/* IFI List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left">IFI</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-right">Cupo</th>
                    <th className="px-4 py-3 text-right">Tasa Base</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {ifis.map(ifi => (
                    <tr key={ifi.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: ifi.color_hex || '#1B4F8A' }}>
                            {ifi.logo_iniciales || ifi.codigo}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{ifi.nombre}</p>
                            <p className="text-xs text-gray-400">{ifi.codigo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{ifi.tipo}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(ifi.cupo_garantia)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{ifi.tasa_base}%</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ifi.estado === 'activa' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {ifi.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleEditIfi(ifi)} className="text-blue-600 hover:text-blue-700 p-1">
                          <Edit3 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Usuarios del Sistema</h2>
            <p className="text-xs text-gray-500 mt-1">Asigne rol y IFI a cada usuario. Use "Invitar usuario" para agregar nuevos.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Rol</th>
                  <th className="px-4 py-3 text-left">IFI</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <select value={u.tipo_usuario || 'oficial_comercial'} onChange={e => handleUpdateUserRole(u.id, e.target.value, u.ifi_id)}
                        className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="admin_acidpay">Admin ACIDPAY</option>
                        <option value="analista_riesgos">Analista de Riesgos</option>
                        <option value="supervisor_banco">Supervisor de Banco</option>
                        <option value="oficial_comercial">Oficial Comercial</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select value={u.ifi_id || ''} onChange={e => handleUpdateUserRole(u.id, u.tipo_usuario, e.target.value)}
                        className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[180px]">
                        <option value="">— Sin IFI —</option>
                        {ifis.map(ifi => <option key={ifi.id} value={ifi.id}>{ifi.nombre}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}