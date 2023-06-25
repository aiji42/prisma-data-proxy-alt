import { getDMMF, getSchema } from "@prisma/internals";
import * as path from "path";

const samplePrismaSchema = getSchema(path.join(__dirname, "./schema.prisma"));

export const getSampleDMMF = async () => {
  return getDMMF({
    datamodel: await samplePrismaSchema,
  });
};
