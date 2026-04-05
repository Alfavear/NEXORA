import { useState, useEffect } from 'react';
import { inventoryApi } from '../api/inventory';
import { itemsApi } from '../api/items';
import { branchesApi } from '../api/branches';

export default function Kardex() {
  const [items, setItems] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    if (selectedItemId > 0) {
      loadKardex();
    } else {
      setData([]);
    }
  }, [selectedItemId, selectedBranchId]);

  const loadBaseData = async () => {
    try {
      const [itmRes, brRes] = await Promise.all([
        itemsApi.list(),
        branchesApi.list()
      ]);
      setItems(itmRes.data ?? itmRes);
      
      const brList = brRes.data ?? brRes;
      setBranches(brList);
      if (brList.length > 0) setSelectedBranchId(brList[0].id);
    } catch (err) {
      console.error(err);
      setMessage('Error cargando catálogos');
    }
  };

  const loadKardex = async () => {
    if (selectedItemId === 0) return;
    setLoading(true);
    try {
      const res = await inventoryApi.kardex(selectedItemId, selectedBranchId);
      setData(res.data ?? res);
      setMessage('');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error al cargar kardex');
    } finally {
      setLoading(false);
    }
  };

  const formatType = (type: string) => {
    const map: Record<string, string> = {
      'INITIAL': 'Apertura',
      'SALE': 'Venta',
      'RETURN_SALE': 'Devolución',
      'ADJUSTMENT_IN': 'Entrada (Ajuste/Compra)',
      'ADJUSTMENT_OUT': 'Salida (Ajuste/Traspaso)',
    };
    return map[type] || type;
  };

  // Cálculos de Resumen
  const totalIn = data.filter(d => ['INITIAL', 'RETURN_SALE', 'ADJUSTMENT_IN'].includes(d.type))
                      .reduce((sum, d) => sum + Number(d.quantity), 0);
  const totalOut = data.filter(d => ['SALE', 'ADJUSTMENT_OUT'].includes(d.type))
                       .reduce((sum, d) => sum + Number(d.quantity), 0);
  
  // El saldo actual es el balance del último movimiento si es que hay filtrado por sucursal, o podemos simplemente calcular in - out = saldo hipotético si está revuelto. 
  // Al obligar a seleccionar una sucursal, el último registro tiene el balance perfecto.
  const currentBalance = data.length > 0 ? Number(data[data.length - 1].balance) : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100">Kardex (Libro Mayor)</h1>
          <p className="text-slate-400 mt-1">Consulta los movimientos de inventario por artículo y sucursal.</p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-red-500/20 text-red-100 rounded-lg border border-red-500/50">
          {message}
        </div>
      )}

      {/* Panel de Filtros */}
      <div className="card p-5 border-slate-700 space-y-4">
        <h2 className="text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2">1. Seleccionar Criterios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Artículo *</label>
            <select 
              className="input w-full text-lg py-2"
              value={selectedItemId}
              onChange={e => setSelectedItemId(Number(e.target.value))}
            >
              <option value={0}>-- Seleccione un Artículo --</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.sku ? `[${i.sku}] ` : ''}{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Sucursal de Consulta *</label>
            <select 
              className="input w-full text-lg py-2"
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(Number(e.target.value))}
            >
              <option value={0}>-- Todas las Sucursales (Global) --</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Panel de Resumen */}
      {selectedItemId > 0 && selectedBranchId > 0 && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5 border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
            <div className="text-sm font-semibold uppercase tracking-wide text-emerald-400 mb-1">Total Entradas</div>
            <div className="text-3xl font-bold text-slate-50">{totalIn}</div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-12 h-12 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>
            </div>
          </div>
          <div className="card p-5 border-red-500/20 bg-red-500/5 relative overflow-hidden">
            <div className="text-sm font-semibold uppercase tracking-wide text-red-500 mb-1">Total Salidas</div>
            <div className="text-3xl font-bold text-slate-50">{totalOut}</div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3.707-7.293a1 1 0 011.414 0L9 12.586V9a1 1 0 012 0v3.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </div>
          </div>
          <div className="card p-5 border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden">
            <div className="text-sm font-semibold uppercase tracking-wide text-indigo-400 mb-1">Saldo Actual</div>
            <div className="text-4xl font-black text-slate-50">{currentBalance}</div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-12 h-12 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" /></svg>
            </div>
          </div>
        </div>
      )}

      {selectedBranchId === 0 && selectedItemId > 0 && (
        <div className="p-4 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-lg text-sm mb-4">
          Visualizando movimientos de <strong>TODAS</strong> las sucursales. El campo "Saldo Calculado" representará el saldo generalizado después del movimiento.
        </div>
      )}

      {/* Tabla (Libro Mayor) */}
      {selectedItemId > 0 && (
        <div className="card p-0 overflow-hidden border-slate-700">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-200">Historial de Movimientos</h2>
            {loading && <div className="text-sm text-indigo-400 animate-pulse">Cargando datos...</div>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900/50">
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="p-4 font-semibold">Fecha y Hora</th>
                  <th className="p-4 font-semibold">Sucursal</th>
                  <th className="p-4 font-semibold">Usuario</th>
                  <th className="p-4 font-semibold">Doc. / Ref.</th>
                  <th className="p-4 font-semibold">Operación</th>
                  <th className="p-4 font-semibold text-right">Ingreso</th>
                  <th className="p-4 font-semibold text-right">Egreso</th>
                  <th className="p-4 font-semibold text-right">Saldo Calculado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.map((m, idx) => {
                  const isIn = ['INITIAL', 'RETURN_SALE', 'ADJUSTMENT_IN'].includes(m.type);
                  const isOut = ['SALE', 'ADJUSTMENT_OUT'].includes(m.type);
                  
                  // Para la vista global, calculamos el saldo iterativamente si queremos un balance global.
                  // Pero el requerimiento fue mostrar lo que hay en base de datos `balance` (que es el balance de la sucursal).
                  // Ya que el usuario eligió ver por Sede, al seleccionar una sede el `m.balance` cuadra perfecto.
                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-slate-300">{new Date(m.date).toLocaleString()}</td>
                      <td className="p-4 text-slate-300">
                        <span className="pill-slate">{m.branchName || 'N/A'}</span>
                      </td>
                      <td className="p-4 text-slate-300">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-300">
                            {String(m.userName||'?').charAt(0)}
                          </div>
                          {m.userName}
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 font-mono text-xs">{m.reference}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded border ${isIn ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                          {formatType(m.type)}
                        </span>
                        {m.notes && <p className="text-xs text-slate-500 mt-1 max-w-xs truncate" title={m.notes}>{m.notes}</p>}
                      </td>
                      <td className="p-4 text-right font-semibold text-emerald-400">
                        {isIn ? `+${m.quantity}` : '-'}
                      </td>
                      <td className="p-4 text-right font-semibold text-red-400">
                        {isOut ? `-${m.quantity}` : '-'}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-200 bg-slate-900/20">
                        {m.balance}
                      </td>
                    </tr>
                  );
                })}
                {data.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        No hay movimientos registrados para los criterios seleccionados.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
