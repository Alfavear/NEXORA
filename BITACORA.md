# Bitácora de trabajo - Nexora
Fecha: 30 marzo 2026

## Estado actual
- Módulo Mantenimiento implementado en frontend (`Maintenance.tsx`) con formulario y tabla.
- Items ahora con campos extendidos y maestros relacionados: `groupId`, `brandId`, `ownerId`, `providerId`.
- Nuevos modelos Prisma:
  - `ItemGroup`, `ItemBrand`, `ItemOwner`
- Nuevos endpoints backend:
  - `/item-groups`
  - `/item-brands`
  - `/item-owners`
- `items` controller/service ajustado a validación en empresas para categorías/grupos/marcas/propietarios/proveedores.

## Problemas abiertos
- Prisma migration: hubo drift y carpetas de migración vacías. 
- `npx prisma migrate reset` ejecutado, pero `npx prisma generate` falla con `EPERM` en Windows (`query_engine-windows.dll.node.tmp`).
- Frontend `npm run build` OK; backend `nest build` OK.
- Node warning: uso 20.17 (recomienda 20.19+).

## Comandos para retomar
1. Reabrir repo:
   - `cd d:\Projects\Nexora\NEXORA`
2. Backend:
   - `cd nexora-api`
   - `npx prisma generate`
   - `npm run build`
   - `npm run start:dev`
3. Frontend:
   - `cd ..\\nexora-web`
   - `npm run dev`
4. Si queda EPERM con prisma:
   - cerrar dev server y VS Code
   - reiniciar máquina
   - repetir `npx prisma generate`

## Siguiente paso sugerido
1. Agregar CRUD UI de maestros (grupos/marcas/propietarios) desde la web.
2. Probar creación de artículo con valores en selects (grupo/marca/propietario/proveedor/categoría).
3. Asegurar stock / kardex refleja los cambios y traslados.
4. Añadir gestión de deletions y estados activos/inactivos en maestros.

## Referencias
- `nexora-api/prisma/schema.prisma`
- `nexora-api/src/items/items.service.ts`
- `nexora-web/src/pages/Maintenance.tsx`

## Avance del 31 marzo 2026
- Se implementó `SalePayment` en prisma y enlace en `Sale`.
- Se habilitaron endpoints nuevos en `SalesController`: `GET /sales/credits`, `POST /sales/:id/payments`, `GET /sales/:id/payments`.
- Se agregaron validaciones y calc. de status en `SalesService` para crédito, parcial, pago y saldo.
- UI de ventas (`Sales.tsx`) ahora soporta ventas crédito con `dueDate`, `initialPayment`, historial de cartera, abonos y `print invoice`.
- Se agregó reporte de cartera avanzada (`GET /sales/credits/report`) con filtros `from`, `to`, `customerId`, `branchId`, `status`.
- En `Reports.tsx`: se modularizó la sección de reportes en tipos (Ventas/Cartera), con filtros, grilla, procesar e imprimir visualizador.
- En `Shell.tsx`: se añadió selector de sedes activo con cambio de sede en caliente (switchBranch) sin cerrar sesión.
- En `Login.tsx`: ahora un vendedor debe escoger sede obligatoriamente antes de entrar al app.

## Mantenimiento y Corrección de Conflictos
- Se resolvieron los marcadores de conflictos de Git que se encontraban alojados erróneamente en el `README.md` y `BITACORA.md`.
- Se refactorizó la comunicación entre `ReportsController` y `ReportsService` para pasar rigurosamente el parámetro de `companyId` aislando los datos por inquilino y aplicando el control preventivo `|| 0` a todas las propiedades numéricas, evitando quiebres del frontend (`NaN`) durante la invocación del método `.toFixed()`.

## Impuestos Dinámicos y Logos de Sede (SRI)
- Se planificó la estructura para soportar impuestos dinámicos creando un modelo `Tax` y vinculándolo al maestro de artículos, garantizando adaptabilidad a futuros cambios tributarios.
- Se planificó la inyección del campo `logoUrl` al modelo `Branch` para personalizar las impresiones térmicas (facturas/tickets).
# Bitácora de trabajo - Nexora
Fecha: 30 marzo 2026

## Estado actual
- Módulo Mantenimiento implementado en frontend (`Maintenance.tsx`) con formulario y tabla.
- Items ahora con campos extendidos y maestros relacionados: `groupId`, `brandId`, `ownerId`, `providerId`.
- Nuevos modelos Prisma:
  - `ItemGroup`, `ItemBrand`, `ItemOwner`
- Nuevos endpoints backend:
  - `/item-groups`
  - `/item-brands`
  - `/item-owners`
- `items` controller/service ajustado a validación en empresas para categorías/grupos/marcas/propietarios/proveedores.

## Problemas abiertos
- Prisma migration: hubo drift y carpetas de migración vacías. 
- `npx prisma migrate reset` ejecutado, pero `npx prisma generate` falla con `EPERM` en Windows (`query_engine-windows.dll.node.tmp`).
- Frontend `npm run build` OK; backend `nest build` OK.
- Node warning: uso 20.17 (recomienda 20.19+).

## Comandos para retomar
1. Reabrir repo:
   - `cd d:\Projects\Nexora\NEXORA`
2. Backend:
   - `cd nexora-api`
   - `npx prisma generate`
   - `npm run build`
   - `npm run start:dev`
3. Frontend:
   - `cd ..\\nexora-web`
   - `npm run dev`
4. Si queda EPERM con prisma:
   - cerrar dev server y VS Code
   - reiniciar máquina
   - repetir `npx prisma generate`

## Siguiente paso sugerido
1. Agregar CRUD UI de maestros (grupos/marcas/propietarios) desde la web.
2. Probar creación de artículo con valores en selects (grupo/marca/propietario/proveedor/categoría).
3. Asegurar stock / kardex refleja los cambios y traslados.
4. Añadir gestión de deletions y estados activos/inactivos en maestros.

## Referencias
- `nexora-api/prisma/schema.prisma`
- `nexora-api/src/items/items.service.ts`
- `nexora-web/src/pages/Maintenance.tsx`

## Avance del 31 marzo 2026
- Se implementó `SalePayment` en prisma y enlace en `Sale`.
- Se habilitaron endpoints nuevos en `SalesController`: `GET /sales/credits`, `POST /sales/:id/payments`, `GET /sales/:id/payments`.
- Se agregaron validaciones y calc. de status en `SalesService` para crédito, parcial, pago y saldo.
- UI de ventas (`Sales.tsx`) ahora soporta ventas crédito con `dueDate`, `initialPayment`, historial de cartera, abonos y `print invoice`.
- Se agregó reporte de cartera avanzada (`GET /sales/credits/report`) con filtros `from`, `to`, `customerId`, `branchId`, `status`.
- En `Reports.tsx`: se modularizó la sección de reportes en tipos (Ventas/Cartera), con filtros, grilla, procesar e imprimir visualizador.
- En `Shell.tsx`: se añadió selector de sedes activo con cambio de sede en caliente (switchBranch) sin cerrar sesión.
- En `Login.tsx`: ahora un vendedor debe escoger sede obligatoriamente antes de entrar al app.

## Mantenimiento y Corrección de Conflictos
- Se resolvieron los marcadores de conflictos de Git que se encontraban alojados erróneamente en el `README.md` y `BITACORA.md`.
- Se refactorizó la comunicación entre `ReportsController` y `ReportsService` para pasar rigurosamente el parámetro de `companyId` aislando los datos por inquilino y aplicando el control preventivo `|| 0` a todas las propiedades numéricas, evitando quiebres del frontend (`NaN`) durante la invocación del método `.toFixed()`.

## Impuestos Dinámicos y Logos de Sede (SRI)
- Se planificó la estructura para soportar impuestos dinámicos creando un modelo `Tax` y vinculándolo al maestro de artículos, garantizando adaptabilidad a futuros cambios tributarios.
- Se planificó la inyección del campo `logoUrl` al modelo `Branch` para personalizar las impresiones térmicas (facturas/tickets).
- Se construyó e implementó el módulo backend `TaxesModule` (CRUD completo: Controller, Service, DTOs) para gestionar el catálogo de impuestos con aislamiento multi-tenant y borrado lógico.
- Se refactorizó el motor de ventas (`sales.service.ts`) para calcular los impuestos de forma dinámica por cada línea de producto basándose en el catálogo `Tax`, blindando financieramente los montos desde el backend.
- Se refactorizó el servicio de compras (`purchases.service.ts`) para integrar el cálculo dinámico de impuestos proveniente del catálogo maestro y se añadió la columna `tax` al modelo `Purchase`.
- Se implementó la pantalla `Taxes.tsx` en el Frontend para el mantenimiento integral del catálogo de impuestos.
- Se actualizó el maestro de Artículos (`Maintenance.tsx`) para exigir obligatoriamente la asignación de un impuesto al crear productos.
- Se actualizó el maestro de Sucursales (`Branches.tsx`) para permitir la configuración de un `logoUrl` por cada sede.
- **Pivote Arquitectónico:** Se refactorizó el modelo de datos para que- [x] Conexión a API REST
- [x] Diseño responsive (blanco + indigo pastel)
- [x] Pantalla Completa en Móviles (Shell y Sidebar dinámicos)
- [x] Estética Premium (Scrollbars y UI estilizada)
- [x] Protección de rutas por autenticación
- [x] Estado global con Context API
lugar de por Artículo individual, permitiendo la selección de múltiples impuestos dinámicos en el POS.

## Estabilización de Reportes, Dashboard y Tipados
- **Reportes Financieros:** Se aplicó un redondeo estricto a 2 decimales (`this.round2`) en todas las salidas numéricas del `ReportsService` para prevenir errores de coma flotante en JS.
- **Exportación Excel/Grillas:** Se transformaron los arreglos anidados (Pagos y Detalles de Venta) en cadenas de texto legibles separadas por `|` para evitar el quiebre de la UI y el renderizado erróneo de `[object Object]`.
- **Dashboard:** Se restauró el consumo de métricas (Ingresos de últimos 30 días y Top Artículos) estandarizando el contrato de la API para devolver llaves en formato `camelCase` nativo.
- **Prisma & TypeScript:** Se resolvieron los bloqueos `EPERM` en el motor de Windows al regenerar tipos, y se corrigieron los errores de inferencia `never[]` en el servicio de compras habilitando la compilación estricta de NestJS al 100%.
- **Inteligencia de Negocios:** Se añadió el endpoint y la plantilla de impresión `SalesVolumePrint` para reportes de "Volumen de Ventas" con capacidad de desglosar información anualmente (mes a mes) o mensualmente (día a día), identificando periodos de mayor rendimiento y el Top 10 de productos.
- **Cartera y Finanzas Avanzadas:** Se integraron campos en la entidad `Sale` para gestionar ventas a crédito con `installments` (plazos), `interestRate` (interés corriente), `lateInterestRate` (interés por mora) y `interestAmount`. El motor matemático del backend y frontend se actualizaron para calcular intereses dinámicamente sobre el saldo a financiar.
- **Tabla de Amortización:** Se añadió el modelo `SaleInstallment` a la base de datos. La fecha base (`dueDate`) ahora actúa como la fecha de inicio de cobro, generando automáticamente un cronograma de pagos (cuotas) proyectado mes a mes sobre el saldo pendiente, permitiendo control preciso de vencimientos e intereses por mora por cuota.
- **Refactorización UX/UI del POS:** Se reestructuró la pantalla principal de ventas hacia un módulo unificado de "Facturación y Cartera". Se separó la interfaz en pestañas (Punto de Venta, Historial, Cartera), se añadieron buscadores en tiempo real para localizar facturas/clientes, y la gestión de créditos e impresión se encapsuló en un Modal Flotante evitando la saturación visual.
- **Dashboard Gerencial:** Se actualizó el Dashboard para consumir la API de Inteligencia de Negocios (`SALES_VOLUME`). Se integró un gráfico de barras CSS puro para visualizar los ingresos diarios del mes actual y el Top 10 de productos.
- **Refactorización de Devoluciones:** Se rediseñó `Returns.tsx` bajo el mismo estándar de pestañas del POS ("Nueva Devolución" e "Historial"). Se incluyeron buscadores en tiempo real y se corrigió el estado de formulario para permitir gestionar retornos múltiples por factura sin cruce de datos.

## Planificación para la siguiente sesión (Movilidad y UX)
- **POS Responsivo (Móvil e iPad):** Adaptar la interfaz del módulo de "Facturación y Cartera" (`Sales.tsx`) para que sea 100% responsiva y amigable con pantallas táctiles.
- **Ventas en Piso:** Permitir a los vendedores registrar ventas y armar carritos directamente desde sus tablets o teléfonos celulares, optimizando el flujo de atención al cliente sin depender del computador principal de la caja (requerimiento operativo para nuevas sedes).

## Avance UX / Movilidad
- **Menú Hamburger y Shell Responsivo:** Se rediseñó el `Shell.tsx` para ocultar el Sidebar en resoluciones pequeñas (tablets verticales/celulares) e invocarlo mediante un menú hamburguesa con un overlay oscuro, otorgando 100% del ancho al espacio de trabajo.
- **Layout Invertido en el POS (`Sales.tsx`):** Se utilizó `CSS Grid Order` para que, en pantallas móviles, el catálogo de productos y el carrito de compras aparezcan en la parte superior (prioridad 1), desplazando los detalles de pago a la parte inferior. Esto permite a los vendedores armar carritos de pie interactuando en primer plano con el cliente.
- **Zonas Táctiles (Touch Targets):** Se rediseñó la línea de artículos del carrito con botones `[ - ]` y `[ + ]` amplios, espaciado adecuado e inputs numéricos configurados con `inputMode="decimal"` para disparar el teclado numérico nativo en celulares.

## Fase de Despliegue a Producción (04 de abril 2026)
- **Objetivo:** Desplegar la primera versión funcional de Nexora utilizando servicios PaaS en su capa gratuita (Free Tier) para validación en un entorno real.
- **Stack Seleccionado:**
  - **Base de Datos:** [Neon.tech](https://neon.tech/) (PostgreSQL Serverless) - Capa gratuita.
  - **Backend (API):** [Render.com](https://render.com/) (Web Service) - Instancia gratuita (Free Instance).
  - **Frontend (Web):** [Vercel.com](https://vercel.com/) (Hobby Plan) - Gratuito para proyectos personales/pruebas.
- **Preparación:**
  - Se identificaron archivos modificados localmente (`Login.tsx`, `tsconfig.json`) que serán sincronizados con el repositorio en `GitHub`.
  - Se verificó que el build de ambos módulos (`api` y `web`) sea exitoso.
- **Plan de Acción:**
  1. Realizar commit y push de cambios pendientes.
  2. Configurar Neon.tech y obtener `DATABASE_URL`. [COMPLETADO]
    - Se ejecutó `npx prisma db push --skip-generate` con éxito hacia el host de Neon.
  3. Desplegar API en Render (`nexora-api`). [EN PROCESO]
  4. Desplegar Frontend en Vercel (`nexora-web`) apuntando a la API de Render.
  5. Validar flujo completo (Login -> Transacción -> Reporte).

## Avance Detallado - 05 de abril 2026: Suite de Reportes "Nexora Elite"
- **Impresión Profesional (80mm)**: 
  - Rediseño total de la tirilla de venta con estética de terminal POS moderna. 
  - Implementación de **Papel Dinámico**: El sistema inyecta estilos `@page` condicionales para alternar entre `80mm auto` (Tickets de Contado) y `A4` (Reportes de Crédito).
  - Optimización de cabecera con logotipos escalables y tabla de ítems de alta legibilidad.
- **Estabilización de Grillas de Reportes**:
  - Se fijó el encabezado y los filtros en la parte superior para evitar el scroll infinito de la página completa, permitiendo que solo la grilla de datos se desplace.
  - **Mapeo de Datos**: Se corrigió el enlace entre el API y el Frontend para los reportes de "Ventas Generales", asegurando la visualización de fechas y números de documento.
  - **Clasificación de Ventas**: Se añadió la columna **"Tipo"** con badges de colores (Verde para Contado / Azul para Crédito) para una identificación inmediata en los listados.
- **Flujos de Agilidad (Quick-Create)**:
  - Implementación de modales "Pop-Out" para la creación inmediata de **Clientes** (desde el POS) y **Proveedores** (desde Compras), evitando el abandono del flujo de transacción principal.
- **Hito de Producción**:
  - Consolidación de todos los cambios en la rama `main`.
  - **Git Push**: Sincronización exitosa con GitHub para activar los pipelines de despliegue en **Vercel** y **Render**.
  - Limpieza de entorno local deteniendo servidores de desarrollo para transición total a nube.

## Optimización Mobile-First y Estética Premium (Actualización 05 de abril 2026 - Sesión 2)
- **Shell & Navegación Dual**: 
  - Rediseño del `Shell.tsx` con breakpoints inteligentes; el Sidebar ahora es un Drawer lateral en todas las resoluciones menores a 1024px, incluyendo el iPhone en modo horizontal (Landscape).
  - Implementación de un Overlay táctil para cerrar menús con un solo toque.
- **Suite de Reportes Responsiva**:
  - Transformación del "Explorador de Reportes" en un **Drawer Dinámico**, liberando el 100% del ancho de pantalla para la visualización de datos.
  - **Grillas Inteligentes**: Se implementó la ocultación selectiva de columnas (Subtotal/IVA) en celulares para priorizar el **Total** y el **Cliente**.
  - **Scroll de Precisión**: Adición de contenedores con `min-width` para garantizar que los datos financieros nunca se encimen, habilitando un desplazamiento horizontal fluido.
- **Punto de Venta (POS) Táctil**:
  - **Sticky Action Bar**: Implementación de una barra inferior fija en móviles que contiene el Total y el botón de "Grabar Venta", optimizando la ergonomía para asesores en piso.
- **Detalles Premium (UI/UX)**:
  - **Custom Scrollbars**: Rediseño global de las barras de desplazamiento (Scrollbars) con estética minimalista, delgada (6px) y efectos de iluminación Índigo al pasar el mouse, eliminando la apariencia genérica del navegador.
