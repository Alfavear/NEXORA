import { useEffect, useState } from 'react';
import { salesApi } from '../api/sales';

export default function Returns() {
  const [sales, setSales] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    salesApi.list().then(setSales);
  }, []);

  const load = async (id: number) => {
    const s = await salesApi.get(id);
    setSelected(s);
  };

  const doReturn = async (itemId: number) => {
    await salesApi.createReturn(selected.id, { items: [{ itemId, quantity: 1 }] });
    alert('Devuelto');
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Devoluciones</h1>

      <div>
        {sales.map((s) => (
          <button key={s.id} onClick={() => load(s.id)} className="block border p-2">
            Venta #{s.id}
          </button>
        ))}
      </div>

      {selected && (
        <div>
          <h2>Detalle</h2>
          {selected.details.map((d: any) => (
            <div key={d.id}>
              {d.item.name}
              <button onClick={() => doReturn(d.itemId)}>Devolver 1</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
