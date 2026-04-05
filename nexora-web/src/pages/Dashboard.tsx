import { useEffect, useState } from 'react';
import { reportsApi } from '../api/reports';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState<'TODAY' | 'YESTERDAY' | 'LAST_7' | 'LAST_30'>('TODAY');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [filter]);

  const loadDashboard = async () => {
    setLoading(true);
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    if (filter === 'YESTERDAY') {
      startDate.setDate(today.getDate() - 1);
      endDate.setDate(today.getDate() - 1);
    } else if (filter === 'LAST_7') {
      startDate.setDate(today.getDate() - 6);
    } else if (filter === 'LAST_30') {
      startDate.setDate(today.getDate() - 29);
    }

    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);

    try {
      const res = await reportsApi.getSalesVolume({ startDate: startStr, endDate: endStr });
      const filterLabels: any = { 'TODAY': 'Hoy', 'YESTERDAY': 'Ayer', 'LAST_7': 'Últimos 7 días', 'LAST_30': 'Últimos 30 días' };
      res.summary.periodLabel = filterLabels[filter];
      setData(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-4 space-y-6">
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-3">
          <select 
            className="input bg-slate-800 text-white border-slate-700 font-semibold" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            disabled={loading}
          >
            <option value="TODAY">Día Actual</option>
            <option value="YESTERDAY">Día Anterior</option>
            <option value="LAST_7">Últimos 7 Días</option>
            <option value="LAST_30">Últimos 30 Días</option>
          </select>
          <span className="pill-indigo whitespace-nowrap min-w-[120px] text-center shadow-lg">{loading ? 'Calculando...' : data?.summary?.periodLabel}</span>
        </div>
      </div>

      {loading && !data ? (
        <div className="h-64 flex items-center justify-center text-slate-400">Generando métricas analíticas...</div>
      ) : data ? (
        <div className={`space-y-6 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-indigo-400/20">
          <div className="text-xs font-medium uppercase tracking-wide text-indigo-200">Ventas Realizadas</div>
          <div className="mt-2 text-3xl font-bold text-white">{data.summary.totalSales}</div>
        </div>
        <div className="card p-5 border-cyan-400/20">
          <div className="text-xs font-medium uppercase tracking-wide text-cyan-200">Total Facturado</div>
          <div className="mt-2 text-3xl font-bold text-white">${data.summary.totalRevenue.toFixed(2)}</div>
        </div>
        <div className="card p-5 border-emerald-400/20">
          <div className="text-xs font-medium uppercase tracking-wide text-emerald-200">Mejor Día</div>
          <div className="mt-2 text-3xl font-bold text-white">{data.summary.bestPeriod}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 border-slate-400/20 lg:col-span-2 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-4">Volumen de Ingresos</h2>
          <div className="flex-1 flex items-end gap-1 sm:gap-2 h-64 mt-4 overflow-x-auto pb-2 px-2">
            {data.breakdown.length === 0 ? (
               <div className="w-full text-center text-slate-500 mb-10">No hay ventas registradas en este periodo.</div>
            ) : data.breakdown.map((b: any, idx: number) => {
              const maxRev = Math.max(...data.breakdown.map((b: any) => b.revenue), 1);
              const heightPct = Math.max((b.revenue / maxRev) * 100, 2);
              return (
                <div key={idx} className="flex flex-col items-center flex-1 min-w-[20px] sm:min-w-[30px] group relative h-full justify-end">
                  {/* Tooltip Hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg border border-slate-700">
                    ${Number(b.revenue).toFixed(2)} ({b.salesCount} ventas)
                  </div>
                  {/* Barra Gráfica */}
                  <div 
                    className="w-full bg-gradient-to-t from-indigo-900/50 to-indigo-500 hover:to-indigo-400 rounded-t-sm transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)] hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                    style={{ height: `${heightPct}%` }}
                  ></div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 mt-2">{b.period}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5 border-slate-400/20">
          <h2 className="text-xl font-semibold text-white mb-4">Top 10 Productos</h2>
          <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-2">
            {data.topProducts.map((p: any) => (
              <div key={p.sku} className="flex justify-between items-center rounded-xl border border-slate-700/50 p-3 bg-slate-900/60 hover:bg-slate-800 transition">
                <div className="overflow-hidden pr-2">
                  <div className="font-semibold text-slate-100 text-sm truncate" title={p.name}>{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="text-emerald-400 font-bold text-sm">{p.quantity} <span className="text-[10px] font-normal text-slate-500">uds</span></div>
                  <div className="text-xs text-indigo-300 font-mono">${Number(p.revenue).toFixed(2)}</div>
                </div>
              </div>
            ))}
            {data.topProducts.length === 0 && (
              <div className="text-center text-slate-500 mt-4 text-sm">No hay ventas registradas.</div>
            )}
          </div>
        </div>
      </div>
    </div>
    ) : null}
    </div>
  );
}
