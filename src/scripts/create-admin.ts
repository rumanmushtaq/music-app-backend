import 'reflect-metadata';
import 'dotenv/config';
import { setDefaultAutoSelectFamilyAttemptTimeout } from 'node:net';

// Same fix as main.ts - a managed Postgres host resolves to several addresses and its TLS
// handshake takes seconds from a distant region, overrunning Node's 250ms default.
setDefaultAutoSelectFamilyAttemptTimeout(5000);

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { clerkClient } from '../auth/clerk-auth.guard';
import { UsersService } from '../users/users.service';
import type { UserRole } from '../users/user.entity';

function parseArgs(): { email: string; password: string; role: UserRole } {
  const args = new Map<string, string>();
  for (const arg of process.argv.slice(2)) {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    args.set(key, rest.join('='));
  }

  const email = args.get('email')?.trim().toLowerCase();
  const password = args.get('password');
  const role = args.get('role') ?? 'admin';

  if (!email || !password) {
    throw new Error('Usage: npm run create-admin -- --email=<email> --password=<password> [--role=admin|superAdmin]');
  }
  if (role !== 'admin' && role !== 'superAdmin') {
    throw new Error(`--role must be "admin" or "superAdmin", got "${role}"`);
  }

  return { email, password, role };
}

async function main() {
  const { email, password, role } = parseArgs();

  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const usersService = app.get(UsersService);

    const clerkUser = await clerkClient.users.createUser({ emailAddress: [email], password });
    await usersService.upsertByClerkId(clerkUser.id, email);
    const user = await usersService.setRole(clerkUser.id, role);

    console.log(`Created ${role} account:`);
    console.log(`  email:    ${email}`);
    console.log(`  password: ${password}`);
    console.log(`  clerkId:  ${clerkUser.id}`);
    console.log(`  role:     ${user.role}`);
    console.log('\nShare the email/password with them directly (not over a logged channel) - they log in via POST /auth/login.');
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
