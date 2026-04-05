import { forwardRef } from 'react';
import { format } from 'date-fns';

interface Props {
  data: any[];
  filters?: any;
}

export const SalesBySellerPrint = forwardRef<HTMLDivElement, Props>(({ data, filters }, ref) => {
  return (
    <div ref={ref} className="bg-white text-black p-10 min-h-[1056px] w-[816px] mx-auto text-sm print:shadow-none">
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">REPORTE DEL SISTEMA</h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">REPORTE: PRODUCCIÓN Y VENTAS POR VENDEDOR</p>
        </div>
        <div className="text-right text-xs text-gray-500 font-mono">
          <p>Impreso: {format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
          {filters?.startDate && filters?.endDate && (
            <p className="mt-1">Periodo: {filters.startDate} a {filters.endDate}</p>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {data.length === 0 ? (
           <p className="text-center text-gray-500 py-10">Ningún dato disponible en este periodo.</p>
        ) : (
          data.map((sellerObj: any) => (
            <div key={sellerObj.sellerId} className="border border-gray-300 rounded-md overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 font-bold text-gray-800 flex justify-between">
                <span>VENDEDOR: {sellerObj.sellerName}</span>
                <span>{sellerObj.totalSales} Ventas</span>
              </div>
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-gray-50 text-gray-600 border-y border-gray-300">
                  <tr>
                    <th className="py-2 px-4">Fecha</th>
                    <th className="py-2 px-4">Documento</th>
                    <th className="py-2 px-4">Cliente</th>
                    <th className="py-2 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sellerObj.sales.map((sale: any) => (
                    <tr key={sale.id}>
                      <td className="py-2 px-4">{new Date(sale.date).toISOString().slice(0,10)}</td>
                      <td className="py-2 px-4">{sale.documentNumber}</td>
                      <td className="py-2 px-4 truncate max-w-[200px]">{sale.customerName}</td>
                      <td className="py-2 px-4 text-right font-medium">${Number(sale.total).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                    <td colSpan={3} className="py-3 px-4 text-right">TOTAL PRODUCIDO:</td>
                    <td className="py-3 px-4 text-right text-lg">${Number(sellerObj.totalAmount).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

SalesBySellerPrint.displayName = 'SalesBySellerPrint';
