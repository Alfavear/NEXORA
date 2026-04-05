import { forwardRef } from 'react';
import { format } from 'date-fns';

interface Props {
  data: any[];
  filters?: any;
}

export const CollectionsPrint = forwardRef<HTMLDivElement, Props>(({ data, filters }, ref) => {
  const totalCollections = data.reduce((acc, p) => acc + Number(p.amount), 0);
  
  return (
    <div ref={ref} className="bg-white text-black p-10 min-h-[1056px] w-[816px] mx-auto text-sm print:shadow-none">
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">REPORTE DEL SISTEMA</h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">REPORTE: RECIBOS DE CAJA / COBROS</p>
        </div>
        <div className="text-right text-xs text-gray-500 font-mono">
          <p>Impreso: {format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
          {filters?.startDate && filters?.endDate && (
            <p className="mt-1">Periodo: {filters.startDate} a {filters.endDate}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <table className="w-full text-xs text-left font-mono">
          <thead className="bg-gray-100 text-gray-700 border-y border-gray-300">
            <tr>
              <th className="py-2 px-4">Fecha</th>
              <th className="py-2 px-4">Recibo / Venta</th>
              <th className="py-2 px-4">Cliente</th>
              <th className="py-2 px-4">Método</th>
              <th className="py-2 px-4">Anotación</th>
              <th className="py-2 px-4 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">No hay pagos registrados en este periodo.</td>
              </tr>
            ) : (
              data.map((p: any) => (
                <tr key={p.id}>
                  <td className="py-2 px-4">{new Date(p.date).toISOString().slice(0,10)}</td>
                  <td className="py-2 px-4">{p.saleDocument}</td>
                  <td className="py-2 px-4 truncate max-w-[150px]">{p.customerName}</td>
                  <td className="py-2 px-4">{p.method}</td>
                  <td className="py-2 px-4 text-gray-500 italic max-w-[150px] truncate">{p.notes || '-'}</td>
                  <td className="py-2 px-4 text-right font-medium">${Number(p.amount).toFixed(2)}</td>
                </tr>
              ))
            )}
            <tr className="bg-gray-100 font-bold border-y-2 border-gray-400">
              <td colSpan={5} className="py-3 px-4 text-right">TOTAL COBRADO:</td>
              <td className="py-3 px-4 text-right text-lg text-green-700">${totalCollections.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
});

CollectionsPrint.displayName = 'CollectionsPrint';
