import { forwardRef } from 'react';

export const SalesPrint = forwardRef<HTMLDivElement, { data: any[], filters: any }>(({ data, filters }, ref) => {
  const total = data.reduce((acc, sale) => acc + sale.total, 0);

  return (
    <div ref={ref} className="p-8 bg-white text-black min-h-[1000px] w-full font-sans">
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-800">Reporte de Ventas General</h1>
        <p className="text-slate-600 mt-2">
          Periodo: {filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'Inicio'} - {filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'Hoy'}
        </p>
      </div>

      <table className="w-full text-sm border-collapse mb-8">
        <thead>
          <tr className="bg-slate-200 text-slate-800 border-b-2 border-slate-800">
            <th className="py-2 px-4 text-left font-bold">Fecha</th>
            <th className="py-2 px-4 text-left font-bold">Documento</th>
            <th className="py-2 px-4 text-left font-bold">Sede</th>
            <th className="py-2 px-4 text-left font-bold">Cliente</th>
            <th className="py-2 px-4 text-left font-bold">Impuestos</th>
            <th className="py-2 px-4 text-right font-bold">Estado</th>
            <th className="py-2 px-4 text-right font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((sale, i) => (
              <tr key={i} className="border-b border-slate-300">
                <td className="py-2 px-4">{new Date(sale.date).toLocaleDateString()}</td>
                <td className="py-2 px-4">{sale.documentNumber}</td>
                <td className="py-2 px-4">{sale.branchName}</td>
                <td className="py-2 px-4 truncate max-w-[200px]">{sale.customerName}</td>
                <td className="py-2 px-4 text-xs text-slate-500 leading-tight">{sale.appliedTaxes}<br/>(+${Number(sale.tax || 0).toFixed(2)})</td>
                <td className="py-2 px-4 text-right">{sale.status}</td>
                <td className="py-2 px-4 text-right font-medium">${sale.total.toFixed(2)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="py-8 text-center text-slate-500 italic">No hay registros para las fechas seleccionadas</td>
            </tr>
          )}
        </tbody>
        {data.length > 0 && (
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-800">
              <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider">Total Generado</td>
              <td className="py-3 px-4 text-right text-lg">${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        )}
      </table>

      <div className="text-xs text-slate-500 text-center mt-16 pt-4 border-t border-slate-300">
        Impreso el {new Date().toLocaleString()}
      </div>
    </div>
  );
});

SalesPrint.displayName = 'SalesPrint';
