import { useState, useEffect } from 'react';
import { rolesApi } from '../api/roles';
import type { Role } from '../api/roles';

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
        <div>Cargando roles...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-slate-200">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-center text-slate-400">
                    No hay roles definidos
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3">{role.name}</td>
                    <td className="px-4 py-3">
                      <button className="btn-soft mr-2" onClick={() => handleEdit(role)}>
                        Editar
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(role.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {error && <div className="mt-4 text-rose-300">{error}</div>}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingRole ? 'Editar rol' : 'Nuevo rol'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className="input w-full"
                placeholder="Nombre del rol"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
              {error && <div className="text-xs text-rose-300">{error}</div>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-soft"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRole(null);
                    setRoleName('');
                    setError('');
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingRole ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
