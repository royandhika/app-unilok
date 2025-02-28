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

import { relations, sql } from "drizzle-orm";

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
    expires_at: timestamp("expires_at")
        .default(sql`(CURRENT_TIMESTAMP + INTERVAL 30 DAY)`)
        .notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});

// MASTER COLOUR
export const colours = mysqlTable("colours", {
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
    is_hidden: tinyint("is_hidden").default(1),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});

// PRODUCT IMAGES
export const productImages = mysqlTable("product_images", {
    id: serial("id").primaryKey(),
    product_id: bigint("product_id", { mode: "number", unsigned: true })
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    is_thumbnail: tinyint("is_thumbnail").notNull(),
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
        .references(() => colours.id, { onDelete: "cascade" }),
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

// RELATIONS
export const usersRelations = relations(users, ({ one, many }) => ({
    userProfiles: one(userProfiles),
    userAddresses: many(userAddresses),
    userSessions: many(userSessions),
    productReviews: many(productReviews),
    orders: many(orders),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
    users: one(users, {
        fields: [userProfiles.user_id],
        references: [users.id],
    }),
}));

export const userAddressesRelations = relations(userAddresses, ({ one, many }) => ({
    users: one(users, {
        fields: [userAddresses.user_id],
        references: [users.id],
    }),
    orders: many(orders),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
    users: one(users, {
        fields: [userSessions.user_id],
        references: [users.id],
    }),
}));

export const productRelations = relations(products, ({ many }) => ({
    productImages: many(productImages),
    productVariants: many(productVariants),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
    product: one(products, {
        fields: [productImages.product_id],
        references: [products.id],
    }),
}));

export const coloursRelations = relations(colours, ({ many }) => ({
    productVariants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
    product: one(products, {
        fields: [productVariants.product_id],
        references: [products.id],
    }),
    colours: one(colours, {
        fields: [productVariants.colour_id],
        references: [colours.id],
    }),
    orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
    users: one(users, {
        fields: [orders.user_id],
        references: [users.id],
    }),
    userAddresses: one(userAddresses, {
        fields: [orders.address_id],
        references: [userAddresses.id],
    }),
    orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    orders: one(orders, {
        fields: [orderItems.order_id],
        references: [orders.id],
    }),
    productVariants: one(productVariants, {
        fields: [orderItems.product_variant_id],
        references: [productVariants.id],
    }),
    productReviews: one(productReviews),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
    users: one(users, {
        fields: [productReviews.user_id],
        references: [users.id],
    }),
    orderItems: one(orderItems, {
        fields: [productReviews.order_item_id],
        references: [orderItems.id],
    }),
}));
