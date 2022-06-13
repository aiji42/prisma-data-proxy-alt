import { PrismaClient } from "@prisma/client/scripts/default-index";
import { DMMF } from "@prisma/client/runtime";
import { FieldNode, SelectionNode } from "graphql";

const toLowerFirstLetter = (str: string) => {
  return str.charAt(0).toLowerCase() + str.substring(1);
};

const functionsMappings = (
  dmmf: DMMF.Document
): Record<string, { operation: string; model: string }> => {
  return Object.fromEntries(
    dmmf.mappings.modelOperations.flatMap(
      ({ model, plural, ...operations }) => {
        return Object.entries(operations).map(([k, v]) => [
          v,
          { operation: k, model },
        ]);
      }
    )
  );
};

interface AggregateField {
  [x: string]: true | AggregateField;
}

const digAggregateField = (
  selections: readonly SelectionNode[],
  root: boolean = true
): AggregateField => {
  return selections.reduce((res, selection) => {
    if ("name" in selection && "selectionSet" in selection) {
      if (root && !selection.name.value.startsWith("_")) return res;
      const dug = digAggregateField(
        selection.selectionSet?.selections ?? [],
        false
      );
      return {
        ...res,
        [selection.name.value]: Object.keys(dug).length ? dug : true,
      };
    }
    return res;
  }, {});
};

const rootOperationProxy = (db: PrismaClient, dmmf: DMMF.Document) => {
  const mapping = functionsMappings(dmmf);
  return new Proxy(
    {},
    {
      get: (_, method) => {
        return async (
          ...[, args, , info]: [
            unknown,
            Record<string, unknown>,
            unknown,
            { fieldNodes: readonly FieldNode[] }
          ]
        ) => {
          const { operation, model } = mapping[method.toString()];

          try {
            if (operation === "aggregate" || operation === "groupBy") {
              return db[toLowerFirstLetter(model)][operation]({
                ...digAggregateField(
                  info.fieldNodes[0].selectionSet?.selections ?? []
                ),
                ...args,
              });
            }

            return db[toLowerFirstLetter(model)][operation](args);
          } catch (e) {
            console.error(e);
            throw e;
          }
        };
      },
    }
  );
};

const relationOperationProxy = (
  db: PrismaClient,
  { name, fields }: DMMF.Model
) => {
  return new Proxy(
    {},
    {
      get: (_, method) => {
        const idFieldName = fields.find(({ isId }) => isId)?.name;
        const field = fields.find(({ name }) => name === method.toString());
        if (!idFieldName || !field?.relationName) return undefined;

        return async (
          parent: Record<string, unknown>,
          args: Record<string, unknown>
        ) => {
          try {
            return await db[toLowerFirstLetter(name)]
              .findUnique({ where: { [idFieldName]: parent[idFieldName] } })
              [method](args);
          } catch (e) {
            console.error(e);
            throw e;
          }
        };
      },
    }
  );
};

export const makeResolver = (
  db: PrismaClient,
  { dmmf }: { dmmf: DMMF.Document }
) => {
  return {
    ...Object.fromEntries(
      dmmf.datamodel.models.map((model) => [
        model.name,
        relationOperationProxy(db, model),
      ])
    ),
    Query: rootOperationProxy(db, dmmf),
    Mutation: rootOperationProxy(db, dmmf),
  };
};
