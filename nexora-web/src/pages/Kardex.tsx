import { useState, useEffect } from 'react';
import { reportsApi } from '../api/reports';
import { itemsApi } from '../api/items';
import { branchesApi } from '../api/branches';

export default function Kardex() {
  const [items, setItems] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({
    itemId: 0,
    branchId: 0,
    startDate: '',
    endDate: ''
  });
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // Definir fechas del mes actual por defecto
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setFilters(prev => ({
      ...prev,
      startDate: firstDay.toISOString().slice(0, 10),
      endDate: today.toISOString().slice(0, 10)
    }));

    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [itRes, brRes] = await Promise.all([
        itemsApi.list(),
        branchesApi.list()
      ]);
      setItems(itRes.data ?? itRes);
      setBranches(brRes.data ?? brRes);
    } catch (err) {
      setMessage('Error cargando listas de productos/sucursales.');
    }
  };

  const buscarKardex = async () => {
    if (!filters.itemId) {
      setMessage('Por favor, selecciona un producto para ver su Kardex.');
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      const res = await reportsApi.getKardex({
        itemId: filters.itemId > 0 ? filters.itemId : undefined,
        branchId: filters.branchId > 0 ? filters.branchId : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      });
      setData(res.data ?? res);
      if ((res.data ?? res).length === 0) {
         setMessage('No se encontraron movimientos para el filtro seleccionado.');
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error al obtener Kardex');
    } finally {
      setLoading(false);
    }
  };

  const getMovementStyle = (type: string, qty: number) => {
    // Si la cantidad es negativa es salida, pero si es positive y es ADJUSTMENT_IN es entrada
    // Las ventas usualmente disminuyen el stock, compras lo aumentan.
    // Depende de como esté back (quantity is absolute or signed?).
    // Pero asumiendo standard:
    if (type.includes('SALE') || type.includes('OUT') || qty < 0) return 'text-red-400 bg-red-400/10';
    if (type.includes('PURCHASE') || type.includes('IN') || qty > 0) return 'text-emerald-400 bg-emerald-400/10';
    return 'text-slate-300';
  };

  const translateType = (type: string) => {
    switch(type) {
      case 'SALE': return 'Venta';
      case 'PURCHASE': return 'Compra';
      case 'ADJUSTMENT_IN': return 'Ajuste (Entrada)';
      case 'ADJUSTMENT_OUT': return 'Ajuste (Salida)';
      case 'TRANSFER': return 'Transferencia';
      default: return type;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Kardex / Movimientos de Inventario</h1>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Producto (Requerido)</label>
            <select 
              className="input w-full bg-white text-black text-sm"
              value={filters.itemId}
              onChange={e => setFilters({...filters, itemId: Number(e.target.value)})}
            >
              <option value={0}>-- Seleccione un Producto --</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.sku ? `[${i.sku}] ` : ''}{i.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">Sucursal</label>
            <select 
              className="input w-full bg-white text-black text-sm"
              value={filters.branchId}
              onChange={e => setFilters({...filters, branchId: Number(e.target.value)})}
            >
              <option value={0}>Todas las sucursales</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Desde</label>
              <input type="date" className="input w-full text-sm" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Hasta</label>
              <input type="date" className="input w-full text-sm" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="btn-primary flex-1" onClick={buscarKardex} disabled={loading || !filters.itemId}>
            {loading ? 'Consultando...' : 'Consultar Kardex'}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 rounded-lg">
          {message}
        </div>
      )}

      {data.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50">
            <h2 className="text-xl font-semibold">Historial de Movimientos</h2>
            <p className="text-sm text-slate-400">Las cantidades muestran el impacto en el stock.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-700">
                  <th className="p-3 text-slate-400 font-semibold text-sm">Fecha</th>
                  <th className="p-3 text-slate-400 font-semibold text-sm">Sucursal</th>
                  <th className="p-3 text-slate-400 font-semibold text-sm">Tipo</th>
                  <th className="p-3 text-slate-400 font-semibold text-sm">Referencia / Doc</th>
                  <th className="p-3 text-slate-400 font-semibold text-sm text-center">Cantidad</th>
                  <th className="p-3 text-slate-400 font-semibold text-sm text-right">Saldo (Stock)</th>
                  <th className="p-3 text-slate-400 font-semibold text-sm">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => {
                  // Determina el signo visual de la cantidad asumiendo venta = baja, compra = alta
                  let qtyStr = String(row.quantity);
                  if (row.type === 'SALE' && row.quantity > 0) qtyStr = `-${row.quantity}`;
                  else if ((row.type === 'ADJUSTMENT_IN' || row.type === 'PURCHASE') && row.quantity > 0) qtyStr = `+${row.quantity}`;

                  return (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 text-sm">{new Date(row.date).toLocaleString()}</td>
                      <td className="p-3 text-sm">{row.branchName}</td>
                      <td className="p-3 text-sm">
                        <span className="bg-slate-700 px-2 py-1 rounded text-xs">
                          {translateType(row.type)}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{row.reference || '-'}</td>
                      <td className="p-3 text-center">
                        <span className={`font-mono font-bold px-2 py-1 rounded ${getMovementStyle(row.type, row.quantity)}`}>
                          {qtyStr}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-lg text-white">
                        {row.balanceAfter}
                      </td>
                      <td className="p-3 text-xs text-slate-400">{row.user}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
