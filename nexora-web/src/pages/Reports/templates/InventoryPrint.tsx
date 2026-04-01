import { forwardRef } from 'react';

export const InventoryPrint = forwardRef<HTMLDivElement, { data: any[] }>(({ data }, ref) => {
  return (
    <div ref={ref} className="p-8 bg-white text-black min-h-[1000px] w-full font-sans">
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-800">Reporte de Inventario / Kardex</h1>
        <p className="text-slate-600 mt-2">Existencias actuales al {new Date().toLocaleDateString()}</p>
      </div>

      <table className="w-full text-sm border-collapse mb-8">
        <thead>
          <tr className="bg-slate-200 text-slate-800 border-b-2 border-slate-800">
            <th className="py-2 px-4 text-left font-bold">Código</th>
            <th className="py-2 px-4 text-left font-bold">Producto</th>
            <th className="py-2 px-4 text-left font-bold">Categoría</th>
            <th className="py-2 px-4 text-right font-bold">Precio</th>
            <th className="py-2 px-4 text-right font-bold">Stock Actual</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, i) => (
              <tr key={i} className="border-b border-slate-300">
                <td className="py-2 px-4 font-mono">{item.code}</td>
                <td className="py-2 px-4 font-medium">{item.name}</td>
                <td className="py-2 px-4 text-slate-600">{item.category}</td>
                <td className="py-2 px-4 text-right">${item.price.toFixed(2)}</td>
                <td className="py-2 px-4 text-right">
                  <span className={item.stock <= 5 ? 'text-red-600 font-bold' : ''}>{item.stock}</span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="py-8 text-center text-slate-500 italic">No hay productos en inventario</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="text-xs text-slate-500 text-center mt-16 pt-4 border-t border-slate-300">
        Empresa Nexora ERP • Impreso el {new Date().toLocaleString()}
      </div>
    </div>
  );
});

InventoryPrint.displayName = 'InventoryPrint';
