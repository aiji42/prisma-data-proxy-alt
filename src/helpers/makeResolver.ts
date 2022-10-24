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

export function convertResultToPrismaFormat(obj: any) {
  if (typeof obj === "bigint") {
    return {
      prisma__type: "bigint",
      prisma__value: String(obj),
    };
  }
  if (typeof obj === "number") {
    return {
      prisma__type: "number",
      prisma__value: obj,
    };
  }
  if (typeof obj === "string") {
    return {
      prisma__type: "string",
      prisma__value: obj,
    };
  }
  if (obj == null) {
    return {
      prisma__type: "null",
      prisma__value: null,
    };
  }
  if (typeof obj === "boolean") {
    return {
      prisma__type: "bool",
      prisma__value: obj,
    };
  }
  if (obj instanceof Date) {
    return {
      prisma__type: "datetime",
      prisma__value: obj,
    };
  }
  if (typeof obj === "object") {
    for (const key in obj) {
      obj[key] = convertResultToPrismaFormat(obj[key]);
    }
  }
  return obj;
}

export const rootOperationProxy = (db: PrismaClient, dmmf: DMMF.Document) => {
  const mapping = functionsMappings(dmmf);
  return new Proxy(
    {},
    {
      get: (_, method): IFieldResolver<Record<string, unknown>, unknown> => {
        return async (...[, args, , info]) => {
          if (method.toString() === "queryRaw") {
            let result = await db.$queryRawUnsafe(
              args.query,
              ...JSON.parse(args.parameters)
            );
            return convertResultToPrismaFormat(result);
          }

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
  { name, fields, primaryKey }: DMMF.Model
) => {
  return new Proxy(
    {},
    {
      get: (
        _,
        method
      ): IFieldResolver<Record<string, unknown>, unknown> | undefined => {
        const field = fields.find(({ name }) => name === method.toString());
        if (!field?.relationName) return undefined;

        const idFieldNames: string[] = fields
          .filter((field) => {
            return field.isId || primaryKey?.fields?.includes(field.name);
          })
          .map((x) => x.name);

        if (idFieldNames.length == 0) return undefined;

        return async (parent, args) => {
          let where: Record<string, any>;

          if (idFieldNames.length > 1) {
            const conditions: Record<string, any> = {};
            for (const idFieldName of idFieldNames) {
              conditions[idFieldName] = parent[idFieldName];
            }
            where = {
              [idFieldNames.join("_")]: conditions,
            };
          } else {
            where = {
              [idFieldNames[0]]: parent[idFieldNames[0]],
            };
          }

          return await db[toLowerFirstLetter(name)]
            .findUnique({ where })
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
