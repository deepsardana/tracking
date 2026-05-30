# Customer Data Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal internal admin dashboard for managing customers and their debit/credit transactions, with hardcoded JWT auth, customer/transaction CRUD, and summary views.

**Architecture:** Monorepo with two sub-packages — `client/` (React + Vite + React Query) and `server/` (Express + Prisma + PostgreSQL). Root `package.json` orchestrates both with `concurrently`. JWT stored in localStorage; all `/api/*` routes (except login) require Bearer token.

**Tech Stack:** Node.js 20+, React 18, Vite, TypeScript, Express, Prisma, PostgreSQL, TanStack Query v5, React Hook Form, Tailwind CSS, Axios, jsonwebtoken.

**Prerequisites:**
- PostgreSQL is installed locally and accessible
- Node.js 20+ installed
- The working directory is `/Users/ankitbhardwaj/Desktop/Practice/my-app`

---

## File Structure

```
my-app/
├── package.json                          # root: concurrently runs both
├── .gitignore
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                              # DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
│   ├── .env.example
│   ├── prisma/
│   │   └── schema.prisma                 # Customer + Transaction models
│   └── src/
│       ├── index.ts                      # express app entry
│       ├── db.ts                         # prisma client instance
│       ├── middleware/
│       │   └── jwtAuth.ts                # bearer token verification
│       └── routes/
│           ├── auth.ts                   # POST /login
│           ├── customers.ts              # CRUD + /summary
│           ├── transactions.ts           # CRUD (with filters)
│           └── dashboard.ts              # GET /summary (overall totals)
│
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.tsx                      # router + query provider
        ├── App.tsx                       # route definitions
        ├── index.css                     # tailwind directives
        ├── api/
        │   ├── axios.ts                  # configured axios instance
        │   ├── auth.ts                   # login mutation
        │   ├── customers.ts              # customer queries/mutations
        │   ├── transactions.ts           # transaction queries/mutations
        │   └── dashboard.ts              # dashboard summary query
        ├── context/
        │   └── AuthContext.tsx           # JWT state, login, logout
        ├── components/
        │   ├── Sidebar.tsx
        │   ├── ProtectedRoute.tsx
        │   ├── Modal.tsx
        │   ├── StatCard.tsx
        │   ├── CustomerForm.tsx
        │   └── TransactionForm.tsx
        └── pages/
            ├── LoginPage.tsx
            ├── DashboardPage.tsx
            ├── CustomerSummaryPage.tsx
            ├── CustomersPage.tsx
            └── TransactionsPage.tsx
```

---

## Task 1: Initialize root monorepo and tooling

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: Create root `package.json`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/package.json`:

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently -n server,client -c blue,green \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "install:all": "npm install && npm install --prefix server && npm install --prefix client",
    "db:migrate": "npm run prisma:migrate --prefix server",
    "db:generate": "npm run prisma:generate --prefix server"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/.gitignore`:

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
client/dist/
server/dist/
```

- [ ] **Step 3: Install root deps**

Run: `npm install`
Expected: installs `concurrently` into root `node_modules`.

- [ ] **Step 4: Commit**

```bash
git init
git add package.json .gitignore
git commit -m "chore: initialize monorepo root"
```

---

## Task 2: Initialize server package with Express + TypeScript

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`
- Create: `server/.env.example`
- Create: `server/.env`

- [ ] **Step 1: Create `server/package.json`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/package.json`:

```json
{
  "name": "server",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "^5.20.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^22.7.4",
    "prisma": "^5.20.0",
    "tsx": "^4.19.1",
    "typescript": "^5.6.2"
  }
}
```

- [ ] **Step 2: Create `server/tsconfig.json`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `server/.env.example` and `server/.env`**

Create both files at `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/.env.example` and `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/customer_db?schema=public"
JWT_SECRET="supersecretkey_change_me"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
PORT=4000
```

- [ ] **Step 4: Create minimal `server/src/index.ts`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 5: Install server deps**

Run: `npm install --prefix server`
Expected: installs all server dependencies.

- [ ] **Step 6: Verify server boots**

Run: `npm run dev --prefix server` (let it run for 3 seconds, then ^C)
Expected output contains: `Server running on http://localhost:4000`

In another terminal: `curl http://localhost:4000/api/health`
Expected: `{"status":"ok"}`

- [ ] **Step 7: Commit**

```bash
git add server/package.json server/tsconfig.json server/.env.example server/src/index.ts
git commit -m "feat(server): scaffold express + typescript server"
```

---

## Task 3: Set up Prisma schema and run initial migration

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/src/db.ts`

**Prerequisite:** PostgreSQL is running locally. Create database first:

```bash
createdb customer_db
```

(If `createdb` is not available, run `psql -U postgres -c "CREATE DATABASE customer_db;"`)

- [ ] **Step 1: Create `server/prisma/schema.prisma`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TransactionType {
  DR
  CR
}

enum PaymentMode {
  CASH
  UPI
  BANK_TRANSFER
  CHEQUE
}

model Customer {
  id           String        @id @default(uuid())
  name         String
  phone        String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  transactions Transaction[]
}

model Transaction {
  id          String          @id @default(uuid())
  customerId  String
  customer    Customer        @relation(fields: [customerId], references: [id], onDelete: Cascade)
  type        TransactionType
  amount      Decimal         @db.Decimal(10, 2)
  date        DateTime
  description String?
  paymentMode PaymentMode
  deviceId    String          @db.VarChar(30)
  vehicleId   String          @db.VarChar(30)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}
```

- [ ] **Step 2: Run initial migration**

Run from `/Users/ankitbhardwaj/Desktop/Practice/my-app`:

```bash
npm run prisma:migrate --prefix server -- --name init
```

Expected: creates `server/prisma/migrations/<timestamp>_init/migration.sql` and applies it. Generates Prisma client.

- [ ] **Step 3: Create `server/src/db.ts`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/src/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

- [ ] **Step 4: Smoke-test DB connection**

Modify `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/src/index.ts` to add a temporary diagnostic route (will be removed in Task 5):

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/db-check', async (_req, res) => {
  const count = await prisma.customer.count();
  res.json({ customers: count });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

Run: `npm run dev --prefix server` (let it run, then test in another terminal)

Verify: `curl http://localhost:4000/api/db-check`
Expected: `{"customers":0}`

- [ ] **Step 5: Commit**

```bash
git add server/prisma server/src/db.ts server/src/index.ts
git commit -m "feat(server): add prisma schema and initial migration"
```

---

## Task 4: Implement JWT auth middleware and login route

**Files:**
- Create: `server/src/middleware/jwtAuth.ts`
- Create: `server/src/routes/auth.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create `server/src/middleware/jwtAuth.ts`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/src/middleware/jwtAuth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

- [ ] **Step 2: Create `server/src/routes/auth.ts`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/src/routes/auth.ts`:

```typescript
import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: '24h' });
  res.json({ token });
});

export default router;
```

- [ ] **Step 3: Wire up the route in `server/src/index.ts`**

Replace the contents of `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/src/index.ts` with:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

(This removes the temporary `/api/db-check` route from Task 3.)

- [ ] **Step 4: Verify login works**

Run: `npm run dev --prefix server` in one terminal.

In another terminal:

```bash
# Success case
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Expected: `{"token":"eyJ..."}` (a real JWT string)

```bash
# Failure case
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong","password":"wrong"}'
```

Expected: HTTP 401 with `{"error":"Invalid credentials"}`

- [ ] **Step 5: Commit**

```bash
git add server/src/middleware server/src/routes/auth.ts server/src/index.ts
git commit -m "feat(server): add jwt auth middleware and login route"
```

---

## Task 5: Implement customers CRUD + summary route

**Files:**
- Create: `server/src/routes/customers.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create `server/src/routes/customers.ts`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/src/routes/customers.ts`:

```typescript
import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/', async (_req, res) => {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(customers);
});

router.get('/summary', async (_req, res) => {
  const customers = await prisma.customer.findMany({
    include: { transactions: true },
    orderBy: { createdAt: 'desc' },
  });

  const summary = customers.map((c) => {
    const totalDR = c.transactions
      .filter((t) => t.type === 'DR')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalCR = c.transactions
      .filter((t) => t.type === 'CR')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      totalDR,
      totalCR,
      balance: totalDR - totalCR,
    };
  });

  res.json(summary);
});

router.post('/', async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required' });
  }
  const customer = await prisma.customer.create({ data: { name, phone } });
  res.status(201).json(customer);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: { name, phone },
    });
    res.json(customer);
  } catch {
    res.status(404).json({ error: 'Customer not found' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.customer.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Customer not found' });
  }
});

export default router;
```

- [ ] **Step 2: Wire up in `server/src/index.ts`**

Replace contents of `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import { jwtAuth } from './middleware/jwtAuth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', jwtAuth, customerRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 3: Verify with curl**

Start server: `npm run dev --prefix server`

Get a token:
```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo $TOKEN
```

Create a customer:
```bash
curl -X POST http://localhost:4000/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","phone":"5551234"}'
```
Expected: `201` with customer JSON including `id`.

List customers:
```bash
curl http://localhost:4000/api/customers -H "Authorization: Bearer $TOKEN"
```
Expected: array with one customer.

Get summary:
```bash
curl http://localhost:4000/api/customers/summary -H "Authorization: Bearer $TOKEN"
```
Expected: array with `totalDR: 0`, `totalCR: 0`, `balance: 0`.

Verify auth blocks without token:
```bash
curl -i http://localhost:4000/api/customers
```
Expected: HTTP 401.

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/customers.ts server/src/index.ts
git commit -m "feat(server): add customers CRUD with summary route"
```

---

## Task 6: Implement transactions CRUD with filters + dashboard summary

**Files:**
- Create: `server/src/routes/transactions.ts`
- Create: `server/src/routes/dashboard.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create `server/src/routes/transactions.ts`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/src/routes/transactions.ts`:

```typescript
import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  const { customerId, type, from, to } = req.query;

  const where: any = {};
  if (customerId) where.customerId = customerId as string;
  if (type) where.type = type as string;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from as string);
    if (to) where.date.lte = new Date(to as string);
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { customer: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' },
  });
  res.json(transactions);
});

router.post('/', async (req, res) => {
  const { customerId, type, amount, date, description, paymentMode, deviceId, vehicleId } = req.body;

  if (!customerId || !type || amount == null || !date || !paymentMode || !deviceId || !vehicleId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (deviceId.length > 30 || vehicleId.length > 30) {
    return res.status(400).json({ error: 'deviceId and vehicleId must be max 30 chars' });
  }

  const transaction = await prisma.transaction.create({
    data: {
      customerId,
      type,
      amount,
      date: new Date(date),
      description,
      paymentMode,
      deviceId,
      vehicleId,
    },
    include: { customer: { select: { id: true, name: true } } },
  });
  res.status(201).json(transaction);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const data: any = { ...req.body };
  if (data.date) data.date = new Date(data.date);
  if (data.deviceId && data.deviceId.length > 30) {
    return res.status(400).json({ error: 'deviceId must be max 30 chars' });
  }
  if (data.vehicleId && data.vehicleId.length > 30) {
    return res.status(400).json({ error: 'vehicleId must be max 30 chars' });
  }
  try {
    const transaction = await prisma.transaction.update({
      where: { id },
      data,
      include: { customer: { select: { id: true, name: true } } },
    });
    res.json(transaction);
  } catch {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.transaction.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

export default router;
```

- [ ] **Step 2: Create `server/src/routes/dashboard.ts`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/src/routes/dashboard.ts`:

```typescript
import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/summary', async (_req, res) => {
  const [customerCount, transactions] = await Promise.all([
    prisma.customer.count(),
    prisma.transaction.findMany({ select: { type: true, amount: true } }),
  ]);

  const totalDR = transactions
    .filter((t) => t.type === 'DR')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalCR = transactions
    .filter((t) => t.type === 'CR')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  res.json({
    customerCount,
    totalDR,
    totalCR,
    netBalance: totalDR - totalCR,
  });
});

export default router;
```

- [ ] **Step 3: Wire up routes in `server/src/index.ts`**

Replace contents of `/Users/ankitbhardwaj/Desktop/Practice/my-app/server/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import transactionRoutes from './routes/transactions';
import dashboardRoutes from './routes/dashboard';
import { jwtAuth } from './middleware/jwtAuth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', jwtAuth, customerRoutes);
app.use('/api/transactions', jwtAuth, transactionRoutes);
app.use('/api/dashboard', jwtAuth, dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 4: Verify end-to-end**

Start server: `npm run dev --prefix server`

Get a customer ID (from earlier or create new):
```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

CUST_ID=$(curl -s http://localhost:4000/api/customers \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
```

Create a DR transaction:
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"customerId\":\"$CUST_ID\",\"type\":\"DR\",\"amount\":1000,\"date\":\"2026-05-27\",\"description\":\"Test debit\",\"paymentMode\":\"CASH\",\"deviceId\":\"DEV001\",\"vehicleId\":\"VEH001\"}"
```
Expected: `201` with transaction JSON including customer relation.

Create a CR transaction:
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"customerId\":\"$CUST_ID\",\"type\":\"CR\",\"amount\":300,\"date\":\"2026-05-27\",\"description\":\"Partial payment\",\"paymentMode\":\"UPI\",\"deviceId\":\"DEV001\",\"vehicleId\":\"VEH001\"}"
```

Check dashboard summary:
```bash
curl http://localhost:4000/api/dashboard/summary -H "Authorization: Bearer $TOKEN"
```
Expected: `{"customerCount":1,"totalDR":1000,"totalCR":300,"netBalance":700}`

Check customer summary:
```bash
curl http://localhost:4000/api/customers/summary -H "Authorization: Bearer $TOKEN"
```
Expected: array with customer showing `totalDR: 1000, totalCR: 300, balance: 700`

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/transactions.ts server/src/routes/dashboard.ts server/src/index.ts
git commit -m "feat(server): add transactions CRUD and dashboard summary"
```

---

## Task 7: Scaffold React client with Vite + TypeScript + Tailwind

**Files:**
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/vite.config.ts`
- Create: `client/index.html`
- Create: `client/tailwind.config.js`
- Create: `client/postcss.config.js`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/src/index.css`

- [ ] **Step 1: Create `client/package.json`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/package.json`:

```json
{
  "name": "client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 5173",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.56.2",
    "axios": "^1.7.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "react-router-dom": "^6.26.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.10",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.2",
    "vite": "^5.4.8"
  }
}
```

- [ ] **Step 2: Create `client/tsconfig.json`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `client/vite.config.ts`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
```

- [ ] **Step 4: Create `client/index.html`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Customer Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create Tailwind config files**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/tailwind.config.js`:

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Create `client/src/main.tsx`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

- [ ] **Step 7: Create temporary placeholder `client/src/App.tsx`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/App.tsx`:

```typescript
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <h1 className="text-2xl font-bold text-gray-800">Customer Admin (scaffold)</h1>
    </div>
  );
}
```

- [ ] **Step 8: Install client deps and verify boot**

Run: `npm install --prefix client`

Run: `npm run dev --prefix client` (let it run 3 seconds, then ^C)
Expected: `Local: http://localhost:5173/`

Visit `http://localhost:5173/` in a browser → see "Customer Admin (scaffold)" centered.

- [ ] **Step 9: Commit**

```bash
git add client
git commit -m "feat(client): scaffold vite + react + tailwind"
```

---

## Task 8: Implement axios instance and Auth context

**Files:**
- Create: `client/src/api/axios.ts`
- Create: `client/src/api/auth.ts`
- Create: `client/src/context/AuthContext.tsx`

- [ ] **Step 1: Create `client/src/api/axios.ts`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/api/axios.ts`:

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);
```

- [ ] **Step 2: Create `client/src/api/auth.ts`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/api/auth.ts`:

```typescript
import { api } from './axios';

export async function loginRequest(email: string, password: string): Promise<string> {
  const { data } = await api.post<{ token: string }>('/auth/login', { email, password });
  return data.token;
}
```

- [ ] **Step 3: Create `client/src/context/AuthContext.tsx`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/context/AuthContext.tsx`:

```typescript
import { createContext, useContext, useState, ReactNode } from 'react';
import { loginRequest } from '../api/auth';

interface AuthContextValue {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const login = async (email: string, password: string) => {
    const newToken = await loginRequest(email, password);
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/api client/src/context
git commit -m "feat(client): add axios instance and auth context"
```

---

## Task 9: Implement Login page, ProtectedRoute, Sidebar, and routing

**Files:**
- Create: `client/src/components/ProtectedRoute.tsx`
- Create: `client/src/components/Sidebar.tsx`
- Create: `client/src/pages/LoginPage.tsx`
- Create: `client/src/pages/DashboardPage.tsx` (placeholder)
- Modify: `client/src/main.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create `client/src/components/ProtectedRoute.tsx`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/components/ProtectedRoute.tsx`:

```typescript
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 2: Create `client/src/components/Sidebar.tsx`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/components/Sidebar.tsx`:

```typescript
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-2 rounded ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'}`;

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-56 bg-gray-800 min-h-screen p-4 flex flex-col">
      <h2 className="text-white text-lg font-bold mb-6">Customer Admin</h2>
      <nav className="flex flex-col gap-1 flex-1">
        <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
        <NavLink to="/customers/summary" className={linkClass}>Customer Summary</NavLink>
        <NavLink to="/customers" className={linkClass}>Customers</NavLink>
        <NavLink to="/transactions" className={linkClass}>Transactions</NavLink>
      </nav>
      <button
        onClick={logout}
        className="text-gray-300 hover:bg-gray-700 px-4 py-2 rounded text-left"
      >
        Logout
      </button>
    </aside>
  );
}
```

- [ ] **Step 3: Create `client/src/pages/LoginPage.tsx`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/pages/LoginPage.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginFormValues>();

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded shadow w-96 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">Login</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <input
          {...register('email', { required: true })}
          type="email"
          placeholder="Email"
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <input
          {...register('password', { required: true })}
          type="password"
          placeholder="Password"
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create placeholder `client/src/pages/DashboardPage.tsx`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/pages/DashboardPage.tsx`:

```typescript
export function DashboardPage() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Dashboard (placeholder)</h1></div>;
}
```

- [ ] **Step 5: Update `client/src/main.tsx`**

Replace contents of `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

- [ ] **Step 6: Update `client/src/App.tsx`**

Replace contents of `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/App.tsx`:

```typescript
import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout><DashboardPage /></Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

- [ ] **Step 7: Verify login flow end-to-end**

Run: `npm run dev` from the repo root (starts both server and client).

Visit `http://localhost:5173/` — should redirect to `/login`.
Enter email `admin@example.com`, password `admin123` → should land on Dashboard placeholder with sidebar visible.
Click Logout → should return to `/login`.
Try wrong credentials → should see "Invalid credentials" message.

- [ ] **Step 8: Commit**

```bash
git add client/src
git commit -m "feat(client): add login page, protected route, sidebar, routing"
```

---

## Task 10: Implement Dashboard page with stat cards and overall summary

**Files:**
- Create: `client/src/components/StatCard.tsx`
- Create: `client/src/api/dashboard.ts`
- Create: `client/src/api/customers.ts`
- Modify: `client/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Create `client/src/components/StatCard.tsx`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/components/StatCard.tsx`:

```typescript
interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-white p-4 rounded shadow border border-gray-200">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-800 mt-1">{value}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create `client/src/api/dashboard.ts`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/api/dashboard.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from './axios';

export interface DashboardSummary {
  customerCount: number;
  totalDR: number;
  totalCR: number;
  netBalance: number;
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async (): Promise<DashboardSummary> => {
      const { data } = await api.get<DashboardSummary>('/dashboard/summary');
      return data;
    },
  });
}
```

- [ ] **Step 3: Create `client/src/api/customers.ts`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/api/customers.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './axios';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  totalDR: number;
  totalCR: number;
  balance: number;
}

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async (): Promise<Customer[]> => {
      const { data } = await api.get<Customer[]>('/customers');
      return data;
    },
  });
}

export function useCustomerSummary() {
  return useQuery({
    queryKey: ['customers', 'summary'],
    queryFn: async (): Promise<CustomerSummary[]> => {
      const { data } = await api.get<CustomerSummary[]>('/customers/summary');
      return data;
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; phone: string }) => {
      const { data } = await api.post<Customer>('/customers', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name: string; phone: string }) => {
      const { id, ...rest } = input;
      const { data } = await api.put<Customer>(`/customers/${id}`, rest);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

- [ ] **Step 4: Replace `client/src/pages/DashboardPage.tsx`**

Replace contents of `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/pages/DashboardPage.tsx`:

```typescript
import { useDashboardSummary } from '../api/dashboard';
import { useCustomerSummary } from '../api/customers';
import { StatCard } from '../components/StatCard';

export function DashboardPage() {
  const summaryQuery = useDashboardSummary();
  const customerSummaryQuery = useCustomerSummary();

  if (summaryQuery.isLoading || customerSummaryQuery.isLoading) {
    return <div className="p-6">Loading...</div>;
  }
  if (summaryQuery.isError || customerSummaryQuery.isError) {
    return <div className="p-6 text-red-600">Failed to load dashboard.</div>;
  }

  const summary = summaryQuery.data!;
  const customers = customerSummaryQuery.data!;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Customers" value={summary.customerCount} />
        <StatCard label="Total DR" value={summary.totalDR.toFixed(2)} />
        <StatCard label="Total CR" value={summary.totalCR.toFixed(2)} />
        <StatCard label="Net Balance" value={summary.netBalance.toFixed(2)} />
      </div>

      <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">Name</th>
              <th className="text-left p-3 text-sm font-semibold">Phone</th>
              <th className="text-right p-3 text-sm font-semibold">Total DR</th>
              <th className="text-right p-3 text-sm font-semibold">Total CR</th>
              <th className="text-right p-3 text-sm font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-gray-200">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3 text-right">{c.totalDR.toFixed(2)}</td>
                <td className="p-3 text-right">{c.totalCR.toFixed(2)}</td>
                <td className="p-3 text-right">{c.balance.toFixed(2)}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={5} className="p-3 text-center text-gray-500">No customers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify in browser**

With `npm run dev` running, log in and visit `/`. Should see 4 stat cards and the customer summary table populated with data from earlier curl tests.

- [ ] **Step 6: Commit**

```bash
git add client/src
git commit -m "feat(client): implement dashboard with stat cards and summary table"
```

---

## Task 11: Implement Customer Summary page

**Files:**
- Create: `client/src/pages/CustomerSummaryPage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create `client/src/pages/CustomerSummaryPage.tsx`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/pages/CustomerSummaryPage.tsx`:

```typescript
import { Link } from 'react-router-dom';
import { useCustomerSummary } from '../api/customers';

export function CustomerSummaryPage() {
  const { data, isLoading, isError } = useCustomerSummary();

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <div className="p-6 text-red-600">Failed to load summary.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Customer Summary</h1>
      <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">Name</th>
              <th className="text-left p-3 text-sm font-semibold">Phone</th>
              <th className="text-right p-3 text-sm font-semibold">Total DR</th>
              <th className="text-right p-3 text-sm font-semibold">Total CR</th>
              <th className="text-right p-3 text-sm font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {data!.map((c) => (
              <tr key={c.id} className="border-t border-gray-200">
                <td className="p-3">
                  <Link
                    to={`/transactions?customerId=${c.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3 text-right">{c.totalDR.toFixed(2)}</td>
                <td className="p-3 text-right">{c.totalCR.toFixed(2)}</td>
                <td className="p-3 text-right">{c.balance.toFixed(2)}</td>
              </tr>
            ))}
            {data!.length === 0 && (
              <tr><td colSpan={5} className="p-3 text-center text-gray-500">No customers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add route in `client/src/App.tsx`**

Replace contents of `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/App.tsx`:

```typescript
import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomerSummaryPage } from './pages/CustomerSummaryPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/customers/summary" element={<Protected><CustomerSummaryPage /></Protected>} />
    </Routes>
  );
}
```

- [ ] **Step 3: Verify in browser**

Navigate to `/customers/summary`. Should see the same data as the dashboard table, but the customer name is a link that takes you to `/transactions?customerId=<id>` (target page doesn't exist yet — that's fine for now).

- [ ] **Step 4: Commit**

```bash
git add client/src
git commit -m "feat(client): add customer summary page"
```

---

## Task 12: Implement Modal, CustomerForm, and Customers CRUD page

**Files:**
- Create: `client/src/components/Modal.tsx`
- Create: `client/src/components/CustomerForm.tsx`
- Create: `client/src/pages/CustomersPage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create `client/src/components/Modal.tsx`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/components/Modal.tsx`:

```typescript
import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg w-96 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `client/src/components/CustomerForm.tsx`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/components/CustomerForm.tsx`:

```typescript
import { useForm } from 'react-hook-form';

export interface CustomerFormValues {
  name: string;
  phone: string;
}

interface CustomerFormProps {
  initialValues?: CustomerFormValues;
  onSubmit: (values: CustomerFormValues) => Promise<void> | void;
  submitLabel?: string;
}

export function CustomerForm({ initialValues, onSubmit, submitLabel = 'Save' }: CustomerFormProps) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<CustomerFormValues>({
    defaultValues: initialValues ?? { name: '', phone: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          {...register('name', { required: true })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          {...register('phone', { required: true })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create `client/src/pages/CustomersPage.tsx`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/pages/CustomersPage.tsx`:

```typescript
import { useState } from 'react';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  Customer,
} from '../api/customers';
import { Modal } from '../components/Modal';
import { CustomerForm, CustomerFormValues } from '../components/CustomerForm';

export function CustomersPage() {
  const { data, isLoading, isError } = useCustomers();
  const createMut = useCreateCustomer();
  const updateMut = useUpdateCustomer();
  const deleteMut = useDeleteCustomer();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const handleCreate = async (values: CustomerFormValues) => {
    await createMut.mutateAsync(values);
    setCreateOpen(false);
  };

  const handleUpdate = async (values: CustomerFormValues) => {
    if (!editing) return;
    await updateMut.mutateAsync({ id: editing.id, ...values });
    setEditing(null);
  };

  const handleDelete = (c: Customer) => {
    if (confirm(`Delete customer "${c.name}"? This also deletes their transactions.`)) {
      deleteMut.mutate(c.id);
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <div className="p-6 text-red-600">Failed to load customers.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">Name</th>
              <th className="text-left p-3 text-sm font-semibold">Phone</th>
              <th className="text-left p-3 text-sm font-semibold">Created</th>
              <th className="text-right p-3 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data!.map((c) => (
              <tr key={c.id} className="border-t border-gray-200">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => setEditing(c)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {data!.length === 0 && (
              <tr><td colSpan={4} className="p-3 text-center text-gray-500">No customers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={createOpen} title="Add Customer" onClose={() => setCreateOpen(false)}>
        <CustomerForm onSubmit={handleCreate} submitLabel="Create" />
      </Modal>

      <Modal open={!!editing} title="Edit Customer" onClose={() => setEditing(null)}>
        {editing && (
          <CustomerForm
            initialValues={{ name: editing.name, phone: editing.phone }}
            onSubmit={handleUpdate}
            submitLabel="Update"
          />
        )}
      </Modal>
    </div>
  );
}
```

- [ ] **Step 4: Add route in `client/src/App.tsx`**

Replace contents of `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/App.tsx`:

```typescript
import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomerSummaryPage } from './pages/CustomerSummaryPage';
import { CustomersPage } from './pages/CustomersPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/customers/summary" element={<Protected><CustomerSummaryPage /></Protected>} />
      <Route path="/customers" element={<Protected><CustomersPage /></Protected>} />
    </Routes>
  );
}
```

- [ ] **Step 5: Verify in browser**

Navigate to `/customers`. Verify:
- Table shows existing customers
- "Add Customer" button opens a modal — submit creates a new row
- "Edit" opens a modal pre-filled — saving updates the row
- "Delete" prompts for confirmation, then removes the row

- [ ] **Step 6: Commit**

```bash
git add client/src
git commit -m "feat(client): add customers CRUD page with modal forms"
```

---

## Task 13: Implement Transactions CRUD page with filters

**Files:**
- Create: `client/src/api/transactions.ts`
- Create: `client/src/components/TransactionForm.tsx`
- Create: `client/src/pages/TransactionsPage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create `client/src/api/transactions.ts`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/api/transactions.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './axios';

export type TransactionType = 'DR' | 'CR';
export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';

export interface Transaction {
  id: string;
  customerId: string;
  customer: { id: string; name: string };
  type: TransactionType;
  amount: string;
  date: string;
  description: string | null;
  paymentMode: PaymentMode;
  deviceId: string;
  vehicleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  customerId?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
}

export interface TransactionInput {
  customerId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description?: string;
  paymentMode: PaymentMode;
  deviceId: string;
  vehicleId: string;
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async (): Promise<Transaction[]> => {
      const { data } = await api.get<Transaction[]>('/transactions', { params: filters });
      return data;
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      const { data } = await api.post<Transaction>('/transactions', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['customers', 'summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string } & Partial<TransactionInput>) => {
      const { id, ...rest } = input;
      const { data } = await api.put<Transaction>(`/transactions/${id}`, rest);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['customers', 'summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['customers', 'summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

- [ ] **Step 2: Create `client/src/components/TransactionForm.tsx`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/components/TransactionForm.tsx`:

```typescript
import { useForm } from 'react-hook-form';
import { useCustomers } from '../api/customers';
import { TransactionType, PaymentMode } from '../api/transactions';

export interface TransactionFormValues {
  customerId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description?: string;
  paymentMode: PaymentMode;
  deviceId: string;
  vehicleId: string;
}

interface TransactionFormProps {
  initialValues?: Partial<TransactionFormValues>;
  onSubmit: (values: TransactionFormValues) => Promise<void> | void;
  submitLabel?: string;
}

export function TransactionForm({ initialValues, onSubmit, submitLabel = 'Save' }: TransactionFormProps) {
  const { data: customers } = useCustomers();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<TransactionFormValues>({
    defaultValues: {
      customerId: '',
      type: 'DR',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      description: '',
      paymentMode: 'CASH',
      deviceId: '',
      vehicleId: '',
      ...initialValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 max-h-[70vh] overflow-y-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700">Customer</label>
        <select
          {...register('customerId', { required: true })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Select customer</option>
          {customers?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            {...register('type', { required: true })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="DR">DR</option>
            <option value="CR">CR</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            step="0.01"
            {...register('amount', { required: true, valueAsNumber: true })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          {...register('date', { required: true })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
        <select
          {...register('paymentMode', { required: true })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="CHEQUE">Cheque</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Device ID</label>
          <input
            {...register('deviceId', { required: true, maxLength: 30 })}
            maxLength={30}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Vehicle ID</label>
          <input
            {...register('vehicleId', { required: true, maxLength: 30 })}
            maxLength={30}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          rows={2}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create `client/src/pages/TransactionsPage.tsx`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/pages/TransactionsPage.tsx`:

```typescript
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  Transaction,
  TransactionType,
} from '../api/transactions';
import { useCustomers } from '../api/customers';
import { Modal } from '../components/Modal';
import { TransactionForm, TransactionFormValues } from '../components/TransactionForm';

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    customerId: searchParams.get('customerId') ?? undefined,
    type: (searchParams.get('type') as TransactionType | null) ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  };

  const { data, isLoading, isError } = useTransactions(filters);
  const { data: customers } = useCustomers();
  const createMut = useCreateTransaction();
  const updateMut = useUpdateTransaction();
  const deleteMut = useDeleteTransaction();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const handleCreate = async (values: TransactionFormValues) => {
    await createMut.mutateAsync(values);
    setCreateOpen(false);
  };

  const handleUpdate = async (values: TransactionFormValues) => {
    if (!editing) return;
    await updateMut.mutateAsync({ id: editing.id, ...values });
    setEditing(null);
  };

  const handleDelete = (t: Transaction) => {
    if (confirm(`Delete this ${t.type} transaction of ${t.amount}?`)) {
      deleteMut.mutate(t.id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Transaction
        </button>
      </div>

      <div className="bg-white rounded shadow border border-gray-200 p-4 mb-4 grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600">Customer</label>
          <select
            value={filters.customerId ?? ''}
            onChange={(e) => updateFilter('customerId', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All</option>
            {customers?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Type</label>
          <select
            value={filters.type ?? ''}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All</option>
            <option value="DR">DR</option>
            <option value="CR">CR</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">From</label>
          <input
            type="date"
            value={filters.from ?? ''}
            onChange={(e) => updateFilter('from', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">To</label>
          <input
            type="date"
            value={filters.to ?? ''}
            onChange={(e) => updateFilter('to', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1"
          />
        </div>
      </div>

      {isLoading && <div>Loading...</div>}
      {isError && <div className="text-red-600">Failed to load transactions.</div>}

      {data && (
        <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3 text-sm font-semibold">Customer</th>
                <th className="text-left p-3 text-sm font-semibold">Type</th>
                <th className="text-right p-3 text-sm font-semibold">Amount</th>
                <th className="text-left p-3 text-sm font-semibold">Date</th>
                <th className="text-left p-3 text-sm font-semibold">Payment</th>
                <th className="text-left p-3 text-sm font-semibold">Device ID</th>
                <th className="text-left p-3 text-sm font-semibold">Vehicle ID</th>
                <th className="text-left p-3 text-sm font-semibold">Description</th>
                <th className="text-right p-3 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="border-t border-gray-200">
                  <td className="p-3">{t.customer.name}</td>
                  <td className="p-3">{t.type}</td>
                  <td className="p-3 text-right">{Number(t.amount).toFixed(2)}</td>
                  <td className="p-3">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="p-3">{t.paymentMode}</td>
                  <td className="p-3">{t.deviceId}</td>
                  <td className="p-3">{t.vehicleId}</td>
                  <td className="p-3">{t.description ?? ''}</td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => setEditing(t)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={9} className="p-3 text-center text-gray-500">No transactions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} title="Add Transaction" onClose={() => setCreateOpen(false)}>
        <TransactionForm onSubmit={handleCreate} submitLabel="Create" />
      </Modal>

      <Modal open={!!editing} title="Edit Transaction" onClose={() => setEditing(null)}>
        {editing && (
          <TransactionForm
            initialValues={{
              customerId: editing.customerId,
              type: editing.type,
              amount: Number(editing.amount),
              date: editing.date.slice(0, 10),
              description: editing.description ?? '',
              paymentMode: editing.paymentMode,
              deviceId: editing.deviceId,
              vehicleId: editing.vehicleId,
            }}
            onSubmit={handleUpdate}
            submitLabel="Update"
          />
        )}
      </Modal>
    </div>
  );
}
```

- [ ] **Step 4: Add route in `client/src/App.tsx`**

Replace contents of `/Users/ankitbhardwaj/Desktop/Practice/my-app/client/src/App.tsx`:

```typescript
import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomerSummaryPage } from './pages/CustomerSummaryPage';
import { CustomersPage } from './pages/CustomersPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/customers/summary" element={<Protected><CustomerSummaryPage /></Protected>} />
      <Route path="/customers" element={<Protected><CustomersPage /></Protected>} />
      <Route path="/transactions" element={<Protected><TransactionsPage /></Protected>} />
    </Routes>
  );
}
```

- [ ] **Step 5: Verify in browser**

Run: `npm run dev` from the repo root.

Navigate through the full app:
1. Log in
2. View Dashboard — should show stats and customer summary
3. Customer Summary page — clicking a customer name should jump to `/transactions?customerId=<id>` with that customer pre-filtered
4. Customers page — create, edit, delete a customer
5. Transactions page — create, edit, delete a transaction. Try each filter (customer dropdown, type, date range)
6. After any transaction change, return to Dashboard and verify the totals updated

- [ ] **Step 6: Commit**

```bash
git add client/src
git commit -m "feat(client): add transactions CRUD page with filters"
```

---

## Task 14: Final verification and README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

Create `/Users/ankitbhardwaj/Desktop/Practice/my-app/README.md`:

```markdown
# Customer Admin Dashboard

Internal admin tool for managing customers and debit/credit transactions.

## Prerequisites

- Node.js 20+
- PostgreSQL running locally (or a reachable instance)

## Setup

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Create a PostgreSQL database:
   ```bash
   createdb customer_db
   ```

3. Configure `server/.env` (copy from `server/.env.example` and adjust `DATABASE_URL` if needed).

4. Run migrations:
   ```bash
   npm run db:migrate
   ```

5. Start both server and client:
   ```bash
   npm run dev
   ```

6. Open http://localhost:5173/ — log in with the credentials in `server/.env` (default: `admin@example.com` / `admin123`).

## Project Layout

- `server/` — Express API + Prisma + PostgreSQL
- `client/` — React + Vite + Tailwind + TanStack Query

## Notes

- The auth uses a hardcoded admin credential pulled from env vars. Not for production.
- See `docs/superpowers/specs/2026-05-27-customer-data-management-design.md` for the design doc.
```

- [ ] **Step 2: Full smoke test from a clean session**

Stop any running dev servers. Run:

```bash
npm run dev
```

In the browser at `http://localhost:5173/`:
1. Should redirect to `/login`
2. Log in with `admin@example.com` / `admin123`
3. Dashboard loads — see customer/transaction totals from your test data
4. Create a new customer via `/customers`
5. Create a new transaction for that customer via `/transactions`
6. Return to Dashboard — totals reflect the new transaction
7. Edit and delete the transaction; verify totals update
8. Filter transactions by customer, by type, by date range
9. Logout, confirm redirect to `/login`

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
```

---

## Done

All 5 pages implemented:
- `/login` — JWT login
- `/` — Dashboard with stat cards + customer summary
- `/customers/summary` — Customer-wise DR/CR/balance with filter shortcut
- `/customers` — Customer CRUD
- `/transactions` — Transaction CRUD with filters

Open item from spec: the "Payments" column on the customer summary page — pending clarification from the business owner. Will be added in a follow-up plan once defined.
