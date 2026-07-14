-- CreateTable
CREATE TABLE "Ratings" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "ratedUserId" TEXT NOT NULL,
    "role" "ProfileRole" NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ratings_tripId_raterId_key" ON "Ratings"("tripId", "raterId");

-- AddForeignKey
ALTER TABLE "Ratings" ADD CONSTRAINT "Ratings_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ratings" ADD CONSTRAINT "Ratings_ratedUserId_fkey" FOREIGN KEY ("ratedUserId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
