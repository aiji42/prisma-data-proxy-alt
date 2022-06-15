import { PrismaClient, Language } from "@prisma/client/edge";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const db = new PrismaClient({
  log: ["query", "warn", "error"],
});

const prepare = async () => {
  await cleanUp();
  let data = await db.team.createMany({
    data: [
      {
        name: "team1",
        language: [Language.JAPANESE, Language.ENGLISH],
      },
      { name: "team2", language: [Language.CHINESE, Language.FRENCH] },
      { name: "team3", language: [] },
    ],
  });
  console.log(data);
  const teams = await db.team.findMany();
  console.log(teams);
  data = await db.user.createMany({
    data: [
      { name: "Foo", email: "foo@example.com", teamId: teams[0].id },
      { name: "Bar", email: "bar@example.com", teamId: teams[0].id },
      { name: "Baz", email: "baz@example.com", teamId: teams[1].id },
      { name: "Org", email: "org@example.com", teamId: null },
    ],
  });

  console.log(data);
};

const cleanUp = async () => {
  await Promise.all([db.user.deleteMany(), db.team.deleteMany()]);
  console.log("complete cleanup 🧹");
};

const main = async () => {
  await prepare();

  const res = await Promise.all([
    db.user.findFirst({
      select: { id: true, Team: true },
    }),
    db.team.findFirst({
      select: { id: true, users: { where: { id: { equals: 1 } } } },
    }),
    db.team.findMany({
      where: { name: { contains: "t", mode: "insensitive" } },
      select: { users: { where: { id: 1 } } },
    }),
    db.user.groupBy({ by: ["name"], _max: { id: true } }),
    db.team.aggregate({ _count: { _all: true, id: true }, where: { id: "1" } }),
  ]);
  console.dir(res, { depth: 5 });

  const userFindFirst = await db.user.findFirst();
  console.log("===== db.user.findFirst() =====");
  console.dir(userFindFirst);

  console.log(
    "===== db.user.findMany() with OR condition and ordered desc ====="
  );
  const userFindMany = await db.user.findMany({
    select: {
      id: true,
      name: true,
      Team: {
        select: {
          name: true,
        },
      },
    },
    where: {
      OR: [
        {
          name: { contains: "oo", mode: "insensitive" },
        },
        {
          name: { contains: "az", mode: "insensitive" },
        },
      ],
    },
    orderBy: { id: "desc" },
  });
  console.dir(userFindMany);

  console.log("===== db.team.findMany() with double nested model =====");
  const teamFindMany = await db.team.findMany({
    select: {
      id: false,
      name: true,
      language: true,
      users: {
        select: {
          name: true,
          Team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        where: {
          OR: [
            { name: { startsWith: "f", mode: "insensitive" } },
            { name: { endsWith: "z", mode: "insensitive" } },
          ],
        },
      },
    },
    where: {
      name: { in: ["team1", "team2"] },
      language: {
        hasSome: ["JAPANESE", "FRENCH"],
      },
    },
  });
  console.dir(teamFindMany);

  console.log("===== db.team.count() =====");
  const teamCount = await db.team.count();
  console.dir(teamCount);

  console.log("===== db.user.count() =====");
  const userCount = await db.user.count({
    select: {
      teamId: true,
      id: true,
      _all: true,
    },
    where: { name: { contains: "o", mode: "insensitive" } },
  });
  console.dir(userCount);

  console.log("===== db.user.create() =====");
  const userCreate = await db.user.create({
    data: { name: "ega", email: "ega@example.com" },
  });
  console.dir(userCreate);

  console.log("===== db.user.createMany() with skipDuplicates =====");
  const userCreateMany = await db.user.createMany({
    data: [
      {
        id: userFindFirst!.id,
        name: userFindFirst!.name,
        email: userFindFirst!.email,
        teamId: userFindFirst!.teamId,
      },
    ],
    skipDuplicates: true,
  });
  console.dir(userCreateMany);

  console.log("===== db.user.update() =====");
  const userUpdate = await db.user.update({
    data: { name: "hoo" },
    where: { id: userFindFirst!.id },
  });
  console.dir(userUpdate);

  console.log("===== db.user.updateMany() =====");
  const userUpdateMany = await db.user.updateMany({
    data: { name: "hee" },
  });
  console.dir(userUpdateMany);

  console.log("===== db.user.delete() =====");
  const userDelete = await db.user.delete({ where: { id: userFindFirst!.id } });
  console.dir(userDelete);

  console.log("===== db.team.deleteMany() =====");
  const userDeleteMany = await db.team.deleteMany({
    where: { name: { contains: "team" } },
  });
  console.dir(userDeleteMany);
};

main();
