import { useState } from 'react';
import { reportsApi } from '../api/reports';

export default function Reports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<any>(null);

  const load = async () => {
    const res = await reportsApi.sales(from, to);
    setData(res);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Reporte de Ventas</h1>

      <div className="flex gap-2 mb-4">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border p-2" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border p-2" />
        <button onClick={load} className="bg-blue-500 text-white px-4">Buscar</button>
      </div>

      {data && (
        <div>
          <h2>Total Ventas: {data.summary.totalSales}</h2>
          <h2>Total Ingresos: {data.summary.totalRevenue}</h2>

          <h3 className="mt-4">Por día</h3>
          {data.byDay.map((d: any) => (
            <div key={d.date}>{d.date}: {d.total}</div>
          ))}
        </div>
      )}
    </div>
  );
}
