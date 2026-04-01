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
