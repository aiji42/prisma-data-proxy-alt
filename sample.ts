import { PrismaClient } from '@prisma/client'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})


const main = async () => {
  const res = await Promise.all([
    db.user.findFirst({ where: { id: 1 }, select: { id: true, Team: true } }),
    db.team.findFirst({ select: { id: true, users: { where: { id: 1 } } } }),
  ])
  console.log(res)
}

main()
