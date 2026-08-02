// scripts/create-admin.ts
import { prisma } from "./src/lib/prisma";
import bcrypt from 'bcryptjs';

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        name: 'المدير',
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin created successfully!');
    console.log('Username:', admin.username);
    console.log('Password: admin123');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
