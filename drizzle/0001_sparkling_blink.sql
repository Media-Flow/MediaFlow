CREATE TABLE "Media" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar(256) DEFAULT '' NOT NULL,
	"description" varchar(256) DEFAULT '' NOT NULL,
	"media_type" varchar,
	"total_parts" integer DEFAULT 0 NOT NULL,
	"upload_id" varchar,
	"source_key" varchar NOT NULL,
	"duration" integer,
	"media_size" bigint NOT NULL,
	"status" varchar NOT NULL,
	"isPrivate" boolean DEFAULT false NOT NULL,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"status_updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Media_source_key_unique" UNIQUE("source_key")
);
