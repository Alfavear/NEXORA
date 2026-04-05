import { forwardRef } from 'react';

export const ReturnPrint = forwardRef<HTMLDivElement, { data: any[] }>(({ data }, ref) => {
  if (!data || data.length === 0) {
    return (
      <div ref={ref} className="p-8 text-center text-gray-500 font-mono">
        No hay devoluciones para imprimir. Utilice los filtros para buscar un documento.
      </div>
    );
  }

  return (
    <div ref={ref} className="bg-white text-black text-[11px] font-mono leading-tight">
      {data.map((ret, idx) => (
        <div 
          key={ret.id} 
          className="w-[80mm] max-w-full mx-auto p-4 flex flex-col"
          style={{ pageBreakAfter: idx < data.length - 1 ? 'always' : 'auto' }}
        >
          {/* Header */}
          <div className="text-center mb-4 border-b border-dashed border-gray-400 pb-4">
            {(ret.branch as any)?.logoUrl && (
              <img src={(ret.branch as any).logoUrl} alt="Logo Sede" className="w-20 h-20 mx-auto mb-2 object-contain grayscale" />
            )}
            <h1 className="text-xl font-bold mb-1 uppercase tracking-wider">{ret.branch?.name || ret.company?.name || 'SUCURSAL'}</h1>
            <p className="mt-2 text-lg font-bold border border-black inline-block px-4 py-1">NOTA DE CRÉDITO</p>
            
            <div className="mt-4 text-left space-y-1">
              <p><span className="font-semibold">SISTEMA N°:</span> {ret.systemNumber}</p>
              <p><span className="font-semibold">FECHA:</span> {new Date(ret.createdAt).toLocaleString()}</p>
              <p><span className="font-semibold">MOTIVO ORIGEN:</span> FACTURA #{ret.sale?.systemNumber || 'N/A'}</p>
              <p><span className="font-semibold">CLIENTE:</span> {ret.customer?.name || 'NO ASIGNADO'}</p>
              <p><span className="font-semibold">AUTORIZA:</span> {ret.createdBy?.name || 'N/A'}</p>
              <p><span className="font-semibold">MOTIVO:</span> {ret.notes || 'Devolución de mercancía'}</p>
            </div>
          </div>

          {/* Table */}
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b border-dashed border-gray-400 text-left">
                <th className="py-1 w-[15%]">CANT</th>
                <th className="py-1 w-[50%]">DESCRIPCIÓN</th>
                <th className="py-1 w-[35%] text-right">MONTOS</th>
              </tr>
            </thead>
            <tbody>
              {ret.details?.map((detail: any, i: number) => (
                <tr key={i} className="border-b border-dashed border-gray-200">
                  <td className="py-1 align-top text-center text-red-600 font-bold">-{Number(detail.quantity).toString()}</td>
                  <td className="py-1 break-words pr-1">
                    {detail.item?.name}
                    {detail.reason && <span className="block text-[9px] italic">({detail.reason})</span>}
                  </td>
                  <td className="py-1 align-top text-right font-semibold">
                    ${Number(detail.subtotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex flex-col items-end border-b border-dashed border-gray-400 pb-4 mb-4 space-y-1">
            <div className="flex justify-between w-[60%] min-w-[140px] font-bold text-sm mt-1 bg-gray-100 p-1">
              <span>TOTAL A FAVOR:</span>
              <span>${ret.details?.reduce((acc: number, d: any) => acc + Number(d.subtotal), 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] space-y-1 mt-auto pt-4">
            <p>Este documento representa un saldo a favor del cliente.</p>
            <p className="mt-4 opacity-50">Generado por el Sistema</p>
          </div>
        </div>
      ))}
    </div>
  );
});
ReturnPrint.displayName = 'ReturnPrint';
