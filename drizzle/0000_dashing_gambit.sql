CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sub" varchar,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"role" varchar NOT NULL,
	"is_blocked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_sub_unique" UNIQUE("sub"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
