-- AlterTable
ALTER TABLE "Bill" ADD COLUMN "invoiceNo" VARCHAR(40);
ALTER TABLE "Bill" ADD COLUMN "vltdSerialNo" VARCHAR(40);
ALTER TABLE "Bill" ADD COLUMN "vltdImeiNo" VARCHAR(20);

-- Backfill from existing columns
UPDATE "Bill" SET
  "invoiceNo" = COALESCE("vehicleId", 'INV-001'),
  "vltdSerialNo" = COALESCE("deviceId", 'PDD'),
  "vltdImeiNo" = '000000000000000'
WHERE "invoiceNo" IS NULL;

ALTER TABLE "Bill" ALTER COLUMN "invoiceNo" SET NOT NULL;
ALTER TABLE "Bill" ALTER COLUMN "vltdSerialNo" SET NOT NULL;
ALTER TABLE "Bill" ALTER COLUMN "vltdImeiNo" SET NOT NULL;
