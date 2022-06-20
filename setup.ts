import { $ } from "zx";
import { config } from "dotenv";
config({ path: ".env.test" });

export async function setup() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  await $`yarn prisma generate --data-proxy`;
}
