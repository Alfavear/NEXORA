// POS completo: crea ventas reales en backend
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { itemsApi } from '../api/items';
import { customersApi } from '../api/customers';
import { salesApi } from '../api/sales';

export default function Sales() {
  const { me } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [externalReceipt, setExternalReceipt] = useState('');
  const [notes, setNotes] = useState('');
  const [saleType, setSaleType] = useState<'CONTADO' | 'CRÉDITO'>('CONTADO');
  const [discount, setDiscount] = useState(0);
  const [transport, setTransport] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    itemsApi.list().then((r: any) => setItems(r.data ?? r));
    customersApi.getAll(true).then((r: any) => setCustomers(r.data ?? r));
    salesApi.list().then((r: any) => setSales(r.data ?? r));
  }, []);

  const filteredItems = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { itemId: item.id, name: item.name, quantity: 1, unitPrice: Number(item.salePrice ?? item.basePrice ?? 0) }];
    });
  };

  const addByCode = () => {
    const found = items.find((item: any) => item.sku === itemCode || item.barcode === itemCode || item.name === itemCode);
    if (!found) {
      setMessage(`Artículo no encontrado para código/nombre: ${itemCode}`);
      return;
    }
    addToCart(found);
    setItemCode('');
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) => prev.map((item) => (item.itemId === itemId ? { ...item, quantity } : item)));
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0),
    [cart],
  );

  const TAX_RATE = 0.12;
  const tax = useMemo(
    () => Math.max(0, (subtotal - discount + transport) * TAX_RATE),
    [subtotal, discount, transport],
  );

  const total = useMemo(() => Math.max(0, subtotal - discount + transport + tax), [subtotal, discount, transport, tax]);

  const cancelSale = async (sale: any) => {
    if (!confirm(`¿Anular venta #${sale.systemNumber}?`)) return;
    setLoading(true);
    setMessage(null);

    try {
      const itemsToReturn = sale.details.map((d: any) => ({
        itemId: d.itemId,
        quantity: Number(d.quantity),
      }));
      if (!itemsToReturn.length) {
        setMessage('No hay detalles para anular.');
        return;
      }
      await salesApi.createReturn(sale.id, { items: itemsToReturn });
      setMessage(`Venta ${sale.systemNumber} anulada correctamente.`);

      const updatedSales = await salesApi.list();
      setSales(updatedSales.data ?? updatedSales);
      const updatedItems = await itemsApi.list();
      setItems(updatedItems.data ?? updatedItems);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'No se pudo anular la venta.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCart([]);
    setItemCode('');
    setSelectedCustomer(null);
    setExternalReceipt('');
    setNotes('');
    setSaleType('CONTADO');
    setDiscount(0);
    setTransport(0);
    setMessage(null);
  };

  const submitSale = async () => {
    if (!cart.length) {
      setMessage('Agrega al menos un artículo al carrito.');
      return;
    }

    setLoading(true);
    setMessage(null);

    if (!selectedCustomer) {
      setMessage('Selecciona un cliente o deja Cliente genérico.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        customerId: selectedCustomer || undefined,
        externalReceiptNumber: externalReceipt || undefined,
        notes: `${notes || ''} | Tipo: ${saleType} | Desc: ${discount.toFixed(2)} | IVA: ${tax.toFixed(2)} | Transp: ${transport.toFixed(2)}`,
        items: cart.map((i) => ({ itemId: i.itemId, quantity: i.quantity, unitPrice: i.unitPrice })),
        subtotal,
        total,
      };

      const res = await salesApi.create(payload);

      setMessage(`Venta creada con N° ${res.data?.systemNumber ?? res.data?.systemNumber ?? ''}`);
      setCart([]);
      setNotes('');
      setExternalReceipt('');
      setSelectedCustomer(null);

      // Actualizar lista de ventas y stocks
      const updatedSales = await salesApi.list();
      setSales(updatedSales.data ?? updatedSales);
      // recargar items para stock update
      const updatedItems = await itemsApi.list();
      setItems(updatedItems.data ?? updatedItems);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'No se pudo crear la venta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 text-slate-100">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ventas / POS</h1>
        <span className="text-sm text-slate-300">Vendedor: {me?.name ?? 'Desconocido'}</span>
      </div>

      {message && (
        <div className="rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-100 p-3">{message}</div>
      )}

      <div className="inline-flex gap-2 mb-4">
        <button className="btn-soft" onClick={resetForm} disabled={loading}>Nueva</button>
        <button className="btn-primary" onClick={submitSale} disabled={loading}>Grabar</button>
        <button className="btn-danger" onClick={() => { setMessage('Selecciona una venta para anular desde el listado'); }} disabled={loading}>Anular</button>
        <button className="btn-soft" onClick={() => window.location.assign('/')} disabled={loading}>Salir</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <h2 className="text-xl font-semibold mb-3">Cliente y parámetros</h2>
          <label className="block mb-2">
            Cliente
            <select
              className="input mt-1 bg-white text-black"
              value={selectedCustomer ?? ''}
              onChange={(e) => setSelectedCustomer(Number(e.target.value) || null)}
            >
              <option value="">Cliente genérico</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block mb-2">
            Recibo / factura (opcional)
            <input
              className="input mt-1"
              value={externalReceipt}
              onChange={(e) => setExternalReceipt(e.target.value)}
            />
          </label>
          <label className="block mb-2">
            Tipo de venta
            <select
              className="input mt-1"
              value={saleType}
              onChange={(e) => setSaleType(e.target.value as 'CONTADO' | 'CRÉDITO')}
            >
              <option value="CONTADO">Contado</option>
              <option value="CRÉDITO">Crédito</option>
            </select>
          </label>

          <label className="block mb-2">
            Descuento
            <input
              type="number"
              min={0}
              className="input mt-1"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            />
          </label>

          <label className="block mb-2">
            Transporte
            <input
              type="number"
              min={0}
              className="input mt-1"
              value={transport}
              onChange={(e) => setTransport(Number(e.target.value) || 0)}
            />
          </label>

          <div className="rounded-xl bg-slate-900/50 border border-slate-700 p-3 mt-2">
            <div className="flex justify-between text-sm text-slate-300">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-300">
              <span>Descuento</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-300">
              <span>Transporte</span>
              <span>${transport.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-300">
              <span>I.V.A. (12%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between text-base font-bold text-white">
              <span>Total neto</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <label className="block mb-2 mt-4">
            Notas (opcional)
            <textarea
              className="input mt-1 h-24 resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button
            className="btn-primary w-full mt-3"
            onClick={submitSale}
            disabled={loading}
          >
            {loading ? 'Procesando venta...' : 'Registrar venta'}
          </button>
        </div>

        <div className="card p-4 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-3">Agregar productos</h2>
          <div className="grid grid-cols-1 gap-2 mb-3">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn-soft px-3" onClick={() => setSearch('')}>
                Limpiar
              </button>
            </div>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Código/Barra/Nombre"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addByCode()}
              />
              <button className="btn-primary px-3" type="button" onClick={addByCode}>
                Agregar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-80 overflow-auto">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="rounded-xl border border-slate-700 p-3 text-left hover:bg-white/10 transition"
              >
                <div className="font-semibold text-white">{item.name}</div>
                <div className="text-xs text-slate-300">
                  Precio: ${Number(item.salePrice ?? item.basePrice ?? 0).toFixed(2)}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <h3 className="text-lg font-bold">Carrito</h3>
            <div className="space-y-2 mt-2">
              {cart.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-800/40">Carrito vacío</div>
              ) : (
                cart.map((item) => (
                  <div key={item.itemId} className="flex gap-2 items-center rounded-xl bg-slate-800/40 p-2">
                    <div className="flex-1">
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-xs text-slate-300">Precio unitario: ${Number(item.unitPrice).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="btn-soft px-2"
                        onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="input w-16 text-center bg-white text-black"
                        value={item.quantity}
                        min={1}
                        onChange={(e) => updateQuantity(item.itemId, Number(e.target.value))}
                      />
                      <button
                        className="btn-soft px-2"
                        onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button className="btn-danger px-3" onClick={() => removeFromCart(item.itemId)}>
                      Eliminar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 flex justify-between items-center">
            <div className="text-lg">Total:</div>
            <div className="text-3xl font-bold">${total.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-xl font-semibold mb-3">Ventas recientes</h2>
        <div className="space-y-2">
          {sales.length === 0 ? (
            <div className="text-slate-300">No hay ventas registradas todavía.</div>
          ) : (
            sales.slice(0, 6).map((sale) => (
              <div key={sale.id} className="rounded-lg border border-slate-700 p-3 bg-slate-900/60">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="text-sm text-slate-300">#{sale.systemNumber} - {new Date(sale.createdAt).toLocaleString()}</div>
                    <div className="text-white font-semibold">Total: ${Number(sale.total).toFixed(2)}</div>
                    <div className="text-xs text-slate-400">Cliente: {sale.customer?.name ?? 'Genérico'}</div>
                  </div>
                  <button
                    className="btn-danger text-xs px-2 py-1"
                    onClick={() => cancelSale(sale)}
                    disabled={loading}
                  >
                    Anular
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
