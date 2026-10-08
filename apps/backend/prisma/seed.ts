import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.save.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.tactic.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Creating users...');

  // The two accounts the app is used with locally. No tactics: those are made
  // in the studio, so the library starts empty.
  await prisma.user.create({
    data: { username: 'analyst', email: 'analyst@offsidestrat.com' },
  });

  await prisma.user.create({
    data: { username: 'coach_k', email: 'coach@offsidestrat.com' },
  });

  console.log('\nSeeding complete! Created:');
  console.log(`  2 users (analyst, coach_k)`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
