-- CreateTable
CREATE TABLE "LeaderboardRow" (
    "leaderboardId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER,

    CONSTRAINT "LeaderboardRow_pkey" PRIMARY KEY ("leaderboardId","userId")
);

-- AddForeignKey
ALTER TABLE "LeaderboardRow" ADD CONSTRAINT "LeaderboardRow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
