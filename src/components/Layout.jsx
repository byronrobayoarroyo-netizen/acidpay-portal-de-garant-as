import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Shield, LayoutDashboard, Calculator, FileText, Receipt,
  AlertTriangle, Settings, Menu, X, ChevronDown, Building2
} from 'lucide-react';
import RoleBadge from './RoleBadge';
import { useCurrentUser, ROLE_LABELS, isAdmin, isBancoUser } from '@/lib/useCurrentUser';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin_acidpay', 'analista_riesgos', 'supervisor_banco'] },
  { path: '/cotizador', label: 'Cotizador', icon: Calculator, roles: ['admin_acidpay', 'oficial_comercial'] },
  { path: '/certificados', label: 'Certificados', icon: FileText, roles: ['admin_acidpay', 'analista_riesgos', 'oficial_comercial', 'supervisor_banco'] },
  { path: '/liquidaciones', label: 'Liquidaciones', icon: Receipt, roles: ['admin_acidpay', 'analista_riesgos', 'supervisor_banco'] },
  { path: '/casos-mora', label: 'Casos de Mora', icon: AlertTriangle, roles: ['admin_acidpay', 'analista_riesgos', 'oficial_comercial', 'supervisor_banco'] },
  { path: '/configuracion', label: 'Configuración', icon: Settings, roles: ['admin_acidpay'] },
];

export default function Layout() {
  const { user, loading } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ifiNombre, setIfiNombre] = useState(null);
  const location = useLocation();

  useEffect(() => {
    async function fetchIFI() {
      if (user?.ifi_id) {
        try {
          const ifi = await base44.entities.IFI.get(user.ifi_id);
          setIfiNombre(ifi?.nombre);
        } catch { /* ignore */ }
      }
    }
    fetchIFI();
  }, [user]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const navItems = NAV_ITEMS.filter(item => item.roles.includes(user?.tipo_usuario));

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - desktop */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-[#0A2342] text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1B4F8A] flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight">ACIDPAY</p>
            <p className="text-[10px] text-blue-300 tracking-wide uppercase">Portal de Garantías</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-blue-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} className={active ? 'text-[#3B82F6]' : ''} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-[10px] text-blue-300 truncate">{ROLE_LABELS[user?.tipo_usuario]}</p>
            </div>
          </div>
          {ifiNombre && (
            <div className="mt-2 px-3 py-2 bg-white/5 rounded-lg flex items-center gap-2">
              <Building2 size={14} className="text-blue-300" />
              <span className="text-xs text-blue-200 truncate">{ifiNombre}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-[#0A2342] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <span className="font-bold text-sm">ACIDPAY Portal</span>
          </div>
          <RoleBadge tipo={user?.tipo_usuario} />
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}