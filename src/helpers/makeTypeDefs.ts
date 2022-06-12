import { Prisma } from "@prisma/client";
import { gql } from "apollo-server-express";

const Definitions = [
  ...Prisma.dmmf.schema.outputObjectTypes.prisma,
  ...Prisma.dmmf.schema.outputObjectTypes.model,
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
            }${f.isNullable ? "!" : ""}`;
          })
          .join(" ")}
      }
      `;
});

export const typeDefs = gql`
  scalar Any
  scalar DateTime
  scalar Json

  ${Definitions}
`;
