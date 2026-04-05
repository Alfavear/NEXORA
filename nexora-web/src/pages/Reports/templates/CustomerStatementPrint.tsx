import { forwardRef } from 'react';
import { format } from 'date-fns';

interface Props {
  data: any;
  filters?: any;
}

export const CustomerStatementPrint = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  if (!data?.customer) {
    return (
      <div ref={ref} className="bg-white text-black p-10 min-h-[1056px] w-[816px] mx-auto text-sm">
        <p className="text-center text-gray-500 py-10">Ningún dato disponible.</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="bg-white text-black p-10 min-h-[1056px] w-[816px] mx-auto text-sm print:shadow-none">
      <div className="border-b-2 border-black pb-4 mb-6 text-center">
        <h1 className="text-2xl font-bold uppercase tracking-widest">REPORTE DEL SISTEMA</h1>
        <p className="text-sm font-semibold text-gray-600 mt-1">ESTADO DE CUENTA CLIENTE</p>
        <p className="text-xs text-gray-500 mt-2">Emitido: {format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 border border-gray-200 p-4 rounded-md text-xs">
        <div>
          <p><span className="font-bold">CLIENTE:</span> {data.customer.name}</p>
          <p><span className="font-bold">DOCUMENTO:</span> {data.customer.document || 'N/A'}</p>
        </div>
        <div className="text-right">
          <p><span className="font-bold">SALDO PENDIENTE TOTAL:</span> <span className="text-lg text-red-600">${Number(data.totalOutstanding).toFixed(2)}</span></p>
        </div>
      </div>

      <div className="space-y-6">
        {data.statement.length === 0 ? (
          <p className="text-center text-gray-500">Este cliente no tiene cuentas pendientes o histórico de deudas en este periodo.</p>
        ) : (
          data.statement.map((sale: any) => (
            <div key={sale.id} className="border border-gray-300 rounded-md p-4">
              <div className="flex justify-between font-bold border-b border-gray-200 pb-2 mb-2">
                <span>Venta #{sale.documentNumber} | Crédito emitido: {new Date(sale.date).toISOString().slice(0,10)}</span>
                <span className="text-red-600">Pendiente: ${Number(sale.outstanding).toFixed(2)}</span>
              </div>
              <div className="text-xs flex justify-between text-gray-500 mb-3">
                 <span>Valor Factura: ${Number(sale.total).toFixed(2)}</span>
                 <span>Total Pagado: ${Number(sale.paidAmount).toFixed(2)}</span>
                 <span>Vencimiento: {sale.dueDate ? new Date(sale.dueDate).toISOString().slice(0,10) : 'N/A'}</span>
              </div>
              
              {sale.payments.length > 0 && (
                <div className="pl-4">
                  <p className="text-xs font-semibold mb-1 text-gray-600">Historial de Abonos:</p>
                  <table className="w-full text-xs text-left text-gray-600 font-mono bg-gray-50">
                    <tbody>
                      {sale.payments.map((p: any, idx: number) => (
                         <tr key={idx} className="border-b border-gray-200">
                           <td className="py-1 px-2">{new Date(p.date).toISOString().slice(0,10)}</td>
                           <td className="py-1 px-2">{p.method}</td>
                           <td className="py-1 px-2 text-right text-green-700">${Number(p.amount).toFixed(2)}</td>
                         </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

CustomerStatementPrint.displayName = 'CustomerStatementPrint';
