import { useEffect, useMemo, useState } from 'react';
import { reportsApi } from '../api/reports';
import { salesApi } from '../api/sales';
import { customersApi } from '../api/customers';
import { branchesApi } from '../api/branches';

type ReportType = 'SALES' | 'CREDIT';

export default function Reports() {
  const [type, setType] = useState<ReportType>('SALES');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [branchId, setBranchId] = useState<number | ''>('');
  const [status, setStatus] = useState<'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED' | ''>('');
  const [result, setResult] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const customersRes = await customersApi.getAll(true);
      setCustomers(customersRes.data ?? customersRes);

      const branchesRes = await branchesApi.list();
      setBranches(branchesRes.data ?? branchesRes);
    })();
  }, []);

  const canProcess = useMemo(() => Boolean(from && to), [from, to]);

  const process = async () => {
    if (!canProcess) return;

    if (type === 'SALES') {
      const res = await reportsApi.sales(from, to);
      const data = res.data ?? res;
      setSummary(data.summary);
      setResult(data.sales || []);
    } else {
      const res = await salesApi.getCreditReport(
        from,
        to,
        customerId || undefined,
        branchId || undefined,
        status || undefined,
      );
      const data = res.data ?? res;
      setSummary(data.summary);
      setResult(data.sales || []);
    }
  };

  const printReport = () => {
    const rows = result
      .map(
        (r) =>
          `<tr><td>${r.systemNumber}</td><td>${r.customer?.name ?? 'Genérico'}</td><td>${Number(r.total).toFixed(2)}</td><td>${Number(r.outstanding || 0).toFixed(2)}</td><td>${r.paymentStatus ?? '-'}</td><td>${r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '-'}</td></tr>`,
      )
      .join('');

    const html = `
      <html>
      <head><style>body{font-family:Arial;} table {border-collapse: collapse;width:100%;} th, td {border:1px solid #333; padding:8px;}</style></head>
      <body>
        <h1>${type === 'SALES' ? 'Reporte de Ventas' : 'Reporte Cartera Créditos'}</h1>
        <p>Periodo: ${from} - ${to}</p>
        <p>${type === 'SALES' ? `Total ventas: ${summary?.totalSales || 0}, Ingresos: ${summary?.totalRevenue || 0}` : `Deuda: ${summary?.totalDebt || 0}, Vencido: ${summary?.overdueAmount || 0}`}</p>
        <table><thead><tr><th>Nro</th><th>Cliente</th><th>Total</th><th>Saldo</th><th>Estado</th><th>Vence</th></tr></thead><tbody>${rows}</tbody></table>
      </body>
      </html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.print();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-slate-100">Reportes</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setType('SALES')}
          className={`btn ${type === 'SALES' ? 'btn-primary' : 'btn-soft'}`}
        >
          Ventas
        </button>
        <button
          onClick={() => setType('CREDIT')}
          className={`btn ${type === 'CREDIT' ? 'btn-primary' : 'btn-soft'}`}
        >
          Cartera
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="input bg-white text-black"
          placeholder="Desde"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="input bg-white text-black"
          placeholder="Hasta"
        />

        {type === 'CREDIT' && (
          <>
            <select
              className="input bg-white text-black"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Todos los clientes</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="input bg-white text-black"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Todas las sucursales</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              className="input bg-white text-black"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">PENDIENTE</option>
              <option value="PARTIAL">PARCIAL</option>
              <option value="PAID">PAGADA</option>
              <option value="CANCELLED">CANCELADA</option>
            </select>
          </>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={process} className="btn-primary" disabled={!canProcess}>
          Procesar
        </button>
        <button onClick={printReport} className="btn-soft" disabled={!result.length}>
          Imprimir
        </button>
      </div>

      {summary && (
        <div className="mb-4 text-slate-200">
          {type === 'SALES' ? (
            <>
              <span className="mr-4">Total Ventas: {summary.totalSales}</span>
              <span className="mr-4">Ingresos: ${Number(summary.totalRevenue).toFixed(2)}</span>
              <span>Promedio: ${Number(summary.averageTicket).toFixed(2)}</span>
            </>
          ) : (
            <>
              <span className="mr-4">Deudas: {summary.totalDebts}</span>
              <span className="mr-4">Total deuda: ${Number(summary.totalDebt).toFixed(2)}</span>
              <span className="mr-4">Vencidas: {summary.overdueCount}</span>
              <span>Monto vencido: ${Number(summary.overdueAmount).toFixed(2)}</span>
            </>
          )}
        </div>
      )}

      <div className="overflow-auto" style={{ maxHeight: '50vh' }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-800">
              <th className="border px-2 py-1">Nro</th>
              <th className="border px-2 py-1">Cliente</th>
              <th className="border px-2 py-1">Total</th>
              <th className="border px-2 py-1">Saldo</th>
              <th className="border px-2 py-1">Estado</th>
              <th className="border px-2 py-1">Vence</th>
            </tr>
          </thead>
          <tbody>
            {result.length ? result.map((r) => (
              <tr key={r.id} className="hover:bg-slate-700/60">
                <td className="border px-2 py-1">{r.systemNumber}</td>
                <td className="border px-2 py-1">{r.customer?.name ?? 'Genérico'}</td>
                <td className="border px-2 py-1">${Number(r.total).toFixed(2)}</td>
                <td className="border px-2 py-1">${Number(r.outstanding || 0).toFixed(2)}</td>
                <td className="border px-2 py-1">{r.paymentStatus ?? '-'}</td>
                <td className="border px-2 py-1">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '-'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="border px-2 py-4 text-center text-slate-400">No hay datos para mostrar</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
