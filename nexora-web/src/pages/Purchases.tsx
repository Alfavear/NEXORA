import { useState, useEffect } from 'react';
import { itemsApi } from '../api/items';
import { suppliersApi } from '../api/suppliers';
import { branchesApi } from '../api/branches';
import { categoriesApi } from '../api/categories';
import http from '../api/http';

export default function Purchases() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(0);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  const [cart, setCart] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);

  const [showNewItem, setShowNewItem] = useState(false);
  const [newItemData, setNewItemData] = useState({ name: '', sku: '', categoryId: 0, salePrice: 0 });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [supRes, brRes, itmRes, catRes] = await Promise.all([
        suppliersApi.getAll(),
        branchesApi.list(),
        itemsApi.list(),
        categoriesApi.list()
      ]);
      setSuppliers(supRes.data ?? supRes);
      
      const brList = brRes.data ?? brRes;
      setBranches(brList);
      if (brList.length > 0) setSelectedBranchId(brList[0].id);
      
      setItems(itmRes.data ?? itmRes);
      const acts = catRes.data ?? catRes;
      setCategories(acts);
      if (acts.length > 0) setNewItemData(prev => ({ ...prev, categoryId: acts[0].id }));
    } catch (err: any) {
      console.error(err);
      setMessage('Error cargando datos base');
    }
  };

  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedItemId(id);
    if (id > 0) {
      const item = items.find(i => i.id === id);
      if (item) setUnitCost(Number(item.costPrice || 0));
    } else {
      setUnitCost(0);
    }
  };

  const addToCart = () => {
    if (selectedItemId === 0) return;
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;

    const existing = cart.find(c => c.itemId === item.id);
    if (existing) {
      setCart(cart.map(c => 
        c.itemId === item.id 
          ? { ...c, quantity: c.quantity + quantity, unitCost } 
          : c
      ));
    } else {
      setCart([...cart, {
        itemId: item.id,
        name: item.name,
        quantity,
        unitCost
      }]);
    }

    setSelectedItemId(0);
    setQuantity(1);
    setUnitCost(0);
  };

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(c => c.itemId !== itemId));
  };

  const createQuickItem = async () => {
    if (!newItemData.name) return setMessage('Nombre del artículo requerido.');
    if (!selectedSupplierId) return setMessage('Para crear un artículo rápido, primero seleccione el Proveedor general arriba.');
    
    setLoading(true);
    try {
      const payload = {
        name: newItemData.name,
        sku: newItemData.sku,
        categoryId: newItemData.categoryId,
        salePrice: newItemData.salePrice,
        costPrice: unitCost,
        providerId: selectedSupplierId,
        isActive: true,
      };
      const res = await itemsApi.create(payload);
      const createdItem = res.data ?? res;
      setItems(prev => [...prev, createdItem]);
      setSelectedItemId(createdItem.id);
      setShowNewItem(false);
      setNewItemData({ name: '', sku: '', categoryId: categories[0]?.id || 0, salePrice: 0 });
      setMessage('Artículo creado y seleccionado.');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error al crear artículo.');
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((acc, c) => acc + (c.quantity * c.unitCost), 0);

  const savePurchase = async () => {
    if (cart.length === 0) return setMessage('No hay artículos agregados.');
    if (selectedSupplierId === 0) return setMessage('Seleccione un proveedor.');
    if (selectedBranchId === 0) return setMessage('Seleccione una sucursal destino.');

    setLoading(true);
    setMessage('');
    try {
      await http.post('/purchases', {
        branchId: selectedBranchId,
        supplierId: selectedSupplierId,
        systemNumber: `COM-${Date.now()}`,
        supplierInvoiceNumber: invoiceNumber,
        notes,
        details: cart.map(c => ({
          itemId: c.itemId,
          quantity: c.quantity,
          unitCost: c.unitCost
        }))
      });

      setMessage('Compra registrada con éxito. Inventario actualizado.');
      setCart([]);
      setInvoiceNumber('');
      setNotes('');
      setSelectedSupplierId(0);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error al completar la compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Ingreso de Compras</h1>

      {message && (
        <div className="p-4 bg-indigo-600/30 text-indigo-100 rounded-lg">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4 space-y-4">
          <h2 className="text-xl font-semibold border-b border-slate-700 pb-2">1. Datos Generales</h2>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">Sucursal de Entrada</label>
            <select 
              className="input w-full"
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(Number(e.target.value))}
            >
              <option value={0}>Seleccione Sucursal</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Proveedor (Obligatorio)</label>
            <select 
              className="input w-full"
              value={selectedSupplierId}
              onChange={e => setSelectedSupplierId(Number(e.target.value))}
            >
              <option value={0}>Seleccione un Proveedor</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Factura de Proveedor</label>
            <input 
              type="text" 
              className="input w-full" 
              placeholder="Ej. F-001-02-0000123"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">Observaciones / Notas</label>
            <textarea 
              className="input w-full" 
              placeholder="Conductor, observaciones extra..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="card p-4 space-y-4">
          <h2 className="text-xl font-semibold border-b border-slate-700 pb-2">2. Agregar Productos</h2>
          
          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="block text-sm text-slate-400">Buscar Producto</label>
              <button onClick={() => setShowNewItem(!showNewItem)} className="text-xs text-indigo-400 hover:text-indigo-300">
                {showNewItem ? 'Cancelar' : '+ Nuevo Artículo'}
              </button>
            </div>

            {showNewItem ? (
              <div className="p-3 bg-slate-900/80 rounded-lg space-y-3 mb-3 border border-indigo-500/30">
                <h3 className="text-sm font-semibold text-indigo-300">Crear Artículo Rápido</h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nombre</label>
                  <input className="input w-full text-sm" value={newItemData.name} onChange={e => setNewItemData({...newItemData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Categoría</label>
                    <select className="input w-full text-sm" value={newItemData.categoryId} onChange={e => setNewItemData({...newItemData, categoryId: Number(e.target.value)})}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Precio Venta Ref.</label>
                    <input type="number" step="0.01" className="input w-full text-sm" value={newItemData.salePrice} onChange={e => setNewItemData({...newItemData, salePrice: Number(e.target.value)})} />
                  </div>
                </div>
                <button onClick={createQuickItem} disabled={loading} className="btn-primary w-full text-sm py-1">Guardar Producto</button>
              </div>
            ) : (
              <select 
                className="input w-full"
                value={selectedItemId}
                onChange={handleItemSelect}
              >
                <option value={0}>Escriba / Seleccione un producto...</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.sku ? `[${i.sku}] ` : ''}{i.name}</option>)}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Costo Unitario</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                className="input w-full" 
                value={unitCost}
                onChange={e => setUnitCost(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Cantidad de Entrada</label>
              <input 
                type="number" 
                min="1"
                className="input w-full" 
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
              />
            </div>
          </div>
          
          <button 
            className="btn-soft w-full"
            onClick={addToCart}
            disabled={selectedItemId === 0 || quantity <= 0}
          >
            Agregar a la lista →
          </button>
        </div>
      </div>

      <div className="card p-4 space-y-4">
        <h2 className="text-xl font-semibold border-b border-slate-700 pb-2">3. Detalle de Compra</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left bg-slate-800/50 rounded-lg">
            <thead>
              <tr className="border-b border-slate-700 text-slate-300">
                <th className="p-3">Producto</th>
                <th className="p-3">Cantidad</th>
                <th className="p-3">Costo Un.</th>
                <th className="p-3">Subtotal</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map(c => (
                <tr key={c.itemId} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3">{c.quantity}</td>
                  <td className="p-3">${c.unitCost.toFixed(2)}</td>
                  <td className="p-3 font-bold">${(c.quantity * c.unitCost).toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => removeFromCart(c.itemId)}
                      className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded bg-red-400/10"
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">Ningún producto agregado todavía</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 font-bold text-lg">
                <td colSpan={3} className="p-4 text-right">Total:</td>
                <td colSpan={2} className="p-4">${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            className="btn-primary px-8 text-lg"
            onClick={savePurchase}
            disabled={loading || cart.length === 0}
          >
            {loading ? 'Procesando...' : 'Confirmar Ingreso a Bodega'}
          </button>
        </div>
      </div>
    </div>
  );
}
