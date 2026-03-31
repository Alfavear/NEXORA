// improved POS version
import { useEffect, useMemo, useState } from 'react';
import { salesApi } from '../api/sales';
import { itemsApi } from '../api/items';
import { customersApi } from '../api/customers';

export default function Sales() {
  const [items, setItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    itemsApi.list().then((r:any)=>setItems(r.data ?? r));
  }, []);

  const filtered = items.filter((i)=> i.name.toLowerCase().includes(search.toLowerCase()));

  const add = (item:any)=>{
    const exist = cart.find(c=>c.id===item.id);
    if(exist){
      setCart(cart.map(c=>c.id===item.id?{...c,quantity:c.quantity+1}:c));
    }else{
      setCart([...cart,{...item,quantity:1}]);
    }
  };

  const remove = (id:number)=> setCart(cart.filter(c=>c.id!==id));

  const total = cart.reduce((a,c)=>a+(c.quantity*(c.salePrice||c.basePrice||0)),0);

  return (
    <div className="p-4">
      <h1>POS</h1>
      <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="buscar" />

      <div>
        {filtered.map(i=>(
          <button key={i.id} onClick={()=>add(i)}>{i.name}</button>
        ))}
      </div>

      <h2>Carrito</h2>
      {cart.map(c=>(
        <div key={c.id}>
          {c.name} x {c.quantity}
          <button onClick={()=>remove(c.id)}>x</button>
        </div>
      ))}

      <h2>Total {total}</h2>
    </div>
  );
}
