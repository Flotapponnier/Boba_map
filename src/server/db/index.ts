import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// During build time, env vars may not be set. Use placeholder to avoid build errors.
const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });

export { schema };

