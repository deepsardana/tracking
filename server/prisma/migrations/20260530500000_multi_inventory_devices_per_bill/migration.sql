ALTER TABLE "DeviceInventory" ADD COLUMN "billedBillId" TEXT;

UPDATE "DeviceInventory" AS d
SET "billedBillId" = b."id"
FROM "Bill" AS b
WHERE b."inventoryDeviceId" = d."id";

CREATE INDEX "DeviceInventory_billedBillId_idx" ON "DeviceInventory"("billedBillId");

ALTER TABLE "DeviceInventory"
ADD CONSTRAINT "DeviceInventory_billedBillId_fkey"
FOREIGN KEY ("billedBillId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
