import { getDMMF, getSchemaSync } from "@prisma/sdk";
import * as path from "path";

const samplePrismaSchema = getSchemaSync(
  path.join(__dirname, "./schema.prisma")
);

export const getSampleDMMF = async () => {
  return getDMMF({
    datamodel: samplePrismaSchema,
  });
};
