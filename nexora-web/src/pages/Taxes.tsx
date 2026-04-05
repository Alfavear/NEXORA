import { useState, useEffect } from 'react';
import { taxesApi } from '../api/taxes';
import { X, Search } from 'lucide-react';

export default function Taxes() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', rate: 0, isActive: true });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await taxesApi.list();
      setItems(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar impuestos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) return setError('El nombre es obligatorio');
    if (formData.rate < 0) return setError('La tarifa no puede ser negativa');

    try {
      if (editingItem) await taxesApi.update(editingItem.id, formData);
      else await taxesApi.create(formData);
      handleCloseModal();
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al guardar impuesto');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ name: item.name, rate: item.rate, isActive: item.isActive });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar o desactivar este impuesto?')) return;
    try { await taxesApi.remove(id); load(); } catch (err: any) { setError(err?.response?.data?.message || 'Error al eliminar impuesto'); }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ name: '', rate: 0, isActive: true });
    setError('');
  };

  const filtered = items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Impuestos</h1>
            <p className="text-sm text-slate-300">Maestro de tarifas y regulaciones fiscales</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Nuevo impuesto</button>
        </div>

        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="input pl-10 w-full bg-slate-900/50 border-slate-700 text-sm" 
              placeholder="Buscar impuesto..." 
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-500 animate-pulse text-sm tracking-widest">CARGANDO IMPUESTOS...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-200">
                  <th className="px-6 py-3 rounded-l-xl text-xs uppercase tracking-wider font-bold">Concepto</th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider font-bold text-center">Tarifa (%)</th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider font-bold text-center">Estado</th>
                  <th className="px-6 py-3 rounded-r-xl text-xs uppercase tracking-wider font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">No se encontraron impuestos registrados</td></tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4 text-slate-300 font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-center text-cyan-400 font-mono font-bold">{Number(item.rate).toFixed(2)}%</td>
                    <td className="px-6 py-4 text-center">
                      {item.isActive ? (
                        <span className="pill-emerald">Activo</span>
                      ) : (
                        <span className="pill bg-rose-500/10 text-rose-400 border border-rose-500/20">Inactivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="btn-soft px-3 py-1 text-[10px] mr-2" onClick={() => handleEdit(item)}>EDITAR</button>
                      <button className="btn-danger px-3 py-1 text-[10px]" onClick={() => handleDelete(item.id)}>ELIMINAR</button>
                    </td>
                  </tr>
                ))}
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
                <h2 className="text-2xl font-bold text-white">{editingItem ? 'Editar Impuesto' : 'Nuevo Impuesto'}</h2>
                <p className="text-xs text-slate-400 mt-1">Configura las tasas impositivas oficiales.</p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-900 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Nombre del Impuesto *</label>
                  <input 
                    className="input w-full bg-slate-900 border-slate-700 text-slate-200" 
                    placeholder="Ej: IVA 15%, Retención, etc." 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Tarifa Porcentual (%) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    className="input w-full bg-slate-900 border-slate-700 text-cyan-400 font-bold" 
                    placeholder="Ej: 15.00" 
                    value={formData.rate} 
                    onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })} 
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                  <input 
                    id="active" 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500/20"
                    checked={formData.isActive} 
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} 
                  />
                  <label htmlFor="active" className="text-xs font-semibold text-slate-300 cursor-pointer">IMPUESTO VIGENTE</label>
                </div>
              </div>

              {error && <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-soft flex-1 py-3 text-slate-400 font-bold tracking-widest text-[10px]" onClick={handleCloseModal}>CANCELAR</button>
                <button type="submit" className="btn-primary flex-1 py-3 font-bold tracking-widest text-[10px] shadow-lg shadow-indigo-500/25">{editingItem ? 'ACTUALIZAR' : 'CREAR IMPUESTO'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}