import { PrismaClient, DeviceStatus } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

const GST = 18;

function round(v: number) {
  return Math.round(v * 100) / 100;
}

function calcTotals(unitPriceIncl: number, qty: number) {
  const factor = 1 + GST / 100;
  const unitPrice = round(unitPriceIncl / factor);
  const amount = round(unitPrice * qty);
  const lineTotalIncl = round(unitPriceIncl * qty);
  const subtotal = amount;
  const totalAmount = lineTotalIncl;
  const gstAmount = round(totalAmount - subtotal);
  return { unitPrice, rateInclTax: unitPriceIncl, amount, subtotal, gstAmount, totalAmount };
}

function pad(n: number) {
  return String(n).padStart(4, '0');
}

function fy() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const fyStart = month >= 4 ? year : year - 1;
  return `${String(fyStart).slice(-2)}-${String(fyStart + 1).slice(-2)}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'asc' } });
  if (customers.length === 0) {
    console.error('No customers found. Run seed.ts first.');
    process.exit(1);
  }

  // ── 20 inventory devices ──────────────────────────────────────────────────
  console.log('Seeding 20 inventory devices…');

  const deviceRows = Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    return {
      vltdSerialNo: `VLTD-HKT-${pad(1000 + n)}`,
      imeiNo: `86${String(900000000000 + n * 111111).slice(0, 12)}`,
      deviceNo: `DEV${pad(n)}`,
      iccid: `8991101${String(200000000000 + n).slice(0, 13)}`,
      billingCompany: 'HK TRADING HOUSE',
      status: DeviceStatus.AVAILABLE,
    };
  });

  const devices = await Promise.all(
    deviceRows.map((d) =>
      prisma.deviceInventory.upsert({
        where: { vltdSerialNo: d.vltdSerialNo },
        update: {},
        create: d,
      }),
    ),
  );

  console.log(`Created/found ${devices.length} devices.`);

  // ── 8 bills (first 8 devices get billed, last 12 stay AVAILABLE) ──────────
  console.log('Seeding 8 bills…');

  const billedDevices = devices.slice(0, 8);
  const prices = [5900, 6490, 5500, 6200, 5800, 6800, 5600, 6100]; // incl. GST

  const existingBillCount = await prisma.bill.count();

  for (let i = 0; i < billedDevices.length; i++) {
    const device = billedDevices[i];
    const customer = customers[i % customers.length];
    const priceIncl = prices[i];
    const { unitPrice, rateInclTax, amount, subtotal, gstAmount, totalAmount } = calcTotals(priceIncl, 1);
    const invoiceNo = `HKT/${fy()}/${pad(existingBillCount + i + 1)}`;
    const vehicleReg = `HR${String(10 + i).padStart(2, '0')}AB${pad(5000 + i)}`;

    const bill = await prisma.bill.create({
      data: {
        customerId: customer.id,
        billDate: daysAgo(90 - i * 10),
        invoiceNo,
        vehicleId: vehicleReg,
        vltdSerialNo: device.vltdSerialNo,
        vltdImeiNo: device.imeiNo,
        deviceId: device.deviceNo ?? device.vltdSerialNo.slice(0, 30),
        subtotal,
        gstAmount,
        totalAmount,
        notes: i % 3 === 0 ? 'AIS 140 compliance fitment' : null,
        items: {
          create: [
            {
              description: 'AIS 140 DEVICE 2G',
              hsn: '85269190',
              quantity: 1,
              per: 'PCS',
              unitPrice,
              rateInclTax,
              discPercent: 0,
              amount,
            },
          ],
        },
      },
    });

    // mark device as BILLED and link it
    await prisma.deviceInventory.update({
      where: { id: device.id },
      data: { status: DeviceStatus.BILLED, billedBillId: bill.id },
    });

    console.log(`  ${invoiceNo} — ${customer.name} — ₹${totalAmount}`);
  }

  console.log('\nDone — 20 devices (8 billed, 12 available), 8 bills.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
