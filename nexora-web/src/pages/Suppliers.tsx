import { useState, useEffect } from 'react';
import { suppliersApi } from '../api/suppliers';
import type { Supplier, CreateSupplierDto } from '../api/suppliers';
import { Search, X } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<CreateSupplierDto>({
    name: '',
    ruc: '',
    phone: '',
    email: '',
    address: '',
  });

  const [errors, setErrors] = useState<string>('');

  useEffect(() => {
    loadSuppliers();
  }, [filter]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const isActive = filter === 'all' ? undefined : filter === 'active';
      const response = await suppliersApi.getAll(isActive);
      setSuppliers(response.data);
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors('');

    try {
      if (editingSupplier) {
        await suppliersApi.update(editingSupplier.id, formData);
      } else {
        await suppliersApi.create(formData);
      }
      
      setShowModal(false);
      resetForm();
      loadSuppliers();
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al guardar proveedor');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      ruc: supplier.ruc || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este proveedor?')) return;

    try {
      await suppliersApi.delete(id);
      loadSuppliers();
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al eliminar proveedor');
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await suppliersApi.update(id, { isActive: true });
      loadSuppliers();
    } catch (error: any) {
      setErrors(error.response?.data?.message || 'Error al activar proveedor');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      ruc: '',
      phone: '',
      email: '',
      address: '',
    });
    setEditingSupplier(null);
    setErrors('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Filtrar proveedores por búsqueda
  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.ruc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-lg">Cargando proveedores...</div>
      </div>
    );
  }

  return (
    <>
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Proveedores</h1>
            <p className="text-sm text-slate-300">Directorio de abastecimiento</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            + Nuevo Proveedor
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button onClick={() => setFilter('active')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${filter === 'active' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Activos</button>
            <button onClick={() => setFilter('inactive')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${filter === 'inactive' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Inactivos</button>
            <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${filter === 'all' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Todos</button>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              className="input pl-10 w-full bg-slate-900/50 border-slate-700 text-sm"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {errors && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">{errors}</div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left border-collapse">
            <thead className="bg-slate-800/50 text-slate-200">
              <tr>
                <th className="px-4 py-3 rounded-l-xl text-xs uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">RUC</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">Teléfono</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-right rounded-r-xl text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    {searchTerm ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-4 font-medium text-slate-200">{supplier.name}</td>
                    <td className="px-4 py-4 text-slate-400 font-mono text-xs italic">{supplier.ruc || '-'}</td>
                    <td className="px-4 py-4 text-slate-400 text-sm">{supplier.phone || '-'}</td>
                    <td className="px-4 py-4 text-slate-400 text-sm">{supplier.email || '-'}</td>
                    <td className="px-4 py-4">
                      {supplier.isActive ? (
                        <span className="pill-emerald">Activo</span>
                      ) : (
                        <span className="pill bg-rose-500/10 text-rose-400 border border-rose-500/20">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => handleEdit(supplier)} className="btn-soft px-3 py-1 text-[10px] mr-2">EDITAR</button>
                      {supplier.isActive ? (
                        <button onClick={() => handleDelete(supplier.id)} className="btn-danger px-3 py-1 text-[10px]">DESACTIVAR</button>
                      ) : (
                        <button onClick={() => handleActivate(supplier.id)} className="btn-soft border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1 text-[10px]">ACTIVAR</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - NEXORA POP-OUT STYLE */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 w-full max-w-lg shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                <p className="text-xs text-slate-400 mt-1">Completa los datos fiscales y de contacto.</p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-900 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Razón Social / Nombre Comercial *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full bg-slate-900 border-slate-700"
                    placeholder="Ej: Distribuidora Central S.A."
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">RUC / Identificación</label>
                  <input
                    type="text"
                    value={formData.ruc}
                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                    className="input w-full bg-slate-900 border-slate-700"
                    placeholder="0000000000001"
                    maxLength={13}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Teléfono Principal</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input w-full bg-slate-900 border-slate-700"
                    placeholder="+00 0000000"
                    maxLength={20}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Email Institucional</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input w-full bg-slate-900 border-slate-700"
                    placeholder="proveedor@empresa.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Dirección Matriz</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input w-full bg-slate-900 border-slate-700 resize-none h-20"
                    placeholder="Sector, Av. Principal, Edificio..."
                    rows={3}
                    maxLength={200}
                  />
                </div>
              </div>

              {errors && (
                <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs animate-in shake duration-300">
                  {errors}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-soft flex-1 py-3 text-slate-400"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-3 font-bold tracking-wide shadow-lg shadow-indigo-500/20"
                >
                  {editingSupplier ? 'ACTUALIZAR DATOS' : 'GUARDAR PROVEEDOR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
