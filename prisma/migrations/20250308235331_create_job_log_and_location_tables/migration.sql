-- CreateTable
CREATE TABLE "JobLog" (
    "id" SERIAL NOT NULL,
    "jobName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "googlePlaceId" TEXT NOT NULL,
    "profilePicture" TEXT,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_googlePlaceId_key" ON "Location"("googlePlaceId");
