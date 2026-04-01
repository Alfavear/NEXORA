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

pendientes 

Estoy trabajando en el proyecto **NEXORA** dentro de este mismo workspace/repo de GitHub: **Alfavear/NEXORA**. Necesito que tomes este mensaje como contexto base completo y continúes desde aquí sin volver a empezar desde cero.

## Contexto general del producto

NEXORA es un sistema comercial / ERP ligero orientado a:

* ventas
* devoluciones
* crédito y cartera
* inventario
* kardex
* multi-sede
* maestros de artículos y catálogos administrativos

El objetivo es mantener una arquitectura limpia, un patrón consistente entre backend y frontend, y una UI/UX profesional pero práctica.

## Repositorio y ramas

El repo principal es:

* **Alfavear/NEXORA**

Se ha trabajado con varias ramas históricas, pero la rama importante actual para seguir trabajando es:

* **feature-finance-foundation**
  Esta rama fue creada desde `main` para continuar sin ensuciar otras ramas.

Asume que:

* `main` ya tiene integrados muchos avances previos
* la nueva rama `feature-finance-foundation` es donde deben caer los próximos cambios

## Stack tecnológico actual

### Backend

* NestJS
* Prisma
* PostgreSQL
* JWT auth
* módulos con patrón:

  * `controller`
  * `service`
  * `dto`

### Frontend

* React + Vite
* Tailwind
* APIs separadas por recurso
* páginas por módulo
* layout general con `Shell.tsx`

## Patrón de diseño y arquitectura que se debe respetar

Quiero mantener el patrón actual de Nexora tanto en backend como en frontend:

### Backend

* lógica de negocio en `service`
* `controller` delgado
* DTOs para validación
* Prisma centralizado
* módulos separados por dominio
* no mezclar lógica de infraestructura con negocio
* mantener estilo existente en `sales`, `inventory`, `items`, etc.

### Frontend

* mantener estructura actual de páginas
* usar las APIs por recurso (`src/api/...`)
* mantener el layout y el diseño base de Nexora
* mejorar UX/UI sin romper identidad visual
* no meter librerías raras ni rehacer todo desde cero
* enfoque profesional, limpio, usable y comercial

## Lo que ya existe en el sistema

### Funcionalidad principal ya implementada

* login
* multi-sede
* cambio de sede
* ventas
* devoluciones
* reportes
* dashboard
* kardex
* módulos de maestros

### Ventas

Ya existe soporte para:

* ventas normales
* devoluciones
* ventas a crédito
* pagos parciales
* saldo pendiente
* impresión de factura / visualización de venta
* cartera / créditos
* pagos sobre ventas

### Inventario

Ya existe soporte para:

* kardex
* stock por sede
* ajustes
* transferencias
* movimientos de inventario

### Maestros

Ya existen o se empezaron a implementar:

* items
* categorías
* proveedores
* clientes
* grupos
* marcas
* propietarios
* sucursales
* roles

## Bitácora funcional importante

Existe un archivo de bitácora en el repo:

* `BITACORA.md`

El archivo resume avances clave como:

* módulo mantenimiento
* extensiones del maestro de artículos
* nuevos endpoints
* soporte para crédito, pagos, cartera y reportes
* problemas previos de Prisma en Windows
* próximos pasos sugeridos

Quiero que uses esa bitácora como referencia viva del proyecto.

## Análisis del sistema anterior

También se analizó una base de datos del software anterior. De ese análisis salieron conclusiones importantes:

### El sistema viejo tenía fuerte presencia en:

* ventas y detalle de ventas
* cartera y cobranzas
* abonos
* letras
* kardex
* costo de venta
* bancos
* cheques
* caja chica
* tipos de pago
* multi-sede
* maestros de artículos mucho más completos

### Hallazgos clave

1. Nexora ya supera al sistema viejo en arquitectura.
2. El sistema viejo todavía era más fuerte en:

   * finanzas
   * cartera avanzada
   * costo/ utilidad
3. No queremos copiar todo el sistema viejo, sino rescatar:

   * las estructuras que agregan valor
   * la lógica de negocio real que el cliente sí usa

## Roadmap acordado

Decidimos trabajar en este orden:

### Fase 1 — Fundación financiera

Prioridad inmediata:

* tipos de pago
* pagos más claros por venta
* ventas mixtas y crédito sin romper flujo actual

### Fase 2 — Costo y utilidad

Después:

* costo por producto
* utilidad por venta
* margen
* reportes con costo real

### Fase 3 — Cartera avanzada

Después:

* vencimientos
* estados más finos
* reporte de cartera más sólido

## Primer objetivo actual

Estamos arrancando en la rama `feature-finance-foundation`.

El objetivo inmediato es construir la **fundación financiera** respetando el patrón actual.

### Diseño propuesto para esta fase

#### Backend

Nueva entidad:

* `PaymentMethod`

Ejemplo conceptual:

* efectivo
* transferencia
* tarjeta
* cheque
* crédito interno

Relación esperada:

* `SalePayment` debe referenciar `PaymentMethod`

Reglas deseadas:

* si suma de pagos == total → venta pagada
* si suma de pagos < total y > 0 → parcial
* si suma de pagos == 0 → crédito
* permitir múltiples pagos por venta

#### Frontend

En ventas:

* permitir seleccionar / cargar pagos por método
* sin romper el flujo actual del POS
* UX clara y profesional

## Lo que espero de este nuevo chat

Quiero que continúes como si ya conocieras todo este contexto.

Necesito que:

1. revises el patrón actual del repo antes de proponer cambios
2. mantengas consistencia entre backend y frontend
3. propongas primero diseño técnico breve
4. luego ejecutes cambios paso a paso sobre `feature-finance-foundation`
5. priorices estabilidad y coherencia del producto por encima de meter features rápidas

## Regla importante

No quiero que rehagas Nexora desde cero ni que cambies el estilo arquitectónico.

Quiero evolución consistente del sistema existente.

## Tu siguiente tarea al leer este contexto

Empieza por:

1. revisar cómo están actualmente `sales`, `inventory`, `items` y la bitácora
2. proponer la implementación concreta de la Fase 1 (fundación financiera)
3. mantener el diseño visual y patrón actual
4. trabajar sobre `feature-finance-foundation`

Si detectas algo importante que pueda romper compatibilidad con `main`, dilo antes de implementar.
