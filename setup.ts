import { $ } from "zx";

export async function setup() {
  /**
   * Prisma Edge is not support metrics. Need remove it first.
   */
  await $`cp prisma/schema.prisma prisma/schema-edge.prisma`;
  await $`sed -i '/previewFeatures/d' prisma/schema-edge.prisma`;
  await $`yarn prisma generate --data-proxy --schema prisma/schema-edge.prisma`;
}
