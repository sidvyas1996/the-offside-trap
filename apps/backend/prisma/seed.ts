import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.save.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.tactic.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Creating users...');

  // Create demo users (password is 'Password123')
  const hashedPassword = await bcrypt.hash('Password123', 12);

  const demoUser = await prisma.user.create({
    data: {
      username: 'demo',
      email: 'demo@example.com',
      password: hashedPassword,
    },
  });

  const coachUser = await prisma.user.create({
    data: {
      username: 'coach',
      email: 'coach@example.com',
      password: hashedPassword,
    },
  });

  console.log('Creating tactics...');

  // Create tactics
  const tikiTakaTactic = await prisma.tactic.create({
    data: {
      title: 'Tiki-Taka 4-3-3',
      formation: '4-3-3',
      tags: ['Possession', 'Tiki-Taka', 'Professional'],
      description:
        'Classic Barcelona-style possession tactic focusing on short passing and movement.',
      players: [
        { id: 1, x: 50, y: 90, number: 1 },
        { id: 2, x: 20, y: 70, number: 2 },
        { id: 3, x: 40, y: 70, number: 5 },
        { id: 4, x: 60, y: 70, number: 6 },
        { id: 5, x: 80, y: 70, number: 3 },
        { id: 6, x: 35, y: 50, number: 4 },
        { id: 7, x: 50, y: 50, number: 8 },
        { id: 8, x: 65, y: 50, number: 6 },
        { id: 9, x: 20, y: 30, number: 7 },
        { id: 10, x: 80, y: 30, number: 11 },
        { id: 11, x: 50, y: 20, number: 9 },
      ],
      authorId: demoUser.id,
    },
  });

  const gegenPressingTactic = await prisma.tactic.create({
    data: {
      title: 'Gegenpressing 4-2-3-1',
      formation: '4-2-3-1',
      tags: ['Pressing', 'Counter', 'High-Intensity'],
      description:
        "High-intensity pressing tactic inspired by Klopp's Liverpool and Dortmund teams.",
      players: [
        { id: 1, x: 50, y: 90, number: 1 },
        { id: 2, x: 20, y: 70, number: 2 },
        { id: 3, x: 40, y: 70, number: 5 },
        { id: 4, x: 60, y: 70, number: 6 },
        { id: 5, x: 80, y: 70, number: 3 },
        { id: 6, x: 35, y: 50, number: 4 },
        { id: 7, x: 65, y: 50, number: 8 },
        { id: 8, x: 20, y: 30, number: 7 },
        { id: 9, x: 50, y: 35, number: 10 },
        { id: 10, x: 80, y: 30, number: 11 },
        { id: 11, x: 50, y: 15, number: 9 },
      ],
      authorId: coachUser.id,
    },
  });

  console.log('Creating interactions...');

  // Create likes
  await prisma.like.create({
    data: {
      userId: coachUser.id,
      tacticId: tikiTakaTactic.id,
    },
  });

  await prisma.like.create({
    data: {
      userId: demoUser.id,
      tacticId: gegenPressingTactic.id,
    },
  });

  // Create comments
  await prisma.comment.create({
    data: {
      content: 'Great tactic, works well against defensive teams!',
      userId: coachUser.id,
      tacticId: tikiTakaTactic.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'I found the pressing too intense for full 90 minutes, better used in bursts.',
      userId: demoUser.id,
      tacticId: gegenPressingTactic.id,
    },
  });

  // Create saves
  await prisma.save.create({
    data: {
      userId: coachUser.id,
      tacticId: tikiTakaTactic.id,
    },
  });

  await prisma.save.create({
    data: {
      userId: demoUser.id,
      tacticId: gegenPressingTactic.id,
    },
  });

  console.log('Creating additional tactics for variety...');

  // Add more tactics for a better demo
  await prisma.tactic.create({
    data: {
      title: 'Catenaccio 5-3-2',
      formation: '5-3-2',
      tags: ['Defensive', 'Counter', 'Italian'],
      description: 'Traditional Italian defensive system with quick counter-attacks.',
      players: [
        { id: 1, x: 50, y: 90, number: 1 },
        { id: 2, x: 15, y: 70, number: 2 },
        { id: 3, x: 35, y: 70, number: 5 },
        { id: 4, x: 50, y: 70, number: 6 },
        { id: 5, x: 65, y: 70, number: 3 },
        { id: 6, x: 85, y: 70, number: 7 },
        { id: 7, x: 30, y: 50, number: 4 },
        { id: 8, x: 50, y: 50, number: 8 },
        { id: 9, x: 70, y: 50, number: 10 },
        { id: 10, x: 35, y: 25, number: 9 },
        { id: 11, x: 65, y: 25, number: 11 },
      ],
      authorId: coachUser.id,
    },
  });

  await prisma.tactic.create({
    data: {
      title: 'High Pressing 4-3-3',
      formation: '4-3-3',
      tags: ['Pressing', 'Attacking', 'Possession'],
      description: 'High pressing system with quick transitions and attacking fullbacks.',
      players: [
        { id: 1, x: 50, y: 90, number: 1 },
        { id: 2, x: 20, y: 70, number: 2 },
        { id: 3, x: 40, y: 70, number: 5 },
        { id: 4, x: 60, y: 70, number: 6 },
        { id: 5, x: 80, y: 70, number: 3 },
        { id: 6, x: 35, y: 50, number: 4 },
        { id: 7, x: 50, y: 50, number: 8 },
        { id: 8, x: 65, y: 50, number: 6 },
        { id: 9, x: 30, y: 25, number: 7 },
        { id: 10, x: 70, y: 25, number: 11 },
        { id: 11, x: 50, y: 20, number: 9 },
      ],
      authorId: demoUser.id,
    },
  });

  await prisma.tactic.create({
    data: {
      title: 'Counter-Attack 4-2-3-1',
      formation: '4-2-3-1',
      tags: ['Counter', 'Defensive', 'Speed'],
      description: 'Defensive setup with rapid counter-attacks using speedy wingers.',
      players: [
        { id: 1, x: 50, y: 90, number: 1 },
        { id: 2, x: 20, y: 70, number: 2 },
        { id: 3, x: 40, y: 70, number: 5 },
        { id: 4, x: 60, y: 70, number: 6 },
        { id: 5, x: 80, y: 70, number: 3 },
        { id: 6, x: 35, y: 55, number: 4 },
        { id: 7, x: 65, y: 55, number: 8 },
        { id: 8, x: 20, y: 30, number: 7 },
        { id: 9, x: 50, y: 40, number: 10 },
        { id: 10, x: 80, y: 30, number: 11 },
        { id: 11, x: 50, y: 20, number: 9 },
      ],
      authorId: coachUser.id,
    },
  });

  await prisma.tactic.create({
    data: {
      title: 'Total Football 4-3-3',
      formation: '4-3-3',
      tags: ['Possession', 'Flexible', 'Dutch'],
      description: 'Inspired by Ajax and Dutch teams of the 70s, focusing on positional fluidity.',
      players: [
        { id: 1, x: 50, y: 90, number: 1 },
        { id: 2, x: 20, y: 65, number: 2 },
        { id: 3, x: 40, y: 70, number: 5 },
        { id: 4, x: 60, y: 70, number: 6 },
        { id: 5, x: 80, y: 65, number: 3 },
        { id: 6, x: 35, y: 50, number: 4 },
        { id: 7, x: 50, y: 50, number: 8 },
        { id: 8, x: 65, y: 50, number: 6 },
        { id: 9, x: 30, y: 25, number: 7 },
        { id: 10, x: 70, y: 25, number: 11 },
        { id: 11, x: 50, y: 15, number: 9 },
      ],
      authorId: demoUser.id,
    },
  });

  console.log('Database seeding completed!');
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
