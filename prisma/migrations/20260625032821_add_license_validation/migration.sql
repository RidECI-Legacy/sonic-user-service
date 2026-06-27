-- CreateEnum
CREATE TYPE "LicenseValidation" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "Profiles" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "driverLicenseUrl" TEXT,
ADD COLUMN     "licenseValidation" "LicenseValidation" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vehicles" ADD COLUMN     "insuranceUrl" TEXT,
ADD COLUMN     "plateImageUrl" TEXT;
