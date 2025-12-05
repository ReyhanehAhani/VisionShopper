// Prisma configuration for standard PostgreSQL connection
// This file configures Prisma 7 to use the library engine type (standard Node.js connection)
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    provider: "postgresql",
    // Use a dummy URL during generation if DATABASE_URL is not set
    // This allows Prisma client generation without an actual database connection
    url: env("DATABASE_URL") || "postgresql://user:password@localhost:5432/dummy?schema=public",
  },
});
