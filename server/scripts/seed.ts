import { PrismaClient, TransactionType, PaymentMode } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

const customers = [
  { name: 'Rajesh Kumar', phone: '9876543210' },
  { name: 'Priya Sharma', phone: '9812345678' },
  { name: 'Amit Verma', phone: '9898765432' },
  { name: 'Sunita Patel', phone: '9765432109' },
  { name: 'Vijay Singh', phone: '9654321098' },
  { name: 'Kavita Mehta', phone: '9543210987' },
  { name: 'Deepak Joshi', phone: '9432109876' },
  { name: 'Anita Gupta', phone: '9321098765' },
  { name: 'Rohit Yadav', phone: '9210987654' },
  { name: 'Neha Agarwal', phone: '9109876543' },
];

const descriptions = [
  'VLTD device installation',
  'Monthly service charge',
  'Advance payment',
  'Device repair',
  'Annual maintenance',
  'New connection fee',
  'GPS tracking fee',
  'SIM card charges',
  'Firmware upgrade',
  'Support visit charges',
];

const paymentModes = [PaymentMode.CASH, PaymentMode.UPI, PaymentMode.BANK_TRANSFER, PaymentMode.CHEQUE];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - randomBetween(0, daysBack));
  return d;
}

function randomPad(prefix: string, digits: number) {
  return prefix + String(randomBetween(1000, 9999)).padStart(digits, '0');
}

async function main() {
  console.log('Seeding customers...');
  const created = await Promise.all(
    customers.map(c => prisma.customer.create({ data: c }))
  );

  console.log('Seeding 50 transactions...');
  for (let i = 0; i < 50; i++) {
    const customer = created[i % created.length];
    await prisma.transaction.create({
      data: {
        customerId: customer.id,
        type: i % 3 === 0 ? TransactionType.CR : TransactionType.DR,
        amount: randomBetween(500, 15000),
        date: randomDate(180),
        description: descriptions[i % descriptions.length],
        paymentMode: paymentModes[i % paymentModes.length],
        deviceId: randomPad('DEV', 4),
        vehicleId: randomPad('MH12AB', 4),
      },
    });
  }

  console.log('Done — 10 customers, 50 transactions seeded.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
