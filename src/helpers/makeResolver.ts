import { PrismaClient } from "@prisma/client/scripts/default-index";
import { DMMF } from "@prisma/client/runtime";

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

const rootOperationProxy = (db: PrismaClient, dmmf: DMMF.Document) => {
  const mapping = functionsMappings(dmmf);
  return new Proxy(
    {},
    {
      get: (_, method) => {
        return async (...[, args]: [unknown, Record<string, unknown>]) => {
          const { operation, model } = mapping[method.toString()];

          try {
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
