import { describe, expect, test, vi } from "vitest";
import { getSampleDMMF } from "./__fixtures__/getSampleSchema";
import { makeTypeDefs } from "../helpers/makeTypeDefs";
import {
  rootOperationProxy,
  relatedOperationProxy,
} from "../helpers/makeResolver";
import { parse } from "graphql";

describe("makeTypeDefs", () => {
  test("Check the generated graphql schema.", async () => {
    const dmmf = await getSampleDMMF();
    const typeDef = makeTypeDefs({ dmmf });

    expect(typeDef.loc?.source.body).toMatchSnapshot();
  });
});

describe("makeResolver > rootOperationProxy", () => {
  test("called fineManyUser", async () => {
    const dmmf = await getSampleDMMF();
    const mock = vi.fn();
    const proxy = rootOperationProxy(
      {
        user: {
          findMany: mock,
        },
      },
      dmmf
    );

    // @ts-ignore
    proxy.findManyUser({}, { foo: "foo", bar: "bar" });
    expect(mock).toBeCalledWith({ foo: "foo", bar: "bar" });
  });

  test("called aggregateUser", async () => {
    const dmmf = await getSampleDMMF();
    const mock = vi.fn();
    const proxy = rootOperationProxy(
      {
        user: {
          aggregate: mock,
        },
      },
      dmmf
    );

    const a = parse(`query {
      aggregateUser(where: {
        id: 1
      }) {
        _count {
          _all
          id
        }
      }
    }`);

    // @ts-ignore
    proxy.aggregateUser(
      {},
      {
        where: {
          id: 1,
        },
      },
      null,
      {
        // @ts-ignore
        fieldNodes: a.definitions[0].selectionSet.selections,
      }
    );
    expect(mock).toBeCalledWith({
      where: {
        id: 1,
      },
      _count: { _all: true, id: true },
    });
  });

  test("called groupByUser", async () => {
    const dmmf = await getSampleDMMF();
    const mock = vi.fn();
    const proxy = rootOperationProxy(
      {
        user: {
          groupBy: mock,
        },
      },
      dmmf
    );

    const a = parse(`query {
      groupByUser(by: [name]) {
        _max {
          id
        }
        name
      }
    }`);

    // @ts-ignore
    proxy.groupByUser({}, { by: ["name"] }, null, {
      // @ts-ignore
      fieldNodes: a.definitions[0].selectionSet.selections,
    });
    expect(mock).toBeCalledWith({
      by: ["name"],
      _max: { id: true },
    });
  });
});

describe("makeResolver > relatedOperationProxy", () => {
  test("called user.Team", async () => {
    const dmmf = await getSampleDMMF();
    const mock = vi.fn();
    const relatedMock = vi.fn();
    const proxy = relatedOperationProxy(
      {
        user: {
          findUnique: mock.mockReturnValue({ Team: relatedMock }),
        },
      },
      dmmf.datamodel.models.find(({ name }) => name === "User")!
    );

    // @ts-ignore
    proxy.Team({ id: 10, name: "foo" }, { select: { id: true, name: true } });
    expect(mock).toBeCalledWith({ where: { id: 10 } });
    expect(relatedMock).toBeCalledWith({ select: { id: true, name: true } });
  });
});
