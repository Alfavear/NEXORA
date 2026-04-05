import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed NEXORA (multi-sede)...');

  const adminPasswordHash = await bcrypt.hash('Admin123*', 10);
  const vendedorPasswordHash = await bcrypt.hash('Vendedor123*', 10);

  // 1️⃣ Empresa
  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Nexora Demo Company',
      ruc: '0000000000',
      address: 'Ecuador',
      phone: '0999999999',
    },
  });

  // 2️⃣ Sedes (2 sedes para probar rotación)
  const branch1 = await prisma.branch.upsert({
    where: { id: 1 },
    update: {
      companyId: company.id,
      name: 'Sucursal Principal',
      address: 'Matriz',
      phone: '0999999999',
    },
    create: {
      companyId: company.id,
      name: 'Sucursal Principal',
      address: 'Matriz',
      phone: '0999999999',
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { id: 2 },
    update: {
      companyId: company.id,
      name: 'Sucursal Norte',
      address: 'Norte',
      phone: '0888888888',
    },
    create: {
      companyId: company.id,
      name: 'Sucursal Norte',
      address: 'Norte',
      phone: '0888888888',
    },
  });

  // 3️⃣ Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const vendedorRole = await prisma.role.upsert({
    where: { name: 'VENDEDOR' },
    update: {},
    create: { name: 'VENDEDOR' },
  });

  // 4️⃣ Usuarios (sin branchId)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexora.com' },
    update: {
      name: 'Administrador',
      passwordHash: adminPasswordHash,
      isActive: true,
      companyId: company.id,
      roleId: adminRole.id,
    },
    create: {
      name: 'Administrador',
      email: 'admin@nexora.com',
      passwordHash: adminPasswordHash,
      isActive: true,
      companyId: company.id,
      roleId: adminRole.id,
    },
  });

  const vendedor = await prisma.user.upsert({
    where: { email: 'vendedor@nexora.com' },
    update: {
      name: 'Vendedor Demo',
      passwordHash: vendedorPasswordHash,
      isActive: true,
      companyId: company.id,
      roleId: vendedorRole.id,
    },
    create: {
      name: 'Vendedor Demo',
      email: 'vendedor@nexora.com',
      passwordHash: vendedorPasswordHash,
      isActive: true,
      companyId: company.id,
      roleId: vendedorRole.id,
    },
  });

  // 5️⃣ Asignación de sedes (UserBranch)
  const pairs = [
    { userId: admin.id, branchId: branch1.id },
    { userId: admin.id, branchId: branch2.id },
    { userId: vendedor.id, branchId: branch1.id },
    { userId: vendedor.id, branchId: branch2.id },
  ];

  for (const p of pairs) {
    await prisma.userBranch.upsert({
      where: { userId_branchId: { userId: p.userId, branchId: p.branchId } },
      update: { isActive: true },
      create: { userId: p.userId, branchId: p.branchId, isActive: true },
    });
  }

  // 6️⃣ Métodos de pago
  const paymentMethods = [
    'Efectivo',
    'Cheque',
    'Depósito Transferencia',
    'Tarjeta Crédito o Débito',
    'Otros Cobros',
    'Nota de Crédito',
    'Letra de Cambio',
  ];

  for (const pm of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { companyId_name: { companyId: company.id, name: pm } },
      update: {},
      create: { name: pm, companyId: company.id },
    });
  }

  console.log('✅ Seed completado correctamente');
  console.log('ADMIN: admin@nexora.com / Admin123*');
  console.log('VENDEDOR: vendedor@nexora.com / Vendedor123*');
  console.log('Sedes: 1 (Principal), 2 (Norte)');

}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
