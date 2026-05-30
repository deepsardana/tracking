import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomerSummaryPage } from './pages/CustomerSummaryPage';
import { CustomersPage } from './pages/CustomersPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BillsPage } from './pages/BillsPage';
import { InventoryPage } from './pages/InventoryPage';
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
      <Route path="/bills" element={<Protected><BillsPage /></Protected>} />
      <Route path="/inventory" element={<Protected><InventoryPage /></Protected>} />
    </Routes>
  );
}
