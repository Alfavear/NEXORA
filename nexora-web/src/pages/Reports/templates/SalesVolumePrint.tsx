import { forwardRef } from 'react';
import { format } from 'date-fns';

interface Props {
  data: any;
}

export const SalesVolumePrint = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  if (!data || !data.summary) {
    return <div ref={ref} className="p-8 text-center text-gray-500">No hay datos de volumen disponibles.</div>;
  }

  return (
    <div ref={ref} className="bg-white text-black p-10 min-h-[1056px] w-[816px] mx-auto text-sm print:shadow-none">
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">REPORTE DEL SISTEMA</h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">VOLUMEN DE VENTAS Y TOP PRODUCTOS</p>
        </div>
        <div className="text-right text-xs text-gray-500 font-mono">
          <p>Impreso: {format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
          <p className="mt-1 font-bold text-gray-800">Periodo: {data.summary.periodLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-50 border border-gray-200 p-4 rounded-md text-center">
        <div>
          <p className="text-xs text-gray-500 font-bold">TOTAL FACTURADO</p>
          <p className="text-2xl font-black text-indigo-600">${Number(data.summary.totalRevenue).toFixed(2)}</p>
        </div>
        <div className="border-l border-r border-gray-200">
          <p className="text-xs text-gray-500 font-bold">VENTAS REALIZADAS</p>
          <p className="text-2xl font-black text-gray-800">{data.summary.totalSales}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-bold">MEJOR PERIODO</p>
          <p className="text-xl font-black text-emerald-600 mt-1">{data.summary.bestPeriod}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold border-b border-gray-300 mb-3 pb-1">Top 10 Productos Más Vendidos</h2>
        <table className="w-full text-xs text-left font-mono bg-white border border-gray-200">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="py-2 px-4 border-b">SKU</th>
              <th className="py-2 px-4 border-b">Nombre del Producto</th>
              <th className="py-2 px-4 border-b text-right">Cant. Vendida</th>
              <th className="py-2 px-4 border-b text-right">Ingreso Generado</th>
            </tr>
          </thead>
          <tbody>
            {data.topProducts.map((p: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-2 px-4">{p.sku}</td>
                <td className="py-2 px-4 font-semibold">{p.name}</td>
                <td className="py-2 px-4 text-right text-indigo-600 font-bold">{p.quantity}</td>
                <td className="py-2 px-4 text-right">${Number(p.revenue).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-bold border-b border-gray-300 mb-3 pb-1">Desglose de Ingresos</h2>
        <div className="grid grid-cols-2 gap-4">
          {data.breakdown.map((b: any, idx: number) => (
            <div key={idx} className="flex justify-between p-2 border-b border-dashed border-gray-300 text-xs">
              <span className="font-bold w-1/3">{b.period}</span>
              <span className="text-gray-500 w-1/3 text-center">{b.salesCount} ventas</span>
              <span className="w-1/3 text-right font-mono">${Number(b.revenue).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

SalesVolumePrint.displayName = 'SalesVolumePrint';