import { pgTable, text, serial, integer, decimal, timestamp, varchar, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    portfolioName: varchar("portfolio_name", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const assets = pgTable("assets", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    ticker: varchar("ticker", { length: 20 }).notNull(),
    isin: varchar("isin", { length: 12 }),
    category: varchar("category", { length: 20 }).notNull(), // stocks | etf | crypto | bonds
    sector: varchar("sector", { length: 50 }),
    region: varchar("region", { length: 50 }),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const transactions = pgTable("transactions", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    assetId: integer("asset_id").references(() => assets.id).notNull(),
    date: date("date").notNull(),
    type: varchar("type", { length: 10 }).notNull(), // buy | sell
    quantity: decimal("quantity", { precision: 15, scale: 6 }).notNull(),
    unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
    fees: decimal("fees", { precision: 15, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const prices = pgTable("prices", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    assetId: integer("asset_id").references(() => assets.id).notNull(),
    date: date("date").notNull(),
    closePrice: decimal("close_price", { precision: 15, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const dividends = pgTable("dividends", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    assetId: integer("asset_id").references(() => assets.id).notNull(),
    paymentDate: date("payment_date").notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const cashMovements = pgTable("cash_movements", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    date: date("date").notNull(),
    type: varchar("type", { length: 10 }).notNull(), // deposit | withdraw
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const portfolioSnapshots = pgTable("portfolio_snapshots", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    month: integer("month").notNull(), // 1-12
    year: integer("year").notNull(),
    totalValue: decimal("total_value", { precision: 15, scale: 2 }).notNull(),
    totalInvested: decimal("total_invested", { precision: 15, scale: 2 }).notNull(),
    totalPL: decimal("total_pl", { precision: 15, scale: 2 }).notNull(),
    totalPLPercent: decimal("total_pl_percent", { precision: 5, scale: 2 }).notNull(),
    // Asset category breakdown
    stocksValue: decimal("stocks_value", { precision: 15, scale: 2 }).default("0"),
    etfValue: decimal("etf_value", { precision: 15, scale: 2 }).default("0"),
    cryptoValue: decimal("crypto_value", { precision: 15, scale: 2 }).default("0"),
    bondsValue: decimal("bonds_value", { precision: 15, scale: 2 }).default("0"),
    categoryDetails: text("category_details"), // JSON string with detailed breakdown
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const assetSnapshots = pgTable("asset_snapshots", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    assetId: integer("asset_id").references(() => assets.id).notNull(),
    date: date("date").notNull(),
    quantity: decimal("quantity", { precision: 15, scale: 6 }).notNull(),
    averagePrice: decimal("average_price", { precision: 15, scale: 2 }).notNull(),
    currentPrice: decimal("current_price", { precision: 15, scale: 2 }).notNull(),
    totalCost: decimal("total_cost", { precision: 15, scale: 2 }).notNull(),
    marketValue: decimal("market_value", { precision: 15, scale: 2 }).notNull(),
    unrealizedPL: decimal("unrealized_pl", { precision: 15, scale: 2 }).notNull(),
    unrealizedPLPercent: decimal("unrealized_pl_percent", { precision: 5, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
// Relations
export const usersRelations = relations(users, ({ many }) => ({
    assets: many(assets),
    transactions: many(transactions),
    prices: many(prices),
    dividends: many(dividends),
    cashMovements: many(cashMovements),
    portfolioSnapshots: many(portfolioSnapshots),
    assetSnapshots: many(assetSnapshots),
}));
export const assetsRelations = relations(assets, ({ one, many }) => ({
    user: one(users, {
        fields: [assets.userId],
        references: [users.id],
    }),
    transactions: many(transactions),
    prices: many(prices),
    dividends: many(dividends),
    snapshots: many(assetSnapshots),
}));
export const assetSnapshotsRelations = relations(assetSnapshots, ({ one }) => ({
    user: one(users, {
        fields: [assetSnapshots.userId],
        references: [users.id],
    }),
    asset: one(assets, {
        fields: [assetSnapshots.assetId],
        references: [assets.id],
    }),
}));
export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(users, {
        fields: [transactions.userId],
        references: [users.id],
    }),
    asset: one(assets, {
        fields: [transactions.assetId],
        references: [assets.id],
    }),
}));
export const pricesRelations = relations(prices, ({ one }) => ({
    user: one(users, {
        fields: [prices.userId],
        references: [users.id],
    }),
    asset: one(assets, {
        fields: [prices.assetId],
        references: [assets.id],
    }),
}));
export const dividendsRelations = relations(dividends, ({ one }) => ({
    user: one(users, {
        fields: [dividends.userId],
        references: [users.id],
    }),
    asset: one(assets, {
        fields: [dividends.assetId],
        references: [assets.id],
    }),
}));
export const cashMovementsRelations = relations(cashMovements, ({ one }) => ({
    user: one(users, {
        fields: [cashMovements.userId],
        references: [users.id],
    }),
}));
export const portfolioSnapshotsRelations = relations(portfolioSnapshots, ({ one }) => ({
    user: one(users, {
        fields: [portfolioSnapshots.userId],
        references: [users.id],
    }),
}));
// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
    username: z.string().min(1, "Username is required"),
    passwordHash: z.string().min(1),
}).omit({
    id: true,
    createdAt: true,
    passwordHash: true,
}).extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
});
export const insertAssetSchema = createInsertSchema(assets).omit({
    id: true,
    userId: true,
    createdAt: true,
});
export const insertTransactionSchema = createInsertSchema(transactions, {
    quantity: z.string().min(1, "Quantity is required"),
    unitPrice: z.string().min(1, "Unit price is required"),
    fees: z.string().default("0"),
}).omit({
    id: true,
    userId: true,
    createdAt: true,
});
export const insertPriceSchema = createInsertSchema(prices, {
    closePrice: z.string().min(1, "Price is required"),
}).omit({
    id: true,
    userId: true,
    createdAt: true,
});
export const insertDividendSchema = createInsertSchema(dividends).omit({
    id: true,
    userId: true,
    createdAt: true,
});
export const insertCashMovementSchema = createInsertSchema(cashMovements).omit({
    id: true,
    userId: true,
    createdAt: true,
});
export const insertPortfolioSnapshotSchema = createInsertSchema(portfolioSnapshots, {
    totalValue: z.string().min(1, "Total value is required"),
    totalInvested: z.string().min(1, "Total invested is required"),
    totalPL: z.string(),
    totalPLPercent: z.string(),
    stocksValue: z.string().default("0"),
    etfValue: z.string().default("0"),
    cryptoValue: z.string().default("0"),
    bondsValue: z.string().default("0"),
    categoryDetails: z.string().optional(),
}).omit({
    id: true,
    userId: true,
    createdAt: true,
});
export const insertAssetSnapshotSchema = createInsertSchema(assetSnapshots, {
    quantity: z.string().min(1, "Quantity is required"),
    averagePrice: z.string().min(1, "Average price is required"),
    currentPrice: z.string().min(1, "Current price is required"),
    totalCost: z.string().min(1, "Total cost is required"),
    marketValue: z.string().min(1, "Market value is required"),
    unrealizedPL: z.string(),
    unrealizedPLPercent: z.string(),
}).omit({
    id: true,
    userId: true,
    createdAt: true,
});
// Define standardized asset categories
export const assetCategories = [
    "stocks",
    "etf",
    "crypto",
    "bonds"
];
export const categoryDisplayNames = {
    stocks: "Stocks",
    etf: "ETFs",
    crypto: "Crypto",
    bonds: "Bonds / Funds"
};
