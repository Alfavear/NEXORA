import { BarChart2, Package, Users, DollarSign, Briefcase, FileText, TrendingUp } from 'lucide-react';

export type FilterFieldType = 'date-range' | 'customer' | 'seller' | 'branch' | 'item' | 'systemNumber' | 'year-month';

export interface ReportDefinition {
  id: string;
  title: string;
  icon: any; // Lucide icon
  description: string;
  requiredFilters: FilterFieldType[];
}

export interface ReportCategory {
  id: string;
  name: string;
  reports: ReportDefinition[];
}

export const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: 'SALES',
    name: 'Ventas y Comercial',
    reports: [
      {
        id: 'GENERAL_SALES',
        title: 'Ventas Generales',
        description: 'Listado global de ventas en un periodo determinado.',
        icon: BarChart2,
        requiredFilters: ['date-range'],
      },
      {
        id: 'SALES_BY_SELLER',
        title: 'Ventas por Vendedor',
        description: 'Producción y ventas consolidadas de un vendedor específico.',
        icon: Briefcase,
        requiredFilters: ['date-range', 'seller'],
      },
      {
        id: 'INVOICE_REPRINTS',
        title: 'Impresión de Facturas',
        description: 'Reimpresión de facturas y visualización de detalles de ventas.',
        icon: FileText,
        requiredFilters: ['date-range', 'systemNumber', 'customer'],
      },
      {
        id: 'RETURN_REPRINTS',
        title: 'Impresión de Notas/Devoluciones',
        description: 'Reimpresión de notas de crédito y devoluciones procesadas.',
        icon: FileText,
        requiredFilters: ['date-range', 'systemNumber', 'customer'],
      },
      {
        id: 'SALES_VOLUME',
        title: 'Volumen y Top Ventas',
        description: 'Análisis de ingresos por periodo y top de productos.',
        icon: TrendingUp,
        requiredFilters: ['year-month'],
      }
    ]
  },
  {
    id: 'FINANCE',
    name: 'Cartera y Cobranzas',
    reports: [
      {
        id: 'CUSTOMER_STATEMENT',
        title: 'Estado de Cuenta',
        description: 'Historial de deudas, abonos y saldo pendiente por cliente.',
        icon: Users,
        requiredFilters: ['customer'],
      },
      {
        id: 'COLLECTIONS',
        title: 'Recibos de Caja / Cobros',
        description: 'Abonos y cobros realizados en un periodo determinado.',
        icon: DollarSign,
        requiredFilters: ['date-range'],
      }
    ]
  },
  {
    id: 'INVENTORY',
    name: 'Inventario',
    reports: [
      {
        id: 'KARDEX',
        title: 'Kardex / Stock',
        description: 'Movimientos de inventario por producto y sede.',
        icon: Package,
        requiredFilters: ['date-range', 'item', 'branch'],
      }
    ]
  }
];
