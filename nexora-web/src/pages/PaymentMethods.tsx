import { useEffect, useState } from 'react';
import { paymentMethodsApi, type PaymentMethod } from '../api/payment-methods';
import { Check, X } from 'lucide-react';

export default function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState('');

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      await paymentMethodsApi.create({ name });
      setName('');
      await loadMethods();
      setMessage('Método agregado correctamente.');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error al agregar');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          Métodos de Pago
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="card p-6 border border-slate-700/50 bg-slate-800/40 backdrop-blur-md shadow-xl rounded-2xl">
            <h2 className="text-lg font-semibold mb-4 text-slate-200">Nuevo Método</h2>
            {message && (
              <div className="mb-4 p-3 rounded-lg bg-indigo-500/10 text-indigo-300 text-sm border border-indigo-500/20">
                {message}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nombre</label>
                <input
                  className="input w-full bg-slate-900/50 border-slate-700 focus:border-indigo-500 transition-colors"
                  placeholder="Ej. Efectivo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !name}
                className="w-full btn-primary bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-500/25 transition-all text-white py-2 rounded-xl font-medium"
              >
                {loading ? 'Guardando...' : 'Guardar Método'}
              </button>
            </form>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <div className="card border border-slate-700/50 bg-slate-800/40 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900/60 border-b border-slate-700/50 text-slate-300 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">ID</th>
                    <th className="px-6 py-4 font-medium">Nombre</th>
                    <th className="px-6 py-4 font-medium text-center">Estado</th>
                    <th className="px-6 py-4 font-medium text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {methods.map((method) => (
                    <tr key={method.id} className="hover:bg-slate-700/20 transition-colors group">
                      <td className="px-6 py-4 text-slate-400">#{method.id}</td>
                      <td className="px-6 py-4 font-medium text-slate-200">{method.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            method.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {method.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggle(method.id, method.isActive)}
                          disabled={loading}
                          className={`p-2 rounded-lg transition-colors ${
                            method.isActive
                              ? 'text-rose-400 hover:bg-rose-500/10'
                              : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={method.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {method.isActive ? <X size={18} /> : <Check size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {methods.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No hay métodos de pago registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
