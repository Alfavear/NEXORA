# 🔧 NEXORA - Documentación Técnica Completa

<div align="center">

## Arquitectura, Diseño y Especificaciones Técnicas

![TypeScript](https://img.shields.io/badge/TypeScript-95.5%25-blue?style=for-the-badge)
![Architecture](https://img.shields.io/badge/Architecture-Modular-brightgreen?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-PostgreSQL-316192?style=for-the-badge)

**Guía completa para desarrolladores y arquitectos**

</div>

---

## 📑 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Modelo de Datos](#modelo-de-datos)
5. [Módulos del Sistema](#módulos-del-sistema)
6. [API REST](#api-rest)
7. [Flujos Clave](#flujos-clave)
8. [Seguridad](#seguridad)
9. [Performance](#performance)
10. [Deployment](#deployment)

---

## 🎯 Visión General

**NEXORA** es un sistema de gestión de inventarios y ventas diseñado con una arquitectura modular y escalable. Soporta múltiples sedes de una empresa con control de roles, inventario centralizado y análisis en tiempo real.

### Objetivos Técnicos:
- ✅ Escalabilidad horizontal (agregar sedes fácilmente)
- ✅ Multi-tenancy por empresa (datos aislados)
- ✅ Alto rendimiento (< 200ms en queries críticas)
- ✅ Seguridad de datos (encriptación, auditoría)
- ✅ Disponibilidad 99.9% (sin dependencias críticas)

---

## 🏗️ Arquitectura del Sistema

### Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENTE (Frontend)                    │
│  React 19 + Vite + TailwindCSS + Axios                 │
│  ├─ Pages (Ventas, Inventario, Reportes)              │
│  ├─ Components (Reutilizables)                         │
│  ├─ Services (API Integration)                         │
│  └─ Context API (State Management)                     │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/REST JSON
                   ↓
┌─────────────────────────────────────────────────────────┐
│                 API GATEWAY (NestJS)                    │
│  ├─ Controllers (endpoints)                            │
│  ├─ Guards (autenticación/autorización)                │
│  ├─ Pipes (validación)                                 │
│  └─ Interceptors (manejo de respuestas)                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│              CAPA DE NEGOCIOS (Services)                │
│  ├─ AuthService (JWT, roles)                           │
│  ├─ SalesService (lógica de ventas)                    │
│  ├─ InventoryService (control de stock)               │
│  ├─ ReportsService (análisis de datos)                │
│  └─ [+20 Services más]                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│           CAPA DE PERSISTENCIA (Prisma ORM)            │
│  ├─ TypeORM equivalente                                │
│  ├─ Migrations                                         │
│  └─ Query optimization                                 │
└──────────────────┬──────────────────────────────────────┘
                   │ SQL
                   ↓
┌─────────────────────────────────────────────────────────┐
│            BASE DE DATOS (PostgreSQL)                   │
│  ├─ 20+ tablas normalizadas                            │
│  ├─ Índices optimizados                                │
│  ├─ Constraints (FK, UK, PK)                           │
│  └─ Triggers para auditoría                            │
└─────────────────────────────────────────────────────────┘
```

### Patrón de Diseño: Modular + MVC

Cada módulo de negocio sigue:
```
Module (auth)
├── auth.controller.ts     (HTTP endpoints)
├── auth.service.ts        (Lógica de negocio)
├── auth.module.ts         (Configuración/Inyección)
├── dto/
│   ├── login.dto.ts       (Input validation)
│   └── auth-response.dto.ts (Output)
├── guards/
│   ├── jwt.guard.ts       (Protección JWT)
│   └── roles.guard.ts     (Control de roles)
└── strategies/
    └── jwt.strategy.ts    (Passport JWT)
```

---

## 🛠️ Stack Tecnológico

### Backend
| Componente | Tecnología | Versión | Propósito |
|---|---|---|---|
| Framework | NestJS | 11.x | Framework Node.js progresivo |
| Runtime | Node.js | 18+ | Ejecución de código |
| Lenguaje | TypeScript | 5.9 | Tipado estático |
| ORM | Prisma | 6.19 | Acceso a datos |
| Base de Datos | PostgreSQL | 14+ | DBMS relacional |
| Autenticación | Passport.js | 0.7 | Estrategias de autenticación |
| JWT | @nestjs/jwt | 11.x | Tokens seguros |
| Encriptación | bcryptjs | 3.0 | Hash de contraseñas |
| Validación | class-validator | 0.14 | DTOs y validación |
| Testing | Jest | 30.x | Framework de testing |

### Frontend
| Componente | Tecnología | Versión | Propósito |
|---|---|---|---|
| Framework | React | 19.2 | UI declarativa |
| Build Tool | Vite | 7.3 | Bundler ultra-rápido |
| Lenguaje | TypeScript | 5.9 | Tipado estático |
| Estilos | TailwindCSS | 3.4 | CSS utility-first |
| HTTP Client | Axios | 1.13 | Requests HTTP |
| Routing | React Router | 7.13 | Navigation |
| Utilidades | date-fns | 4.1 | Manejo de fechas |
| Icons | lucide-react | 1.7 | Librería de iconos |
| Print | react-to-print | 3.3 | Funcionalidad de impresión |

### DevOps
| Componente | Tecnología | Propósito |
|---|---|---|
| VCS | Git + GitHub | Control de versiones |
| Deployment | Vercel | Hosting Frontend |
| Database | PostgreSQL Cloud | Hosting Backend |
| Environment | .env files | Configuración |

---

## 💾 Modelo de Datos

### Diagrama Entidad-Relación (Simplificado)

```
┌──────────────┐
│   Company    │ (Empresa)
│ id, name...  │
└──────┬───────┘
       │ 1:N
       ├─────────────┬──────────┬─────────────┐
       │             │          │             │
    ┌──▼──┐    ┌─────▼──┐  ┌──▼──┐      ┌──▼──┐
    │User │    │Branch  │  │Item │      │Sale │
    │ id  │    │ id     │  │ id  │      │ id  │
    └─────┘    └─┬──────┘  └─┬───┘      └──┬──┘
                 │          │             │
            ┌────▼─────┐    │        ┌────▼─────┐
            │UserBranch│    │        │SaleDetail│
            │FK:User   │    │        │FK:Item   │
            │ FK:Branch│    │        └──────────┘
            └──────────┘    │
                        ┌───▼────┐
                        │Category│
                        │ id     │
                        └────────┘
```

### Tablas Principales (20+)

#### 1. **Company** (Empresa)
```prisma
model Company {
  id        Int      @id @default(autoincrement())
  name      String   // Nombre de la empresa
  ruc       String?  // RUC/NIT
  address   String?  // Dirección
  phone     String?  // Teléfono
  createdAt DateTime @default(now())
  
  // Relaciones
  branches   Branch[]
  users      User[]
  items      Item[]
  sales      Sale[]
  customers  Customer[]
  // ... más relaciones
}
```

#### 2. **Branch** (Sede)
```prisma
model Branch {
  id        Int      @id @default(autoincrement())
  name      String   // Nombre de sede
  address   String?  // Dirección física
  phone     String?  // Teléfono
  logoUrl   String?  // Logo de la sede
  createdAt DateTime @default(now())
  
  company   Company @relation(fields: [companyId], references: [id])
  companyId Int     @unique
  
  // Relaciones
  userBranches  UserBranch[]
  stocks        BranchStock[]
  sales         Sale[]
  movements     InventoryMovement[]
}
```

#### 3. **User** (Usuarios)
```prisma
model User {
  id           Int      @id @default(autoincrement())
  name         String   // Nombre completo
  email        String   @unique
  username     String?  @unique
  passwordHash String   // Hash bcrypt de contraseña
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  
  company   Company @relation(fields: [companyId], references: [id])
  companyId Int
  
  role   Role @relation(fields: [roleId], references: [id])
  roleId Int
  
  // Relaciones
  userBranches UserBranch[]
  sales        Sale[]
}
```

#### 4. **Item** (Productos)
```prisma
model Item {
  id                Int      @id @default(autoincrement())
  name              String   // Nombre del producto
  sku               String?  // Stock Keeping Unit
  barcode           String?  // Código de barras
  type              ItemType // MUEBLE | INSUMO
  
  // Precios
  costPrice         Decimal? // Precio de costo
  basePrice         Decimal? // Precio base
  salePrice         Decimal? // Precio de venta
  wholesalePrice    Decimal? // Precio mayorista
  
  // Categorización
  categoryId        Int
  groupId           Int?
  brandId           Int?
  
  // Control
  trackStock        Boolean  @default(true)
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  
  company   Company @relation(fields: [companyId], references: [id])
  
  // Relaciones
  stocks    BranchStock[]
  saleDetails SaleDetail[]
  
  @@unique([companyId, sku])
  @@unique([companyId, barcode])
}
```

#### 5. **Sale** (Ventas)
```prisma
model Sale {
  id                    Int             @id @default(autoincrement())
  systemNumber          String          // Número único del sistema
  
  // Montos
  subtotal              Decimal         @db.Decimal(12, 2)
  discount              Decimal         @default(0)
  transport             Decimal         @default(0)
  tax                   Decimal         @default(0)
  total                 Decimal
  
  // Cliente y vendedor
  customerId            Int?
  sellerId              Int
  
  // Crédito
  isCredit              Boolean         @default(false)
  dueDate               DateTime?
  installments          Int             @default(1)
  interestRate          Decimal         @default(0)
  paidAmount            Decimal         @default(0)
  outstanding           Decimal         @default(0)
  
  // Estados
  paymentStatus         SalePaymentStatus // PAID | PARTIAL | PENDING
  status                SaleStatus        // COMPLETED | CANCELLED
  createdAt             DateTime          @default(now())
  
  // Relaciones
  details  SaleDetail[]
  payments SalePayment[]
  amortization SaleInstallment[]
  
  @@unique([companyId, systemNumber])
}
```

#### 6. **BranchStock** (Inventario por Sede)
```prisma
model BranchStock {
  id        Int     @id @default(autoincrement())
  branchId  Int
  itemId    Int
  quantity  Decimal @default(0) @db.Decimal(14, 2)
  updatedAt DateTime @updatedAt
  
  branch Branch @relation(fields: [branchId], references: [id])
  item   Item   @relation(fields: [itemId], references: [id])
  
  @@unique([branchId, itemId])
}
```

#### 7. **InventoryMovement** (Auditoría de Inventario)
```prisma
model InventoryMovement {
  id            Int                   @id @default(autoincrement())
  companyId     Int
  branchId      Int
  itemId        Int
  type          InventoryMovementType // SALE | ADJUSTMENT | RETURN
  quantity      Decimal               @db.Decimal(14, 2)
  balanceAfter  Decimal               @db.Decimal(14, 2)
  reference     String?               // Referencia (ID de venta, etc)
  notes         String?
  createdAt     DateTime              @default(now())
  
  @@index([companyId, createdAt])
  @@index([branchId, itemId, createdAt])
}
```

### Índices de Rendimiento

```sql
-- Tabla Sale
CREATE INDEX idx_sale_company_date ON sale(company_id, created_at DESC);
CREATE INDEX idx_sale_branch_date ON sale(branch_id, created_at DESC);
CREATE INDEX idx_sale_customer ON sale(customer_id);

-- Tabla Item
CREATE INDEX idx_item_category ON item(category_id);
CREATE INDEX idx_item_company_active ON item(company_id, is_active);

-- Tabla BranchStock
CREATE INDEX idx_stock_branch_item ON branch_stock(branch_id, item_id);

-- Tabla InventoryMovement
CREATE INDEX idx_movement_branch_item_date ON inventory_movement(branch_id, item_id, created_at DESC);
```

---

## 🧩 Módulos del Sistema

### 1. **Auth Module** 🔐
```
Responsabilidad: Autenticación y autorización
Componentes:
  • auth.controller.ts     → /auth endpoints
  • auth.service.ts        → JWT generation, password validation
  • jwt.guard.ts          → Protección de rutas
  • jwt.strategy.ts       → Passport strategy
  • auth.module.ts        → DI container

Endpoints:
  POST   /auth/login              → Login con email/password
  POST   /auth/register           → Crear usuario (Admin only)
  GET    /auth/me                 → Obtener usuario actual
  POST   /auth/switch-branch      → Cambiar sede activa
  POST   /auth/refresh-token      → Renovar JWT

DTOs:
  • LoginDto: { email, password }
  • CreateUserDto: { name, email, password, roleId, companyId }
  • SwitchBranchDto: { branchId }
```

### 2. **Users Module** 👥
```
Responsabilidad: Gestión de usuarios
Endpoints:
  GET    /users                   → Listar usuarios (Admin)
  GET    /users/:id              → Obtener usuario
  PATCH  /users/:id              → Actualizar usuario
  DELETE /users/:id              → Desactivar usuario
  PATCH  /users/:id/password     → Cambiar contraseña

Lógica:
  • Validar unicidad de email
  • Encriptar contraseña con bcryptjs
  • Auditoría de cambios
  • Soft delete (isActive = false)
```

### 3. **Branches Module** 🏪
```
Responsabilidad: Gestión de sedes
Endpoints:
  GET    /branches                → Listar sedes (por company)
  GET    /branches/:id           → Obtener sede
  POST   /branches               → Crear sede (Admin)
  PATCH  /branches/:id           → Actualizar sede
  DELETE /branches/:id           → Desactivar sede
  GET    /branches/:id/stock     → Stock de sede

Validaciones:
  • Una company puede tener múltiples branches
  • Usuarios pueden pertenecer a múltiples branches
  • Cambio de branch sin re-autenticación
```

### 4. **Items Module** 📦
```
Responsabilidad: Catálogo de productos
Endpoints:
  GET    /items                   → Listar (con filtros)
  GET    /items/:id              → Obtener detalle
  POST   /items                  → Crear (Admin)
  PATCH  /items/:id              → Actualizar
  DELETE /items/:id              → Soft delete
  GET    /items/search           → Búsqueda por nombre/SKU/barcode

Campos:
  • Identificadores: sku, barcode, name
  • Precios: costPrice, salePrice, wholesalePrice
  • Categorización: category, group, brand, owner
  • Control: trackStock, isActive, images

Validaciones:
  • SKU único por company
  • Barcode único por company
  • Precios no negativos
  • Al menos salePrice definido
```

### 5. **Sales Module** 💰
```
Responsabilidad: Registro y gestión de ventas
Endpoints:
  GET    /sales                   → Listar ventas
  GET    /sales/:id              → Obtener detalle
  POST   /sales                  → Crear venta (Critical Path)
  PATCH  /sales/:id              → Actualizar venta
  DELETE /sales/:id              → Cancelar venta
  GET    /sales/:id/print        → Generar PDF para imprimir
  POST   /sales/:id/return       → Crear devolución

Flujo de Creación de Venta:
  1. Validar items en stock
  2. Validar cliente (si existe)
  3. Calcular subtotal y descuentos
  4. Aplicar taxes
  5. Crear registro Sale
  6. Crear SaleDetail (líneas)
  7. Actualizar BranchStock
  8. Crear InventoryMovement
  9. Registrar pagos (SalePayment)
  10. Generar número de comprobante único

DTO de Entrada (CreateSaleDto):
  {
    customerId?: number,
    items: [{
      itemId: number,
      quantity: number,
      unitPrice: number,
      isGift?: boolean
    }],
    discount?: number,
    transport?: number,
    taxIds?: number[],
    payments: [{
      paymentMethodId: number,
      amount: number
    }],
    notes?: string,
    isCredit?: boolean,
    installments?: number,
    interestRate?: number
  }

Estados:
  • COMPLETED: Venta realizada
  • CANCELLED: Venta cancelada
  
Estados de Pago:
  • PAID: Totalmente pagada
  • PARTIAL: Pago parcial
  • PENDING: Pendiente de pago (crédito)
```

### 6. **Inventory Module** 📊
```
Responsabilidad: Control de stock y movimientos
Endpoints:
  GET    /inventory/stock         → Stock consolidado
  GET    /inventory/movements     → Movimientos (auditoría)
  POST   /inventory/adjustment    → Solicitar ajuste
  GET    /inventory/low-stock     → Alertas de bajo stock
  POST   /inventory/transfer      → Transferencia entre sedes

Tipos de Movimientos:
  • INITIAL: Carga inicial de stock
  • SALE: Venta registrada
  • RETURN_SALE: Devolución de venta
  • ADJUSTMENT_IN: Ajuste de entrada
  • ADJUSTMENT_OUT: Ajuste de salida

Cálculo de Stock:
  stock = sum(movements) where item_id = X and branch_id = Y

Validaciones:
  • No se puede vender más que el stock
  • Movimientos son inmutables (auditoría)
  • Cada movimiento registra quién, cuándo y por qué
```

### 7. **Reports Module** 📈
```
Responsabilidad: Análisis y reportes
Endpoints:
  GET    /reports/dashboard       → Dashboard del día
  GET    /reports/sales-summary   → Resumen de ventas
  GET    /reports/top-products    → Productos más vendidos
  GET    /reports/customers       → Análisis de clientes
  GET    /reports/inventory       → Estado de inventario
  GET    /reports/collections     → Cobranzas y cartera
  GET    /reports/branch-compare  → Comparativa entre sedes

Parámetros Comunes:
  ?startDate=2026-05-01
  ?endDate=2026-05-31
  ?branchId=2
  ?customerId=5
  ?format=json|csv|pdf

Queries Optimizadas:
  • Aggregation en DB (no en memoria)
  • Índices específicos para reportes
  • Caching de reportes frecuentes
```

### 8. **Customers Module** 👥
```
Responsabilidad: Gestión de clientes
Endpoints:
  GET    /customers               → Listar clientes
  POST   /customers               → Crear cliente (Vendedor)
  PATCH  /customers/:id           → Actualizar
  GET    /customers/:id/history   → Historial de compras
  GET    /customers/:id/debt      → Deuda pendiente

Campos:
  • name, document (RUC/DUI), phone, email, address
  • isActive (soft delete)
  • Relación con Company

Búsqueda:
  • Por nombre, teléfono, RUC
  • Filtro de activos/inactivos
```

### 9. **Suppliers Module** 📦
```
Responsabilidad: Gestión de proveedores
Endpoints:
  GET    /suppliers               → Listar proveedores
  POST   /suppliers               → Crear (Admin)
  PATCH  /suppliers/:id           → Actualizar
  GET    /suppliers/:id/history   → Historial de compras
```

### 10. **Payments Module** 💳
```
Responsabilidad: Métodos de pago y cobranzas
Endpoints:
  GET    /payment-methods         → Listar métodos
  POST   /payment-methods         → Crear método (Admin)
  GET    /payments/pending        → Pagos pendientes
  POST   /payments/record         → Registrar pago
  GET    /payments/collections    → Reporte de cobranzas
```

### 11. **Categories Module** 🏷️
```
Responsabilidad: Categorización de productos
CRUD básico con validación de unicidad por company
```

### 12. **Taxes Module** 🧮
```
Responsabilidad: Tasas impositivas
Endpoints: CRUD de tax rates por company
Aplicación: Automática en cálculos de venta
```

---

## 🔗 API REST

### Estructura de Respuestas

```typescript
// Respuesta exitosa
{
  "success": true,
  "data": { ... },
  "message": "Operación completada"
}

// Respuesta con error
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Email ya existe en el sistema",
  "details": {
    "email": ["Email debe ser único"]
  }
}

// Respuesta de listado
{
  "success": true,
  "data": [
    { ... },
    { ... }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Autenticación

```
Header: Authorization: Bearer <JWT_TOKEN>

JWT Payload:
{
  "sub": 123,                    // User ID
  "email": "vendedor@empresa.com",
  "name": "Juan Pérez",
  "roleId": 2,                   // VENDEDOR
  "companyId": 1,
  "branchId": 2,                 // Sede activa
  "branches": [1, 2, 3],         // Sedes accesibles
  "iat": 1715159688,
  "exp": 1715188488             // 8 horas
}
```

### Ejemplo: POST /sales

```bash
curl -X POST http://localhost:3000/sales \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 5,
    "items": [
      {
        "itemId": 12,
        "quantity": 2,
        "unitPrice": 1500.00
      },
      {
        "itemId": 25,
        "quantity": 1,
        "unitPrice": 800.00,
        "isGift": false
      }
    ],
    "discount": 100.00,
    "taxIds": [1],
    "payments": [
      {
        "paymentMethodId": 1,
        "amount": 3200.00
      }
    ],
    "notes": "Entrega a domicilio"
  }'
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "id": 456,
    "systemNumber": "2026-05-08-00001",
    "subtotal": 3300.00,
    "discount": 100.00,
    "tax": 330.00,
    "total": 3530.00,
    "paymentStatus": "PAID",
    "status": "COMPLETED",
    "createdAt": "2026-05-08T16:30:00Z"
  }
}
```

---

## 🔄 Flujos Clave

### Flujo de Registro de Venta (Critical Path)

```
┌─────────────────────────────────────────────────┐
│ 1. Cliente selecciona productos en tienda       │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ 2. Vendedor busca producto en sistema           │
│    GET /items?search=silla                      │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ 3. Valida stock disponible en sede actual       │
│    SELECT quantity FROM branch_stock            │
│    WHERE item_id = 12 AND branch_id = 2        │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ 4. Agrega producto al carrito (frontend)        │
│    State: items = [{id: 12, qty: 2, ...}]      │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ 5. Verifica cliente (nuevo o existente)         │
│    GET /customers?search=Pérez                 │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ 6. Aplica descuentos, taxes, formas de pago    │
│    Frontend calcula totales                     │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ 7. Envía venta al servidor                      │
│    POST /sales { items, customer, payments }   │
└────────────┬────────────────────────────────────┘
             │
             ↓ (TRANSACCIÓN BD INICIA)
┌─────────────────────────────────────────────────┐
│ 8. Validación de datos (DTO pipes)              │
│    • Items válidos                              │
│    • Cantidades > 0                             │
│    • Precios > 0                                │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ 9. Guards: Validar JWT y permisos               │
│    • Usuario autenticado                        │
│    • Usuario puede acceder a rama               │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ 10. Service: Crear venta                        │
│     saleSvc.create(saleData)                   │
└────────────┬────────────────────────────────────┘
             │
             ├─→ Crear registro Sale
             ├─→ Crear SaleDetails (líneas)
             ├─→ Actualizar BranchStock (restar)
             ├─→ Crear InventoryMovement (auditoría)
             ├─→ Registrar SalePayments
             └─→ Si es crédito: crear SaleInstallments
             │
             ↓
┌─────────────────────────────────────────────────┐
│ 11. Generar número único systemNumber           │
│     Format: YYYY-MM-DD-NNNNN                    │
└────────────┬────────────────────────────────────┘
             │
             ↓ (TRANSACCIÓN BD TERMINA - COMMIT)
┌─────────────────────────────────────────────────┐
│ 12. Responder al cliente                        │
│     { success: true, data: { id, total, ... }} │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ 13. Frontend recibe respuesta                   │
│     Imprime recibo/factura                      │
│     Actualiza estado global                     │
│     Limpia carrito                              │
└──────────────────────────────────────────────────┘
```

### Flujo de Cambio de Sede

```
Usuario: vendedor@empresa.com
Puede acceder a: [Sede 1, Sede 2, Sede 3]

┌─ ESTADO 1: Sede Inicial = Sede 1
│ JWT.branchId = 1
│ Cuando vende: sale.branchId = 1
│ Ve inventario: de Sede 1
│
├─ ACCIÓN: Usuario solicita cambio a Sede 2
│ POST /auth/switch-branch { branchId: 2 }
│
├─ VALIDACIÓN:
│ • Sede existe
│ • Usuario tiene acceso a Sede 2
│ • Sede está activa
│
├─ NUEVO JWT GENERADO:
│ JWT.branchId = 2
│ JWT.exp = now + 8h
│
└─ ESTADO 2: Sede Activa = Sede 2
  JWT.branchId = 2
  Cuando vende: sale.branchId = 2
  Ve inventario: de Sede 2
```

---

## 🔒 Seguridad

### Autenticación (JWT)

```typescript
// login.dto.ts
{
  email: string;      // Validado como email válido
  password: string;   // Min 6 caracteres
}

// Almacenamiento:
// passwordHash = bcrypt(password, salt=10)
// NO se almacena contraseña en texto plano

// JWT Generation:
payload = {
  sub: user.id,
  email: user.email,
  roleId: user.roleId,
  branchId: userBranch.branchId,
  branches: user.userBranches.map(ub => ub.branchId)
}

token = jwt.sign(payload, SECRET, {
  expiresIn: '8h',
  issuer: 'NEXORA',
  audience: 'nexora-web'
})
```

### Autorización (Roles & Guards)

```typescript
// JwtGuard: Valida que JWT sea válido
@UseGuards(JwtGuard)
async getProfile(@Request() req) { ... }

// RolesGuard: Valida que usuario tenga rol
@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
async createUser() { ... }

// BranchGuard: Valida que usuario pueda acceder a branch
@UseGuards(JwtGuard, BranchGuard)
async getSalesByBranch(@Param('branchId') branchId) { ... }
```

### Validación de DTOs

```typescript
// class-validator en acción
export class CreateSaleDto {
  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];  // Validación recursiva

  @IsOptional()
  @IsDecimal()
  @Min(0)
  discount?: number;

  @IsArray()
  @ArrayMinSize(1)
  payments: SalePaymentDto[];
}

// Validación automática antes de llegar al controller
// Si falla → retorna 400 con errores detallados
```

### Encriptación de Contraseñas

```typescript
// Crear usuario
const salt = await bcrypt.genSalt(10);  // 10 rounds
const hash = await bcrypt.hash(password, salt);
// Guardar hash en BD

// Login
const isValid = await bcrypt.compare(password, user.passwordHash);
// No se puede revertir el hash → seguro
```

### CORS y Headers

```typescript
// main.ts
app.enableCors({
  origin: [
    'http://localhost:5173',
    'https://nexora-web.vercel.app',
    /.*\.vercel\.app$/  // Cualquier dominio Vercel
  ],
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type, Accept, Authorization'
});
```

### Rate Limiting (Recomendado)

```typescript
// throttler.guard.ts
@UseGuards(ThrottlerGuard)
@Throttle(5, 60)  // 5 requests por minuto
@Post('auth/login')
async login(@Body() dto: LoginDto) { ... }
```

### SQL Injection Protection

Prisma protege automáticamente:
```typescript
// Seguro: Prisma parametriza
const user = await prisma.user.findUnique({
  where: { email: userInput }  // Parametrizado
});

// Nunca hacer queries con concatenación
// ❌ NUNCA: `SELECT * FROM users WHERE email = '${userInput}'`
```

---

## ⚡ Performance

### Query Optimization

```typescript
// ❌ N+1 Query Problem
const sales = await prisma.sale.findMany();
for (const sale of sales) {
  sale.customer = await prisma.customer.findUnique({
    where: { id: sale.customerId }
  }); // 1 + N queries
}

// ✅ Solución: Include
const sales = await prisma.sale.findMany({
  include: {
    customer: true,
    details: {
      include: { item: true }
    }
  }
});  // 1 query eficiente
```

### Índices Críticos

```sql
-- Sale reporting queries
CREATE INDEX idx_sale_company_date ON sale(company_id, created_at DESC);
CREATE INDEX idx_sale_branch_date ON sale(branch_id, created_at DESC);

-- Inventory tracking
CREATE INDEX idx_stock_branch_item ON branch_stock(branch_id, item_id);

-- Movement audit
CREATE INDEX idx_movement_date ON inventory_movement(created_at DESC);

-- Análisis de productos
CREATE INDEX idx_item_category ON item(category_id) WHERE is_active = true;
```

### Caching Estrategia

```typescript
// Redis (Recomendado)
@Injectable()
export class CacheService {
  // Cache de productos (TTL: 1 hora)
  @Cacheable({
    key: 'items_{{companyId}}',
    ttl: 3600
  })
  async getItems(companyId: number) { ... }

  // Cache de reportes (TTL: 5 minutos)
  @Cacheable({
    key: 'dashboard_{{branchId}}_{{date}}',
    ttl: 300
  })
  async getDashboard(branchId: number, date: string) { ... }
}
```

### Benchmarks Objetivo

| Operación | Target | Status |
|---|---|---|
| Login | < 200ms | ✅ |
| Crear venta | < 300ms | ✅ |
| Listar productos | < 100ms | ✅ |
| Dashboard reportes | < 500ms | ✅ |
| Búsqueda de items | < 150ms | ✅ |

---

## 🚀 Deployment

### Producción (Vercel + Railway/Render)

```yaml
Frontend (Vercel):
  - Repositorio: GitHub
  - Build: npm run build
  - Output: dist/
  - Environment: VITE_API_URL=https://api.nexora.com

Backend (Railway/Render):
  - Repositorio: GitHub
  - Build: npm install && npm run build
  - Start: npm run start:prod
  - Environment:
    DATABASE_URL=postgresql://...
    JWT_SECRET=<SECRET_KEY>
    NODE_ENV=production
    PORT=10000

PostgreSQL:
  - Managed Database en Railway/Render
  - Backups automáticos
  - Replicas para HA
```

### Variables de Entorno

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:5432/nexora_db?schema=public
JWT_SECRET=<long-random-string-at-least-32-chars>
JWT_EXPIRES_IN=8h
PORT=10000
NODE_ENV=production
ALLOWED_ORIGINS=https://nexora-web.vercel.app

# Frontend (.env)
VITE_API_URL=https://api.nexora.com
VITE_APP_NAME=NEXORA
```

### CI/CD Pipeline

```yaml
# GitHub Actions
name: Deploy NEXORA

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run test:e2e

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          # Railway deployment script
          railway deploy

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          # Vercel deployment
          vercel deploy --prod
```

---

## 📚 Referencias y Recursos

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma ORM](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [JWT.io](https://jwt.io)
- [OWASP Security](https://owasp.org)
- [Nest Best Practices](https://docs.nestjs.com/techniques/database)

---

<div align="center">

## 🔧 NEXORA - Documentación Técnica

**Mantenida y actualizada regularmente**

Última actualización: Mayo 2026 | Status: ✅ Producción

</div>
