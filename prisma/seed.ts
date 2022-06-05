import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const main = async () => {
  await db.team.deleteMany({})
  await db.user.deleteMany({})

  await db.team.create({
    data: {
      name: 'team1',
      users: {
        create: [
          { name: 'Foo', email: 'foo@example.com' },
          { name: 'Bar', email: 'bar@example.com' },
        ],
      },
    },
  })
  await db.team.create({
    data: {
      name: 'team2',
      users: {
        create: [{ name: 'Baz', email: 'baz@example.com' }],
      },
    },
  })
  await db.team.create({
    data: {
      name: 'team3',
    },
  })
}

main().catch(console.error)
