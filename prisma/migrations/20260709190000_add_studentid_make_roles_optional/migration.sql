-- AlterTable: Make role optional in Users
ALTER TABLE "Users" ALTER COLUMN "role" DROP NOT NULL;

-- AlterTable: Make role optional and add studentId in Profiles
ALTER TABLE "Profiles" ALTER COLUMN "role" DROP NOT NULL;
ALTER TABLE "Profiles" ALTER COLUMN "rate" SET DEFAULT 0;
ALTER TABLE "Profiles" ADD COLUMN "studentId" TEXT;

-- CreateIndex: Unique constraint for studentId
CREATE UNIQUE INDEX "Profiles_studentId_key" ON "Profiles"("studentId");
