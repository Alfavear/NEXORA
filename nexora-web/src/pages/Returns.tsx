import { useEffect, useState } from 'react';
import { salesApi } from '../api/sales';

export default function Returns() {
  const [sales, setSales] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [returns, setReturns] = useState<any[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    setMessage(null);
  };

  const doReturn = async (itemId: number) => {
    if (!selected) return;
    setLoading(true);
    setMessage(null);

    try {
      await salesApi.createReturn(selected.id, {
        items: [{ itemId, quantity, reason: reason || undefined }],
      });
      setMessage('Devolución registrada correctamente.');
      setQuantity(1);
      setReason('');
      await loadReturns();
      await loadSales();
      if (selected) await loadSale(selected.id);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Error al registrar devolución');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Devoluciones</h1>

      {message && <div className="p-3 bg-yellow-500/20 rounded border border-yellow-500 text-sm">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Ventas recientes</h2>
          {sales.length === 0 && <p>No hay ventas disponibles.</p>}
          <div className="space-y-2">
            {sales.map((sale) => (
              <button
                key={sale.id}
                className="w-full text-left border rounded p-2 hover:bg-slate-800"
                onClick={() => loadSale(sale.id)}
              >
                #{sale.id} - {sale.customer?.name ?? 'Cliente Genérico'} - {sale.systemNumber}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-2">Devoluciones registradas</h2>
          {returns.length === 0 && <p>No hay devoluciones registradas.</p>}
          <div className="space-y-2">
            {returns.map((r) => (
              <div key={r.id} className="border rounded p-2">
                <div className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleString()}</div>
                <div>#{r.systemNumber} | {r.sale?.systemNumber || 'N/A'} | {r.branch?.name || '-'}</div>
                <div>Total item(s): {r.details?.length}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <div className="card p-4">
          <h3 className="font-semibold">Detalle de venta #{selected.id} ({selected.systemNumber})</h3>
          <p className="text-sm">Cliente: {selected.customer?.name ?? 'Genérico'}</p>
          <div className="space-y-2 mt-3">
            {selected.details.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between gap-2 border-b pb-2">
                <div>
                  <div className="font-semibold">{d.item?.name}</div>
                  <div className="text-xs text-slate-400">Cantidad vendida: {d.quantity} | Precio: {Number(d.unitPrice).toFixed(2)} | {d.isGift ? 'Regalo' : 'Normal'}</div>

                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={d.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="input w-20"
                  />
                  <input
                    type="text"
                    placeholder="Motivo"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="input w-48"
                  />
                  <button
                    disabled={loading}
                    className="btn btn-sm btn-warning"
                    onClick={() => doReturn(d.itemId)}
                  >
                    Devolver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
