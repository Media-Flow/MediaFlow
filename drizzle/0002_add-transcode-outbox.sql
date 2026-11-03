CREATE TABLE "transcode_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar DEFAULT 'PENDING' NOT NULL,
	"retries" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"last_error" text
);
