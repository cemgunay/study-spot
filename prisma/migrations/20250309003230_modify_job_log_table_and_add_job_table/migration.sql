/*
  Warnings:

  - You are about to drop the column `jobName` on the `JobLog` table. All the data in the column will be lost.
  - You are about to drop the column `runAt` on the `JobLog` table. All the data in the column will be lost.
  - Added the required column `jobId` to the `JobLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JobLog" DROP COLUMN "jobName",
DROP COLUMN "runAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "jobId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobLog" ADD CONSTRAINT "JobLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
