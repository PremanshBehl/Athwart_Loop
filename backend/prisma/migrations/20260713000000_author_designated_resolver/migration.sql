-- Add check constraint to ensure 'IDEA' posts never have an assignee
ALTER TABLE "Post" ADD CONSTRAINT check_idea_no_assignee CHECK ("type" != 'IDEA' OR "assigneeId" IS NULL);
