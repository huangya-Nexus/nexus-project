-- CreateIndex
CREATE INDEX "knowledge_edges_graphId_idx" ON "knowledge_edges"("graphId");

-- CreateIndex
CREATE INDEX "knowledge_edges_sourceId_idx" ON "knowledge_edges"("sourceId");

-- CreateIndex
CREATE INDEX "knowledge_edges_targetId_idx" ON "knowledge_edges"("targetId");

-- CreateIndex
CREATE INDEX "knowledge_graphs_userId_idx" ON "knowledge_graphs"("userId");

-- CreateIndex
CREATE INDEX "knowledge_graphs_status_idx" ON "knowledge_graphs"("status");

-- CreateIndex
CREATE INDEX "knowledge_graphs_userId_status_idx" ON "knowledge_graphs"("userId", "status");

-- CreateIndex
CREATE INDEX "knowledge_nodes_graphId_idx" ON "knowledge_nodes"("graphId");

-- CreateIndex
CREATE INDEX "knowledge_nodes_title_idx" ON "knowledge_nodes"("title");
