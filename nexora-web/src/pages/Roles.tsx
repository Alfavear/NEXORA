import { useState, useEffect } from 'react';
import { rolesApi } from '../api/roles';
import type { Role } from '../api/roles';
import { X } from 'lucide-react';

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await rolesApi.list();
      setRoles(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    try {
      if (editingRole) {
        await rolesApi.update(editingRole.id, { name: roleName });
      } else {
        await rolesApi.create({ name: roleName });
      }
      setShowModal(false);
      setEditingRole(null);
      setRoleName('');
      loadRoles();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al guardar rol');
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este rol?')) return;
    try {
      await rolesApi.remove(id);
      loadRoles();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al eliminar rol');
    }
  };

  return (
    <>
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Roles</h1>
            <p className="text-sm text-slate-300">Gestión de roles de usuario</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Nuevo rol
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-500 animate-pulse text-sm tracking-widest">CARGANDO ROLES...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-200">
                  <th className="px-6 py-3 rounded-l-xl text-xs uppercase tracking-wider font-bold">Nombre</th>
                  <th className="px-6 py-3 rounded-r-xl text-xs uppercase tracking-wider font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-slate-500 italic">
                      No hay roles definidos en el sistema
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-4 text-slate-300 font-medium">{role.name}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="btn-soft px-3 py-1 text-[10px] mr-2" onClick={() => handleEdit(role)}>
                          EDITAR
                        </button>
                        <button className="btn-danger px-3 py-1 text-[10px]" onClick={() => handleDelete(role.id)}>
                          ELIMINAR
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {error && <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl animate-in shake duration-300">{error}</div>}
      </div>

      {/* Modal - NEXORA POP-OUT STYLE */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">Define el nombre del perfil de acceso.</p>
              </div>
              <button 
                onClick={() => { setShowModal(false); setEditingRole(null); setRoleName(''); setError(''); }} 
                className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Nombre del Rol *</label>
                <input
                  className="input w-full bg-slate-900 border-slate-700 text-slate-200 focus:ring-indigo-500/20"
                  placeholder="Ej: Administrador, Cajero, etc."
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  autoFocus
                />
              </div>

              {error && <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="btn-soft flex-1 py-3 text-slate-400 font-bold tracking-widest text-[10px]"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRole(null);
                    setRoleName('');
                    setError('');
                  }}
                >
                  CANCELAR
                </button>
                <button type="submit" className="btn-primary flex-1 py-3 font-bold tracking-widest text-[10px] shadow-lg shadow-indigo-500/25">
                  {editingRole ? 'ACTUALIZAR' : 'CREAR ROL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
