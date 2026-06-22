export interface User {
  id: number;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
  branchId: string | null;
  tenantId: string | null;
}

export interface Branch {
  branchId: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export interface Employee {
  id: number;
  user: User;
  department: string;
  title: string;
  hireDate: string;
  baseSalary: number;
  salaryType: string;
  branch: Branch | null;
}

export interface TableEntity {
  id: number;
  name: string;
  capacity: number;
  status: string;
  guestCount: number;
  room: Room;
}

export interface Room {
  id: number;
  name: string;
  branch: Branch;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export interface ProductVariant {
  id: number;
  name: string;
  price: number;
  product: Product;
}

export interface Category {
  id: number;
  name: string;
}

export interface Order {
  id: number;
  status: string;
  totalAmount: number;
}

export interface OrderDetail {
  id: number;
  variant: ProductVariant;
  price: number;
  quantity: number;
  status: string;
  notes: string;
}

export interface TableSession {
  id: number;
  table: TableEntity;
  status: string;
}

export interface CartItem {
  detailId: number;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  status: string;
  notes: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
}

export interface ShiftTemplate {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  durationHours: number;
}

export interface EmployeeShiftAssignment {
  id: number;
  employeeId: number;
  employeeName: string;
  shiftTemplateName: string;
  startTime: string;
  endTime: string;
  date: string;
}

export interface LeaveRequest {
  id: number;
  employee: Employee;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: string;
}

export interface ForgotClockRequest {
  id: number;
  employee: Employee;
  date: string;
  clockType: string;
  timeProposed: string;
  reason: string;
  status: string;
}

export interface AuditLog {
  id: number;
  userName: string;
  action: string;
  description: string;
  createdAt: string;
  ipAddress: string;
}

export interface BankSetting {
  id: number;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  branch: Branch;
}

export interface PurchaseOrder {
  id: number;
  supplier: { id: number; name: string };
  status: string;
  orderDate: string;
  totalAmount: number;
}
