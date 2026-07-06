import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const u = await base44.auth.me();
        setUser({
          ...u,
          tipo_usuario: u.tipo_usuario || 'admin_acidpay',
          ifi_id: u.ifi_id || null,
          full_name: u.full_name || 'Administrador'
        });
      } catch {
        setUser({
          tipo_usuario: 'admin_acidpay',
          ifi_id: null,
          full_name: 'Administrador ACIDPAY'
        });
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  return { user, loading };
}

export const ROLE_LABELS = {
  admin_acidpay: 'Administrador ACIDPAY',
  analista_riesgos: 'Analista de Riesgos',
  oficial_comercial: 'Oficial Comercial',
  supervisor_banco: 'Supervisor de Banco'
};

export function isAdmin(user) {
  return user?.tipo_usuario === 'admin_acidpay' || user?.tipo_usuario === 'analista_riesgos';
}

export function isReadOnly(user) {
  return user?.tipo_usuario === 'analista_riesgos';
}

export function isBancoUser(user) {
  return user?.tipo_usuario === 'oficial_comercial' || user?.tipo_usuario === 'supervisor_banco';
}