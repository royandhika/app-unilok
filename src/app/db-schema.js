import {
    mysqlTable,
    serial,
    varchar,
    text,
    int,
    decimal,
    timestamp,
    json,
    tinyint,
    mysqlEnum,
    bigint,
    date,
} from "drizzle-orm/mysql-core";

// ENUMS
// const orderStatusEnum = mysqlEnum("order_status", ["Pending", "Paid", "Cancelled", "Shipped"]);
// const flagAddressEnum = mysqlEnum("flag_address", ["Home", "Office"]);

// USERS
export const users = mysqlTable("users", {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 20 }).unique().notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    email: varchar("email", { length: 30 }).unique().notNull(),
    verified_email: tinyint("verified_email").default(0),
    phone: varchar("phone", { length: 20 }).unique(),
    verified_phone: tinyint("verified_phone").default(0),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});

// USER PROFILE
export const userProfiles = mysqlTable("user_profiles", {
    id: serial("id").primaryKey(),
    user_id: bigint("user_id", { mode: "number", unsigned: true })
        .unique()
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    avatar: varchar("avatar", { length: 250 }),
    full_name: varchar("full_name", { length: 50 }),
    birthdate: date("birthdate"),
    gender: mysqlEnum("gender", ["Male", "Female"]),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});

// USER ADDRESS
export const userAddresses = mysqlTable("user_addresses", {
    id: serial("id").primaryKey(),
    user_id: bigint("user_id", { mode: "number", unsigned: true })
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    address: varchar("address", { length: 50 }).notNull(),
    postal_code: varchar("postal_code", { length: 5 }).notNull(),
    district: varchar("district", { length: 20 }).notNull(),
    city: varchar("city", { length: 20 }).notNull(),
    province: varchar("province", { length: 20 }).notNull(),
    notes: varchar("notes", { length: 80 }),
    is_default: tinyint("is_default").default(0),
    flag: mysqlEnum("flag", ["Home", "Office"]).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});

// USER SESSION
export const userSessions = mysqlTable("user_sessions", {
    id: serial("id").primaryKey(),
    user_id: bigint("user_id", { mode: "number", unsigned: true })
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    refresh_token: varchar("refresh_token", { length: 250 }).notNull(),
    user_agent: varchar("user_agent", { length: 50 }).notNull(),
    ip_address: varchar("ip_address", { length: 20 }).notNull(),
    is_active: tinyint("is_active").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});

// MASTER COLOUR
export const productColours = mysqlTable("product_colour", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    hex: varchar("hex", { length: 12 }).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});

// PRODUCTS
export const products = mysqlTable("products", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 30 }).notNull(),
    description: text("description"),
    base_price: decimal("base_price", { precision: 12, scale: 2 }).notNull(),
    category: varchar("category", { length: 20 }).notNull(),
    gender: varchar("gender", { length: 20 }).notNull(),
    tags: json("tags").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});

// PRODUCT VARIANTS
export const productVariants = mysqlTable("product_variants", {
    id: serial("id").primaryKey(),
    product_id: bigint("product_id", { mode: "number", unsigned: true })
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    colour_id: bigint("colour_id", { mode: "number", unsigned: true })
        .notNull()
        .references(() => productColours.id, { onDelete: "cascade" }),
    size: varchar("size", { length: 10 }).notNull(),
    stock: int("stock").notNull(),
    reserved_stock: int("reserved_stock").notNull(),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});

// ORDER
export const orders = mysqlTable("orders", {
    id: serial("id").primaryKey(),
    address_id: bigint("address_id", { mode: "number", unsigned: true })
        .notNull()
        .references(() => userAddresses.id, { onDelete: "cascade" }),
    user_id: bigint("user_id", { mode: "number", unsigned: true })
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    status: mysqlEnum("status", ["Pending", "Paid", "Cancelled", "Shipped"]).default("Pending"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});

// ORDER ITEMS
export const orderItems = mysqlTable("order_items", {
    id: serial("id").primaryKey(),
    order_id: bigint("order_id", { mode: "number", unsigned: true })
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
    product_variant_id: bigint("product_variant_id", { mode: "number", unsigned: true })
        .notNull()
        .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: int("quantity").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});

// PRODUCT REVIEW
export const productReviews = mysqlTable("product_reviews", {
    id: serial("id").primaryKey(),
    order_item_id: bigint("order_item_id", { mode: "number", unsigned: true })
        .unique()
        .notNull()
        .references(() => orderItems.id, { onDelete: "cascade" }),
    user_id: bigint("user_id", { mode: "number", unsigned: true })
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    rating: decimal("rating", { precision: 10, scale: 2 }).notNull(),
    comment: text("comment"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});
