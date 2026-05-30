import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HK_APP } from '../lib/company';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-2 rounded ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'}`;

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-56 bg-gray-800 min-h-screen p-4 flex flex-col">
      <div className="mb-6">
        <h2 className="text-white text-lg font-bold leading-tight">{HK_APP.shortName}</h2>
        <p className="text-gray-400 text-xs mt-1 leading-snug">{HK_APP.tagline}</p>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
        <NavLink to="/customers/summary" className={linkClass}>Customer Summary</NavLink>
        <NavLink to="/customers" className={linkClass}>Customers</NavLink>
        <NavLink to="/transactions" className={linkClass}>Transactions</NavLink>
        <NavLink to="/inventory" className={linkClass}>Device Inventory</NavLink>
        <NavLink to="/bills" className={linkClass}>Tax Invoices</NavLink>
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
