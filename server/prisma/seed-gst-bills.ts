import { PrismaClient, DeviceStatus } from '@prisma/client';

const prisma = new PrismaClient();

const GST = 0.18;

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function money(n: number) {
  return Math.round(n * 100) / 100;
}

const billsToCreate = [
  {
    customerName: 'Haryana Roadways Depot',
    customerGst: '06AABCH1234K1Z5',
    vehicleIds: ['HR26BX9901', 'HR26BX9902'],
    invoiceNo: 'HKT/26-27/0022',
    daysAgo: 3,
    deviceCount: 2,
  },
  {
    customerName: 'Sharma Logistics Pvt Ltd',
    customerGst: '06AABCS5678M1Z2',
    vehicleIds: ['HR55JC0011'],
    invoiceNo: 'HKT/26-27/0023',
    daysAgo: 7,
    deviceCount: 1,
  },
  {
    customerName: 'Delhi NCR Carriers',
    customerGst: '07AABCD9012N1Z8',
    vehicleIds: ['DL01AB4401', 'DL01AB4402', 'DL01AB4403'],
    invoiceNo: 'HKT/26-27/0024',
    daysAgo: 12,
    deviceCount: 3,
  },
  {
    customerName: 'Kumar Express Pvt Ltd',
    customerGst: '06AABCK3456P1Z1',
    vehicleIds: ['HR29DX7700'],
    invoiceNo: 'HKT/26-27/0025',
    daysAgo: 18,
    deviceCount: 1,
  },
  {
    customerName: 'Gupta Fleet Services',
    customerGst: '06AABCG7890Q1Z4',
    vehicleIds: ['HR12FY5500', 'HR12FY5501'],
    invoiceNo: 'HKT/26-27/0026',
    daysAgo: 25,
    deviceCount: 2,
  },
];

async function main() {
  const availableDevices = await prisma.deviceInventory.findMany({
    where: { status: DeviceStatus.AVAILABLE },
    orderBy: { vltdSerialNo: 'asc' },
  });

  if (availableDevices.length < 9) {
    throw new Error(`Need at least 9 available devices, found ${availableDevices.length}`);
  }

  let deviceCursor = 0;

  for (const spec of billsToCreate) {
    const customer = await prisma.customer.findFirst({ where: { name: spec.customerName } });
    if (!customer) throw new Error(`Customer not found: ${spec.customerName}`);

    const devices = availableDevices.slice(deviceCursor, deviceCursor + spec.deviceCount);
    deviceCursor += spec.deviceCount;

    const unitPrice = 4500;
    const rateInclTax = money(unitPrice * (1 + GST));
    const subtotal = money(unitPrice * spec.deviceCount);
    const gstAmount = money(subtotal * GST);
    const totalAmount = money(subtotal + gstAmount);

    const bill = await prisma.$transaction(async (tx) => {
      const created = await tx.bill.create({
        data: {
          customerId: customer.id,
          billDate: daysAgo(spec.daysAgo),
          invoiceNo: spec.invoiceNo,
          vehicleId: spec.vehicleIds.join('\n'),
          vltdSerialNo: devices.map(d => d.vltdSerialNo).join('\n'),
          vltdImeiNo: devices.map(d => d.imeiNo).join('\n'),
          deviceId: devices[0].deviceNo ?? devices[0].vltdSerialNo,
          inventoryDeviceId: devices[0].id,
          customerGst: spec.customerGst,
          subtotal,
          gstAmount,
          totalAmount,
          notes: 'AIS 140 compliant VLTD installation',
          items: {
            create: [{
              description: 'AIS 140 DEVICE 2G',
              hsn: '85269190',
              quantity: spec.deviceCount,
              per: 'PCS',
              unitPrice,
              rateInclTax,
              discPercent: 0,
              amount: subtotal,
            }],
          },
        },
      });

      // Link additional devices
      if (devices.length > 1) {
        await tx.deviceInventory.updateMany({
          where: { id: { in: devices.map(d => d.id) } },
          data: { status: DeviceStatus.BILLED, billedBillId: created.id },
        });
      } else {
        await tx.deviceInventory.update({
          where: { id: devices[0].id },
          data: { status: DeviceStatus.BILLED },
        });
      }

      return created;
    });

    console.log(`Created bill ${bill.invoiceNo} for ${spec.customerName} | GST: ${spec.customerGst} | devices: ${devices.map(d => d.vltdSerialNo).join(', ')}`);
  }

  console.log('\nDone! Created 5 bills with customer GSTIN.');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
