// POS completo: crea ventas reales en backend
import { useEffect, useMemo, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../auth/AuthContext';
import { itemsApi } from '../api/items';
import { customersApi } from '../api/customers';
import { salesApi } from '../api/sales';
import { paymentMethodsApi, type PaymentMethod } from '../api/payment-methods';

import { InvoicePrint } from './Reports/templates/InvoicePrint';

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
  const [dueDate, setDueDate] = useState('');
  const [discount, setDiscount] = useState(0);
  const [transport, setTransport] = useState(0);
  const [selectedCreditSaleId, setSelectedCreditSaleId] = useState<number | null>(null);
  const [selectedCreditSale, setSelectedCreditSale] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethodId, setPaymentMethodId] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saleToPrint, setSaleToPrint] = useState<any>(null);
  
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Ticket_Venta'
  });
  const [message, setMessage] = useState<string | null>(null);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [payments, setPayments] = useState<{ paymentMethodId: number; amount: number }[]>([]);

  useEffect(() => {
    itemsApi.list().then((r: any) => setItems(r.data ?? r));
    customersApi.getAll(true).then((r: any) => setCustomers(r.data ?? r));
    salesApi.list().then((r: any) => setSales(r.data ?? r));
    paymentMethodsApi.getAll().then((r) => setPaymentMethods(r.filter((p: PaymentMethod) => p.isActive)));
  }, []);

  const filteredItems = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  const outstandingSales = useMemo(
    () => sales.filter((sale) => Number(sale.outstanding) > 0),
    [sales],
  );

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      const price = Number(item.salePrice ?? item.basePrice ?? 0);
      return [...prev, { itemId: item.id, name: item.name, quantity: 1, baseUnitPrice: price, unitPrice: price, isGift: false }];
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
    setDueDate('');
    setPayments([]);
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
      if (saleType === 'CRÉDITO' && !dueDate) {
        setMessage('Selecciona una fecha de vencimiento para crédito');
        setLoading(false);
        return;
      }

      const payload = {
        customerId: selectedCustomer || undefined,
        externalReceiptNumber: externalReceipt || undefined,
        notes: `${notes || ''} | Tipo: ${saleType} | Desc: ${discount.toFixed(2)} | IVA: ${tax.toFixed(2)} | Transp: ${transport.toFixed(2)}`,
        isCredit: saleType === 'CRÉDITO',
        dueDate: saleType === 'CRÉDITO' ? dueDate : undefined,
        payments: payments.filter((p) => p.amount > 0 && p.paymentMethodId > 0),
        items: cart.map((i) => ({ itemId: i.itemId, quantity: i.quantity, unitPrice: i.isGift ? 0 : i.baseUnitPrice, isGift: i.isGift ?? false })),
        subtotal,
        total,
      };

      const res = await salesApi.create(payload);
      
      const createdSale = res.data ?? res;
      setMessage(`Venta creada con N° ${createdSale?.systemNumber ?? ''}`);
      setSaleToPrint(createdSale);

      setCart([]);
      setNotes('');
      setExternalReceipt('');
      setSelectedCustomer(null);
      setSaleType('CONTADO');
      setDueDate('');
      setPayments([]);

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

  const loadCreditSale = async (saleId: number) => {
    try {
      const res = await salesApi.get(saleId);
      setSelectedCreditSale(res.data ?? res);
      setMessage(null);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'No se pudo cargar la venta');
    }
  };

  const printSale = (sale: any) => {
    setSaleToPrint(sale);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const submitPayment = async () => {
    if (!selectedCreditSaleId) {
      setMessage('Selecciona una venta a crédito');
      return;
    }
    if (paymentAmount <= 0) {
      setMessage('Ingresa un monto válido para abonar');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await salesApi.createPayment(selectedCreditSaleId, {
        amount: paymentAmount,
        paymentMethodId: paymentMethodId,
        notes: paymentNotes,
      });

      setMessage('Abono registrado correctamente');
      setPaymentAmount(0);
      setPaymentNotes('');

      const updatedSales = await salesApi.list();
      setSales(updatedSales.data ?? updatedSales);
      if (selectedCreditSaleId) {
        await loadCreditSale(selectedCreditSaleId);
      }
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'No se pudo registrar el abono.');
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

          {saleType === 'CRÉDITO' && (
            <label className="block mb-2">
              Fecha de vencimiento
              <input
                type="date"
                className="input mt-1"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
          )}

          <div className="mt-4 p-3 rounded-xl border border-indigo-500/30 bg-indigo-900/10 space-y-3">
            <h3 className="font-semibold text-indigo-200">Pagos</h3>
            {payments.map((p, idx) => (
              <div key={idx} className="flex gap-2">
                <select
                  className="input flex-1 bg-white text-black"
                  value={p.paymentMethodId}
                  onChange={(e) => {
                    const newId = Number(e.target.value);
                    setPayments((prev) => prev.map((item, i) => (i === idx ? { ...item, paymentMethodId: newId } : item)));
                  }}
                >
                  <option value={0}>Selecciona método</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  className="input w-32"
                  value={p.amount}
                  onChange={(e) => {
                    const newAmount = Number(e.target.value);
                    setPayments((prev) => prev.map((item, i) => (i === idx ? { ...item, amount: newAmount } : item)));
                  }}
                />
                <button
                  className="btn-danger p-2"
                  onClick={() => setPayments((prev) => prev.filter((_, i) => i !== idx))}
                >
                  X
                </button>
              </div>
            ))}
            <div className="flex gap-2 text-sm text-slate-300">
              Pagado acumulado: ${payments.reduce((acc, p) => acc + p.amount, 0).toFixed(2)}
            </div>
            <button
              className="btn-soft w-full text-sm"
              onClick={() => {
                const alreadyAdded = payments.reduce((acc, p) => acc + p.amount, 0);
                const remaining = total - alreadyAdded;
                setPayments([...payments, { paymentMethodId: 0, amount: remaining > 0 ? remaining : 0 }]);
              }}
            >
              + Añadir pago
            </button>
          </div>

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
                      <label className="text-xs text-slate-300 inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={item.isGift ?? false}
                          onChange={(e) => {
                            const gift = e.target.checked;
                            setCart((prev) =>
                              prev.map((c) =>
                                c.itemId === item.itemId ? { ...c, isGift: gift, unitPrice: gift ? 0 : c.unitPrice } : c,
                              ),
                            );
                          }}
                        />
                        Regalo (cero valor)
                      </label>
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

      <div className="card p-4">
        <h2 className="text-xl font-semibold mb-3">Cartera de Clientes</h2>
        <p className="text-sm text-slate-400 mb-3">Ventas con deuda pendiente (créditos)</p>

        <div className="space-y-2 mb-4">
          {outstandingSales.length === 0 ? (
            <div className="text-slate-300">No hay deudas pendientes.</div>
          ) : (
            outstandingSales.map((sale) => (
              <div key={sale.id} className="rounded-lg border border-amber-500 p-3 bg-slate-900/60">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="text-sm text-slate-300">#{sale.systemNumber} - {new Date(sale.dueDate).toLocaleDateString()}</div>
                    <div className="text-white font-semibold">Total: ${Number(sale.total).toFixed(2)}</div>
                    <div className="text-xs text-amber-200">Saldo: ${Number(sale.outstanding).toFixed(2)}</div>
                    <div className="text-xs text-slate-400">Cliente: {sale.customer?.name ?? 'Genérico'}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="btn-soft px-2 text-xs"
                      onClick={() => {
                        setSelectedCreditSaleId(sale.id);
                        loadCreditSale(sale.id);
                      }}
                    >
                      Ver
                    </button>
                    <button
                      className="btn-soft px-2 text-xs"
                      onClick={() => {
                        printSale(sale);
                      }}
                    >
                      Imprimir
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedCreditSale && (
          <div className="rounded-xl border border-cyan-500 p-3 bg-slate-900/40 mt-3">
            <h3 className="font-semibold text-cyan-200">Venta seleccionada</h3>
            <p>Sistema: {selectedCreditSale.systemNumber}</p>
            <p>Cliente: {selectedCreditSale.customer?.name ?? 'Genérico'}</p>
            <p>Total: ${Number(selectedCreditSale.total).toFixed(2)}</p>
            <p>Pagado: ${Number(selectedCreditSale.paidAmount).toFixed(2)}</p>
            <p>Saldo: ${Number(selectedCreditSale.outstanding).toFixed(2)}</p>
            <p>Estado: {selectedCreditSale.paymentStatus}</p>

            <h4 className="mt-2 text-sm text-white">Historial de pagos</h4>
            <div className="space-y-1 text-sm text-slate-200">
              {selectedCreditSale.payments?.length ? (
                selectedCreditSale.payments.map((p: any) => (
                  <div key={p.id} className="border border-slate-600 rounded p-2 bg-slate-800/50">
                    <div>{new Date(p.createdAt).toLocaleString()}</div>
                    <div>Monto: ${Number(p.amount).toFixed(2)} / {p.paymentMethod?.name || p.method || '-'}</div>
                    <div>Nota: {p.notes || '-'}</div>
                  </div>
                ))
              ) : (
                <div>No hay pagos registrados.</div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
          <label className="block">
            Seleccionar venta
            <select className="input mt-1 bg-white text-black" value={selectedCreditSaleId ?? ''} onChange={(e) => setSelectedCreditSaleId(Number(e.target.value) || null)}>
              <option value="">Seleccione</option>
              {outstandingSales.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  {sale.systemNumber} - ${Number(sale.outstanding).toFixed(2)} - {sale.customer?.name ?? 'Genérico'}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Monto abonado
            <input type="number" min={0} className="input mt-1" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)} />
          </label>
          <label className="block">
            Método
            <select
              className="input mt-1 bg-white text-black"
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(Number(e.target.value))}
            >
              <option value={0}>Seleccione método</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            Notas
            <input className="input mt-1" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
          </label>
          <button className="btn-primary md:col-span-2" onClick={submitPayment} disabled={loading}>
            Registrar abono
          </button>
        </div>
      </div>

      {/* Hidden print component */}
      <div className="hidden">
        <InvoicePrint ref={printRef} data={saleToPrint ? [saleToPrint] : []} />
      </div>

      {/* Success Modal for printing */}
      {saleToPrint && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/50">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2 text-center">¡Venta Exitosa!</h2>
            <p className="text-sm text-slate-400 mb-6 text-center">La venta ha sido registrada correctamente.</p>
            <div className="w-full space-y-3">
              <button 
                onClick={handlePrint} 
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Imprimir Tirilla (Ticket)
              </button>
              <button 
                onClick={() => setSaleToPrint(null)} 
                className="btn-soft w-full py-2"
              >
                Continuar nueva venta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
