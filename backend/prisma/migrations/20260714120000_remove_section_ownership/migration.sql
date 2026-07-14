-- Remove the SectionOwnership feature (author now designates the post owner
-- via assignee; no section->owner mapping or Founder fallback).
DROP TABLE IF EXISTS "SectionOwnership";
