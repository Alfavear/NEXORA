import { useEffect, useState } from 'react';
import { salesApi } from '../api/sales';
import { itemsApi } from '../api/items';
import { customersApi } from '../api/customers';

export default function Sales() {
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [external, setExternal] = useState('');

  useEffect(() => {
    itemsApi.list().then(setItems);
    customersApi.getAll(true).then(setCustomers);
  }, []);

  const addItem = (item: any) => {
    setCart([...cart, { ...item, quantity: 1 }]);
  };

  const total = cart.reduce((acc, i) => acc + i.quantity * (i.salePrice || i.basePrice || 0), 0);

  const save = async () => {
    await salesApi.create({
      customerId,
      externalReceiptNumber: external,
      items: cart.map((i) => ({ itemId: i.id, quantity: i.quantity, unitPrice: i.salePrice || i.basePrice || 0 })),
    });
    alert('Venta creada');
    setCart([]);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Ventas</h1>

      <select onChange={(e) => setCustomerId(Number(e.target.value))} className="border p-2 mb-2">
        <option>Cliente</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <input placeholder="Consecutivo cliente" value={external} onChange={(e) => setExternal(e.target.value)} className="border p-2 mb-4 w-full" />

      <div className="grid grid-cols-2 gap-2">
        {items.map((i) => (
          <button key={i.id} onClick={() => addItem(i)} className="border p-2">
            {i.name}
          </button>
        ))}
      </div>

      <h2 className="mt-4">Carrito</h2>
      {cart.map((c, idx) => (
        <div key={idx}>{c.name} x {c.quantity}</div>
      ))}

      <h2>Total: {total}</h2>

      <button onClick={save} className="bg-blue-500 text-white px-4 py-2 mt-2">Guardar</button>
    </div>
  );
}
