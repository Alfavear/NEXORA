import { useEffect, useState } from 'react';
import { paymentMethodsApi, type PaymentMethod } from '../api/payment-methods';
import { Check, X, Search, Plus } from 'lucide-react';

export default function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentMethod | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    setLoading(true);
    try {
      const data = await paymentMethodsApi.getAll();
      setMethods(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (editingItem) {
        await paymentMethodsApi.update(editingItem.id, { name });
      } else {
        await paymentMethodsApi.create({ name });
      }
      handleCloseModal();
      await loadMethods();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingItem(method);
    setName(method.name);
    setShowModal(true);
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    setLoading(true);
    try {
      await paymentMethodsApi.update(id, { isActive: !currentStatus });
      await loadMethods();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setName('');
    setError(null);
  };

  const filtered = methods.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Métodos de Pago</h1>
            <p className="text-sm text-slate-300">Configuración de medios de cobro</p>
          </div>
          <button 
            className="btn-primary flex items-center gap-2" 
            onClick={() => setShowModal(true)}
          >
            <Plus className="w-4 h-4" /> Nuevo Método
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="input pl-10 w-full bg-slate-900/50 border-slate-700 text-sm" 
              placeholder="Buscar método..." 
            />
          </div>
        </div>

        {loading && methods.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-500 animate-pulse text-sm tracking-widest">CARGANDO MÉTODOS...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-200">
                  <th className="px-6 py-3 rounded-l-xl text-xs uppercase tracking-wider font-bold">Concepto</th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider font-bold text-center">Estado</th>
                  <th className="px-6 py-3 rounded-r-xl text-xs uppercase tracking-wider font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic">
                      No hay métodos registrados
                    </td>
                  </tr>
                ) : (
                  filtered.map((method) => (
                    <tr key={method.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-4 text-slate-300 font-medium">{method.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`pill ${method.isActive ? 'pill-emerald' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                          {method.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleEdit(method)}
                          className="btn-soft px-3 py-1 text-[10px] mr-2"
                        >
                          EDITAR
                        </button>
                        <button
                          onClick={() => handleToggle(method.id, method.isActive)}
                          className={`p-2 rounded-lg transition-colors ${
                            method.isActive ? 'text-rose-400 hover:bg-rose-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {method.isActive ? <X size={16} /> : <Check size={16} />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - NEXORA POP-OUT STYLE */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {editingItem ? 'Editar Método' : 'Nuevo Método'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">Nombre del medio de pago/cobro.</p>
              </div>
              <button 
                onClick={handleCloseModal} 
                className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Nombre del Método *</label>
                <input
                  className="input w-full bg-slate-900 border-slate-700 text-slate-200"
                  placeholder="Ej: Transferencia, Tarjeta de Crédito..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs animate-in shake">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="btn-soft flex-1 py-3 text-slate-400 font-bold tracking-widest text-[10px]"
                  onClick={handleCloseModal}
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !name}
                  className="btn-primary flex-1 py-3 font-bold tracking-widest text-[10px] shadow-lg shadow-indigo-500/25"
                >
                  {loading ? 'GUARDANDO...' : editingItem ? 'ACTUALIZAR' : 'GUARDAR MÉTODO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
