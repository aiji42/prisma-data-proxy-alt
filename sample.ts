import { PrismaClient } from '@prisma/client'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})


const main = async () => {
  const res = await db.user.findFirst({ where: { id: 1 }, select: { Team: true } })
  console.log(res)
}

main()
