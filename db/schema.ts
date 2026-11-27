// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const brands = sqliteTable("brands", {
  id: text("id").primaryKey(),
  nameKey: text("name_key").notNull().unique(),
  data: text("data").notNull(),
});
export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  data: text("data").notNull(),
  revision: integer("revision").notNull().default(0),
});
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  data: text("data").notNull(),
});
export const rateLimits = sqliteTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull(),
    expires: integer("expires").notNull(),
  },
  (t) => [index("rate_expiry_idx").on(t.expires)],
);
export const auditLog = sqliteTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    action: text("action").notNull(),
    productId: text("product_id"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);
