'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { label: 'Dashboard', href: '/', icon: '📊', roles: ['ADMIN', 'MANAGER'] },
  { label: 'POS', href: '/pos', icon: '💻', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'EMPLOYEE', 'KITCHEN', 'CHEF'] },
  { label: 'KDS', href: '/kds', icon: '🍳', roles: ['ADMIN', 'MANAGER', 'KITCHEN', 'CHEF'] },
  { label: 'Employees', href: '/employees', icon: '👥', roles: [] },
  { label: 'Schedule', href: '/schedule', icon: '📅', roles: ['ADMIN', 'MANAGER', 'HR', 'EMPLOYEE', 'CASHIER', 'CHEF'] },
  { label: 'HR Management', href: '/hr-management', icon: '📋', roles: ['ADMIN', 'MANAGER', 'HR'] },
  { label: 'Inventory', href: '/inventory', icon: '📦', roles: ['ADMIN', 'MANAGER', 'WAREHOUSE', 'CHEF'] },
  { label: 'Procurement', href: '/procurement', icon: '🛒', roles: ['ADMIN', 'MANAGER', 'PROCUREMENT'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSuperAdmin, canSwitchBranch, branches, activeBranchId, activeBranchName, switchBranch, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  const visibleItems = menuItems.filter(item => {
    if (item.roles.length === 0) return true;
    return user?.roles.some(r => item.roles.includes(r));
  });

  const handleBranchSwitch = (branchId: string) => {
    switchBranch(branchId);
    setBranchDropdownOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed left-0 top-0 h-full w-64 bg-gray-900 text-white z-40 transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">RMS</h1>
          <p className="text-xs text-gray-400 mt-1">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.roles.join(', ')}</p>
        </div>

        {canSwitchBranch && branches.length > 0 && (
          <div className="p-2 border-b border-gray-700 relative">
            <button
              onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
              className="w-full text-left px-3 py-2 text-sm bg-gray-800 rounded hover:bg-gray-700 flex justify-between items-center"
            >
              <span>{activeBranchName || 'All Branches'}</span>
              <span>▾</span>
            </button>
            {branchDropdownOpen && (
              <div className="absolute left-2 right-2 mt-1 bg-gray-800 rounded shadow-lg z-50 max-h-60 overflow-auto">
                {branches.map(b => (
                  <button
                    key={b.branchId}
                    onClick={() => handleBranchSwitch(b.branchId)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${b.branchId === activeBranchId ? 'bg-blue-600' : ''}`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <nav className="p-2 overflow-y-auto" style={{ height: 'calc(100% - 200px)' }}>
          {visibleItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors
                ${pathname === item.href ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-gray-700">
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800">
            <span>⚙️</span><span>Profile</span>
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800">
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
