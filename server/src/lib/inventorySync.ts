import { DeviceStatus, Prisma } from '@prisma/client';
import { prisma } from '../db';

type Tx = Prisma.TransactionClient;

function uniqueIds(ids: (string | null | undefined)[]) {
  return [...new Set(ids.map((id) => id?.trim()).filter(Boolean) as string[])];
}

export async function assignDevicesToBill(
  tx: Tx,
  billId: string,
  inventoryDeviceIds: string[],
  previousDeviceIds: string[] = [],
) {
  const selectedIds = uniqueIds(inventoryDeviceIds);
  const previousIds = uniqueIds(previousDeviceIds);
  const releaseIds = previousIds.filter((id) => !selectedIds.includes(id));

  if (releaseIds.length > 0) {
    await tx.deviceInventory.updateMany({
      where: { id: { in: releaseIds }, status: DeviceStatus.BILLED },
      data: { status: DeviceStatus.AVAILABLE, billedBillId: null },
    });
  }

  if (selectedIds.length === 0) return;

  const devices = await tx.deviceInventory.findMany({
    where: { id: { in: selectedIds } },
    include: {
      bill: { select: { id: true } },
      billedBill: { select: { id: true } },
    },
  });

  if (devices.length !== selectedIds.length) {
    throw new Error('One or more selected inventory devices were not found');
  }

  for (const device of devices) {
    const belongsToThisBill = device.bill?.id === billId || device.billedBill?.id === billId;
    if (device.status === DeviceStatus.BILLED && !belongsToThisBill) {
      throw new Error(`${device.vltdSerialNo} is already billed`);
    }
  }

  await tx.deviceInventory.updateMany({
    where: { id: { in: selectedIds } },
    data: { status: DeviceStatus.BILLED, billedBillId: billId },
  });
}

export async function releaseBillDevices(billId: string) {
  await prisma.deviceInventory.updateMany({
    where: {
      OR: [
        { billedBillId: billId },
        { bill: { id: billId } },
      ],
      status: DeviceStatus.BILLED,
    },
    data: { status: DeviceStatus.AVAILABLE, billedBillId: null },
  });
}

export async function resolveInventoryDevices(
  inventoryDeviceIds: string[],
  vltdSerialNo: string,
  vltdImeiNo: string,
  billId?: string,
) {
  const selectedIds = uniqueIds(inventoryDeviceIds);

  if (selectedIds.length > 0) {
    const devices = await prisma.deviceInventory.findMany({
      where: { id: { in: selectedIds } },
      include: {
        bill: { select: { id: true } },
        billedBill: { select: { id: true } },
      },
    });

    if (devices.length !== selectedIds.length) {
      throw new Error('One or more selected inventory devices were not found');
    }

    for (const device of devices) {
      const belongsToThisBill = device.bill?.id === billId || device.billedBill?.id === billId;
      if (device.status === DeviceStatus.BILLED && !belongsToThisBill) {
        throw new Error(`${device.vltdSerialNo} is already billed`);
      }
    }

    const ordered = selectedIds
      .map((id) => devices.find((device) => device.id === id))
      .filter(Boolean) as typeof devices;

    return {
      inventoryDeviceId: ordered[0]?.id ?? null,
      inventoryDeviceIds: ordered.map((device) => device.id),
      vltdSerialNo: ordered.map((device) => device.vltdSerialNo).join('\\n'),
      vltdImeiNo: ordered.map((device) => device.imeiNo).join('\\n'),
    };
  }

  return {
    inventoryDeviceId: null,
    inventoryDeviceIds: [],
    vltdSerialNo: vltdSerialNo.trim(),
    vltdImeiNo: vltdImeiNo.trim(),
  };
}
