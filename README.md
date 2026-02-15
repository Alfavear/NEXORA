📦 NEXORA
Sistema de Inventarios Multi-Sede para Almacén de Muebles

Nexora es un sistema de gestión de inventarios diseñado inicialmente para un almacén de muebles en Ecuador, con arquitectura moderna, soporte multi-sede desde el inicio y preparado para evolucionar hacia un modelo SaaS escalable.

🚀 Estado Actual del Proyecto
Backend (NestJS + Prisma + PostgreSQL)

✅ Autenticación JWT
✅ Roles (ADMIN / VENDEDOR)
✅ Multi-sede (usuario puede pertenecer a varias sedes)
✅ Cambio de sede activa (switch-branch)
✅ Guards y protección por roles
✅ CRUD Categorías
✅ CRUD Artículos (dependen de Categoría)

Frontend (React + Vite + Tailwind)

✅ Login funcional
✅ Conexión a API
✅ Diseño base blanco + Indigo pastel
✅ Protección por sesión

🏗 Arquitectura
Capa	Tecnología
Backend	NestJS
ORM	Prisma
Base de datos	PostgreSQL
Auth	JWT + Bcrypt
Frontend	React + Vite
UI	TailwindCSS
🏢 Multi-Sede (Concepto Clave)

Una empresa puede tener múltiples sedes.

Un usuario puede pertenecer a múltiples sedes.

El JWT incluye branchId como sede activa.

Se puede cambiar de sede usando:

POST /auth/switch-branch


Esto permite en el futuro:

Vender en sede A

Despachar desde sede B

🔐 Roles
ADMIN

Gestiona maestros

Crea usuarios

Control total del sistema

VENDEDOR

Puede operar ventas

Puede crear clientes (pendiente implementación)

Solo lectura en maestros protegidos

📂 Estructura del Proyecto
NEXORA/
 ├── nexora-api/    (Backend NestJS)
 └── nexora-web/    (Frontend React)

⚙️ Backend Setup
1️⃣ Instalar dependencias
cd nexora-api
npm install

2️⃣ Variables de entorno (.env)
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/nexora_db?schema=public"
JWT_SECRET="supersecret"
JWT_EXPIRES_IN="8h"
PORT=3000

3️⃣ Prisma

Generar cliente:

npx prisma generate


Migrar:

npx prisma migrate dev


Seed:

npx prisma db seed

4️⃣ Ejecutar API
npm run start:dev


API:

http://localhost:3000

🔑 Autenticación
Login
POST /auth/login

Usuario actual
GET /auth/me

Cambiar sede activa
POST /auth/switch-branch

📚 Maestros Implementados
Categorías

GET /categories

POST /categories (ADMIN)

PATCH /categories/:id (ADMIN)

DELETE /categories/:id (ADMIN)

Artículos

GET /items

POST /items (ADMIN)

PATCH /items/:id (ADMIN)

DELETE /items/:id (ADMIN)

Los artículos dependen obligatoriamente de una categoría.

🎨 Frontend Setup
cd nexora-web
npm install
npm run dev


Web:

http://localhost:5173

🛠 Roadmap
Maestros

 Clientes (VENDEDOR puede crear)

 Proveedores

 Sedes CRUD completo

Inventario

 Stock por sede

 Cardex (movimientos)

 Ajustes por daño / pérdida

 Decoraciones

Ventas

 Venta multi-sede

 Medios de pago

 Reportes

🐞 Troubleshooting
CORS

Habilitar en main.ts:

app.enableCors({
  origin: ['http://localhost:5173'],
  credentials: true,
});

Puerto ocupado

Si aparece:

EADDRINUSE :::3000


Cerrar proceso Node activo.

Prisma EPERM en Windows

Detener servidor

Borrar node_modules/.prisma

Ejecutar npx prisma generate

📈 Visión

Nexora está diseñado para:

Ser ligero

Ser escalable

Ser multi-empresa

Poder convertirse en SaaS

Mantener arquitectura limpia y modular

👨‍💻 Autor

Proyecto desarrollado por Alfavear
