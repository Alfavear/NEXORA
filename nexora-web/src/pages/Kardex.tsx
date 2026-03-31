import { useState } from 'react';
import { inventoryApi } from '../api/inventory';

export default function Kardex() {
  const [itemId, setItemId] = useState('');
  const [data, setData] = useState<any[]>([]);

  const load = async () => {
    const res = await inventoryApi.kardex(Number(itemId));
    setData(res.data);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Kardex</h1>

      <input
        placeholder="Item ID"
        value={itemId}
        onChange={(e) => setItemId(e.target.value)}
        className="border p-2"
      />
      <button onClick={load} className="ml-2 bg-blue-500 text-white px-3 py-1">
        Buscar
      </button>

      <div className="mt-4">
        {data.map((d, i) => (
          <div key={i} className="border p-2">
            {d.itemName} | {d.type} | {d.quantity} | saldo: {d.balance}
          </div>
        ))}
      </div>
    </div>
  );
}
