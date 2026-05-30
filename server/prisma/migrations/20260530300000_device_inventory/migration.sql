-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('AVAILABLE', 'BILLED');

-- CreateTable
CREATE TABLE "DeviceInventory" (
    "id" TEXT NOT NULL,
    "vltdSerialNo" VARCHAR(40) NOT NULL,
    "imeiNo" VARCHAR(20) NOT NULL,
    "deviceNo" VARCHAR(20),
    "iccid" VARCHAR(25),
    "qrCode" VARCHAR(120),
    "billingCompany" VARCHAR(80),
    "dispatchCustomer" VARCHAR(80),
    "pcba" VARCHAR(40),
    "dispatchHex" VARCHAR(40),
    "scanBy" VARCHAR(40),
    "status" "DeviceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceInventory_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN "inventoryDeviceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DeviceInventory_vltdSerialNo_key" ON "DeviceInventory"("vltdSerialNo");
CREATE UNIQUE INDEX "Bill_inventoryDeviceId_key" ON "Bill"("inventoryDeviceId");

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_inventoryDeviceId_fkey" FOREIGN KEY ("inventoryDeviceId") REFERENCES "DeviceInventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
