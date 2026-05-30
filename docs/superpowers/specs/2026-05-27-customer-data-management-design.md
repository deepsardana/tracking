# Customer Data Management — Admin Dashboard
**Date:** 2026-05-27  
**Stack:** React + Vite · Node.js + Express · PostgreSQL + Prisma  
**Scope:** Internal single-admin tool for managing customers and their debit/credit transactions.

---

## 1. Architecture Overview

Monorepo with two sub-packages: `client/` and `server/`. A root `package.json` uses `concurrently` to run both in development.

```
my-app/
├── client/                  # React + Vite + Tailwind + React Query
│   ├── src/
│   │   ├── pages/           # Login, Dashboard, Customers, CustomerSummary, Transactions
│   │   ├── components/      # Shared UI: Sidebar, Modal, Table, StatCard, ProtectedRoute
│   │   ├── api/             # axios instance + React Query hooks per resource
│   │   └── context/         # AuthContext — stores JWT, exposes login/logout
│   └── package.json
│
├── server/                  # Express + Prisma + PostgreSQL
│   ├── src/
│   │   ├── routes/          # auth.ts, customers.ts, transactions.ts, dashboard.ts
│   │   ├── middleware/       # jwtAuth.ts — verifies Bearer token on protected routes
│   │   └── index.ts         # app entry point
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── package.json             # root — dev script runs both via concurrently
```

**Key libraries:**
| Layer | Library | Purpose |
|-------|---------|---------|
| Frontend | React 18 + Vite | App framework + fast HMR |
| Frontend | React Router v6 | Client-side routing |
| Frontend | TanStack Query v5 | Server state, caching, loading/error |
| Frontend | React Hook Form | Form handling + validation |
| Frontend | Tailwind CSS | Minimal utility-first styling |
| Frontend | Axios | HTTP client |
| Backend | Express | HTTP server |
| Backend | Prisma | ORM + migrations |
| Backend | jsonwebtoken | JWT sign/verify |
| Backend | dotenv | Load env vars (credentials, JWT secret, DB URL) |

---

## 2. Authentication

Single hardcoded admin credential stored as environment variables on the server:

```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
JWT_SECRET=supersecretkey
```

**Flow:**
1. Client POSTs `{ email, password }` to `/api/auth/login`
2. Server compares email and password directly against env vars (plain string comparison), returns signed JWT (24h expiry) on match
3. Client stores token in `localStorage`
4. All subsequent requests send `Authorization: Bearer <token>`
5. `jwtAuth` middleware verifies token; returns `401` on failure
6. On `401`, React Query's axios instance clears token and redirects to `/login`

---

## 3. Data Model

```prisma
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
  customer    Customer        @relation(fields: [customerId], references: [id])
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

**Computed fields** (derived at query time, never stored):
- `totalDR` — `SUM(amount) WHERE type = DR` per customer
- `totalCR` — `SUM(amount) WHERE type = CR` per customer
- `balance` — `totalDR - totalCR` per customer (positive = customer owes us; negative = we owe customer)

---

## 4. Backend API

All routes under `/api`. All routes except `/api/auth/login` require a valid JWT.

### Auth
| Method | Route | Body | Response |
|--------|-------|------|----------|
| POST | `/api/auth/login` | `{ email, password }` | `{ token }` or `401` |

### Dashboard
| Method | Route | Response |
|--------|-------|----------|
| GET | `/api/dashboard/summary` | `{ customerCount, totalDR, totalCR, netBalance }` |

### Customers
| Method | Route | Body / Params | Response |
|--------|-------|---------------|----------|
| GET | `/api/customers` | — | Array of customers |
| GET | `/api/customers/summary` | — | Array with `totalDR`, `totalCR`, `balance` per customer |
| POST | `/api/customers` | `{ name, phone }` | Created customer |
| PUT | `/api/customers/:id` | `{ name?, phone? }` | Updated customer |
| DELETE | `/api/customers/:id` | — | `204 No Content` |

### Transactions
| Method | Route | Body / Params | Response |
|--------|-------|---------------|----------|
| GET | `/api/transactions` | `?customerId=&type=&from=&to=` | Array with customer name included |
| POST | `/api/transactions` | `{ customerId, type, amount, date, description?, paymentMode, deviceId, vehicleId }` | Created transaction |
| PUT | `/api/transactions/:id` | Any transaction fields | Updated transaction |
| DELETE | `/api/transactions/:id` | — | `204 No Content` |

---

## 5. Frontend Pages

### Navigation
Persistent left sidebar with links to all pages. Logout button clears JWT and redirects to `/login`.

### Page 1: Login (`/login`)
- Centered card with email + password fields
- On success → stores JWT, redirects to `/`
- On error → shows inline error message

### Page 2: Overall Summary (`/`)
- 4 stat cards: **Total Customers**, **Total DR**, **Total CR**, **Net Balance**
- Summary table below listing all customers with their DR, CR, Balance at a glance

### Page 3: Customer Summary (`/customers/summary`)
- Table columns: **Name** | **Phone** | **Total DR** | **Total CR** | **Balance**
- Clicking a customer name navigates to `/transactions?customerId=<id>` to filter that customer's transactions

### Page 4: Customer CRUD (`/customers`)
- Table columns: **Name** | **Phone** | **Created At** | **Actions**
- "Add Customer" button → opens modal with form (name, phone)
- Edit icon → opens pre-filled modal
- Delete icon → confirm dialog, then deletes

### Page 5: Transactions CRUD (`/transactions`)
- Filter bar: Customer dropdown, Type (DR/CR), Date range (from/to)
- Table columns: **Customer** | **Type** | **Amount** | **Date** | **Payment Mode** | **Device ID** | **Vehicle ID** | **Description** | **Actions**
- "Add Transaction" button → opens modal with full form
- Edit icon → opens pre-filled modal
- Delete icon → confirm dialog, then deletes

---

## 6. Error Handling

- **Backend:** All routes wrapped in try/catch; return `{ error: message }` with appropriate HTTP status codes (`400`, `401`, `404`, `500`)
- **Frontend:** React Query's `isError` state shown as inline error banners; `401` responses auto-redirect to login
- **Forms:** React Hook Form client-side validation before submission (required fields, max lengths)

---

## 7. Open Items

- **Payments column** on the customer summary page — definition unclear, to be clarified with the owner. Will be added as a follow-up once defined.
