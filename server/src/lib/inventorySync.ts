import { DeviceStatus, Prisma } from '@prisma/client';
import { prisma } from '../db';

type Tx = Prisma.TransactionClient;

export async function assignDeviceToBill(
  tx: Tx,
  billId: string,
  inventoryDeviceId: string | null | undefined,
  previousDeviceId?: string | null,
) {
  if (previousDeviceId && previousDeviceId !== inventoryDeviceId) {
    await tx.deviceInventory.updateMany({
      where: { id: previousDeviceId, status: DeviceStatus.BILLED },
      data: { status: DeviceStatus.AVAILABLE },
    });
  }

  if (!inventoryDeviceId) return;

  const device = await tx.deviceInventory.findUnique({
    where: { id: inventoryDeviceId },
    include: { bill: { select: { id: true } } },
  });
  if (!device) throw new Error('Device not found in inventory');
  if (device.status === DeviceStatus.BILLED && device.bill?.id !== billId) {
    throw new Error('Device is already billed');
  }

  await tx.deviceInventory.update({
    where: { id: inventoryDeviceId },
    data: { status: DeviceStatus.BILLED },
  });
}

export async function releaseBillDevice(billId: string) {
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    select: { inventoryDeviceId: true },
  });
  if (!bill?.inventoryDeviceId) return;

  await prisma.deviceInventory.updateMany({
    where: { id: bill.inventoryDeviceId, status: DeviceStatus.BILLED },
    data: { status: DeviceStatus.AVAILABLE },
  });
}

export async function resolveInventoryDevice(
  inventoryDeviceId: string | null | undefined,
  vltdSerialNo: string,
  vltdImeiNo: string,
  billId?: string,
) {
  if (inventoryDeviceId) {
    const device = await prisma.deviceInventory.findUnique({
      where: { id: inventoryDeviceId },
      include: { bill: { select: { id: true } } },
    });
    if (!device) throw new Error('Selected device not found');
    if (device.status === DeviceStatus.BILLED && device.bill?.id !== billId) {
      throw new Error('Selected device is already billed');
    }
    return {
      inventoryDeviceId: device.id,
      vltdSerialNo: device.vltdSerialNo,
      vltdImeiNo: device.imeiNo,
    };
  }

  const bySerial = await prisma.deviceInventory.findUnique({
    where: { vltdSerialNo },
    include: { bill: { select: { id: true } } },
  });
  if (bySerial) {
    if (bySerial.status === DeviceStatus.BILLED && bySerial.bill?.id !== billId) {
      throw new Error('Device serial already billed in inventory');
    }
    if (bySerial.imeiNo !== vltdImeiNo) {
      throw new Error('IMEI does not match inventory record for this serial');
    }
    return {
      inventoryDeviceId: bySerial.id,
      vltdSerialNo: bySerial.vltdSerialNo,
      vltdImeiNo: bySerial.imeiNo,
    };
  }

  return { inventoryDeviceId: null, vltdSerialNo, vltdImeiNo };
}
