export interface User {
  id: number;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
  branchId: string | null;
  tenantId: string | null;
  avatarUrl?: string | null;
  bookingCount?: number;
  totalSpent?: number;
  loyaltyPoints?: number;
  tier?: string;
  loyaltyCardNo?: string;
  memberSince?: string;
  phone?: string | null;
  birthday?: string | null;
  gender?: string | null;
  dietaryNotes?: string | null;
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
  layoutX?: number | null;
  layoutY?: number | null;
  layoutWidth?: number | null;
  layoutHeight?: number | null;
  layoutRotation?: number | null;
  layoutRadius?: number | null;
  displayLabel?: string | null;
}

export interface Room {
  id: number;
  name: string;
  branch: Branch;
  floorPlanImageUrl?: string | null;
  panoramaUrl?: string | null;
  panoramaType?: string | null;
  displayOrder?: number;
  floorPlanWidth?: number | null;
  floorPlanHeight?: number | null;
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

// ─── Floor Plan Types ─────────────────────────────────────────────────

export interface FloorPlan {
  id: number;
  branch: Branch;
  name: string;
  floorNumber: number;
  width: number;
  height: number;
  backgroundImageUrl: string | null;
  panorama360Url: string | null;
  status: 'draft' | 'published';
  isTableSelectionEnabled: boolean;
  createdBy: User | null;
  updatedBy: User | null;
  createdAt: string;
  updatedAt: string;
  floorPlanObjects?: FloorPlanObject[];
}

export interface FloorPlanObject {
  id: number;
  floorPlan: FloorPlan;
  objectType: string;
  label: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: string | null;
  zIndex: number;
  styleJson: string | null;
  metadataJson: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FloorPlanStyle {
  color?: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: string;
  [key: string]: unknown;
}

export interface FloorPlanMetadata {
  tableCode?: string;
  capacity?: number;
  isMergeable?: boolean;
  zone?: string;
  tableId?: string;
  doorType?: string;
}

export const OBJECT_TYPES = [
  'table', 'wall', 'door', 'window', 'toilet', 'cashier',
  'kitchen', 'bar', 'stairs', 'text', 'decoration', 'blocked_area'
] as const;

export type ObjectType = typeof OBJECT_TYPES[number];

export const OBJECT_TYPE_LABELS: Record<string, string> = {
  table: 'Bàn',
  wall: 'Tường',
  door: 'Cửa',
  window: 'Cửa sổ',
  toilet: 'WC',
  cashier: 'Quầy thu ngân',
  kitchen: 'Bếp',
  bar: 'Quầy bar',
  stairs: 'Cầu thang',
  text: 'Nhãn chữ',
  decoration: 'Trang trí',
  blocked_area: 'Khu vực chặn',
};

export const STATUS_COLORS: Record<string, string> = {
  available: '#22c55e',
  occupied: '#ef4444',
  reserved: '#f59e0b',
  cleaning: '#3b82f6',
  disabled: '#94a3b8',
};
