export interface MenuItem {
  label: string;
  href: string;
  icon: string;
  roles: string[];
}

export const menuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['ADMIN', 'MANAGER'] },
  { label: 'POS', href: '/pos', icon: 'pos', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'EMPLOYEE', 'KITCHEN', 'CHEF'] },
  { label: 'KDS', href: '/kds', icon: 'kds', roles: ['ADMIN', 'MANAGER', 'KITCHEN', 'CHEF'] },
  { label: 'Inventory', href: '/inventory', icon: 'inventory', roles: ['ADMIN', 'MANAGER', 'WAREHOUSE', 'CHEF'] },
  { label: 'Procurement', href: '/procurement', icon: 'procurement', roles: ['ADMIN', 'MANAGER', 'PROCUREMENT'] },
  { label: 'Employees', href: '/employees', icon: 'employees', roles: ['ADMIN', 'MANAGER', 'HR'] },
  { label: 'Schedule', href: '/schedule', icon: 'schedule', roles: ['ADMIN', 'MANAGER', 'HR', 'EMPLOYEE'] },
  { label: 'HR Management', href: '/hr-management', icon: 'hr', roles: ['ADMIN', 'MANAGER', 'HR'] },
  { label: 'Floor Plans', href: '/floor-plans', icon: 'floorplan', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Duyệt Review', href: '/admin-feed', icon: 'review', roles: ['ADMIN', 'MANAGER'] },
];
