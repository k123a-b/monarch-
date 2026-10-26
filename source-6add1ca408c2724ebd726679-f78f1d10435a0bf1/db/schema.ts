import {
  pgTable,
  text,
  integer,
  bigint,
  serial,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
export const accounts = pgTable("accounts", {
  id: text().primaryKey(),
  googleEmail: text("google_email"),
  username: text().notNull().unique(),
  usernameSet: boolean("username_set").notNull().default(false),
  friendCode: text("friend_code").notNull().unique(),
  balance: bigint({ mode: "number" }).notNull().default(500),
  sold: bigint({ mode: "number" }).notNull().default(0),
  packs: integer().notNull().default(0),
  pulled: integer().notNull().default(0),
  bot: boolean().notNull().default(false),
  lastHeartbeat: timestamp("last_heartbeat", { withTimezone: true }),
  activeSeconds: integer("active_seconds").notNull().default(0),
  rewardDay: text("reward_day").notNull().default(""),
  dailyReward: integer("daily_reward").notNull().default(0),
  rewardSteps: integer("reward_steps").notNull().default(0),
  starterClaimed: boolean("starter_claimed").notNull().default(false),
  spinDay: text("spin_day").notNull().default(""),
  spinReward: integer("spin_reward"),
  loadout: integer().array().notNull().default([]),
  fortniteCollection: text("fortnite_collection").array().notNull().default([]),
  loadoutSlots: integer("loadout_slots").notNull().default(3),
  packSlots: integer("pack_slots").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const alphaPulls = pgTable("alpha_pulls", { id: serial().primaryKey() });
export const inventory = pgTable("inventory", {
  id: serial().primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => accounts.id),
  templateId: text("template_id").notNull(),
  value: bigint({ mode: "number" }).notNull(),
  rarity: text().notNull(),
  serial: integer(),
  vaulted: boolean().notNull().default(false),
  tradeId: integer("trade_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const ledger = pgTable("ledger", {
  id: serial().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => accounts.id),
  amount: bigint({ mode: "number" }).notNull(),
  balance: bigint({ mode: "number" }).notNull(),
  reason: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const friends = pgTable("friends", {
  id: serial().primaryKey(),
  userA: text("user_a")
    .notNull()
    .references(() => accounts.id),
  userB: text("user_b")
    .notNull()
    .references(() => accounts.id),
});
export const rounds = pgTable("rounds", {
  id: bigint({ mode: "number" }).primaryKey(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  winnerId: text("winner_id").references(() => accounts.id),
  total: bigint({ mode: "number" }).notNull().default(0),
  settled: boolean().notNull().default(false),
});
export const wagers = pgTable("wagers", {
  id: serial().primaryKey(),
  roundId: bigint("round_id", { mode: "number" })
    .notNull()
    .references(() => rounds.id),
  userId: text("user_id")
    .notNull()
    .references(() => accounts.id),
  amount: bigint({ mode: "number" }).notNull(),
});
export const tables = pgTable("friend_tables", {
  id: serial().primaryKey(),
  code: text().notNull().unique(),
  hostId: text("host_id")
    .notNull()
    .references(() => accounts.id),
  guestId: text("guest_id").references(() => accounts.id),
  stake: bigint({ mode: "number" }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  winnerId: text("winner_id").references(() => accounts.id),
  settled: boolean().notNull().default(false),
});
export const trades = pgTable("trades", {
  id: serial().primaryKey(),
  userA: text("user_a")
    .notNull()
    .references(() => accounts.id),
  userB: text("user_b")
    .notNull()
    .references(() => accounts.id),
  offerA: jsonb("offer_a").$type<number[]>().notNull().default([]),
  offerB: jsonb("offer_b").$type<number[]>().notNull().default([]),
  confirmA: boolean("confirm_a").notNull().default(false),
  confirmB: boolean("confirm_b").notNull().default(false),
  status: text().notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

