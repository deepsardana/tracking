import { PrismaClient, TransactionType, PaymentMode, DeviceStatus } from '@prisma/client';

const prisma = new PrismaClient();

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function imei(seed: number) {
  return String(860000000000000 + seed).padStart(15, '0');
}

function vltdSerial(n: number) {
  return `HKT${String(n).padStart(6, '0')}`;
}

async function main() {
  console.log('Seeding database...');

  // ── Customers ─────────────────────────────────────────────────────────────
  const customerData = [
    { name: 'Rajesh Transport Co.', phone: '9876543210' },
    { name: 'Sharma Logistics Pvt Ltd', phone: '9811223344' },
    { name: 'Haryana Roadways Depot', phone: '9988776655' },
    { name: 'Gupta Fleet Services', phone: '9765432100' },
    { name: 'Delhi NCR Carriers', phone: '9654321098' },
    { name: 'Verma Auto Traders', phone: '9543210987' },
    { name: 'Singh Brothers Transport', phone: '9432109876' },
    { name: 'Kumar Express Pvt Ltd', phone: '9321098765' },
    { name: 'Yadav Goods Movers', phone: '9210987654' },
    { name: 'Patel Freight Solutions', phone: '9109876543' },
  ];

  const customers = await Promise.all(
    customerData.map(d => prisma.customer.create({ data: d }))
  );
  console.log(`Created ${customers.length} customers`);

  // ── Device Inventory ───────────────────────────────────────────────────────
  const devices = [];
  for (let i = 1; i <= 40; i++) {
    devices.push(
      await prisma.deviceInventory.create({
        data: {
          vltdSerialNo: vltdSerial(i),
          imeiNo: imei(1000 + i),
          deviceNo: `DEV${String(i).padStart(4, '0')}`,
          iccid: `89914400000${String(i).padStart(5, '0')}`,
          billingCompany: 'HK TRADING HOUSE',
          dispatchCustomer: i <= 20 ? randomFrom(customers).name : null,
          pcba: `PCBA${String(i).padStart(5, '0')}`,
          scanBy: 'ankit',
          status: i <= 25 ? DeviceStatus.BILLED : DeviceStatus.AVAILABLE,
        },
      })
    );
  }
  console.log(`Created ${devices.length} devices`);

  const vehicleIds = [
    'HR26BX1234', 'HR26CY5678', 'UP14AZ9012', 'UP16BK3456', 'DL01AB7890',
    'DL03CD1122', 'HR29DX3344', 'UP32EZ5566', 'HR12FY7788', 'UP78GK9900',
    'DL07HB1234', 'HR55JC5678', 'UP88KD9012', 'DL10LF3456', 'HR22MB7890',
    'UP45NC1122', 'HR38PD3344', 'DL15QE5566', 'UP60RF7788', 'HR47SD9900',
  ];

  const billItems = [
    { description: 'VLTD Device (AIS 140 Certified)', hsn: '85269190', unitPrice: 4500, quantity: 1 },
    { description: 'SIM Card & Data Plan (1 Year)', hsn: '99849090', unitPrice: 600, quantity: 1 },
    { description: 'Installation Charges', hsn: '99871900', unitPrice: 400, quantity: 1 },
  ];

  // ── Bills & Transactions ───────────────────────────────────────────────────
  const GST = 0.18;
  let deviceIndex = 0;
  let invoiceCounter = 1;

  for (const customer of customers) {
    const billCount = randomInt(1, 3);

    for (let b = 0; b < billCount; b++) {
      if (deviceIndex >= 25) break; // only use BILLED devices

      const device = devices[deviceIndex++];
      const vehicle = randomFrom(vehicleIds);
      const billDaysAgo = randomInt(5, 180);
      const billDate = daysAgo(billDaysAgo);

      // Build items for this bill
      const selectedItems = billItems.map(item => {
        const amount = Number(item.unitPrice) * Number(item.quantity);
        const rateInclTax = Number(item.unitPrice) * (1 + GST);
        return { ...item, amount, rateInclTax };
      });

      const subtotal = selectedItems.reduce((s, i) => s + i.amount, 0);
      const gstAmount = subtotal * GST;
      const totalAmount = subtotal + gstAmount;

      const invoiceNo = `HKT${String(invoiceCounter++).padStart(4, '0')}`;

      const bill = await prisma.bill.create({
        data: {
          customerId: customer.id,
          billDate,
          invoiceNo,
          vehicleId: vehicle,
          vltdSerialNo: device.vltdSerialNo,
          vltdImeiNo: device.imeiNo,
          deviceId: device.deviceNo ?? device.vltdSerialNo,
          inventoryDeviceId: device.id,
          subtotal,
          gstAmount,
          totalAmount,
          notes: 'AIS 140 compliant VLTD installation',
          items: {
            create: selectedItems.map(item => ({
              description: item.description,
              hsn: item.hsn,
              quantity: item.quantity,
              per: 'PCS',
              unitPrice: item.unitPrice,
              rateInclTax: item.rateInclTax,
              discPercent: 0,
              amount: item.amount,
            })),
          },
        },
      });

      // Payment transaction for this bill (CR = money received)
      const paymentModes: PaymentMode[] = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'];
      const paidFull = Math.random() > 0.3;

      await prisma.transaction.create({
        data: {
          customerId: customer.id,
          type: TransactionType.CR,
          amount: paidFull ? totalAmount : totalAmount * 0.5,
          date: new Date(billDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days after bill
          description: `Payment for invoice ${invoiceNo}`,
          paymentMode: randomFrom(paymentModes),
          deviceId: device.deviceNo ?? device.vltdSerialNo,
          vehicleId: vehicle,
        },
      });

      // If partial payment, add a pending balance DR entry
      if (!paidFull) {
        await prisma.transaction.create({
          data: {
            customerId: customer.id,
            type: TransactionType.DR,
            amount: totalAmount * 0.5,
            date: billDate,
            description: `Balance due for invoice ${invoiceNo}`,
            paymentMode: 'BANK_TRANSFER',
            deviceId: device.deviceNo ?? device.vltdSerialNo,
            vehicleId: vehicle,
          },
        });
      }
    }

    // Add 1-2 standalone transactions per customer (maintenance, renewal, etc.)
    const extras = randomInt(1, 2);
    for (let t = 0; t < extras; t++) {
      await prisma.transaction.create({
        data: {
          customerId: customer.id,
          type: randomFrom([TransactionType.CR, TransactionType.DR] as TransactionType[]),
          amount: randomInt(200, 2000),
          date: daysAgo(randomInt(1, 60)),
          description: randomFrom([
            'SIM renewal charges',
            'Annual maintenance contract',
            'Device replacement - damaged',
            'Advance payment',
            'Refund adjustment',
          ]),
          paymentMode: randomFrom(['CASH', 'UPI', 'BANK_TRANSFER'] as PaymentMode[]),
          deviceId: `DEV${String(randomInt(1, 40)).padStart(4, '0')}`,
          vehicleId: randomFrom(vehicleIds),
        },
      });
    }
  }

  const billCount = await prisma.bill.count();
  const txCount = await prisma.transaction.count();
  console.log(`Created ${billCount} bills, ${txCount} transactions`);
  console.log('Done!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
