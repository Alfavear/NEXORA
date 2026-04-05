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
    <>
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

        <div className="mb-6">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input bg-slate-900/50 border-slate-700 text-white w-full md:w-80"
            placeholder="Buscar sucursal..."
          />
        </div>

        {loading ? (
          <div className="text-slate-500 italic">Cargando sucursales...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left border-collapse">
              <thead className="bg-slate-800/50 text-slate-200">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl text-xs uppercase tracking-wider">Logo</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Dirección</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Teléfono</th>
                  <th className="px-4 py-3 text-right rounded-r-xl text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No hay sucursales registradas
                    </td>
                  </tr>
                ) : (
                  filtered.map((branch) => (
                    <tr key={branch.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 py-4">
                        {(branch as any).logoUrl ? (
                          <img src={(branch as any).logoUrl} alt="logo" className="h-8 w-auto rounded bg-white p-1 shadow-sm" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-slate-800 flex items-center justify-center text-[10px] text-slate-500">S/L</div>
                        )}
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-200">{branch.name}</td>
                      <td className="px-4 py-4 text-slate-400 text-sm">{branch.address || '-'}</td>
                      <td className="px-4 py-4 text-slate-400 text-sm">{branch.phone || '-'}</td>
                      <td className="px-4 py-4 text-right">
                        <button className="btn-soft px-3 py-1 text-[10px] mr-2" onClick={() => handleEdit(branch)}>
                          EDITAR
                        </button>
                        <button className="btn-danger px-3 py-1 text-[10px]" onClick={() => handleDelete(branch.id)}>
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

        {error && <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">{error}</div>}
      </div>

      {/* MODAL - NEXORA POP-OUT STYLE */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 w-full max-w-lg shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
            <div className="mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white">{editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
              <p className="text-xs text-slate-400 mt-1">Configura los datos de identidad de la sede.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Nombre de Sucursal *</label>
                  <input
                    className="input w-full bg-slate-900 border-slate-700"
                    placeholder="Ej: Sucursal Norte"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Dirección Física</label>
                  <input
                    className="input w-full bg-slate-900 border-slate-700"
                    placeholder="Calle, Ciudad..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Teléfono</label>
                  <input
                    className="input w-full bg-slate-900 border-slate-700"
                    placeholder="+00 0000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">URL del Logo (Img)</label>
                  <input
                    className="input w-full bg-slate-900 border-slate-700"
                    placeholder="https://..."
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  />
                </div>
              </div>

              {error && <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs animate-in shake duration-300">{error}</div>}

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  className="btn-soft flex-1 py-3 text-slate-400" 
                  onClick={() => { setShowModal(false); setEditingBranch(null); setError(''); }}
                >
                  CANCELAR
                </button>
                <button type="submit" className="btn-primary flex-1 py-3 font-bold tracking-wide shadow-lg shadow-indigo-500/20">
                  {editingBranch ? 'ACTUALIZAR SEDE' : 'CREAR SUCURSAL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
