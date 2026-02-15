<div align="center">

# 📦 NEXORA

### Sistema de Inventarios Multi-Sede para Almacén de Muebles

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/status-In%20Development-orange?style=flat-square)

</div>

---

## 📖 Descripción

**Nexora** es un sistema de gestión de inventarios diseñado inicialmente para un almacén de muebles en Ecuador. Construido con arquitectura moderna y escalable, ofrece soporte multi-sede desde el inicio y está preparado para evolucionar hacia un modelo **SaaS**.

### ✨ Características Principales

- 🏢 **Multi-Sede**: Gestión de múltiples ubicaciones físicas
- 👥 **Control de Acceso**: Sistema de roles (ADMIN/VENDEDOR)
- 🔐 **Autenticación JWT**: Seguridad robusta
- 📊 **Inventario en Tiempo Real**: Control preciso de stock
- 🎯 **Arquitectura Modular**: Fácil de mantener y escalar

---

## 🚀 Estado Actual del Proyecto

### ✅ Backend (NestJS + Prisma + PostgreSQL)

- [x] Autenticación JWT completa
- [x] Sistema de roles (ADMIN / VENDEDOR)
- [x] Multi-sede (usuario puede pertenecer a varias sedes)
- [x] Cambio de sede activa (`switch-branch`)
- [x] Guards y protección por roles
- [x] CRUD Categorías
- [x] CRUD Artículos (con relación a categorías)
- [x] Validación de datos con `class-validator`

### ✅ Frontend (React + Vite + Tailwind)

- [x] Login funcional con validación
- [x] Conexión a API REST
- [x] Diseño responsive (blanco + indigo pastel)
- [x] Protección de rutas por autenticación
- [x] Estado global con Context API

---

## 🏗️ Arquitectura Técnica

```
┌─────────────────────────────────────────────┐
│           Frontend (React + Vite)           │
│  ┌─────────────────────────────────────┐   │
│  │  Components │ Pages │ Services      │   │
│  └─────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST
                   ▼
┌─────────────────────────────────────────────┐
│          Backend (NestJS + Prisma)          │
│  ┌─────────────────────────────────────┐   │
│  │  Controllers │ Services │ Guards    │   │
│  └─────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │ Prisma ORM
                   ▼
┌─────────────────────────────────────────────┐
│         PostgreSQL Database                 │
└─────────────────────────────────────────────┘
```

### 🛠️ Stack Tecnológico

| Capa            | Tecnología      | Descripción                    |
|-----------------|-----------------|--------------------------------|
| **Backend**     | NestJS          | Framework Node.js progresivo   |
| **ORM**         | Prisma          | ORM moderno para TypeScript    |
| **Base de Datos** | PostgreSQL    | Base de datos relacional       |
| **Autenticación** | JWT + Bcrypt  | Tokens seguros y hash          |
| **Frontend**    | React 18        | Biblioteca UI declarativa      |
| **Build Tool**  | Vite            | Bundler ultra-rápido           |
| **Estilos**     | TailwindCSS     | Framework CSS utility-first    |
| **Validación**  | class-validator | Decoradores para validación    |

---

## 🏢 Concepto Multi-Sede

Nexora implementa un sistema flexible de múltiples ubicaciones:

- ✅ Una **empresa** puede tener múltiples **sedes**
- ✅ Un **usuario** puede pertenecer a múltiples **sedes**
- ✅ El JWT incluye `branchId` como **sede activa**
- ✅ Cambio dinámico de sede sin re-autenticación

### 🔄 Cambio de Sede

```bash
POST /auth/switch-branch
Content-Type: application/json
Authorization: Bearer <token>

{
  "branchId": 2
}
```

**Casos de uso:**
- 🛒 Vender en Sede A
- 📦 Despachar desde Sede B
- 📊 Reportes consolidados multi-sede

---

## 🔐 Sistema de Roles

### 👨‍💼 ADMIN
- ✅ Gestión completa de maestros
- ✅ Creación de usuarios
- ✅ Control total del sistema
- ✅ Configuración de sedes

### 👤 VENDEDOR
- ✅ Registro de ventas
- ✅ Creación de clientes
- ✅ Consulta de inventario
- 🔒 Lectura limitada en maestros

---

## 📂 Estructura del Proyecto

```
NEXORA/
├── nexora-api/              # Backend NestJS
│   ├── src/
│   │   ├── auth/           # Autenticación JWT
│   │   ├── users/          # Gestión de usuarios
│   │   ├── categories/     # Categorías de productos
│   │   ├── items/          # Artículos/Productos
│   │   ├── branches/       # Sedes
│   │   └── prisma/         # Configuración Prisma
│   ├── prisma/
│   │   ├── schema.prisma   # Esquema de base de datos
│   │   └── seed.ts         # Datos de prueba
│   └── package.json
│
└── nexora-web/              # Frontend React
    ├── src/
    │   ├── components/     # Componentes reutilizables
    │   ├── pages/          # Páginas de la aplicación
    │   ├── services/       # Llamadas a API
    │   ├── context/        # Estado global
    │   └── utils/          # Utilidades
    └── package.json
```

---

## ⚙️ Instalación y Configuración

### 📋 Prerequisitos

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm o yarn

### 🔧 Backend Setup

#### 1️⃣ Instalar dependencias

```bash
cd nexora-api
npm install
```

#### 2️⃣ Configurar variables de entorno

Crear archivo `.env` en la raíz de `nexora-api`:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/nexora_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-key-change-this"
JWT_EXPIRES_IN="8h"

# Server
PORT=3000
NODE_ENV="development"
```

#### 3️⃣ Configurar base de datos

```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# (Opcional) Poblar con datos de prueba
npx prisma db seed
```

#### 4️⃣ Iniciar servidor

```bash
npm run start:dev
```

✅ API disponible en: `http://localhost:3000`

---

### 🎨 Frontend Setup

#### 1️⃣ Instalar dependencias

```bash
cd nexora-web
npm install
```

#### 2️⃣ Configurar variables de entorno

Crear archivo `.env` en la raíz de `nexora-web`:

```env
VITE_API_URL=http://localhost:3000
```

#### 3️⃣ Iniciar aplicación

```bash
npm run dev
```

✅ Web disponible en: `http://localhost:5173`

---

## 🔑 API Endpoints

### 🔐 Autenticación

| Método | Endpoint            | Descripción                  | Auth |
|--------|---------------------|------------------------------|------|
| POST   | `/auth/login`       | Iniciar sesión               | ❌   |
| GET    | `/auth/me`          | Obtener usuario actual       | ✅   |
| POST   | `/auth/switch-branch` | Cambiar sede activa        | ✅   |

### 📚 Categorías

| Método | Endpoint            | Descripción                  | Rol    |
|--------|---------------------|------------------------------|--------|
| GET    | `/categories`       | Listar categorías            | ALL    |
| GET    | `/categories/:id`   | Obtener categoría            | ALL    |
| POST   | `/categories`       | Crear categoría              | ADMIN  |
| PATCH  | `/categories/:id`   | Actualizar categoría         | ADMIN  |
| DELETE | `/categories/:id`   | Eliminar categoría (soft)    | ADMIN  |

### 📦 Artículos

| Método | Endpoint            | Descripción                  | Rol    |
|--------|---------------------|------------------------------|--------|
| GET    | `/items`            | Listar artículos             | ALL    |
| GET    | `/items/:id`        | Obtener artículo             | ALL    |
| POST   | `/items`            | Crear artículo               | ADMIN  |
| PATCH  | `/items/:id`        | Actualizar artículo          | ADMIN  |
| DELETE | `/items/:id`        | Eliminar artículo (soft)     | ADMIN  |

> **Nota:** Todos los artículos deben estar asociados a una categoría válida.

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 🛣️ Roadmap

### 📊 Fase 1: Maestros (En Progreso)
- [x] Categorías
- [x] Artículos
- [ ] Clientes (VENDEDOR puede crear)
- [ ] Proveedores
- [ ] Sedes CRUD completo

### 📦 Fase 2: Inventario
- [ ] Stock por sede
- [ ] Cardex (movimientos de inventario)
- [ ] Ajustes por daño / pérdida / robo
- [ ] Transferencias entre sedes
- [ ] Decoraciones y atributos personalizados

### 💰 Fase 3: Ventas
- [ ] Registro de ventas multi-sede
- [ ] Múltiples medios de pago
- [ ] Facturación electrónica (SRI Ecuador)
- [ ] Cotizaciones
- [ ] Reportes de ventas

### 📈 Fase 4: Reportes y Analytics
- [ ] Dashboard ejecutivo
- [ ] Reportes de inventario
- [ ] Análisis de ventas por sede
- [ ] Productos más vendidos
- [ ] Alertas de stock bajo

### 🌐 Fase 5: SaaS (Futuro)
- [ ] Multi-tenancy
- [ ] Planes de suscripción
- [ ] Billing automatizado
- [ ] Personalización por empresa

---

## 🐞 Troubleshooting

### ❌ Error CORS

Si aparece error de CORS en el frontend, verificar en `main.ts`:

```typescript
app.enableCors({
  origin: ['http://localhost:5173'],
  credentials: true,
});
```

### ❌ Puerto ocupado

Si aparece `EADDRINUSE :::3000`:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### ❌ Prisma EPERM (Windows)

Si hay error de permisos con Prisma:

1. Detener el servidor
2. Eliminar `node_modules/.prisma`
3. Ejecutar `npx prisma generate`
4. Reiniciar servidor

### ❌ Error de migraciones

```bash
# Resetear base de datos (⚠️ elimina datos)
npx prisma migrate reset

# Aplicar migraciones pendientes
npx prisma migrate deploy
```

---

## 📈 Visión del Proyecto

Nexora está diseñado con los siguientes principios:

- 🚀 **Ligero**: Sin dependencias innecesarias
- 📈 **Escalable**: Arquitectura preparada para crecer
- 🏢 **Multi-empresa**: Soporte nativo para múltiples clientes
- ☁️ **SaaS-Ready**: Estructura para modelo de suscripción
- 🧩 **Modular**: Componentes independientes y reutilizables
- 🔒 **Seguro**: Mejores prácticas de seguridad implementadas

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork del proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit de cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 👨‍💻 Autor

**Alfavear**

- 💼 Desarrollador Full Stack
- 🎯 Especializado en arquitecturas escalables
- 📧 Contacto: [tu-email@ejemplo.com]

---

## 🙏 Agradecimientos

- NestJS Team por el increíble framework
- Prisma Team por el ORM moderno
- React Team por la biblioteca UI
- La comunidad open source

---

<div align="center">

**⭐ Si te gusta el proyecto, dale una estrella en GitHub ⭐**

Hecho con ❤️ en Ecuador 🇪🇨

</div>
