import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed NEXORA...');

  const hashedPassword = await bcrypt.hash('Admin123*', 10);

  // 1️⃣ Empresa
  const company = await prisma.company.create({
    data: {
      name: 'Nexora Demo Company',
      ruc: '0000000000',
      address: 'Ecuador',
      phone: '0999999999',
    },
  });

  // 2️⃣ Sucursal
  const branch = await prisma.branch.create({
    data: {
      name: 'Sucursal Principal',
      address: 'Matriz',
      phone: '0999999999',
      companyId: company.id,
    },
  });

  // 3️⃣ Roles
  const adminRole = await prisma.role.create({
    data: { name: 'ADMIN' },
  });

  await prisma.role.create({
    data: { name: 'VENDEDOR' },
  });

  await prisma.role.create({
    data: { name: 'CAJERO' },
  });

  // 4️⃣ Usuario administrador
  await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@nexora.com',
      passwordHash: hashedPassword,
      companyId: company.id,
      branchId: branch.id,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Seed completado correctamente');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
