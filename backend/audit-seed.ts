/**
 * Audit seed: creates one known user per role for live testing.
 * Idempotent — run repeatedly, updates password hash and role on collision.
 *
 * Passwords are trivial-but-known; this DB is a dev container.
 */
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const USERS: { email: string; name: string; role: Role }[] = [
  { email: 'audit-admin@test.local',    name: 'Audit Admin',    role: 'ADMIN' },
  { email: 'audit-founder@test.local',  name: 'Audit Founder',  role: 'FOUNDER' },
  { email: 'audit-frontend@test.local', name: 'Audit Frontend', role: 'FRONTEND' },
  { email: 'audit-backend@test.local',  name: 'Audit Backend',  role: 'BACKEND' },
  { email: 'audit-devops@test.local',   name: 'Audit DevOps',   role: 'DEVOPS' },
  { email: 'audit-aiml@test.local',     name: 'Audit AIML',     role: 'AI_ML' },
];

const PW = 'auditpass1234';

async function main() {
  const hash = await bcrypt.hash(PW, 10);
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: hash, role: u.role, name: u.name },
      create: { email: u.email, name: u.name, role: u.role, passwordHash: hash },
    });
    console.log(`ok  ${u.role.padEnd(9)} ${u.email}`);
  }
  console.log(`\nAll users share password: ${PW}`);
}

main().finally(() => prisma.$disconnect());
