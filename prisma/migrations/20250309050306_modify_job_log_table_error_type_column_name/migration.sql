/*
  Warnings:

  - You are about to drop the column `errorType` on the `JobLog` table. All the data in the column will be lost.
  - Added the required column `logType` to the `JobLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('SUCCESS', 'ERROR');

-- AlterTable
ALTER TABLE "JobLog" DROP COLUMN "errorType",
ADD COLUMN     "logType" "LogType" NOT NULL;

-- DropEnum
DROP TYPE "ErrorType";
