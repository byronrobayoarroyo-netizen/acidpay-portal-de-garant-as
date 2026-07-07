import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RoleBadge from './RoleBadge';
import { formatDate } from '@/lib/calculos';
import { Building2 } from 'lucide-react';

export default function UserListTable({ users }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Usuarios del Sistema</h2>
        <p className="text-xs text-gray-500 mt-0.5">{users.length} usuarios registrados</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="text-xs text-gray-500 uppercase">
            <TableHead className="px-5 py-3">Nombre</TableHead>
            <TableHead className="px-5 py-3">Email</TableHead>
            <TableHead className="px-5 py-3">Rol</TableHead>
            <TableHead className="px-5 py-3">IFI</TableHead>
            <TableHead className="px-5 py-3">Registro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id} className="border-b border-gray-50">
              <TableCell className="px-5 py-3 font-medium text-gray-900">{u.full_name || '—'}</TableCell>
              <TableCell className="px-5 py-3 text-gray-500">{u.email}</TableCell>
              <TableCell className="px-5 py-3"><RoleBadge tipo={u.tipo_usuario} /></TableCell>
              <TableCell className="px-5 py-3">
                {u.ifi_id ? (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <Building2 size={12} className="text-gray-400" /> Asignada
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell className="px-5 py-3 text-gray-500 text-xs">{formatDate(u.created_date)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}