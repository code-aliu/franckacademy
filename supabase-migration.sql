-- FranckAcademy Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Paste → Run

-- Enums
CREATE TYPE "Subject" AS ENUM ('MATHEMATICS', 'PHYSICS', 'CHEMISTRY', 'ENGLISH');
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- Users
CREATE TABLE "users" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "supabase_id"  TEXT NOT NULL UNIQUE,
  "email"        TEXT NOT NULL UNIQUE,
  "full_name"    TEXT NOT NULL,
  "avatar_url"   TEXT,
  "grade"        TEXT,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student profiles
CREATE TABLE "student_profiles" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "user_id"         TEXT NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "weak_subjects"   "Subject"[] NOT NULL DEFAULT '{}',
  "strong_subjects" "Subject"[] NOT NULL DEFAULT '{}',
  "learning_style"  TEXT,
  "total_sessions"  INTEGER NOT NULL DEFAULT 0,
  "total_questions" INTEGER NOT NULL DEFAULT 0,
  "streak_days"     INTEGER NOT NULL DEFAULT 0,
  "last_active_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversations
CREATE TABLE "conversations" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "user_id"     TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "subject"     "Subject" NOT NULL,
  "title"       TEXT,
  "is_archived" BOOLEAN NOT NULL DEFAULT false,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "conversations_user_id_subject_idx" ON "conversations"("user_id", "subject");
CREATE INDEX "conversations_user_id_created_at_idx" ON "conversations"("user_id", "created_at");

-- Messages
CREATE TABLE "messages" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "conversation_id" TEXT NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "role"            "MessageRole" NOT NULL,
  "content"         TEXT NOT NULL,
  "metadata"        JSONB,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- Homework submissions
CREATE TABLE "homework_submissions" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "user_id"         TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "conversation_id" TEXT NOT NULL UNIQUE REFERENCES "conversations"("id") ON DELETE CASCADE,
  "subject"         "Subject" NOT NULL,
  "raw_image_url"   TEXT,
  "extracted_text"  TEXT,
  "ocr_confidence"  FLOAT,
  "processed_text"  TEXT,
  "status"          "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "homework_submissions_user_id_subject_idx" ON "homework_submissions"("user_id", "subject");

-- Subject progress
CREATE TABLE "subject_progress" (
  "id"                   TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "user_id"              TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "subject"              "Subject" NOT NULL,
  "questions_asked"      INTEGER NOT NULL DEFAULT 0,
  "sessions_count"       INTEGER NOT NULL DEFAULT 0,
  "avg_hints_used"       FLOAT NOT NULL DEFAULT 0,
  "topics_encountered"   TEXT[] NOT NULL DEFAULT '{}',
  "weak_topics"          TEXT[] NOT NULL DEFAULT '{}',
  "last_studied_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("user_id", "subject")
);

CREATE INDEX "subject_progress_user_id_idx" ON "subject_progress"("user_id");

-- Prisma migration tracking table
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "checksum"          TEXT NOT NULL,
  "finished_at"       TIMESTAMPTZ,
  "migration_name"    TEXT NOT NULL,
  "logs"              TEXT,
  "rolled_back_at"    TIMESTAMPTZ,
  "started_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER student_profiles_updated_at BEFORE UPDATE ON "student_profiles"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON "conversations"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER homework_submissions_updated_at BEFORE UPDATE ON "homework_submissions"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subject_progress_updated_at BEFORE UPDATE ON "subject_progress"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
