import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migración de nombres de usuario...');
  
  const users = await prisma.user.findMany({
    where: { username: null }
  });

  console.log(`🔍 Encontrados ${users.length} usuarios sin username.`);

  for (const user of users) {
    const generatedUsername = user.email.split('@')[0].toLowerCase();
    
    await prisma.user.update({
      where: { id: user.id },
      data: { username: generatedUsername }
    });
    
    console.log(`✅ Usuario ${user.email} actualizado -> username: ${generatedUsername}`);
  }

  console.log('✨ Migración completada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
