import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const orderStatusEnum = [
  "new",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
] as const;

export type OrderStatus = (typeof orderStatusEnum)[number];

export const fulfillmentEnum = ["delivery", "pickup"] as const;
export type Fulfillment = (typeof fulfillmentEnum)[number];

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customers = mysqlTable(
  "customers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    address: text("address"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [index("customers_phone_idx").on(t.phone)],
);

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    categoryId: int("category_id")
      .notNull()
      .references(() => categories.id),
    name: varchar("name", { length: 160 }).notNull(),
    /** Price in satang (1 THB = 100) */
    basePrice: int("base_price").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: int("sort_order").notNull().default(0),
    notes: text("notes"),
  },
  (t) => [index("products_category_id_idx").on(t.categoryId)],
);

export const optionGroups = mysqlTable("option_groups", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  minSelect: int("min_select").notNull().default(0),
  maxSelect: int("max_select").notNull().default(1),
  sortOrder: int("sort_order").notNull().default(0),
});

export const options = mysqlTable("options", {
  id: int("id").autoincrement().primaryKey(),
  optionGroupId: int("option_group_id")
    .notNull()
    .references(() => optionGroups.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  /** Delta in satang; 0 for no price impact */
  priceDelta: int("price_delta").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
});

export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    orderNumber: varchar("order_number", { length: 32 }).notNull().unique(),
    customerId: int("customer_id").references(() => customers.id),
    status: mysqlEnum("status", orderStatusEnum).notNull().default("new"),
    fulfillment: mysqlEnum("fulfillment", fulfillmentEnum)
      .notNull()
      .default("delivery"),
    notes: text("notes"),
    /** Sum of line totals in satang; no separate delivery fee column */
    subtotal: int("subtotal").notNull().default(0),
    total: int("total").notNull().default(0),
    createdByUserId: int("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
    deliveredAt: timestamp("delivered_at"),
  },
  (t) => [
    index("orders_created_at_idx").on(t.createdAt),
    index("orders_status_idx").on(t.status),
    index("orders_customer_id_idx").on(t.customerId),
  ],
);

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: int("product_id")
    .notNull()
    .references(() => products.id),
  productNameSnapshot: varchar("product_name_snapshot", {
    length: 160,
  }).notNull(),
  unitBasePrice: int("unit_base_price").notNull(),
  qty: int("qty").notNull().default(1),
  lineNotes: text("line_notes"),
  lineTotal: int("line_total").notNull(),
});

export const orderItemOptions = mysqlTable("order_item_options", {
  id: int("id").autoincrement().primaryKey(),
  orderItemId: int("order_item_id")
    .notNull()
    .references(() => orderItems.id, { onDelete: "cascade" }),
  optionId: int("option_id")
    .notNull()
    .references(() => options.id),
  optionNameSnapshot: varchar("option_name_snapshot", {
    length: 120,
  }).notNull(),
  priceDeltaSnapshot: int("price_delta_snapshot").notNull().default(0),
});

export const orderStatusHistory = mysqlTable("order_status_history", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  fromStatus: mysqlEnum("from_status", orderStatusEnum),
  toStatus: mysqlEnum("to_status", orderStatusEnum).notNull(),
  changedByUserId: int("changed_by_user_id")
    .notNull()
    .references(() => users.id),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});
