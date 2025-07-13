-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "userName" TEXT NOT NULL,
    "fid" INTEGER,
    "totalEarned" BIGINT NOT NULL DEFAULT 0,
    "claimable" BIGINT NOT NULL DEFAULT 0,
    "walletAddress" TEXT NOT NULL,
    "smartAddress" TEXT,
    "isTester" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "subTaskId" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "reward" BIGINT NOT NULL DEFAULT 0,
    "ipfsHash" TEXT,
    "aiRating" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Taskers" (
    "id" SERIAL NOT NULL,
    "taskId" TEXT NOT NULL,
    "taskersArray" TEXT NOT NULL,

    CONSTRAINT "Taskers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
