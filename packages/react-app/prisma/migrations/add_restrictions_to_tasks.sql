-- Add restriction fields to Task table
ALTER TABLE "Task" ADD COLUMN "restrictionsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN "ageRestriction" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN "minAge" INTEGER;
ALTER TABLE "Task" ADD COLUMN "maxAge" INTEGER;
ALTER TABLE "Task" ADD COLUMN "genderRestriction" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN "gender" TEXT;
ALTER TABLE "Task" ADD COLUMN "countryRestriction" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN "countries" TEXT;

-- Add indexes for better query performance
CREATE INDEX "idx_task_restrictions" ON "Task"("restrictionsEnabled", "ageRestriction", "genderRestriction", "countryRestriction");
CREATE INDEX "idx_task_age_range" ON "Task"("minAge", "maxAge") WHERE "ageRestriction" = true;
CREATE INDEX "idx_task_gender" ON "Task"("gender") WHERE "genderRestriction" = true;
CREATE INDEX "idx_task_countries" ON "Task"("countries") WHERE "countryRestriction" = true; 