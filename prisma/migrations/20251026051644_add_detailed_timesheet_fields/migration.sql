-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "bandoffice";

-- CreateEnum
CREATE TYPE "bandoffice"."UserRole" AS ENUM ('STAFF', 'STAFF_ADMIN', 'ADMIN', 'CHIEF_COUNCIL');

-- CreateEnum
CREATE TYPE "bandoffice"."Department" AS ENUM ('UTILITIES', 'FINANCE', 'HOUSING');

-- CreateEnum
CREATE TYPE "bandoffice"."TransportationType" AS ENUM ('PERSONAL_VEHICLE', 'PUBLIC_TRANSPORT_WINNIPEG', 'PUBLIC_TRANSPORT_THOMPSON', 'COMBINATION', 'OTHER');

-- CreateEnum
CREATE TYPE "bandoffice"."TravelFormStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ISSUED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "bandoffice"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department" "bandoffice"."Department" NOT NULL DEFAULT 'UTILITIES',
    "role" "bandoffice"."UserRole" NOT NULL DEFAULT 'STAFF',
    "pin" TEXT,
    "pinExpiresAt" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "passwordResetRequested" TIMESTAMP(3),
    "passwordResetCompleted" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bandoffice"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "access_token" TEXT,
    "refresh_token" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bandoffice"."SmsLog" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "recipients" TEXT[],
    "status" TEXT NOT NULL,
    "messageIds" TEXT[],
    "error" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SmsLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bandoffice"."EmailLog" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recipients" TEXT[],
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "error" TEXT,
    "attachments" JSONB,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bandoffice"."SatffEmailLog" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recipients" TEXT[],
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "error" TEXT,
    "attachments" JSONB,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SatffEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bandoffice"."MsgApiLog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'notice',
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "MsgApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bandoffice"."MsgCnC" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'notice',
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "MsgCnC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bandoffice"."Time_Sheets" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "submitted" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakDuration" INTEGER NOT NULL DEFAULT 0,
    "totalHours" DECIMAL(4,2) NOT NULL,
    "project" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Time_Sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bandoffice"."travel_forms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "reasonsForTravel" TEXT NOT NULL,
    "hotelRate" DECIMAL(10,2) NOT NULL,
    "hotelNights" INTEGER NOT NULL DEFAULT 0,
    "hotelTotal" DECIMAL(10,2) NOT NULL,
    "privateRate" DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    "privateNights" INTEGER NOT NULL DEFAULT 0,
    "privateTotal" DECIMAL(10,2) NOT NULL,
    "breakfastRate" DECIMAL(10,2) NOT NULL DEFAULT 20.50,
    "breakfastDays" INTEGER NOT NULL DEFAULT 0,
    "breakfastTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lunchRate" DECIMAL(10,2) NOT NULL DEFAULT 20.10,
    "lunchDays" INTEGER NOT NULL DEFAULT 0,
    "lunchTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dinnerRate" DECIMAL(10,2) NOT NULL DEFAULT 50.65,
    "dinnerDays" INTEGER NOT NULL DEFAULT 0,
    "dinnerTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "incidentalRate" DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    "incidentalDays" INTEGER NOT NULL DEFAULT 0,
    "incidentalTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "transportationType" "bandoffice"."TransportationType" NOT NULL DEFAULT 'PERSONAL_VEHICLE',
    "personalVehicleRate" DECIMAL(10,2) DEFAULT 0.50,
    "licensePlateNumber" TEXT,
    "oneWayWinnipegKm" INTEGER DEFAULT 904,
    "oneWayWinnipegTrips" INTEGER DEFAULT 0,
    "oneWayWinnipegTotal" DECIMAL(10,2) DEFAULT 0,
    "oneWayThompsonKm" INTEGER DEFAULT 150,
    "oneWayThompsonTrips" INTEGER DEFAULT 0,
    "oneWayThompsonTotal" DECIMAL(10,2) DEFAULT 0,
    "winnipegFlatRate" DECIMAL(10,2) DEFAULT 450.00,
    "thompsonFlatRate" DECIMAL(10,2) DEFAULT 100.00,
    "publicTransportTotal" DECIMAL(10,2) DEFAULT 0,
    "taxiFareRate" DECIMAL(10,2) DEFAULT 17.30,
    "taxiFareDays" INTEGER DEFAULT 0,
    "taxiFareTotal" DECIMAL(10,2) DEFAULT 0,
    "parkingTotal" DECIMAL(10,2) DEFAULT 0,
    "parkingReceipts" BOOLEAN NOT NULL DEFAULT false,
    "grandTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "bandoffice"."TravelFormStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT NOT NULL,
    "submittedDate" TIMESTAMP(3),
    "authorizedBy" TEXT,
    "authorizedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "travel_forms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "bandoffice"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "bandoffice"."Session"("sessionToken");

-- AddForeignKey
ALTER TABLE "bandoffice"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "bandoffice"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bandoffice"."SmsLog" ADD CONSTRAINT "SmsLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "bandoffice"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bandoffice"."EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "bandoffice"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bandoffice"."SatffEmailLog" ADD CONSTRAINT "SatffEmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "bandoffice"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bandoffice"."MsgApiLog" ADD CONSTRAINT "MsgApiLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "bandoffice"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bandoffice"."MsgCnC" ADD CONSTRAINT "MsgCnC_userId_fkey" FOREIGN KEY ("userId") REFERENCES "bandoffice"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bandoffice"."Time_Sheets" ADD CONSTRAINT "Time_Sheets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "bandoffice"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bandoffice"."travel_forms" ADD CONSTRAINT "travel_forms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "bandoffice"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
