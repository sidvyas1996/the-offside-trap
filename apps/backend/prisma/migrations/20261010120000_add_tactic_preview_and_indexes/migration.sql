-- AlterTable
ALTER TABLE "tactics" ADD COLUMN     "preview" JSONB;

-- CreateIndex
CREATE INDEX "tactics_created_at_idx" ON "tactics"("created_at" DESC);

-- CreateIndex
CREATE INDEX "tactics_author_id_idx" ON "tactics"("author_id");

-- CreateIndex
CREATE INDEX "likes_tactic_id_idx" ON "likes"("tactic_id");

-- CreateIndex
CREATE INDEX "comments_tactic_id_idx" ON "comments"("tactic_id");

-- CreateIndex
CREATE INDEX "saves_tactic_id_idx" ON "saves"("tactic_id");
