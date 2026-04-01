import { forwardRef } from 'react';

export const InvoicePrint = forwardRef<HTMLDivElement, { data: any[] }>(({ data }, ref) => {
  if (!data || data.length === 0) {
    return (
      <div ref={ref} className="p-8 text-center text-gray-500 font-mono">
        No hay facturas para imprimir. Utilice los filtros para buscar una factura.
      </div>
    );
  }

  // Si hay varias facturas en la búsqueda, las imprimimos una tras otra con un page break
  return (
    <div ref={ref} className="bg-white text-black text-[11px] font-mono leading-tight">
      {data.map((sale, idx) => (
        <div 
          key={sale.id} 
          className="w-[80mm] max-w-full mx-auto p-4 flex flex-col"
          style={{ pageBreakAfter: idx < data.length - 1 ? 'always' : 'auto' }}
        >
          {/* Header */}
          <div className="text-center mb-4 border-b border-dashed border-gray-400 pb-4">
            <h1 className="text-xl font-bold mb-1 uppercase tracking-wider">{sale.company?.name || 'NEXORA ERP'}</h1>
            <p>RUC: {sale.company?.ruc || '0000000000001'}</p>
            <p>{sale.branch?.name || 'Sede Principal'}</p>
            <p>{sale.branch?.address || 'Dirección no especificada'}</p>
            <p>Telf: {sale.branch?.phone || ''}</p>
            
            <div className="mt-4 text-left space-y-1">
              <p><span className="font-semibold">FACTURA N°:</span> {sale.systemNumber}</p>
              <p><span className="font-semibold">FECHA:</span> {new Date(sale.createdAt).toLocaleString()}</p>
              <p><span className="font-semibold">CLIENTE:</span> {sale.customer?.name || 'CONSUMIDOR FINAL'}</p>
              <p><span className="font-semibold">RUC/DNI:</span> {sale.customer?.document || '9999999999999'}</p>
              <p><span className="font-semibold">VENDEDOR:</span> {sale.seller?.name || 'N/A'}</p>
            </div>
          </div>

          {/* Table */}
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b border-dashed border-gray-400 text-left">
                <th className="py-1 w-[15%]">CANT</th>
                <th className="py-1 w-[50%]">DESCRIPCIÓN</th>
                <th className="py-1 w-[15%] text-right">P.U</th>
                <th className="py-1 w-[20%] text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {sale.details?.map((detail: any, i: number) => (
                <tr key={i} className="border-b border-dashed border-gray-200">
                  <td className="py-1 align-top">{Number(detail.quantity).toString()}</td>
                  <td className="py-1 break-words pr-1">
                    {detail.item?.name}
                    {detail.isGift && <span className="block text-[9px]">(REGALO)</span>}
                  </td>
                  <td className="py-1 align-top text-right">${Number(detail.unitPrice).toFixed(2)}</td>
                  <td className="py-1 align-top text-right font-semibold">${Number(detail.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex flex-col items-end border-b border-dashed border-gray-400 pb-4 mb-4 space-y-1">
            <div className="flex justify-between w-1/2 min-w-[120px]">
              <span>SUBTOTAL:</span>
              <span>${Number(sale.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-1/2 min-w-[120px] font-bold text-sm mt-1">
              <span>TOTAL:</span>
              <span>${Number(sale.total).toFixed(2)}</span>
            </div>
            {sale.isCredit && (
              <div className="flex flex-col w-full text-right mt-2 pt-2 border-t border-dotted border-gray-300">
                <p>VENTA A CRÉDITO</p>
                <div className="flex justify-between w-1/2 min-w-[120px] self-end mt-1">
                  <span>ABONADO:</span>
                  <span>${Number(sale.paidAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-1/2 min-w-[120px] self-end font-bold">
                  <span>SALDO:</span>
                  <span>${Number(sale.outstanding).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] space-y-1 mt-auto pt-4">
            <p>¡GRACIAS POR SU COMPRA!</p>
            <p>Conserve este ticket para cualquier reclamo o garantía.</p>
            <p className="mt-4 opacity-50">Generado por Nexora ERP</p>
          </div>
        </div>
      ))}
    </div>
  );
});
InvoicePrint.displayName = 'InvoicePrint';
