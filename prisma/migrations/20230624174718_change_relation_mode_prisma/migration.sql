-- DropForeignKey
ALTER TABLE "LeaderboardRow" DROP CONSTRAINT "LeaderboardRow_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_teamId_fkey";

-- CreateIndex
CREATE INDEX "LeaderboardRow_userId_idx" ON "LeaderboardRow"("userId");

-- CreateIndex
CREATE INDEX "User_teamId_idx" ON "User"("teamId");
