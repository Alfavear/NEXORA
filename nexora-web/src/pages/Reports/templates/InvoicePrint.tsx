import { forwardRef } from 'react';

export const InvoicePrint = forwardRef<HTMLDivElement, { data: any[] }>(({ data }, ref) => {
  if (!data || data.length === 0) {
    return (
      <div ref={ref} className="p-8 text-center text-gray-500 font-mono">
        No hay facturas para imprimir. Utilice los filtros para buscar una factura.
      </div>
    );
  }

  // Detectamos si hay facturas de 80mm (contado) para ajustar el papel
  const hasTicket = data.some(s => !s.isCredit);

  return (
    <div ref={ref} className="bg-transparent">
      {/* Estilos dinámicos para el tamaño del papel en impresoras térmicas vs A4 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${hasTicket ? '80mm auto' : 'A4'};
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
          }
          .no-print { display: none !important; }
        }
      `}} />

      {data.map((sale, idx) => {
        const isCredit = Boolean(sale.isCredit);
        const pageBreak = { pageBreakAfter: idx < data.length - 1 ? 'always' : 'auto' } as any;

        if (isCredit) {
          // FORMATO A4 PARA CRÉDITO Y ACUERDO DE PAGOS
          return (
            <div key={sale.id} className="bg-white text-black p-10 min-h-[1056px] w-[816px] mx-auto text-sm print:shadow-none font-sans relative" style={pageBreak}>
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
                <div className="flex items-center gap-4">
                  {(sale.branch as any)?.logoUrl && (
                    <img src={(sale.branch as any).logoUrl} alt="Logo" className="w-24 h-24 object-contain grayscale" />
                  )}
                  <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wider">{sale.branch?.name || sale.company?.name || 'SUCURSAL'}</h1>
                    <p>RUC: {sale.company?.ruc || '0000000000001'}</p>
                    <p>{sale.branch?.address}</p>
                    <p>Telf: {sale.branch?.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold border-2 border-black px-4 py-2 bg-gray-100 uppercase tracking-widest">Factura a Crédito</h2>
                  <p className="mt-3 text-xl font-bold text-red-600">N° {sale.systemNumber}</p>
                  <p className="text-sm mt-1">Emitido: {new Date(sale.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Datos del Cliente */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm border border-gray-400 p-4 rounded-lg bg-gray-50">
                <div><span className="font-bold">Cliente:</span> {sale.customer?.name || 'CONSUMIDOR FINAL'}</div>
                <div><span className="font-bold">RUC/DNI:</span> {sale.customer?.document || '9999999999999'}</div>
                <div><span className="font-bold">Dirección:</span> {sale.customer?.address || 'No registrada'}</div>
                <div><span className="font-bold">Vendedor:</span> {sale.seller?.name || 'N/A'}</div>
              </div>

              {/* Tabla de Productos */}
              <table className="w-full mb-8 text-sm border-collapse">
                <thead className="bg-gray-200 border-y-2 border-black">
                  <tr>
                    <th className="py-2 px-2 text-left">Cant</th>
                    <th className="py-2 px-2 text-left">Descripción del Artículo</th>
                    <th className="py-2 px-2 text-right">P. Unitario</th>
                    <th className="py-2 px-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="border-b-2 border-gray-300">
                  {sale.details?.map((detail: any, i: number) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-2 px-2 text-center">{Number(detail.quantity)}</td>
                      <td className="py-2 px-2 font-medium">{detail.item?.name} {detail.isGift && <span className="text-xs italic text-gray-500">(Regalo)</span>}</td>
                      <td className="py-2 px-2 text-right">${Number(detail.unitPrice).toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-bold">${Number(detail.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Sección de Amortización y Totales */}
              <div className="flex gap-8 mb-12">
                {/* Tabla de Amortización */}
                <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
                  <h3 className="bg-gray-800 text-white font-bold p-2 uppercase text-center text-xs tracking-widest">Cronograma de Pagos (Amortización)</h3>
                  {sale.amortization?.length > 0 ? (
                    <table className="w-full text-xs text-left font-mono">
                      <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                          <th className="p-2 text-center">N° Cuota</th>
                          <th className="p-2">Fecha Vencimiento</th>
                          <th className="p-2 text-right">Valor Cuota</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sale.amortization.map((a: any) => (
                          <tr key={a.id}>
                            <td className="p-2 text-center font-bold text-gray-600">{a.quotaNumber}</td>
                            <td className="p-2">{new Date(a.dueDate).toLocaleDateString()}</td>
                            <td className="p-2 text-right font-bold">${Number(a.amount).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-gray-500 text-center p-4">No hay cuotas registradas.</p>
                  )}
                  <div className="bg-gray-50 p-2 border-t border-gray-300 text-[10px] text-gray-500 text-center italic">
                    El atraso en el pago generará interés por mora de {Number(sale.lateInterestRate || 0).toFixed(2)}%.
                  </div>
                </div>

                {/* Totales Financieros */}
                <div className="w-[300px] flex flex-col font-mono text-sm">
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-600">Subtotal Factura:</span>
                    <span>${Number(sale.subtotal).toFixed(2)}</span>
                  </div>
                  {sale.saleTaxes && sale.saleTaxes.length > 0 ? (
                    sale.saleTaxes.map((st: any) => (
                      <div key={st.taxId} className="flex justify-between py-1.5 border-b border-gray-200 text-xs">
                        <span className="text-gray-600">{st.tax?.name} ({Number(st.tax?.rate).toFixed(2)}%):</span>
                        <span>${(Number(sale.subtotal) * (Number(st.tax?.rate) / 100)).toFixed(2)}</span>
                      </div>
                    ))
                  ) : Number(sale.tax) > 0 ? (
                    <div className="flex justify-between py-1.5 border-b border-gray-200 text-xs">
                      <span className="text-gray-600">Impuestos:</span>
                      <span>${Number(sale.tax).toFixed(2)}</span>
                    </div>
                  ) : null}
                  
                  {Number(sale.interestAmount) > 0 && (
                    <div className="flex justify-between py-1.5 border-b border-gray-200 font-semibold text-gray-800">
                      <span>Interés Financiación:</span>
                      <span>${Number(sale.interestAmount).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-3 text-xl font-black border-b-2 border-black">
                    <span>TOTAL BRUTO:</span>
                    <span>${Number(sale.total).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between py-2 text-sm mt-2 font-bold text-green-700 bg-green-50 px-2 rounded">
                    <span>Abono Inicial:</span>
                    <span>-${Number(sale.paidAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-base font-black text-red-700 bg-red-50 px-2 mt-1 border border-red-200 rounded shadow-sm">
                    <span>SALDO A FINANCIAR:</span>
                    <span>${Number(sale.outstanding).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Firmas / Pagaré */}
              <div className="absolute bottom-12 left-10 right-10 flex justify-between">
                <div className="w-72 text-center border-t-2 border-black pt-2">
                  <p className="font-bold text-xs uppercase">{sale.customer?.name || 'Cliente'}</p>
                  <p className="text-[10px] text-gray-500">Firma de aceptación y Pagaré incondicional</p>
                </div>
                <div className="w-72 text-center border-t-2 border-black pt-2">
                  <p className="font-bold text-xs uppercase">{sale.seller?.name || 'Vendedor'}</p>
                  <p className="text-[10px] text-gray-500">Por {sale.branch?.name || sale.company?.name || 'La Empresa'}</p>
                </div>
              </div>
            </div>
          );
        }

        // FORMATO REDISEÑADO 80MM "NEXORA ELITE" PARA CONTADO
        return (
          <div key={sale.id} className="bg-white text-black text-[11px] font-sans leading-relaxed w-[80mm] max-w-full mx-auto p-5 flex flex-col shadow-sm border border-gray-100" style={pageBreak}>
            {/* Logo y Sede */}
            <div className="text-center mb-5">
              {(sale.branch as any)?.logoUrl ? (
                <img src={(sale.branch as any).logoUrl} alt="Sede Logo" className="w-16 h-16 mx-auto mb-3 object-contain grayscale" />
              ) : (
                <div className="text-2xl font-black tracking-tighter mb-1 select-none">NEXORA</div>
              )}
              <h1 className="text-lg font-black uppercase tracking-tight leading-none mb-2">{sale.branch?.name || sale.company?.name || 'CENTRO MATRIZ'}</h1>
              <div className="text-[10px] space-y-0.5 opacity-80 uppercase font-medium">
                <p>RUC: {sale.company?.ruc || '0000000000001'}</p>
                <p className="px-2">{sale.branch?.address || 'Sucursal Principal'}</p>
                <p>Tel: {sale.branch?.phone || '---'}</p>
              </div>
            </div>

            {/* Ficha de Documento */}
            <div className="border-y-2 border-black py-3 mb-5 space-y-1.5 bg-gray-50/50">
              <div className="flex justify-between items-center px-1">
                <span className="font-bold text-xs">FACTURA N°:</span>
                <span className="font-mono font-black text-sm">{sale.systemNumber}</span>
              </div>
              <div className="flex justify-between px-1 text-[10px]">
                <span>FECHA EMISIÓN:</span>
                <span className="font-semibold">{new Date(sale.createdAt).toLocaleString()}</span>
              </div>
              <div className="px-1 pt-2 border-t border-gray-200 mt-2">
                <p className="font-bold text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Cliente:</p>
                <p className="text-xs font-black uppercase">{sale.customer?.name || 'CONSUMIDOR FINAL'}</p>
                <p className="text-[10px] font-mono tracking-wider opacity-70">ID/RUC: {sale.customer?.document || '9999999999999'}</p>
              </div>
              <div className="px-1 text-[9px] opacity-60 italic">Atendido por: {sale.seller?.name || 'Sistema'}</div>
            </div>

            {/* Tabla de Artículos */}
            <table className="w-full mb-5 border-collapse">
              <thead>
                <tr className="border-b-2 border-black text-[10px] uppercase font-black tracking-tighter">
                  <th className="py-1.5 text-left w-10">CANT</th>
                  <th className="py-1.5 text-left">PRODUCTO</th>
                  <th className="py-1.5 text-right w-16">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sale.details?.map((detail: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2 align-top text-center font-bold text-gray-600">{Number(detail.quantity).toString()}</td>
                    <td className="py-2 pr-2">
                      <div className="font-bold text-[10px] uppercase leading-tight">{detail.item?.name}</div>
                      <div className="text-[9px] text-gray-500 font-mono">PU: ${Number(detail.unitPrice).toFixed(2)}</div>
                      {detail.isGift && <span className="inline-block px-1 bg-gray-100 text-[8px] font-bold rounded">REGALO</span>}
                    </td>
                    <td className="py-2 align-top text-right font-mono font-bold text-xs">${Number(detail.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bloque de Totales */}
            <div className="flex flex-col items-end space-y-1 text-xs border-t-2 border-black pt-4 mb-6">
              <div className="flex justify-between w-3/4">
                <span className="font-medium text-gray-500">SUBTOTAL</span>
                <span className="font-mono font-bold">${Number(sale.subtotal).toFixed(2)}</span>
              </div>
              {sale.saleTaxes?.map((st: any) => (
                <div key={st.taxId} className="flex justify-between w-3/4 text-[10px]">
                  <span className="text-gray-500 uppercase">{st.tax?.name} ({Number(st.tax?.rate).toFixed(2)}%)</span>
                  <span className="font-mono">${(Number(sale.subtotal) * (Number(st.tax?.rate) / 100)).toFixed(2)}</span>
                </div>
              )) || (Number(sale.tax) > 0 && (
                <div className="flex justify-between w-3/4 text-[10px]">
                  <span className="text-gray-500 uppercase">IMPUESTOS</span>
                  <span className="font-mono">${Number(sale.tax).toFixed(2)}</span>
                </div>
              ))}
              
              <div className="flex justify-between w-full mt-3 p-3 bg-black text-white rounded-sm items-center">
                <span className="text-xs font-black tracking-widest">TOTAL A PAGAR</span>
                <span className="text-lg font-black font-mono tracking-tighter">${Number(sale.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Footer / Estilo Barcode */}
            <div className="text-center mt-auto">
              <div className="mb-4 flex flex-col items-center opacity-40">
                <div className="w-full flex justify-center h-4 gap-0.5 items-end mb-1">
                  {[1,3,1,2,5,2,1,4,1,3,1].map((w,i) => <div key={i} className="bg-black" style={{width: `${w}px`, height: '100%'}} />)}
                  {[2,1,4,2,1,3,2].map((w,i) => <div key={i} className="bg-black" style={{width: `${w}px`, height: '70%'}} />)}
                </div>
                <p className="text-[8px] font-mono tracking-widest">{sale.systemNumber}</p>
              </div>
              
              <div className="text-[10px] space-y-1 font-bold text-gray-500 leading-tight">
                <p>¡GRACIAS POR SU COMPRA!</p>
                <p className="text-[8px] opacity-70 font-medium">Conserve este comprobante para cambios o devoluciones.</p>
                <p className="text-[7px] mt-6 opacity-30 uppercase font-mono">Nexora ERP Cloud v2.0</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
InvoicePrint.displayName = 'InvoicePrint';
