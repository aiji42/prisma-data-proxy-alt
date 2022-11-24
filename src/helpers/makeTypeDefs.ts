import { gql } from "apollo-server-express";
import { DMMF } from "@prisma/client/runtime";

export const makeTypeDefs = (dmmf: DMMF.Document) => {
  const enums = [
    ...dmmf.schema.enumTypes.prisma,
    ...(dmmf.schema.enumTypes.model ?? []),
  ].map(({ name, values }) => {
    return `
      enum ${name} {
        ${values.join(" ")}
      }
    `;
  });

  const types = [
    ...dmmf.schema.outputObjectTypes.prisma,
    ...dmmf.schema.outputObjectTypes.model,
  ].map((m) => {
    return `
      type ${m.name} {
        ${m.fields
          .map((f) => {
            return `${f.name}${
              f.args.length > 0
                ? `(${f.args.map(({ name }) => `${name}: Any`).join(" ")})`
                : ""
            }: ${
              f.outputType.isList
                ? `[${f.outputType.type}]`
                : `${f.outputType.type}`
            }${f.isNullable ? "" : "!"}`;
          })
          .join(" ")}
      }
      `;
  });

  return gql`
    scalar Any
    scalar DateTime
    scalar Json
    scalar BigInt
    ${enums}
    ${types}
  `;
};
