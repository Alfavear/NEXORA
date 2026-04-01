import { useEffect, useState } from 'react';
import { reportsApi } from '../api/reports';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const start = thirtyDaysAgo.toISOString().slice(0, 10);
    const end = today.toISOString().slice(0, 10);
    
    reportsApi.getSales({ startDate: start, endDate: end }).then((sales: any[]) => {
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
      const totalUnits = sales.reduce((sum, s) => sum + Number(s.units || 0), 0);
      const activeCustomers = new Set(sales.map((s) => s.customerName || 'Consumidor Final')).size;

      const productMap: Record<string, { itemId: number; name: string; quantity: number }> = {};
      sales.forEach((sale) => {
        (sale.details || []).forEach((detail: any) => {
          const itemId = detail.itemId;
          const name = detail.description ?? 'Desconocido';
          if (!itemId) return;
          if (!productMap[itemId]) {
            productMap[itemId] = { itemId, name, quantity: Number(detail.quantity || 0) };
          } else {
            productMap[itemId].quantity += Number(detail.quantity || 0);
          }
        });
      });

      const topProducts = Object.values(productMap).
        sort((a, b) => b.quantity - a.quantity).
        slice(0, 5);

      setData({ summary: { totalSales, totalRevenue, totalUnits, activeCustomers }, topProducts });
    });
  }, []);

  if (!data) return <div className="p-4">Cargando...</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-100">Dashboard</h1>
        <span className="pill-indigo">{new Date().toLocaleDateString()}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card p-5 border-indigo-400/20">
          <div className="text-xs font-medium uppercase tracking-wide text-indigo-200">Ventas (30 días)</div>
          <div className="mt-2 text-3xl font-bold text-white">{data.summary.totalSales}</div>
        </div>
        <div className="card p-5 border-cyan-400/20">
          <div className="text-xs font-medium uppercase tracking-wide text-cyan-200">Ingresos (30 días)</div>
          <div className="mt-2 text-3xl font-bold text-white">${data.summary.totalRevenue.toFixed(2)}</div>
        </div>
        <div className="card p-5 border-emerald-400/20">
          <div className="text-xs font-medium uppercase tracking-wide text-emerald-200">Unidades vendidas</div>
          <div className="mt-2 text-3xl font-bold text-white">{data.summary.totalUnits}</div>
        </div>
        <div className="card p-5 border-fuchsia-400/20">
          <div className="text-xs font-medium uppercase tracking-wide text-fuchsia-200">Clientes activos</div>
          <div className="mt-2 text-3xl font-bold text-white">{data.summary.activeCustomers}</div>
        </div>
      </div>

      <div className="card p-5 border-slate-400/20">
        <h2 className="text-xl font-semibold text-white mb-3">Top productos</h2>
        <div className="grid gap-2">
          {data.topProducts.map((p:any)=>(
            <div key={p.itemId} className="rounded-xl border border-slate-700 p-3 bg-slate-900/60 hover:bg-slate-900/80 transition">
              <div className="font-semibold text-slate-50">{p.name}</div>
              <div className="text-xs text-slate-300">Vendidos: {p.quantity}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
