CREATE TABLE "accounts" (
	"id" text PRIMARY KEY,
	"username" text NOT NULL UNIQUE,
	"friend_code" text NOT NULL UNIQUE,
	"balance" bigint DEFAULT 500 NOT NULL,
	"sold" bigint DEFAULT 0 NOT NULL,
	"packs" integer DEFAULT 0 NOT NULL,
	"pulled" integer DEFAULT 0 NOT NULL,
	"bot" boolean DEFAULT false NOT NULL,
	"last_heartbeat" timestamp with time zone,
	"active_seconds" integer DEFAULT 0 NOT NULL,
	"reward_day" text DEFAULT '' NOT NULL,
	"daily_reward" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alpha_pulls" (
	"id" serial PRIMARY KEY
);
--> statement-breakpoint
CREATE TABLE "friends" (
	"id" serial PRIMARY KEY,
	"user_a" text NOT NULL,
	"user_b" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY,
	"owner_id" text NOT NULL,
	"template_id" text NOT NULL,
	"value" bigint NOT NULL,
	"rarity" text NOT NULL,
	"serial" integer,
	"vaulted" boolean DEFAULT false NOT NULL,
	"trade_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"balance" bigint NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" bigint PRIMARY KEY,
	"ends_at" timestamp with time zone NOT NULL,
	"winner_id" text,
	"total" bigint DEFAULT 0 NOT NULL,
	"settled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friend_tables" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"host_id" text NOT NULL,
	"guest_id" text,
	"stake" bigint NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"winner_id" text,
	"settled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY,
	"user_a" text NOT NULL,
	"user_b" text NOT NULL,
	"offer_a" jsonb DEFAULT '[]' NOT NULL,
	"offer_b" jsonb DEFAULT '[]' NOT NULL,
	"confirm_a" boolean DEFAULT false NOT NULL,
	"confirm_b" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wagers" (
	"id" serial PRIMARY KEY,
	"round_id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"amount" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_a_accounts_id_fkey" FOREIGN KEY ("user_a") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_b_accounts_id_fkey" FOREIGN KEY ("user_b") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_owner_id_accounts_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_user_id_accounts_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_winner_id_accounts_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "friend_tables" ADD CONSTRAINT "friend_tables_host_id_accounts_id_fkey" FOREIGN KEY ("host_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "friend_tables" ADD CONSTRAINT "friend_tables_guest_id_accounts_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "friend_tables" ADD CONSTRAINT "friend_tables_winner_id_accounts_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_a_accounts_id_fkey" FOREIGN KEY ("user_a") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_b_accounts_id_fkey" FOREIGN KEY ("user_b") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "wagers" ADD CONSTRAINT "wagers_round_id_rounds_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id");--> statement-breakpoint
ALTER TABLE "wagers" ADD CONSTRAINT "wagers_user_id_accounts_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts"("id");