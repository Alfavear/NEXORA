// POS completo: crea ventas reales en backend
import { useEffect, useMemo, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../auth/AuthContext';
import { itemsApi } from '../api/items';
import { customersApi } from '../api/customers';
import { salesApi } from '../api/sales';
import { paymentMethodsApi, type PaymentMethod } from '../api/payment-methods';
import { taxesApi } from '../api/taxes';
import { Search, X } from 'lucide-react';

import { InvoicePrint } from './Reports/templates/InvoicePrint';

export default function Sales() {
  const { me } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  const [activeTab, setActiveTab] = useState<'POS' | 'HISTORY' | 'CARTERA'>('POS');
  const [historySearch, setHistorySearch] = useState('');
  const [carteraSearch, setCarteraSearch] = useState('');
  const [showSaleModal, setShowSaleModal] = useState(false);

  const [itemCode, setItemCode] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [externalReceipt, setExternalReceipt] = useState('');
  const [notes, setNotes] = useState('');
  const [saleType, setSaleType] = useState<'CONTADO' | 'CRÉDITO'>('CONTADO');
  const [dueDate, setDueDate] = useState('');
  const [installments, setInstallments] = useState(1);
  const [interestRate, setInterestRate] = useState(0);
  const [lateInterestRate, setLateInterestRate] = useState(0);
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
  const [taxes, setTaxes] = useState<any[]>([]);
  const [selectedTaxIds, setSelectedTaxIds] = useState<number[]>([]);
  const [payments, setPayments] = useState<{ paymentMethodId: number; amount: number }[]>([]);

  useEffect(() => {
    itemsApi.list().then((r: any) => setItems(r.data ?? r));
    customersApi.getAll(true).then((r: any) => setCustomers(r.data ?? r));
    salesApi.list().then((r: any) => setSales(r.data ?? r));
    paymentMethodsApi.getAll().then((r) => setPaymentMethods(r.filter((p: PaymentMethod) => p.isActive)));
    taxesApi.list().then((r) => setTaxes(r.filter((t: any) => t.isActive)));
  }, []);

  const filteredItems = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  const outstandingSales = useMemo(
    () => {
      let filtered = sales.filter((sale) => Number(sale.outstanding) > 0);
      if (carteraSearch) {
        const lower = carteraSearch.toLowerCase();
        filtered = filtered.filter(s => 
          s.systemNumber.toLowerCase().includes(lower) || 
          s.customer?.name?.toLowerCase().includes(lower) ||
          s.customer?.document?.toLowerCase().includes(lower)
        );
      }
      return filtered;
    },
    [sales, carteraSearch],
  );

  const historySales = useMemo(() => {
    if (!historySearch) return sales;
    const lower = historySearch.toLowerCase();
    return sales.filter(s => 
      s.systemNumber.toLowerCase().includes(lower) || 
      s.customer?.name?.toLowerCase().includes(lower)
    );
  }, [sales, historySearch]);

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

  const selectedTaxes = useMemo(() => taxes.filter(t => selectedTaxIds.includes(t.id)), [taxes, selectedTaxIds]);
  const tax = useMemo(
    () => {
      let totalTax = 0;
      const base = subtotal - discount + transport;
      if (base > 0) {
        selectedTaxes.forEach(t => {
          totalTax += base * (Number(t.rate) / 100);
        });
      }
      return totalTax;
    }, [subtotal, discount, transport, selectedTaxes]
  );

  const interest = useMemo(() => {
    if (saleType !== 'CRÉDITO' || interestRate <= 0) return 0;
    const baseTotal = subtotal - discount + transport + tax;
    const downPayment = payments.reduce((acc, p) => acc + p.amount, 0);
    const financed = baseTotal - downPayment;
    return financed > 0 ? financed * (interestRate / 100) : 0;
  }, [saleType, interestRate, subtotal, discount, transport, tax, payments]);

  const total = useMemo(() => Math.max(0, subtotal - discount + transport + tax + interest), [subtotal, discount, transport, tax, interest]);

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
    setInstallments(1);
    setInterestRate(0);
    setLateInterestRate(0);
    setPayments([]);
    setSelectedTaxIds([]);
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
        installments: saleType === 'CRÉDITO' ? installments : 1,
        interestRate: saleType === 'CRÉDITO' ? interestRate : 0,
        lateInterestRate: saleType === 'CRÉDITO' ? lateInterestRate : 0,
        taxIds: selectedTaxIds,
        payments: payments.filter((p) => p.amount > 0 && p.paymentMethodId > 0),
        items: cart.map((i) => ({ itemId: i.itemId, quantity: i.quantity, unitPrice: i.isGift ? 0 : i.baseUnitPrice, isGift: i.isGift ?? false })),
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
      setInstallments(1);
      setInterestRate(0);
      setLateInterestRate(0);
      setPayments([]);
      setSelectedTaxIds([]);

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

  const openSaleModal = async (sale: any) => {
    setSelectedCreditSaleId(sale.id);
    await loadCreditSale(sale.id);
    setShowSaleModal(true);
  };

  const closeSaleModal = () => {
    setShowSaleModal(false);
    setSelectedCreditSaleId(null);
    setSelectedCreditSale(null);
    setPaymentAmount(0);
    setPaymentNotes('');
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
        <h1 className="text-3xl font-bold">Facturación y Cartera</h1>
        <span className="text-sm text-slate-300">Vendedor: {me?.name ?? 'Desconocido'}</span>
      </div>

      {message && (
        <div className="rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-100 p-3">{message}</div>
      )}

      <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-slate-700 pb-4">
        <div className="flex gap-2">
          <button className={`btn ${activeTab === 'POS' ? 'btn-primary' : 'btn-soft'}`} onClick={() => setActiveTab('POS')}>Punto de Venta</button>
          <button className={`btn ${activeTab === 'HISTORY' ? 'btn-primary' : 'btn-soft'}`} onClick={() => setActiveTab('HISTORY')}>Historial</button>
          <button className={`btn ${activeTab === 'CARTERA' ? 'btn-primary' : 'btn-soft'}`} onClick={() => setActiveTab('CARTERA')}>Cartera y Abonos</button>
        </div>
        {activeTab === 'POS' && (
          <div className="inline-flex gap-2">
            <button className="btn-soft" onClick={resetForm} disabled={loading}>Limpiar</button>
            <button className="btn-primary shadow-lg shadow-indigo-500/20" onClick={submitSale} disabled={loading}>Grabar Venta</button>
          </div>
        )}
      </div>

      {/* TAB: PUNTO DE VENTA */}
      {activeTab === 'POS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in">
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
            <div className="grid grid-cols-2 gap-3 mb-2 p-3 bg-indigo-900/10 border border-indigo-500/30 rounded-xl">
              <label className="block">
                Vencimiento Final
                <input
                  type="date"
                  className="input w-full mt-1 bg-slate-900/50"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>
              <label className="block">
                Plazos (Cuotas)
                <input
                  type="number"
                  min={1}
                  className="input w-full mt-1 bg-slate-900/50"
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                />
              </label>
              <label className="block">
                % Int. Corriente
                <input
                  type="number" min={0} step="0.01"
                  className="input w-full mt-1 bg-slate-900/50"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                />
              </label>
              <label className="block">
                % Int. por Mora
                <input
                  type="number" min={0} step="0.01"
                  className="input w-full mt-1 bg-slate-900/50"
                  value={lateInterestRate}
                  onChange={(e) => setLateInterestRate(Number(e.target.value))}
                />
              </label>
            </div>
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

          <div className="mt-4 p-3 rounded-xl border border-cyan-500/30 bg-cyan-900/10 space-y-2">
            <h3 className="font-semibold text-cyan-200">Impuestos Aplicables</h3>
            {taxes.map(tax => (
              <div key={tax.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`tax-chk-${tax.id}`}
                  className="h-4 w-4 rounded"
                  checked={selectedTaxIds.includes(tax.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedTaxIds(prev => [...prev, tax.id]);
                    else setSelectedTaxIds(prev => prev.filter(id => id !== tax.id));
                  }}
                />
                <label htmlFor={`tax-chk-${tax.id}`} className="text-sm">{tax.name} ({Number(tax.rate).toFixed(2)}%)</label>
              </div>
            ))}
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
              <span>Impuestos</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {interest > 0 && (
              <div className="flex justify-between text-sm text-indigo-300 font-semibold">
                <span>Interés por Crédito</span>
                <span>${interest.toFixed(2)}</span>
              </div>
            )}
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
      )}

      {/* TAB: HISTORIAL DE VENTAS */}
      {activeTab === 'HISTORY' && (
        <div className="card p-5 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Historial de Ventas</h2>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-2 text-slate-400" />
              <input className="input pl-10 w-72" placeholder="Buscar por cliente o documento..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
            </div>
          </div>
        <div className="space-y-2">
            {historySales.length === 0 ? (
            <div className="text-slate-300">No hay ventas registradas todavía.</div>
          ) : (
              historySales.map((sale) => (
              <div key={sale.id} className="rounded-lg border border-slate-700 p-3 bg-slate-900/60">
                <div className="flex justify-between items-start gap-2">
                  <div>
                        <div className="text-sm text-slate-300 font-bold text-indigo-300">#{sale.systemNumber} <span className="text-slate-500 ml-2 font-normal">{new Date(sale.createdAt).toLocaleString()}</span></div>
                        <div className="text-white font-semibold mt-1">Total: ${Number(sale.total).toFixed(2)} <span className={`ml-2 text-xs px-2 py-0.5 rounded ${sale.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{sale.paymentStatus}</span></div>
                        <div className="text-xs text-slate-400 mt-1">Cliente: {sale.customer?.name ?? 'Genérico'}</div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <button className="btn-soft text-xs" onClick={() => printSale(sale)}>Imprimir Factura</button>
                  <button
                    className="btn-danger text-xs px-2 py-1"
                    onClick={() => cancelSale(sale)}
                    disabled={loading}
                  >
                    Anular
                  </button>
                      </div>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      )}

      {/* TAB: CARTERA DE CLIENTES */}
      {activeTab === 'CARTERA' && (
        <div className="card p-5 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
            <div>
              <h2 className="text-xl font-semibold">Cartera de Clientes</h2>
              <p className="text-sm text-slate-400">Ventas con deuda pendiente (créditos activos)</p>
            </div>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-2 text-slate-400" />
              <input className="input pl-10 w-full md:w-80" placeholder="Buscar por documento, nombre o RUC..." value={carteraSearch} onChange={(e) => setCarteraSearch(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
          {outstandingSales.length === 0 ? (
              <div className="text-slate-300 col-span-full py-8 text-center bg-slate-800/30 rounded-xl border border-slate-700 border-dashed">No hay deudas pendientes que coincidan con la búsqueda.</div>
          ) : (
            outstandingSales.map((sale) => (
                <div key={sale.id} className="rounded-xl border border-amber-500/50 p-5 bg-slate-900/60 flex flex-col justify-between hover:border-amber-400 transition-colors shadow-lg">
                  <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-white font-bold tracking-wider">#{sale.systemNumber}</div>
                        <div className="text-xs px-2 py-1 bg-rose-500/20 text-rose-300 rounded border border-rose-500/30 font-semibold">Vence: {new Date(sale.dueDate).toLocaleDateString()}</div>
                      </div>
                      <div className="text-slate-300 text-sm mb-1">Total Factura: ${Number(sale.total).toFixed(2)}</div>
                      <div className="text-2xl text-amber-400 font-black mb-3 drop-shadow-md">Saldo: ${Number(sale.outstanding).toFixed(2)}</div>
                      
                      <div className="p-2 bg-slate-950/50 rounded-lg border border-slate-800">
                        <div className="text-xs text-slate-300 font-semibold truncate uppercase">{sale.customer?.name ?? 'Cliente Genérico'}</div>
                        <div className="text-[10px] text-slate-500">{sale.customer?.document || 'Sin RUC'}</div>
                      </div>
                    <div className="text-xs text-slate-400">Sede: {sale.branch?.name ?? 'Desconocida'}</div>
                  </div>
                    <button
                      className="btn-primary w-full mt-4 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 border-none shadow-lg shadow-orange-500/20"
                      onClick={() => openSaleModal(sale)}
                    >
                      Gestionar Cartera / Abonar
                    </button>
              </div>
            ))
          )}
        </div>
        </div>
      )}

      {/* MODAL FLOTANTE DE CARTERA Y ABONOS */}
      {showSaleModal && selectedCreditSale && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col my-auto relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-950/50 rounded-t-2xl sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-wide">Gestión de Cartera <span className="text-amber-400">#{selectedCreditSale.systemNumber}</span></h2>
                <p className="text-sm text-slate-400 mt-1">Cliente: <span className="text-slate-200">{selectedCreditSale.customer?.name ?? 'Genérico'}</span> | Sede: {selectedCreditSale.branch?.name ?? 'Desconocida'}</p>
              </div>
              <div className="flex items-center gap-4">
                <button className="btn-soft border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20" onClick={() => printSale(selectedCreditSale)}>Imprimir Acuerdo / Factura</button>
                <button onClick={closeSaleModal} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition-colors"><X className="w-6 h-6" /></button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Info & Amortization */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Factura</p>
                    <p className="text-xl font-bold text-white">${Number(selectedCreditSale.total).toFixed(2)}</p>
                  </div>
                  <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30">
                    <p className="text-xs text-amber-500 uppercase tracking-wider mb-1">Saldo Pendiente</p>
                    <p className="text-2xl font-black text-amber-400">${Number(selectedCreditSale.outstanding).toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider border-b border-slate-700 pb-2 mb-3">Cronograma de Pagos</h4>
                  {selectedCreditSale.amortization?.length > 0 ? (
                    <div className="bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden">
                      <table className="w-full text-xs text-left font-mono">
                        <thead className="bg-slate-800 text-slate-300">
                          <tr>
                            <th className="px-4 py-2 text-center">N°</th>
                            <th className="px-4 py-2">Vencimiento</th>
                            <th className="px-4 py-2 text-right">Cuota</th>
                            <th className="px-4 py-2 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {selectedCreditSale.amortization.map((a: any) => (
                            <tr key={a.id} className="hover:bg-slate-800/30">
                              <td className="px-4 py-2 text-center font-bold text-slate-500">{a.quotaNumber}</td>
                              <td className="px-4 py-2 text-slate-300">{new Date(a.dueDate).toLocaleDateString()}</td>
                              <td className="px-4 py-2 text-right text-indigo-300 font-semibold">${Number(a.amount).toFixed(2)}</td>
                              <td className="px-4 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${a.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>{a.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 p-4 bg-slate-900 rounded border border-slate-800 text-center">No hay tabla de amortización para este crédito.</div>
                  )}
                </div>
              </div>

              {/* Right Column: Payments & New Abono */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-700 pb-2 mb-3">Registrar Nuevo Abono</h4>
                  <div className="bg-slate-800/30 p-5 rounded-xl border border-emerald-500/20 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Monto a Pagar ($)</label>
                        <input type="number" min={0.01} step="0.01" className="input w-full text-lg font-bold text-emerald-300" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)} placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Método de Pago</label>
                        <select className="input w-full bg-slate-900 text-slate-200" value={paymentMethodId} onChange={(e) => setPaymentMethodId(Number(e.target.value))}>
                          <option value={0}>Seleccione...</option>
                          {paymentMethods.map((pm) => (
                            <option key={pm.id} value={pm.id}>{pm.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Notas / Referencia</label>
                      <input className="input w-full text-sm" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Transferencia #12345..." />
                    </div>
                    <button className="btn-primary w-full bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-500/20 py-3" onClick={submitPayment} disabled={loading || paymentAmount <= 0 || paymentMethodId === 0}>
                      {loading ? 'Procesando Abono...' : 'Aplicar Pago a la Cuenta'}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-700 pb-2 mb-3">Historial de Pagos Recibidos</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {selectedCreditSale.payments?.length ? (
                      selectedCreditSale.payments.map((p: any) => (
                        <div key={p.id} className="border border-slate-700 rounded-lg p-3 bg-slate-800/40 flex justify-between items-center">
                          <div>
                            <div className="text-xs text-slate-400 mb-1">{new Date(p.createdAt).toLocaleString()}</div>
                            <div className="text-sm text-slate-200 font-medium">Método: {p.paymentMethod?.name || p.method || '-'}</div>
                            {p.notes && <div className="text-[10px] text-slate-500 italic mt-1">{p.notes}</div>}
                          </div>
                          <div className="text-lg font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded">
                            +${Number(p.amount).toFixed(2)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 p-4 bg-slate-900 rounded border border-slate-800 text-center">Aún no se han recibido pagos para esta factura.</div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

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
