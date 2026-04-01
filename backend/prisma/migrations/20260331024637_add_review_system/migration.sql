-- CreateTable
CREATE TABLE "review_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "dueDate" DATETIME NOT NULL,
    "lastReviewedAt" DATETIME,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "nodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "graphId" TEXT NOT NULL,
    CONSTRAINT "review_cards_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "knowledge_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_cards_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "knowledge_graphs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "review_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "easeFactor" REAL NOT NULL,
    "interval" INTEGER NOT NULL,
    "repetitions" INTEGER NOT NULL,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "review_logs_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "review_cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "review_cards_userId_idx" ON "review_cards"("userId");

-- CreateIndex
CREATE INDEX "review_cards_nodeId_idx" ON "review_cards"("nodeId");

-- CreateIndex
CREATE INDEX "review_cards_graphId_idx" ON "review_cards"("graphId");

-- CreateIndex
CREATE INDEX "review_cards_dueDate_idx" ON "review_cards"("dueDate");

-- CreateIndex
CREATE INDEX "review_cards_userId_dueDate_idx" ON "review_cards"("userId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "review_cards_userId_nodeId_key" ON "review_cards"("userId", "nodeId");

-- CreateIndex
CREATE INDEX "review_logs_cardId_idx" ON "review_logs"("cardId");

-- CreateIndex
CREATE INDEX "review_logs_userId_idx" ON "review_logs"("userId");

-- CreateIndex
CREATE INDEX "review_logs_createdAt_idx" ON "review_logs"("createdAt");
