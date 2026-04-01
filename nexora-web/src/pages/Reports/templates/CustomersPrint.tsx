import { forwardRef } from 'react';

export const CustomersPrint = forwardRef<HTMLDivElement, { data: any[] }>(({ data }, ref) => {
  return (
    <div ref={ref} className="p-8 bg-white text-black min-h-[1000px] w-full font-sans">
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-800">Reporte de Clientes</h1>
        <p className="text-slate-600 mt-2">Listado general de clientes registrados</p>
      </div>

      <table className="w-full text-sm border-collapse mb-8">
        <thead>
          <tr className="bg-slate-200 text-slate-800 border-b-2 border-slate-800">
            <th className="py-2 px-4 text-left font-bold">Identificación</th>
            <th className="py-2 px-4 text-left font-bold">Nombre Completo</th>
            <th className="py-2 px-4 text-left font-bold">Teléfono</th>
            <th className="py-2 px-4 text-left font-bold">Email</th>
            <th className="py-2 px-4 text-right font-bold">Cupo Crédito</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, i) => (
              <tr key={i} className="border-b border-slate-300">
                <td className="py-2 px-4 font-mono">{item.identification}</td>
                <td className="py-2 px-4 font-medium">{item.name}</td>
                <td className="py-2 px-4">{item.phone}</td>
                <td className="py-2 px-4 truncate max-w-[150px]">{item.email}</td>
                <td className="py-2 px-4 text-right">${item.creditLimit.toFixed(2)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="py-8 text-center text-slate-500 italic">No hay clientes registrados</td>
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

CustomersPrint.displayName = 'CustomersPrint';
