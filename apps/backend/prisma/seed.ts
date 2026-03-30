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

  const analyst = await prisma.user.create({
    data: { username: 'analyst', email: 'analyst@offsidestrat.com' },
  });

  const coach = await prisma.user.create({
    data: { username: 'coach_k', email: 'coach@offsidestrat.com' },
  });

  console.log('Creating tactics...');

  const tactics = [
    {
      title: 'Tiki-Taka 4-3-3',
      formation: '4-3-3',
      tags: ['Possession', 'Tiki-Taka', 'Buildup'],
      description: 'Classic Barcelona-style possession play. Short, crisp passes through the thirds with constant movement to open channels. The key is the pivot holding deep while the 8s roam freely.',
      players: [
        { id: 1, x: 50, y: 90, number: 1, name: 'GK', position: 'GK' },
        { id: 2, x: 20, y: 70, number: 2, name: 'R.Back', position: 'RB' },
        { id: 3, x: 38, y: 72, number: 5, name: 'CB', position: 'CB' },
        { id: 4, x: 62, y: 72, number: 6, name: 'CB', position: 'CB' },
        { id: 5, x: 80, y: 70, number: 3, name: 'L.Back', position: 'LB' },
        { id: 6, x: 35, y: 52, number: 4, name: 'Pivot', position: 'DM' },
        { id: 7, x: 50, y: 48, number: 8, name: 'CM', position: 'CM' },
        { id: 8, x: 65, y: 52, number: 10, name: 'CM', position: 'CM' },
        { id: 9, x: 18, y: 28, number: 7, name: 'RW', position: 'RW' },
        { id: 10, x: 82, y: 28, number: 11, name: 'LW', position: 'LW' },
        { id: 11, x: 50, y: 18, number: 9, name: 'ST', position: 'ST' },
      ],
      authorId: analyst.id,
      fieldSettings: { fieldColor: '#166534', playerColor: '#1a1a1a', showPlayerLabels: true, markerType: 'circle' },
    },
    {
      title: 'Gegenpressing 4-2-3-1',
      formation: '4-2-3-1',
      tags: ['Pressing', 'Counter', 'High Intensity'],
      description: "High-intensity pressing inspired by Klopp's Liverpool. Win the ball high, transition fast. The double pivot provides cover while the front five press in a coordinated block.",
      players: [
        { id: 1, x: 50, y: 90, number: 1, name: 'GK', position: 'GK' },
        { id: 2, x: 20, y: 70, number: 2, name: 'RB', position: 'RB' },
        { id: 3, x: 38, y: 72, number: 5, name: 'CB', position: 'CB' },
        { id: 4, x: 62, y: 72, number: 6, name: 'CB', position: 'CB' },
        { id: 5, x: 80, y: 70, number: 3, name: 'LB', position: 'LB' },
        { id: 6, x: 38, y: 53, number: 4, name: 'DM', position: 'DM' },
        { id: 7, x: 62, y: 53, number: 8, name: 'DM', position: 'DM' },
        { id: 8, x: 20, y: 32, number: 7, name: 'RW', position: 'RW' },
        { id: 9, x: 50, y: 35, number: 10, name: 'AM', position: 'AM' },
        { id: 10, x: 80, y: 32, number: 11, name: 'LW', position: 'LW' },
        { id: 11, x: 50, y: 16, number: 9, name: 'ST', position: 'ST' },
      ],
      authorId: coach.id,
      fieldSettings: { fieldColor: '#0d2d4d', playerColor: '#e05c1a', showPlayerLabels: true, markerType: 'circle' },
    },
    {
      title: 'Low Block Counter 5-4-1',
      formation: '5-4-1',
      tags: ['Defensive', 'Counter', 'Low Block'],
      description: 'Deep defensive shape with two banks of five, absorbing pressure and releasing quickly in transition. One striker holds the line to receive the counter ball.',
      players: [
        { id: 1, x: 50, y: 90, number: 1, name: 'GK', position: 'GK' },
        { id: 2, x: 12, y: 68, number: 2, name: 'RWB', position: 'RWB' },
        { id: 3, x: 30, y: 72, number: 4, name: 'CB', position: 'CB' },
        { id: 4, x: 50, y: 75, number: 5, name: 'CB', position: 'CB' },
        { id: 5, x: 70, y: 72, number: 6, name: 'CB', position: 'CB' },
        { id: 6, x: 88, y: 68, number: 3, name: 'LWB', position: 'LWB' },
        { id: 7, x: 22, y: 48, number: 7, name: 'RM', position: 'RM' },
        { id: 8, x: 40, y: 50, number: 8, name: 'CM', position: 'CM' },
        { id: 9, x: 60, y: 50, number: 10, name: 'CM', position: 'CM' },
        { id: 10, x: 78, y: 48, number: 11, name: 'LM', position: 'LM' },
        { id: 11, x: 50, y: 20, number: 9, name: 'ST', position: 'ST' },
      ],
      authorId: coach.id,
      fieldSettings: { fieldColor: '#166534', playerColor: '#1a1a1a', showPlayerLabels: true, markerType: 'circle' },
    },
    {
      title: 'Total Football 3-4-3',
      formation: '3-4-3',
      tags: ['Possession', 'Fluid', 'Attacking'],
      description: "Inspired by the Ajax and Dutch national teams of the 70s. Every outfield player is comfortable in any position. Wide midfielders push high to create overloads in the final third.",
      players: [
        { id: 1, x: 50, y: 90, number: 1, name: 'GK', position: 'GK' },
        { id: 2, x: 28, y: 74, number: 5, name: 'CB', position: 'CB' },
        { id: 3, x: 50, y: 76, number: 6, name: 'CB', position: 'CB' },
        { id: 4, x: 72, y: 74, number: 4, name: 'CB', position: 'CB' },
        { id: 5, x: 15, y: 50, number: 2, name: 'RM', position: 'RM' },
        { id: 6, x: 38, y: 52, number: 8, name: 'CM', position: 'CM' },
        { id: 7, x: 62, y: 52, number: 10, name: 'CM', position: 'CM' },
        { id: 8, x: 85, y: 50, number: 3, name: 'LM', position: 'LM' },
        { id: 9, x: 22, y: 22, number: 7, name: 'RW', position: 'RW' },
        { id: 10, x: 50, y: 18, number: 9, name: 'ST', position: 'ST' },
        { id: 11, x: 78, y: 22, number: 11, name: 'LW', position: 'LW' },
      ],
      authorId: analyst.id,
      fieldSettings: { fieldColor: '#166534', playerColor: '#c8a600', showPlayerLabels: true, markerType: 'circle' },
    },
    {
      title: 'High Press 4-3-3 Wide',
      formation: '4-3-3',
      tags: ['Pressing', 'Wide Play', 'Attacking'],
      description: 'Attack-minded 4-3-3 with wide forwards who hug the touchline. The full-backs invert to overload the midfield while the 9 presses the centre-backs directly.',
      players: [
        { id: 1, x: 50, y: 90, number: 1, name: 'GK', position: 'GK' },
        { id: 2, x: 18, y: 65, number: 2, name: 'RB', position: 'RB' },
        { id: 3, x: 38, y: 70, number: 5, name: 'CB', position: 'CB' },
        { id: 4, x: 62, y: 70, number: 6, name: 'CB', position: 'CB' },
        { id: 5, x: 82, y: 65, number: 3, name: 'LB', position: 'LB' },
        { id: 6, x: 50, y: 52, number: 4, name: 'Pivot', position: 'DM' },
        { id: 7, x: 32, y: 44, number: 8, name: 'CM', position: 'CM' },
        { id: 8, x: 68, y: 44, number: 10, name: 'CM', position: 'CM' },
        { id: 9, x: 12, y: 22, number: 7, name: 'RW', position: 'RW' },
        { id: 10, x: 88, y: 22, number: 11, name: 'LW', position: 'LW' },
        { id: 11, x: 50, y: 16, number: 9, name: 'ST', position: 'ST' },
      ],
      authorId: analyst.id,
      fieldSettings: { fieldColor: '#166534', playerColor: '#1a1a1a', showPlayerLabels: true, markerType: 'circle' },
    },
    {
      title: 'Catenaccio 5-3-2',
      formation: '5-3-2',
      tags: ['Defensive', 'Italian', 'Counter'],
      description: 'Traditional Italian defensive system with a sweeper behind the defensive line. Very hard to break down, with lethal counter-attacking through the strikers.',
      players: [
        { id: 1, x: 50, y: 90, number: 1, name: 'GK', position: 'GK' },
        { id: 2, x: 14, y: 66, number: 2, name: 'RWB', position: 'RWB' },
        { id: 3, x: 32, y: 70, number: 4, name: 'CB', position: 'CB' },
        { id: 4, x: 50, y: 74, number: 5, name: 'Libero', position: 'CB' },
        { id: 5, x: 68, y: 70, number: 6, name: 'CB', position: 'CB' },
        { id: 6, x: 86, y: 66, number: 3, name: 'LWB', position: 'LWB' },
        { id: 7, x: 28, y: 48, number: 8, name: 'CM', position: 'CM' },
        { id: 8, x: 50, y: 46, number: 10, name: 'CM', position: 'CM' },
        { id: 9, x: 72, y: 48, number: 7, name: 'CM', position: 'CM' },
        { id: 10, x: 35, y: 20, number: 9, name: 'ST', position: 'ST' },
        { id: 11, x: 65, y: 20, number: 11, name: 'ST', position: 'ST' },
      ],
      authorId: coach.id,
      fieldSettings: { fieldColor: '#1a0a3d', playerColor: '#c0c0c0', showPlayerLabels: true, markerType: 'circle' },
    },
  ];

  const created = [];
  for (const t of tactics) {
    const tactic = await prisma.tactic.create({ data: t as any });
    created.push(tactic);
    console.log(`  ✓ ${t.title}`);
  }

  console.log('Adding interactions...');

  // Likes
  for (const tactic of created.slice(0, 4)) {
    await prisma.like.create({ data: { userId: coach.id, tacticId: tactic.id } });
  }
  for (const tactic of created.slice(2, 6)) {
    await prisma.like.create({ data: { userId: analyst.id, tacticId: tactic.id } });
  }

  // Comments
  const comments = [
    'Brilliant structure, the pivot is key to making this work.',
    'Works great in a back-three system too — very adaptable.',
    'The pressing triggers here are very well defined.',
    'Tested this in a real match, the transitions are deadly.',
  ];
  for (let i = 0; i < 4; i++) {
    await prisma.comment.create({
      data: { content: comments[i], userId: i % 2 === 0 ? analyst.id : coach.id, tacticId: created[i].id },
    });
  }

  console.log('\nSeeding complete! Created:');
  console.log(`  ${created.length} tactics`);
  console.log(`  2 users (analyst, coach_k)`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
