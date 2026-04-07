import { sendVerificationEmail, sendPasswordResetEmail } from '../src/backend/lib/email.js';
import { prisma } from '../src/backend/lib/prisma.js';
import { env } from '../src/backend/config/env.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

async function main() {
  const email = 'NoticedXAaryan@gmail.com';

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('User already exists, updating token...');
    const vToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: existing.id },
      data: { emailVerified: false, emailVerificationToken: vToken },
    });
    console.log('Sending verification email...');
    const vOk = await sendVerificationEmail(email, existing.name, vToken);
    console.log('Verification email sent:', vOk);
  } else {
    console.log('Creating fresh user and emailing...');
    const passwordHash = await bcrypt.hash('Test1234', 12);
    const vToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.create({
      data: {
        email,
        name: 'Aaryan',
        passwordHash,
        emailVerified: false,
        emailVerificationToken: vToken,
      },
    });
    console.log('Sending verification email...');
    const vOk = await sendVerificationEmail(email, 'Aaryan', vToken);
    console.log('Verification email sent:', vOk);
  }

  // Send a reset email
  console.log('Sending password reset email...');
  const rToken = crypto.randomBytes(32).toString('hex');
  const rOk = await sendPasswordResetEmail(email, rToken);
  console.log('Reset email sent:', rOk);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
