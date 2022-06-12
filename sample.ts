import { PrismaClient } from "@prisma/client";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const db = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

const main = async () => {
  const res = await Promise.all([
    db.user.findFirst({
      where: { id: { equals: 1 } },
      select: { id: true, Team: true },
    }),
    db.team.findFirst({
      select: { id: true, users: { where: { id: { equals: 1 } } } },
    }),
    db.team.findMany({
      where: { name: { contains: "t", mode: "insensitive" } },
      select: { users: { where: { id: 1 } } },
    }),
    // db.team.aggregate({ _count: true }),
  ]);
  console.log(res);
};

main();
