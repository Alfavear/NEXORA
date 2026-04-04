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
    <div ref={ref} className="bg-transparent">
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

        // FORMATO ORIGINAL 80MM PARA CONTADO
        return (
          <div key={sale.id} className="bg-white text-black text-[11px] font-mono leading-tight w-[80mm] max-w-full mx-auto p-4 flex flex-col" style={pageBreak}>
            {/* Header */}
            <div className="text-center mb-4 border-b border-dashed border-gray-400 pb-4">
              {(sale.branch as any)?.logoUrl && (
                <img src={(sale.branch as any).logoUrl} alt="Logo Sede" className="w-20 h-20 mx-auto mb-2 object-contain grayscale" />
              )}
              <h1 className="text-xl font-bold mb-1 uppercase tracking-wider">{sale.branch?.name || sale.company?.name || 'SUCURSAL'}</h1>
              <p>RUC: {sale.company?.ruc || '0000000000001'}</p>
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
              {sale.saleTaxes && sale.saleTaxes.length > 0 ? (
                sale.saleTaxes.map((st: any) => (
                  <div key={st.taxId} className="flex justify-between w-1/2 min-w-[120px] text-[10px]">
                    <span>{st.tax?.name} ({Number(st.tax?.rate).toFixed(2)}%):</span>
                    <span>${(Number(sale.subtotal) * (Number(st.tax?.rate) / 100)).toFixed(2)}</span>
                  </div>
                ))
              ) : Number(sale.tax) > 0 ? (
                <div className="flex justify-between w-1/2 min-w-[120px] text-[10px]">
                  <span>IMPUESTOS:</span>
                  <span>${Number(sale.tax).toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between w-1/2 min-w-[120px] font-bold text-sm mt-1">
                <span>TOTAL:</span>
                <span>${Number(sale.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] space-y-1 mt-auto pt-4">
              <p>¡GRACIAS POR SU COMPRA!</p>
              <p>Conserve este ticket para cualquier reclamo o garantía.</p>
              <p className="mt-4 opacity-50">Generado por el Sistema</p>
            </div>
          </div>
        );
      })}
    </div>
  );
});
InvoicePrint.displayName = 'InvoicePrint';
