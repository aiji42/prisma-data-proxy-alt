import { $ } from "zx";

export async function setup() {
  await $`yarn prisma generate --data-proxy`;
}
