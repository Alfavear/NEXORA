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
      <h1 className="text-xl font-bold mb-4 text-slate-100">Reporte de Ventas</h1>

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="input bg-white text-black border-slate-300 shadow-sm"
          style={{ color: '#000000' }}
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="input bg-white text-black border-slate-300 shadow-sm"
          style={{ color: '#000000' }}
        />
        <button onClick={load} className="btn-primary">Buscar</button>
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
