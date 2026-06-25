/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `Profiles` table. All the data in the column will be lost.
  - You are about to drop the column `driverLicenseUrl` on the `Profiles` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceUrl` on the `Vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `plateImageUrl` on the `Vehicles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profiles" DROP COLUMN "avatarUrl",
DROP COLUMN "driverLicenseUrl",
ADD COLUMN     "driverLicense" TEXT,
ADD COLUMN     "photo" TEXT;

-- AlterTable
ALTER TABLE "Vehicles" DROP COLUMN "insuranceUrl",
DROP COLUMN "plateImageUrl",
ADD COLUMN     "insurance" TEXT;
