import { useState, useEffect } from 'react';
import { itemOwnersApi } from '../api/itemOwners';

export default function ItemOwners() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', isActive: true });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await itemOwnersApi.list();
      setItems(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar propietarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) return setError('El nombre es obligatorio');

    try {
      if (editingItem) await itemOwnersApi.update(editingItem.id, formData);
      else await itemOwnersApi.create(formData);
      setShowModal(false); setEditingItem(null);
      setFormData({ name: '', isActive: true });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al guardar propietario');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ name: item.name, isActive: item.isActive });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este propietario?')) return;
    try { await itemOwnersApi.remove(id); load(); } catch (err: any) { setError(err?.response?.data?.message || 'Error al eliminar propietario'); }
  };

  const filtered = items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Propietarios de Artículos</h1>
          <p className="text-sm text-slate-300">Maestro de propietarios</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Nuevo propietario</button>
      </div>

      <div className="mb-4">
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input bg-white text-black" placeholder="Buscar..." />
      </div>

      {loading ? (<div>Cargando...</div>) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-slate-200">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-4 text-center text-slate-400">No hay registros</td></tr>
              ) : filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.isActive ? 'A' : 'I'}</td>
                  <td className="px-4 py-3">
                    <button className="btn-soft mr-2" onClick={() => handleEdit(item)}>Editar</button>
                    <button className="btn-danger" onClick={() => handleDelete(item.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <div className="mt-4 text-red-400">{error}</div>}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{editingItem ? 'Editar propietario' : 'Nuevo propietario'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="input w-full" placeholder="Nombre" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <div className="flex items-center gap-2">
                <input id="active" type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                <label>Activo</label>
              </div>
              {error && <div className="text-xs text-rose-300">{error}</div>}
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-soft" onClick={() => { setShowModal(false); setEditingItem(null); setError(''); }}>Cancelar</button>
                <button type="submit" className="btn-primary">{editingItem ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
