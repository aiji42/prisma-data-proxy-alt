import { PrismaClient } from "@prisma/client/scripts/default-index";
import { DMMF } from "@prisma/client/runtime";
import { SelectionNode } from "graphql";
import { IFieldResolver } from "@graphql-tools/utils";

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
  isRoot: boolean = true
): AggregateField => {
  return selections.reduce((res, selection) => {
    if (
      "name" in selection &&
      "selectionSet" in selection &&
      !(isRoot && !selection.name.value.startsWith("_"))
    ) {
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

export const rootOperationProxy = (db: PrismaClient, dmmf: DMMF.Document) => {
  const mapping = functionsMappings(dmmf);
  return new Proxy(
    {},
    {
      get: (_, method): IFieldResolver<Record<string, unknown>, unknown> => {
        return async (...[, args, , info]) => {
          const { operation, model } = mapping[method.toString()];

          const newArgs =
            operation === "aggregate" || operation === "groupBy"
              ? {
                  ...digAggregateField(
                    info.fieldNodes[0].selectionSet?.selections ?? []
                  ),
                  ...args,
                }
              : args;

          return db[toLowerFirstLetter(model)][operation.replace(/One$/, "")](
            newArgs
          );
        };
      },
    }
  );
};

export const relatedOperationProxy = (
  db: PrismaClient,
  { name, fields }: DMMF.Model
) => {
  return new Proxy(
    {},
    {
      get: (
        _,
        method
      ): IFieldResolver<Record<string, unknown>, unknown> | undefined => {
        const idFieldName = fields.find(({ isId }) => isId)?.name;
        const field = fields.find(({ name }) => name === method.toString());
        if (!idFieldName || !field?.relationName) return undefined;

        return async (parent, args) => {
          return await db[toLowerFirstLetter(name)]
            .findUnique({ where: { [idFieldName]: parent[idFieldName] } })
            [method](args);
        };
      },
    }
  );
};

export const makeResolver = (dmmf: DMMF.Document, db: PrismaClient) => {
  return {
    ...Object.fromEntries(
      dmmf.datamodel.models.map((model) => [
        model.name,
        relatedOperationProxy(db, model),
      ])
    ),
    Query: rootOperationProxy(db, dmmf),
    Mutation: rootOperationProxy(db, dmmf),
  };
};
