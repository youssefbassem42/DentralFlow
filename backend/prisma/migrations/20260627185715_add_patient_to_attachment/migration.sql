-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "patientId" TEXT;

-- CreateIndex
CREATE INDEX "Attachment_patientId_idx" ON "Attachment"("patientId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
