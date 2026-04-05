# NEXORA ERP - Documentación Técnica y Funcional

NEXORA es un sistema comercial y ERP ligero diseñado para ofrecer una experiencia rápida, moderna y robusta. Se especializa en la gestión transaccional (Ventas, Créditos, Compras e Inventarios) con una arquitectura limpia orientada a escalabilidad comercial para esquemas multi-sede.

---

## 1. Arquitectura de Software y Stack Tecnológico

El sistema respeta una separación estricta entre cliente (Frontend) y servidor (Backend), comunicándose vía API REST asegurada con tokens JWT.

### Backend (nexora-api)
- **Framework:** NestJS (Node.js)
- **ORM:** Prisma
- **Base de Datos:** PostgreSQL
- **Patrón Estructural:** Hexagonal / Capas (Controller -> Service -> DTOs).
  - **Controller:** Capa delegada exclusivamente a manejar rutas, peticiones HTTP, inyección de usuario (JWT/Claims) y responder.
  - **Service:** Capa central que encapsula toda la **Lógica de Negocio** y transacciones con base de datos (mediante Prisma).
  - **DTO:** Data Transfer Objects para validación de ingresos con `class-validator`.

### Frontend (nexora-web)
- **Framework:** React + Vite (TypeScript)
- **Estilos:** Tailwind CSS
- **Patrón Estructural:** 
  - `src/api`: Módulos de abstracción HTTP por recurso (Ej. `salesApi.ts`, `itemsApi.ts`).
  - `src/pages`: Componentes principales que actúan como contenedores de lógica visual y de estado.
  - `src/components`: Componentes reutilizables, layout centralizado (`Shell.tsx`).

---

## 2. Mapa Funcional de Módulos

Nexora divide sus operaciones comerciales en los siguientes pilares de negocio:

### 2.1. Gestión de Ventas (Point of Sale y Cartera)
Módulo pilar para el registro de ingresos económicos.
- **Tipos de Transacción:** Soporta ventas al Contado, Crédito Interno y Mixtas (distintos Payment Methods como efectivo, transferencia, etc.).
- **Ventas a Crédito:** Permite establecer una Fecha de Vencimiento (`dueDate`), generar pagos parciales/abonos (`SalePayment`), y visualizar saldos pendientes (`outstanding`) con estados automáticos (`PENDING`, `PARTIAL`, `PAID`).
- **Devoluciones:** Capacidad de procesar retornos de mercancía (`RETURN_SALE`) ajustando ingresos.
- **Comprobantes:** Impresión automática de Tirilla Térmica (Tickets de 80mm) con el formato comercial al concluir la transacción.

### 2.2. Gestión de Inventarios (Kardex y Abastecimiento)
Control algorítmico de existencias por sucursal (`BranchStock`) y trazabilidad histórica.
- **Kardex (Libro Mayor):** Un panel financiero que cruza Entradas (verdes) y Salidas (rojas). Los saldos calculan la existencia real sobre la sucursal seleccionada identificando al operario emisor y el número de documento referencia.
- **Compras (Abastecimiento):** El registro interno de compra de mercadería vinculada a un proveedor obligatorio. Genera un movimiento de inventario automático (`ADJUSTMENT_IN`) inflando el stock, y recalcula el precio de costo (`costPrice`) garantizando márgenes actualizados para reventa.
- **Traslados Multisede:** Envío formal de mercancía entre bodegas (`fromBranchId` a `toBranchId`) con validaciones de existencias suficientes y doble afectación al libro mayor.
- **Ajustes:** Ingresos y salidas estáticas (`ADJUSTMENT_IN / OUT`) auditables a través de un rol administrativo.

### 2.3. Gestión de Maestros Administrativos (Maintenance)
Toda la data núcleo que da vida al ERP.
- **Catálogo de Artículos:** Cada producto posee Categoría, Grupo, Marca, Propietario y Proveedor, con variables de Costo, Precio de Venta, Precio Base y Mayorista, e integrando control estricto de identificadores (SKU / Barcode).
- **Entidades Auxiliares:** Gestión dinámica de clientes, proveedores y tipos/métodos de pago (`PaymentMethod`).
- **Control Organizacional:** Creación de Compañías, Sucursales y Roles.

---

## 3. Lógica Transaccional (Flujos Críticos)

### Flujo de Creación de Venta (`SalesService.createSale`)
1. **Validación:** El frontend envía el carrito y la orden al POST `/sales`.
2. **Stock check:** Se consulta exhaustivamente el modelo `BranchStock` para verificar que la sucursal tenga existencias de cada ítem. Si no las tiene, la base de datos aborta y lanza un `BadRequestException`.
3. **Descuento de Stock:** Se reduce la cantidad en el `BranchStock` e inmediatamente se documenta la acción en `InventoryMovement` (`SALE`).
4. **Saldo y Pago:** El sistema toma los anticipos recibidos (`payments`) y si difieren del total de la factura, la clasifica formalmente como saldo ` outstanding` elevando el `paymentStatus` y esperando un `SalePayment` posterior que cierre la factura.

### Flujo de Creación de Compra (`PurchasesService.create`)
1. El usuario selecciona Sucursal y Proveedor (Estrictamente obligatorio).
2. Se procesa vía transacción Prisma (`$transaction`) garantizando integridad ACID.
3. Se sobrescribe el modelo central de `Item` adaptando el nuevo costo (`costPrice`) a raíz de la inflación o variación de precios del proveedor.
4. Ingresa la mercadería al `BranchStock` local y lo graba en Kardex `InventoryMovement` con referencia `COMPRA-XXXX`.

---

## 4. Convenciones de Diseño y Desarrollo

- **Zero "Hard-Deletes":** Se utiliza un flag estricto `isActive: Boolean` a lo largo de las tablas core (Items, Brands, Owners, Categories) para lograr borrados lógicos que no revienten el historial financiero atado a UUID / Llaves Foráneas.
- **Contexto Aislado JWT:** Los Requests incluyen bajo el token JWT en el Payload la identificación de Inquilino/Tenant (`companyId`), de modo que operaciones DML o SELECTS siempre filtren nativamente `where: { companyId }`.
- **Trazabilidad Forense:** Toda tabla operacional posee un `createdById` apuntando al identificador unívoco del usuario final para auditorías.
- **Restricción Prisma Schema:** Mantener el estado `schema.prisma` puro en ambientes Windows. En caso de error local intermitente ("EPERM lock Prisma"), reiniciar motor / IDE y ejecutar `npx prisma generate` de nuevo antes de forzar un `migrate`.
