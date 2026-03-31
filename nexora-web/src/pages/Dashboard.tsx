import { useEffect, useState } from 'react';
import { reportsApi } from '../api/reports';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    reportsApi.sales(today, today).then((res:any)=>setData(res.data));
  }, []);

  if (!data) return <div className="p-4">Cargando...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="border p-4">
          <div>Ventas del día</div>
          <div className="text-xl font-bold">{data.summary.totalSales}</div>
        </div>
        <div className="border p-4">
          <div>Ingresos del día</div>
          <div className="text-xl font-bold">${data.summary.totalRevenue}</div>
        </div>
      </div>

      <div className="border p-4">
        <h2 className="font-semibold">Top productos</h2>
        {data.topProducts.map((p:any)=>(
          <div key={p.itemId}>{p.name} - {p.quantity}</div>
        ))}
      </div>
    </div>
  );
}
