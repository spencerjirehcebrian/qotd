-- AlterTable
ALTER TABLE "questions" ADD COLUMN "textNorm" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "questions_textNorm_key" ON "questions"("textNorm");
