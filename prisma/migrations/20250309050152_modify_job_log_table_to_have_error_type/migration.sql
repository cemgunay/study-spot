/*
  Warnings:

  - Added the required column `errorType` to the `JobLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ErrorType" AS ENUM ('SUCCESS', 'ERROR');

-- AlterTable
ALTER TABLE "JobLog" ADD COLUMN     "errorType" "ErrorType" NOT NULL;
