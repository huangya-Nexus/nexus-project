-- CreateTable
CREATE TABLE "graph_shares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shareToken" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'read',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "cloneCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "graphId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "graph_shares_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "knowledge_graphs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "graph_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "graph_shares_shareToken_key" ON "graph_shares"("shareToken");

-- CreateIndex
CREATE INDEX "graph_shares_shareToken_idx" ON "graph_shares"("shareToken");

-- CreateIndex
CREATE INDEX "graph_shares_userId_idx" ON "graph_shares"("userId");

-- CreateIndex
CREATE INDEX "graph_shares_graphId_idx" ON "graph_shares"("graphId");
