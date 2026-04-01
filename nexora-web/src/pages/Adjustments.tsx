import { useEffect, useState } from 'react';
import { inventoryApi } from '../api/inventory';
import { itemsApi } from '../api/items';
import { branchesApi } from '../api/branches';
import { useAuth } from '../auth/AuthContext';

export default function Adjustments() {
  const { me } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [payload, setPayload] = useState({ itemId: 0, branchId: 0, quantity: 0, reason: '', notes: '' });
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    itemsApi.list().then((r:any)=>setItems(r.data ?? r));
    branchesApi.list().then((r:any)=>setBranches(r.data ?? r));
    loadAdjustments();
  }, []);

  const loadAdjustments = async () => {
    const res = await inventoryApi.listAdjustments(filterStatus || undefined);
    setAdjustments(res.data ?? res);
  };

  const submit = async () => {
    setLoading(true);
    setMessage(null);

    if (!payload.itemId || !payload.quantity) {
      setMessage('Selecciona artículo y cantidad');
      setLoading(false);
      return;
    }

    try {
      await inventoryApi.createAdjustment({
        itemId: payload.itemId,
        branchId: payload.branchId || me?.branchId,
        quantity: payload.quantity,
        reason: payload.reason,
        notes: payload.notes,
      });
      setMessage('Ajuste enviado.');
      setPayload({ itemId: 0, branchId: 0, quantity: 0, reason: '', notes: '' });
      await loadAdjustments();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Error creando ajuste');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id:number, approved:boolean) => {
    setLoading(true);
    setMessage(null);

    try {
      await inventoryApi.approveAdjustment(id, { approved });
      setMessage(approved ? 'Ajuste aprobado' : 'Ajuste rechazado');
      await loadAdjustments();
    } catch (error:any) {
      setMessage(error?.response?.data?.message || 'Error aprobando ajuste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Ajustes de Inventario</h1>
      {message && <div className="p-3 rounded bg-blue-800/20 border border-blue-500 text-sm">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold">Nuevo Ajuste</h2>
          <select className="input w-full mt-2" value={payload.itemId} onChange={(e)=>setPayload((p)=>({...p, itemId:Number(e.target.value)}))}>
            <option value={0}>Selecciona artículo</option>
            {items.map((it)=> (<option key={it.id} value={it.id}>{it.name}</option>))}
          </select>
          <select className="input w-full mt-2" value={payload.branchId || me?.branchId || 0} onChange={(e)=>setPayload((p)=>({...p, branchId:Number(e.target.value)}))}>
            <option value={0}>Sucursal (default {me?.branchName})</option>
            {branches.map((b)=> (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
          <input className="input w-full mt-2" type="number" value={payload.quantity} onChange={(e)=>setPayload((p)=>({...p, quantity:Number(e.target.value)}))} placeholder="Cantidad (+ para ingreso, - para salida)" />
          <input className="input w-full mt-2" value={payload.reason} onChange={(e)=>setPayload((p)=>({...p, reason:e.target.value}))} placeholder="Motivo" />
          <input className="input w-full mt-2" value={payload.notes} onChange={(e)=>setPayload((p)=>({...p, notes:e.target.value}))} placeholder="Notas" />
          <button className="btn-primary mt-2" disabled={loading} onClick={submit}>{loading ? 'Procesando...' : 'Guardar ajuste'}</button>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold">Ajustes pendientes/aprobados</h2>
          <div className="flex gap-2 mt-2">
            <select className="input" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobados</option>
              <option value="REJECTED">Rechazados</option>
            </select>
            <button className="btn" onClick={loadAdjustments}>Filtrar</button>
          </div>
          <div className="mt-3 space-y-2 max-h-96 overflow-auto">
            {adjustments.map((a)=> (
              <div key={a.id} className="border rounded p-2">
                <div className="text-xs text-slate-400">#{a.id} | {a.branch?.name || ''} | {new Date(a.createdAt).toLocaleString()}</div>
                <div>{a.item?.name || '???'} | Cant: {a.quantity} | {a.status}</div>
                <div>Solicitó: {a.requestedBy?.name || '-'} | Aprobó: {a.approvedBy?.name || '-'}</div>
                <div>Motivo: {a.reason || '-'} | Notas: {a.notes || '-'}</div>
                {me?.role === 'ADMIN' && a.status === 'PENDING' && (
                  <div className="flex gap-2 mt-2">
                    <button className="btn btn-success btn-sm" onClick={()=>handleApprove(a.id, true)} disabled={loading}>Aprobar</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>handleApprove(a.id, false)} disabled={loading}>Rechazar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
