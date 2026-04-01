-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_knowledge_graphs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "nodeCount" INTEGER NOT NULL DEFAULT 0,
    "edgeCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "knowledge_graphs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_knowledge_graphs" ("createdAt", "description", "edgeCount", "id", "nodeCount", "status", "tags", "title", "updatedAt", "userId", "viewCount") SELECT "createdAt", "description", "edgeCount", "id", "nodeCount", "status", "tags", "title", "updatedAt", "userId", "viewCount" FROM "knowledge_graphs";
DROP TABLE "knowledge_graphs";
ALTER TABLE "new_knowledge_graphs" RENAME TO "knowledge_graphs";
CREATE INDEX "knowledge_graphs_userId_idx" ON "knowledge_graphs"("userId");
CREATE INDEX "knowledge_graphs_status_idx" ON "knowledge_graphs"("status");
CREATE INDEX "knowledge_graphs_userId_status_idx" ON "knowledge_graphs"("userId", "status");
CREATE INDEX "knowledge_graphs_isPublic_idx" ON "knowledge_graphs"("isPublic");
CREATE INDEX "knowledge_graphs_isPublic_status_idx" ON "knowledge_graphs"("isPublic", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
