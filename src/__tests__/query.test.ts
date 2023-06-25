import { Language, PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, expect, test } from "vitest";

const db = new PrismaClient({
  log: ["query", "warn", "error"],
});

const cleanUp = async () => {
  await db.leaderboardRow.deleteMany();
  await db.team.deleteMany();
  await db.user.deleteMany();
  console.log("complete cleanup 🧹");
};

beforeAll(async () => {
  console.log(process.env.DATABASE_URL);
  await cleanUp();

  await db.team.createMany({
    data: [
      {
        name: "team1",
        language: [Language.JAPANESE, Language.ENGLISH],
      },
      { name: "team2", language: [Language.CHINESE, Language.FRENCH] },
      { name: "team3", language: [] },
    ],
  });
  const teams = await db.team.findMany();
  await db.user.createMany({
    data: [
      { name: "Foo", email: "foo@example.com", teamId: teams[0].id },
      { name: "Bar", email: "bar@example.com", teamId: teams[0].id },
      { name: "Baz", email: "baz@example.com", teamId: teams[1].id },
      { name: "Org", email: "org@example.com", teamId: null },
    ],
  });
});

test("db.user.findFirst()", async () => {
  const data = await db.user.findFirst();
  expect(data).toMatchObject({
    id: expect.any(Number),
    email: "foo@example.com",
    name: "Foo",
    teamId: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  });
});

test("db.user.findMany() with OR condition and ordered desc", async () => {
  const data = await db.user.findMany({
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

  expect(data).toMatchObject([
    { id: expect.any(Number), name: "Baz", Team: { name: "team2" } },
    { id: expect.any(Number), name: "Foo", Team: { name: "team1" } },
  ]);
});

test("db.team.findMany() with double nested model", async () => {
  const data = await db.team.findMany({
    select: {
      id: true,
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

  expect(data).toMatchObject([
    {
      id: expect.any(String),
      name: "team1",
      language: ["JAPANESE", "ENGLISH"],
      users: [
        {
          name: "Foo",
          Team: {
            id: expect.any(String),
            name: "team1",
          },
        },
      ],
    },
    {
      id: expect.any(String),
      name: "team2",
      language: ["CHINESE", "FRENCH"],
      users: [
        {
          name: "Baz",
          Team: {
            id: expect.any(String),
            name: "team2",
          },
        },
      ],
    },
  ]);
});

test("db.team.count()", async () => {
  const data = await db.team.count();
  expect(data).toBe(3);
});

test("db.user.count()", async () => {
  const data = await db.user.count({
    select: {
      teamId: true,
      id: true,
      _all: true,
    },
    where: { name: { contains: "o", mode: "insensitive" } },
  });
  expect(data).toMatchObject({
    _all: 2,
    id: 2,
    teamId: 1,
  });
});

test("db.user.create()", async () => {
  const data = await db.user.create({
    data: {
      name: "ega",
      email: "ega@example.com",
      Team: {
        connectOrCreate: {
          where: { id: "0" },
          create: {
            name: "team4",
            language: [],
          },
        },
      },
    },
  });

  expect(data).toMatchObject({
    id: expect.any(Number),
    email: "ega@example.com",
    name: "ega",
    teamId: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  });
});

test("db.user.createMany() with skipDuplicates", async () => {
  const user = await db.user.findFirst();
  const data = await db.user.createMany({
    data: [
      {
        id: user!.id,
        name: user!.name,
        email: user!.email,
        teamId: user!.teamId,
      },
    ],
    skipDuplicates: true,
  });

  expect(data).toMatchObject({
    count: 0,
  });
});

test("db.user.update()", async () => {
  const user = await db.user.findFirst();
  const data = await db.user.update({
    data: { name: "hoo" },
    where: { id: user!.id },
  });

  expect(data).toMatchObject({
    id: expect.any(Number),
    email: "foo@example.com",
    name: "hoo",
    teamId: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  });
});

test("db.user.updateMany()", async () => {
  const data = await db.user.updateMany({
    data: { name: "hee" },
  });

  expect(data).toMatchObject({
    count: 5,
  });
});

test("db.user.delete()", async () => {
  const user = await db.user.findFirst();
  const data = await db.user.delete({ where: { id: user!.id } });

  expect(data).toMatchObject({
    id: expect.any(Number),
    email: user!.email,
    name: user!.name,
    teamId: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  });
});

test("db.team.deleteMany()", async () => {
  const data = await db.team.deleteMany({
    where: { name: { contains: "team" } },
  });

  expect(data).toMatchObject({
    count: 4,
  });
});

test("db.leaderboardRow.create() - check BigInt", async () => {
  const user = await db.user.findFirst();
  if (!user) throw "not user";

  const data = await db.leaderboardRow.create({
    data: {
      leaderboardId: 1,
      userId: user.id,
      rating: 11112222333344n,
    },
  });

  expect(data).toMatchObject({
    leaderboardId: expect.any(Number),
    userId: expect.any(Number),
    rating: expect.any(BigInt),
  });
});

afterAll(async () => {
  await cleanUp();
});
