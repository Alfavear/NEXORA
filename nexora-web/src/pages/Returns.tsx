import { useEffect, useState, useMemo } from 'react';
import { salesApi } from '../api/sales';
import { Search, X } from 'lucide-react';

export default function Returns() {
  const [activeTab, setActiveTab] = useState<'NEW_RETURN' | 'HISTORY'>('NEW_RETURN');
  const [sales, setSales] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [returns, setReturns] = useState<any[]>([]);
  
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [returnReasons, setReturnReasons] = useState<Record<number, string>>({});
  
  const [searchSale, setSearchSale] = useState('');
  const [searchHistory, setSearchHistory] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadSales();
    loadReturns();
  }, []);

  const loadSales = async () => {
    const result = await salesApi.list();
    setSales(result.data ?? result);
  };

  const loadReturns = async () => {
    const result = await salesApi.listReturns();
    setReturns(result.data ?? result);
  };

  const loadSale = async (id: number) => {
    const result = await salesApi.get(id);
    setSelected(result.data ?? result);
    setReturnQuantities({});
    setReturnReasons({});
    setMessage(null);
    setShowModal(true);
  };

  const doReturn = async (itemId: number) => {
    if (!selected) return;
    
    const q = returnQuantities[itemId] || 1;
    const r = returnReasons[itemId] || '';

    setLoading(true);
    setMessage(null);

    try {
      await salesApi.createReturn(selected.id, {
        items: [{ itemId, quantity: q, reason: r || undefined }],
      });
      setMessage('Devolución registrada correctamente.');
      setReturnQuantities({ ...returnQuantities, [itemId]: 1 });
      setReturnReasons({ ...returnReasons, [itemId]: '' });
      await loadReturns();
      await loadSales();
      setShowModal(false);
      if (selected) await loadSale(selected.id);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Error al registrar devolución');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = useMemo(() => {
    if (!searchSale) return sales.slice(0, 30);
    const lower = searchSale.toLowerCase();
    return sales.filter(s => 
      s.systemNumber.toLowerCase().includes(lower) || 
      s.customer?.name?.toLowerCase().includes(lower) ||
      s.customer?.document?.toLowerCase().includes(lower)
    );
  }, [sales, searchSale]);

  const filteredReturns = useMemo(() => {
    if (!searchHistory) return returns;
    const lower = searchHistory.toLowerCase();
    return returns.filter(r => 
      r.systemNumber.toLowerCase().includes(lower) ||
      r.sale?.systemNumber?.toLowerCase().includes(lower) ||
      r.customer?.name?.toLowerCase().includes(lower)
    );
  }, [returns, searchHistory]);

  const closeModal = () => {
    setShowModal(false);
    setSelected(null);
  };

  return (
    <div className="p-4 space-y-6 text-slate-100">
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold">Gestión de Devoluciones</h1>
        <div className="flex gap-2">
          <button className={`btn ${activeTab === 'NEW_RETURN' ? 'btn-primary' : 'btn-soft'}`} onClick={() => setActiveTab('NEW_RETURN')}>Procesar Retorno</button>
          <button className={`btn ${activeTab === 'HISTORY' ? 'btn-primary' : 'btn-soft'}`} onClick={() => setActiveTab('HISTORY')}>Historial de Notas</button>
        </div>
      </div>

      {message && <div className="p-3 bg-emerald-500/20 text-emerald-100 rounded-xl border border-emerald-500/30 text-sm">{message}</div>}

      {activeTab === 'NEW_RETURN' && (
        <div className="card p-6 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-semibold">Procesar Devolución</h2>
              <p className="text-sm text-slate-400">Busca y selecciona una factura para registrar retornos de mercancía</p>
            </div>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-2 text-slate-400" />
              <input className="input pl-10 w-full md:w-80 bg-slate-900 border-slate-700" placeholder="N° Sistema o Cédula..." value={searchSale} onChange={(e) => setSearchSale(e.target.value)} />
            </div>
          </div>
            
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSales.length === 0 ? (
              <div className="text-slate-500 col-span-full py-8 text-center bg-slate-800/30 rounded-xl border border-slate-700 border-dashed">No se encontraron facturas.</div>
            ) : (
              filteredSales.map((sale) => (
                <button
                  key={sale.id}
                  className="w-full text-left border rounded-xl p-4 transition-colors bg-slate-900/60 border-slate-700 hover:border-indigo-500 shadow-lg hover:shadow-indigo-500/20"
                  onClick={() => loadSale(sale.id)}
                >
                  <div className="flex justify-between items-center mb-2 border-b border-slate-700/50 pb-2">
                    <span className="font-bold text-white tracking-wider">#{sale.systemNumber}</span>
                    <span className="text-xs text-slate-400">{new Date(sale.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-indigo-300 font-semibold truncate">{sale.customer?.name ?? 'Cliente Genérico'}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Total Factura: <span className="text-emerald-400 font-bold ml-1">${Number(sale.total).toFixed(2)}</span>
                  </div>
                  <div className="mt-3 text-xs text-center w-full bg-slate-800 p-1.5 rounded text-slate-300 hover:bg-slate-700 transition-colors">
                    Generar Nota de Crédito / Retorno
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL FLOTANTE DE DEVOLUCIÓN */}
      {showModal && selected && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col my-auto relative">
            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-950/50 rounded-t-2xl sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-wide">Procesar Devolución <span className="text-rose-400">#{selected.systemNumber}</span></h2>
                <p className="text-sm text-slate-400 mt-1">Cliente: <span className="text-slate-200">{selected.customer?.name ?? 'Genérico'}</span> | Vendedor: {selected.seller?.name ?? '-'}</p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition-colors"><X className="w-6 h-6" /></button>
            </div>
                
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-800/80 rounded-lg text-xs font-bold uppercase text-slate-400 tracking-wider">
                <div className="col-span-5">Producto</div>
                <div className="col-span-2 text-center">Comprado</div>
                <div className="col-span-5 text-center">Acción de Devolución</div>
              </div>
              
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                {selected.details.map((d: any) => (
                  <div key={d.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center border border-slate-700/50 rounded-xl bg-slate-800/30 hover:bg-slate-800/80 transition-colors">
                    <div className="col-span-5">
                      <div className="font-bold text-slate-200 truncate" title={d.item?.name}>{d.item?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">P.U: ${Number(d.unitPrice).toFixed(2)} {d.isGift ? <span className="text-amber-500 ml-1">(Regalo)</span> : ''}</div>
                    </div>
                    <div className="col-span-2 text-center font-mono text-lg text-indigo-300 font-bold bg-slate-900/50 rounded p-1 border border-slate-700/50">
                      {d.quantity}
                    </div>
                    <div className="col-span-5 flex items-center gap-3 justify-end">
                      <div className="flex flex-col w-20">
                        <label className="text-[10px] text-slate-400 mb-1">Devolver</label>
                        <input type="number" min={1} max={d.quantity} value={returnQuantities[d.itemId] || 1} onChange={(e) => setReturnQuantities({ ...returnQuantities, [d.itemId]: Number(e.target.value) })} className="input bg-slate-900 text-center font-bold text-rose-300 border-slate-600 px-1 py-1 h-8" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <label className="text-[10px] text-slate-400 mb-1">Motivo (Opcional)</label>
                        <input type="text" placeholder="Ej. Defecto" value={returnReasons[d.itemId] || ''} onChange={(e) => setReturnReasons({ ...returnReasons, [d.itemId]: e.target.value })} className="input bg-slate-900 border-slate-600 px-2 py-1 h-8 text-xs" />
                      </div>
                      <button disabled={loading} className="btn-primary bg-rose-600 hover:bg-rose-500 border-none shadow-lg shadow-rose-600/20 mt-4 px-3 py-1.5 text-xs whitespace-nowrap" onClick={() => doReturn(d.itemId)}>
                        Ejecutar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: HISTORY */}
      {activeTab === 'HISTORY' && (
        <div className="card p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Historial de Notas de Crédito / Devoluciones</h2>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-2 text-slate-400" />
              <input className="input pl-10 w-80 bg-slate-900 border-slate-700" placeholder="Buscar por documento o cliente..." value={searchHistory} onChange={(e) => setSearchHistory(e.target.value)} />
            </div>
          </div>
          
          {filteredReturns.length === 0 ? (
            <div className="text-slate-500 text-center py-10 border border-dashed border-slate-700 rounded-xl bg-slate-900/30">No se encontraron devoluciones que coincidan.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredReturns.map((r) => (
                <div key={r.id} className="border border-slate-700/50 rounded-xl p-4 bg-slate-800/40 hover:bg-slate-800 transition-colors shadow-lg">
                  <div className="flex justify-between items-start mb-2 border-b border-slate-700 pb-2">
                    <span className="font-black text-rose-400 tracking-wider">#{r.systemNumber}</span>
                    <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm space-y-1 mb-3">
                    <div className="text-slate-200 truncate"><span className="text-slate-500">Cliente:</span> {r.customer?.name || 'Genérico'}</div>
                    <div className="text-slate-300"><span className="text-slate-500">Afectó Factura:</span> {r.sale?.systemNumber || 'N/A'}</div>
                    <div className="text-slate-300"><span className="text-slate-500">Sede:</span> {r.branch?.name || '-'}</div>
                  </div>
                  <div className="text-xs bg-slate-950/50 p-2 rounded text-center font-mono text-slate-400">
                    Artículos devueltos: <span className="font-bold text-white">{r.details?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
