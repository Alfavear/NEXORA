import { useState, useEffect } from 'react';
import { customersApi } from '../api/customers';
import type { Customer, CreateCustomerDto } from '../api/customers';
import { Search, X } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<CreateCustomerDto>({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
  });

  const [errors, setErrors] = useState<string>('');

  useEffect(() => {
    loadCustomers();
  }, [filter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const isActive = filter === 'all' ? undefined : filter === 'active';
      const response = await customersApi.getAll(isActive);
      setCustomers(response.data);
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors('');

    try {
      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, formData);
      } else {
        await customersApi.create(formData);
      }
      
      setShowModal(false);
      resetForm();
      loadCustomers();
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al guardar cliente');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      document: customer.document || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este cliente?')) return;

    try {
      await customersApi.delete(id);
      loadCustomers();
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al eliminar cliente');
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await customersApi.update(id, { isActive: true });
      loadCustomers();
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al activar cliente');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      document: '',
      phone: '',
      email: '',
      address: '',
    });
    setEditingCustomer(null);
    setErrors('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Filtrar clientes por búsqueda
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.document?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-lg">Cargando clientes...</div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-sm text-slate-300">Directorio y gestión de clientes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          + Nuevo Cliente
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div className="flex gap-2">
          <button onClick={() => setFilter('active')} className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-soft'}`}>Activos</button>
          <button onClick={() => setFilter('inactive')} className={`btn ${filter === 'inactive' ? 'btn-primary' : 'btn-soft'}`}>Inactivos</button>
          <button onClick={() => setFilter('all')} className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-soft'}`}>Todos</button>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-5 h-5 absolute left-3 top-2 text-slate-400" />
          <input
            className="input pl-10 w-full"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {errors && <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/50 text-rose-300 rounded-lg">{errors}</div>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left border-collapse">
          <thead className="bg-slate-800 text-slate-200">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Cédula/RUC</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-200">{customer.name}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-sm">{customer.document || '-'}</td>
                  <td className="px-4 py-3 text-slate-400">{customer.phone || '-'}</td>
                  <td className="px-4 py-3 text-slate-400">{customer.email || '-'}</td>
                  <td className="px-4 py-3">
                    {customer.isActive ? (
                      <span className="pill bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Activo</span>
                    ) : (
                      <span className="pill bg-rose-500/10 text-rose-400 border border-rose-500/20">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(customer)} className="btn-soft px-3 py-1 text-xs mr-2">Editar</button>
                    {customer.isActive ? (
                      <button onClick={() => handleDelete(customer.id)} className="btn-danger px-3 py-1 text-xs">Desactivar</button>
                    ) : (
                      <button onClick={() => handleActivate(customer.id)} className="btn-soft border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1 text-xs">Activar</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-950 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full bg-slate-900 border-slate-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Cédula/RUC</label>
                  <input
                    type="text"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    className="input w-full bg-slate-900 border-slate-700"
                    maxLength={13}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input w-full bg-slate-900 border-slate-700"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input w-full bg-slate-900 border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Dirección</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input w-full bg-slate-900 border-slate-700 resize-none h-20"
                    rows={3}
                    maxLength={200}
                  />
                </div>
              </div>

              {errors && (
                <div className="mt-4 p-3 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-sm">
                  {errors}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-soft flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 shadow-lg shadow-indigo-500/20"
                >
                  {editingCustomer ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
