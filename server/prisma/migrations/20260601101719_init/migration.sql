-- DropIndex
DROP INDEX "DeviceInventory_billedBillId_idx";

-- AlterTable
ALTER TABLE "BillItem" ALTER COLUMN "rateInclTax" DROP DEFAULT;
