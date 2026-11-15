import "./env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { closeDb, getDb } from "./index";

async function main() {
  await migrate(getDb(), { migrationsFolder: "./drizzle" });
  console.log("Veritabanı şeması güncel.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
