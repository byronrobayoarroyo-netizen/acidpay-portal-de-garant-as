import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LogOut, User, ChevronDown, LogIn, UserPlus } from 'lucide-react';

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await base44.auth.logout();
    } catch {
      /* ignore */
    }
    window.location.href = '/login';
  };

  // Logged out: show login/signup buttons
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <LogIn size={15} /> Iniciar sesión
        </Link>
        <Link
          to="/register"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={15} /> Registrarse
        </Link>
      </div>
    );
  }

  // Logged in: show user menu with logout
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-800">
          {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
          {user.full_name}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 z-50">
          <div className="px-3 py-2 border-b border-gray-50">
            <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <Link
            to="/configuracion"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <User size={15} /> Mi cuenta
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <LogOut size={15} /> {loggingOut ? 'Cerrando...' : 'Cerrar sesión'}
          </button>
        </div>
      )}
    </div>
  );
}