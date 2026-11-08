import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";

export const targetTypes = sqliteTable("target_types", {
  code: text("code", { length: 16 }).primaryKey(),
  name: text("name", { length: 64 }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
});

export type TargetType = typeof targetTypes.$inferSelect;
export type TargetTypeInsertValue = typeof targetTypes.$inferInsert;

export const providers = sqliteTable("providers", {
  code: text("code", { length: 16 }).primaryKey(),
  name: text("name", { length: 64 }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`)
    .$onUpdate(() => new Date()),
});

export type Provider = typeof providers.$inferSelect;
export type ProviderInsertValue = typeof providers.$inferInsert;

export const products = sqliteTable("products", {
  code: text("code", { length: 16 }).primaryKey(),
  providerCode: text("provider_code", { length: 16 })
    .notNull()
    .references(() => providers.code, {
      onUpdate: "cascade",
      onDelete: "restrict",
    }),
  name: text("name", { length: 64 }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`)
    .$onUpdate(() => new Date()),
});

export type Product = typeof products.$inferSelect;
export type ProductInsertValue = typeof products.$inferInsert;

export const suppliers = sqliteTable(
  "suppliers",
  {
    code: text("code", { length: 16 }).primaryKey(),
    targetTypeCode: text("target_type_code", { length: 16 })
      .notNull()
      .references(() => targetTypes.code, {
        onUpdate: "cascade",
        onDelete: "restrict",
      }),
    name: text("name", { length: 64 }).notNull(),
    productListUrl: text("product_list_url", { length: 500 }).notNull(),
    lastSyncedAt: integer("last_synced_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`)
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_suppliers_last_synced_at").on(table.lastSyncedAt)],
);

export type Supplier = typeof suppliers.$inferSelect;
export type SupplierInsertValue = typeof suppliers.$inferInsert;

export const productSuppliers = sqliteTable(
  "product_suppliers",
  {
    productCode: text("product_code", { length: 16 })
      .notNull()
      .references(() => products.code, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    supplierCode: text("supplier_code", { length: 16 })
      .notNull()
      .references(() => suppliers.code, {
        onUpdate: "cascade",
        onDelete: "restrict",
      }),
    supplierProductCode: text("supplier_product_code", { length: 32 }).notNull(),
    title: text("title", { length: 255 }),
    status: text("status", {
      enum: ["inactive", "active", "not-found", "unknown"],
    })
      .notNull()
      .default("unknown"),
    price: integer("price", { mode: "number" }).notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`)
      .$onUpdate(() => new Date()),
  },

  (table) => [
    primaryKey({
      columns: [table.productCode, table.supplierCode, table.supplierProductCode],
    }),

    index("idx_product_suppliers_product_status_price").on(
      table.productCode,
      table.status,
      table.price,
      table.supplierCode,
      table.supplierProductCode,
    ),

    index("idx_product_suppliers_price").on(table.price),
    index("idx_product_suppliers_updated_at").on(table.updatedAt),
  ],
);

export type ProductSupplier = typeof productSuppliers.$inferSelect;
export type ProductSupplierInsertValue = typeof productSuppliers.$inferInsert;
