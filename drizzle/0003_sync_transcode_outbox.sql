ALTER TABLE "transcode_outbox" ADD COLUMN "media_id" uuid;--> statement-breakpoint
UPDATE "transcode_outbox" SET "media_id" = ("payload"->>'MediaId')::uuid WHERE "media_id" IS NULL;--> statement-breakpoint
ALTER TABLE "transcode_outbox" ALTER COLUMN "media_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transcode_outbox" ADD COLUMN "failed_at" timestamp;--> statement-breakpoint
ALTER TABLE "transcode_outbox" DROP COLUMN "event_type";
