import { useState, useEffect } from 'react';
import { branchesApi } from '../api/branches';
import type { Branch } from '../api/branches';

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', logoUrl: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const response = await branchesApi.list();
      setBranches(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar sucursales');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    try {
      if (editingBranch) {
        await branchesApi.update(editingBranch.id, formData);
      } else {
        await branchesApi.create(formData);
      }
      setShowModal(false);
      setEditingBranch(null);
      setFormData({ name: '', address: '', phone: '', logoUrl: '' }); // Reset form
      loadBranches();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al guardar sucursal');
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address ?? '',
      phone: branch.phone ?? '',
      logoUrl: (branch as any).logoUrl ?? '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar esta sucursal?')) return;
    try {
      await branchesApi.remove(id);
      loadBranches();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al eliminar sucursal');
    }
  };

  const filtered = branches.filter((branch) => branch.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sucursales</h1>
          <p className="text-sm text-slate-300">Gestión de sucursales multi-sede</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Nueva sucursal
        </button>
      </div>

      <div className="mb-4">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input bg-white text-black"
          placeholder="Buscar sucursal..."
        />
      </div>

      {loading ? (
        <div>Cargando sucursales...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-slate-200">
                <th className="px-4 py-3">Logo</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                    No hay sucursales registradas
                  </td>
                </tr>
              ) : (
                filtered.map((branch) => (
                  <tr key={branch.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      {(branch as any).logoUrl && (
                        <img src={(branch as any).logoUrl} alt="logo" className="h-8 w-auto rounded bg-white p-1" />
                      )}
                    </td>
                    <td className="px-4 py-3">{branch.name}</td>
                    <td className="px-4 py-3">{branch.address || '-'}</td>
                    <td className="px-4 py-3">{branch.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <button className="btn-soft mr-2" onClick={() => handleEdit(branch)}>
                        Editar
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(branch.id)}>
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

      {error && <div className="mt-4 text-red-400">{error}</div>}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{editingBranch ? 'Editar sucursal' : 'Nueva sucursal'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  className="input w-full"
                  placeholder="Nombre"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <input
                  className="input w-full"
                  placeholder="Dirección"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <input
                  className="input w-full"
                  placeholder="Teléfono"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <input
                  className="input w-full"
                  placeholder="URL del Logo (Opcional)"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                />
              </div>
              {error && <div className="text-xs text-rose-300">{error}</div>}
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-soft" onClick={() => { setShowModal(false); setEditingBranch(null); setError(''); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingBranch ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
