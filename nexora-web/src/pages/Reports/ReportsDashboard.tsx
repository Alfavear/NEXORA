import { useState, useRef, useEffect, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FileText, Printer, Search, RefreshCw, Filter, ChevronRight, ChevronDown } from 'lucide-react';
import { reportsApi } from '../../api/reports';
import { startOfMonth, endOfMonth, format } from 'date-fns';

import { REPORT_CATEGORIES } from './config/reportDefinitions';
import { SalesPrint } from './templates/SalesPrint';
import { InventoryPrint } from './templates/InventoryPrint';
import { SalesBySellerPrint } from './templates/SalesBySellerPrint';
import { CustomerStatementPrint } from './templates/CustomerStatementPrint';
import { CollectionsPrint } from './templates/CollectionsPrint';
import { InvoicePrint } from './templates/InvoicePrint';
import { ReturnPrint } from './templates/ReturnPrint';
import { SalesVolumePrint } from './templates/SalesVolumePrint';

import { listUsers } from '../../api/users';
import { customersApi } from '../../api/customers';
import { itemsApi } from '../../api/items';
import { branchesApi } from '../../api/branches';

export default function ReportsDashboard() {
  const [activeTab, setActiveTab] = useState<'GRID' | 'PRINT'>('GRID');
  
  // Flatten reports for easy access
  const allReports = useMemo(() => REPORT_CATEGORIES.flatMap(cat => cat.reports), []);
  const [activeReportId, setActiveReportId] = useState<string>(allReports[0].id);
  
  const activeReport = allReports.find(r => r.id === activeReportId) || allReports[0];

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Filters State
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [systemNumber, setSystemNumber] = useState<string>('');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>('');

  // Dropdown lists
  const [sellers, setSellers] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  // Expanded Categories logic
  const [expandedCategories, setExpandedCategories] = useState<string[]>(REPORT_CATEGORIES.map(c => c.id));

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Reporte-${activeReportId}-${new Date().getTime()}`,
  });

  useEffect(() => {
    listUsers().then(setSellers).catch(() => {});
    customersApi.getAll().then(res => setCustomersList(res.data)).catch(() => {});
    itemsApi.list().then(res => setItems(res.data)).catch(() => {});
    branchesApi.list().then(res => setBranches(res.data)).catch(() => {});
  }, []);

  const switchReport = (reportId: string) => {
    setActiveReportId(reportId);
    setData(null);
    setSelectedRecord(null);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  const loadData = async () => {
    setLoading(true);
    setSelectedRecord(null);
    try {
      let res;
      switch (activeReportId) {
        case 'GENERAL_SALES':
          res = await reportsApi.getSales({ startDate, endDate });
          break;
        case 'SALES_BY_SELLER':
          res = await reportsApi.getSalesBySeller({ startDate, endDate, sellerId: selectedSeller ? Number(selectedSeller) : undefined });
          break;
        case 'CUSTOMER_STATEMENT':
          if (!selectedCustomer) {
             alert('Debe seleccionar un cliente');
             return;
          }
          res = await reportsApi.getCustomerStatement(Number(selectedCustomer));
          break;
        case 'COLLECTIONS':
          res = await reportsApi.getCollections({ startDate, endDate });
          break;
        case 'KARDEX':
          res = await reportsApi.getKardex({ 
            startDate, endDate, 
            itemId: selectedItem ? Number(selectedItem) : undefined, 
            branchId: selectedBranch ? Number(selectedBranch) : undefined 
          });
          break;
        case 'INVOICE_REPRINTS':
          res = await reportsApi.getInvoiceReprints({
            from: startDate, to: endDate,
            customerId: selectedCustomer ? Number(selectedCustomer) : undefined,
            systemNumber
          });
          break;
        case 'RETURN_REPRINTS':
          res = await reportsApi.getReturnReprints({
            from: startDate, to: endDate,
            customerId: selectedCustomer ? Number(selectedCustomer) : undefined,
            systemNumber
          });
          break;
        case 'SALES_VOLUME':
          res = await reportsApi.getSalesVolume({ year: Number(year), month: month ? Number(month) : undefined });
          break;
        default:
          res = [];
      }
      setData(res);
    } catch (error) {
      console.error('Error loading report', error);
      alert('Ocurrió un error cargando el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const renderGridData = () => {
    if (!data) return null;
    
    // Diseño especial para la grilla de Volumen de Ventas (Top 10 y Desglose)
    if (activeReportId === 'SALES_VOLUME') {
      if (!data.summary || data.breakdown.length === 0) return <p className="text-gray-400 p-4">No hay datos en grilla para este filtro.</p>;
      return (
        <div className="flex flex-col gap-6 bg-slate-900/50 p-6">
          <div>
            <h3 className="px-4 py-2 text-lg font-bold text-white border-b border-slate-700">Top 10 Productos Vendidos</h3>
            <table className="w-full text-sm text-left font-mono mt-2">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-right">Cant. Vendida</th>
                  <th className="px-4 py-3 text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data.topProducts.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-slate-300">{row.sku}</td>
                    <td className="px-4 py-3 text-slate-300 font-semibold">{row.name}</td>
                    <td className="px-4 py-3 text-right text-indigo-400 font-bold">{row.quantity}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">${Number(row.revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="px-4 py-2 text-lg font-bold text-white border-b border-slate-700">Desglose de Ingresos ({data.summary.periodLabel})</h3>
            <table className="w-full text-sm text-left font-mono mt-2">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3 text-right">No. Ventas</th>
                  <th className="px-4 py-3 text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data.breakdown.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-slate-300 font-semibold">{row.period}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{row.salesCount}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">${Number(row.revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeReportId === 'GENERAL_SALES') {
      const records = data || [];
      if (records.length === 0) return <p className="text-gray-400 p-4">No hay ventas registradas en este periodo.</p>;

      return (
        <table className="w-full text-sm text-left font-mono">
          <thead className="text-xs uppercase bg-slate-900 text-slate-400 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Documento</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4 text-right">Subtotal</th>
              <th className="px-6 py-4 text-right">Impuestos</th>
              <th className="px-6 py-4 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {records.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-3 whitespace-nowrap text-slate-400 font-medium">
                  {new Date(row.date || row.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-white font-bold">{row.documentNumber || row.systemNumber}</td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {row.isCredit ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border border-blue-500/30 bg-blue-500/10 text-blue-400">
                      Crédito
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      Contado
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-slate-300">
                   <div className="font-semibold text-slate-100 uppercase">{row.customerName || row.customer?.name || 'CONSUMIDOR FINAL'}</div>
                   <div className="text-[10px] text-slate-500">{row.branchName || row.branch?.name || 'SUCURSAL'}</div>
                </td>
                <td className="px-6 py-3 text-right text-slate-400">${Number(row.subtotal || 0).toFixed(2)}</td>
                <td className="px-6 py-3 text-right text-amber-500/80">${Number(row.tax || 0).toFixed(2)}</td>
                <td className="px-6 py-3 text-right text-emerald-400 font-black">${Number(row.total || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeReportId === 'INVOICE_REPRINTS' || activeReportId === 'RETURN_REPRINTS') {
      const records = Array.isArray(data) ? data : data.statement || [];
      if (records.length === 0) return <p className="text-gray-400 p-4">No hay documentos para este filtro.</p>;

      return (
        <table className="w-full text-sm text-left font-mono">
          <thead className="text-xs uppercase bg-slate-900 text-slate-400 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">N° Documento</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4 text-right">Subtotal</th>
              <th className="px-6 py-4 text-right">Impuestos</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {records.map((row: any, i: number) => (
              <tr key={i} className={`hover:bg-slate-700/30 transition-colors ${selectedRecord?.id === row.id ? 'bg-indigo-500/10' : ''}`}>
                <td className="px-6 py-3 whitespace-nowrap text-slate-400">{new Date(row.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-3 whitespace-nowrap text-white font-bold">{row.systemNumber}</td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {row.isCredit ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border border-blue-500/30 bg-blue-500/10 text-blue-400">
                      Crédito
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      Contado
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-slate-300">
                   <div className="font-semibold text-slate-100">{row.customer?.name || 'Consumidor Final'}</div>
                   <div className="text-[10px] text-slate-500 uppercase">{row.customer?.document || '---'}</div>
                </td>
                <td className="px-6 py-3 text-right text-slate-400">${Number(row.subtotal).toFixed(2)}</td>
                <td className="px-6 py-3 text-right text-amber-500/80">${Number(row.tax || 0).toFixed(2)}</td>
                <td className="px-6 py-3 text-right text-emerald-400 font-bold">${Number(row.total).toFixed(2)}</td>
                <td className="px-6 py-3 text-center">
                  <button 
                    onClick={() => { setSelectedRecord(row); setActiveTab('PRINT'); }}
                    className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-all border border-indigo-500/20 group"
                    title="Visualizar para Imprimir"
                  >
                    <Search className="w-4 h-4 group-hover:scale-110" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    let arrayData = Array.isArray(data) ? data : data.statement || [];
    if (activeReportId === 'SALES_BY_SELLER') {
      arrayData = data.flatMap((seller:any) => seller.sales);
    }

    if (arrayData.length === 0) return <p className="text-gray-400 p-4">No hay datos en grilla para este filtro.</p>;

    const keys = Object.keys(arrayData[0]).filter(k => k !== 'id' && typeof arrayData[0][k] !== 'object');

    return (
      <table className="w-full text-sm text-left font-mono">
        <thead className="text-xs uppercase bg-slate-900 text-slate-400 border-b border-slate-700">
          <tr>
            {keys.map(key => <th key={key} className="px-6 py-4">{key}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {arrayData.map((row: any, i: number) => (
            <tr key={i} className="hover:bg-slate-700/30 transition-colors">
              {keys.map(k => (
                <td key={k} className="px-6 py-3 whitespace-nowrap text-slate-300">
                  {String(row[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderPrintTemplate = () => {
    const filtersUsed = { startDate, endDate, selectedSeller, selectedCustomer, selectedItem, selectedBranch };
    const printData = selectedRecord ? [selectedRecord] : (data || []);
    
    switch (activeReportId) {
      case 'GENERAL_SALES': return <SalesPrint ref={printRef} data={printData} filters={filtersUsed} />;
      case 'SALES_BY_SELLER': return <SalesBySellerPrint ref={printRef} data={printData} filters={filtersUsed} />;
      case 'CUSTOMER_STATEMENT': return <CustomerStatementPrint ref={printRef} data={data || {}} filters={filtersUsed} />;
      case 'COLLECTIONS': return <CollectionsPrint ref={printRef} data={printData} filters={filtersUsed} />;
      case 'KARDEX': return <InventoryPrint ref={printRef} data={printData} />;
      case 'INVOICE_REPRINTS': return <InvoicePrint ref={printRef} data={printData} />;
      case 'RETURN_REPRINTS': return <ReturnPrint ref={printRef} data={printData} />;
      case 'SALES_VOLUME': return <SalesVolumePrint ref={printRef} data={data || {}} />;
      default: return <div ref={printRef} className="p-10 text-black bg-white">Plantilla no definida</div>;
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar de Reportes Dinámico */}
      <div className="w-72 bg-slate-900 border-r border-slate-700/50 flex flex-col pt-4 overflow-y-auto">
        <h2 className="px-6 text-sm font-semibold uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" /> Explorador
        </h2>
        <div className="flex-1 space-y-4 px-3">
          {REPORT_CATEGORIES.map(category => (
            <div key={category.id} className="mb-2">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white mb-1"
              >
                <span>{category.name}</span>
                {expandedCategories.includes(category.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              
              {expandedCategories.includes(category.id) && (
                <div className="space-y-1 pl-2">
                  {category.reports.map(report => {
                    const Icon = report.icon;
                    return (
                      <button
                        key={report.id}
                        onClick={() => switchReport(report.id)}
                        className={`w-full text-left flex flex-col gap-1 px-3 py-2.5 rounded-lg transition-colors ${
                          activeReportId === report.id 
                            ? 'bg-indigo-500/10 border border-indigo-500/30' 
                            : 'hover:bg-slate-800 border border-transparent'
                        }`}
                      >
                        <div className={`flex items-center gap-2 text-sm font-medium ${activeReportId === report.id ? 'text-indigo-400' : 'text-slate-300'}`}>
                          <Icon className="w-4 h-4" />
                          {report.title}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-2 pl-6">
                          {report.description}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col bg-[#0F172A] relative">
        <div className="p-4 pb-3 border-b border-slate-700/50 bg-[#0F172A]/90 backdrop-blur-sm z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white flex items-center gap-3">
              <activeReport.icon className="w-6 h-6 text-indigo-400" />
              {activeReport.title}
            </h1>

            <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setActiveTab('GRID')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'GRID' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4" /> Grilla
              </button>
              <button
                onClick={() => setActiveTab('PRINT')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'PRINT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Printer className="w-4 h-4" /> Visualizador
              </button>
            </div>
          </div>

          {/* Dynamic Filters Compacted */}
          <div className="flex flex-wrap gap-3 items-end bg-slate-800/30 p-3 rounded-xl border border-slate-700/50 shadow-sm">
            <div className="flex items-center gap-2 px-2 border-r border-slate-700 mr-1 text-slate-500">
              <Filter className="w-4 h-4" />
            </div>

            {activeReport.requiredFilters.includes('date-range') && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-400">Desde</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input bg-slate-900 border-slate-700 text-white text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-400">Hasta</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input bg-slate-900 border-slate-700 text-white text-sm" />
                </div>
              </>
            )}

            {activeReport.requiredFilters.includes('seller') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-slate-400">Vendedor</label>
                <select value={selectedSeller} onChange={e => setSelectedSeller(e.target.value)} className="input bg-slate-900 border-slate-700 text-white text-sm min-w-[150px]">
                  <option value="">TODOS</option>
                  {sellers.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {activeReport.requiredFilters.includes('customer') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-slate-400">Cliente (Requerido)</label>
                <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="input bg-slate-900 border-slate-700 text-white text-sm min-w-[200px]">
                  <option value="">Selecciona Cliente...</option>
                  {customersList.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {activeReport.requiredFilters.includes('branch') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-slate-400">Sucursal</label>
                <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="input bg-slate-900 border-slate-700 text-white text-sm min-w-[150px]">
                  <option value="">TODAS</option>
                  {branches.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}

            {activeReport.requiredFilters.includes('item') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-slate-400">Producto / Item</label>
                <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className="input bg-slate-900 border-slate-700 text-white text-sm min-w-[150px]">
                  <option value="">TODOS</option>
                  {items.map((it:any) => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
              </div>
            )}

            {activeReport.requiredFilters.includes('systemNumber') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-slate-400">No. Documento</label>
                <input 
                  type="text" 
                  value={systemNumber} 
                  onChange={e => setSystemNumber(e.target.value)} 
                  placeholder="Ej. VTA-..." 
                  className="input bg-slate-900 border-slate-700 text-white text-sm" 
                />
              </div>
            )}

            {activeReport.requiredFilters.includes('year-month') && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-400">Año</label>
                  <input type="number" min="2000" max="2100" value={year} onChange={e => setYear(e.target.value)} className="input bg-slate-900 border-slate-700 text-white text-sm w-24" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-400">Mes (Opcional)</label>
                  <select value={month} onChange={e => setMonth(e.target.value)} className="input bg-slate-900 border-slate-700 text-white text-sm min-w-[150px]">
                    <option value="">Todo el año</option>
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex-1" />

            <button onClick={loadData} disabled={loading} className="btn btn-primary shadow-lg shadow-indigo-500/20 px-6">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><RefreshCw className="w-5 h-5" /> Generar Datos</>}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-slate-900/30">
          {!data && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <activeReport.icon className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg">Selecciona los filtros y haz clic en "Generar Datos"</p>
            </div>
          ) : activeTab === 'GRID' ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                {renderGridData()}
              </div>
            </div>
          ) : (
            <div className="max-w-[850px] mx-auto bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-6">
                <span className="text-sm font-medium text-slate-400">Previsualización del Documento</span>
                <button onClick={() => handlePrint()} className="btn btn-primary px-6 shadow-lg shadow-indigo-500/20">
                  <Printer className="w-4 h-4 mr-2" /> Imprimir / PDF
                </button>
              </div>

              <div className="w-full aspect-[1/1.414] bg-white rounded-lg overflow-hidden shadow-inner flex shadow-[0_0_15px_rgba(0,0,0,0.5)] transform scale-[0.85] origin-top">
                <div className="w-full h-full overflow-y-auto">
                  {renderPrintTemplate()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
