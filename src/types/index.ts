export interface User {
  id: number;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
  branchId: string | null;
  tenantId: string | null;
  isUsingSystemWeb?: boolean;
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
  hasDefaultPassword?: boolean;
}

export interface Branch {
  branchId: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  bankBranch?: string;
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

export type TableStyle = 'ROUND' | 'SQUARE' | 'RECTANGLE' | 'VIP';

export const TABLE_STYLE_OPTIONS: { value: TableStyle; label: string; icon: string }[] = [
  { value: 'ROUND', label: 'Ban tron', icon: 'o' },
  { value: 'SQUARE', label: 'Ban vuong', icon: '[]' },
  { value: 'RECTANGLE', label: 'Ban chu nhat', icon: '[ ]' },
  { value: 'VIP', label: 'VIP Booth', icon: 'VIP' },
];

export function getTableStyleLabel(style?: TableStyle | null): string {
  return TABLE_STYLE_OPTIONS.find(s => s.value === style)?.label ?? 'Tron';
}

export interface TableEntity {
  id: number;
  name: string;
  capacity: number;
  status: string;
  guestCount: number;
  room: Room;
  tableStyle?: TableStyle | null;
  layoutX?: number | null;
  layoutY?: number | null;
  layoutWidth?: number | null;
  layoutHeight?: number | null;
  layoutRotation?: number | null;
  layoutRadius?: number | null;
  displayLabel?: string | null;
  shape?: 'circle' | 'rectangle' | null;
  activeSessionId?: number | null;
  sessionOpenedAt?: string | null;
  sessionTotalAmount?: number | null;
}

export interface Room {
  id: number;
  name: string;
  branch: Branch;
  floorPlanImageUrl?: string | null;
  backgroundMode?: BackgroundMode;
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
  sizeName?: string;
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

export const BACKGROUND_MODES = [
  { value: 'DEFAULT_WOOD', label: 'Wood Floor', icon: 'wood' },
  { value: 'DEFAULT_MARBLE', label: 'Luxury Marble', icon: 'marble' },
  { value: 'DEFAULT_DARK', label: 'Dark Restaurant', icon: 'dark' },
  { value: 'DEFAULT_OUTDOOR', label: 'Outdoor Grass', icon: 'outdoor' },
  { value: 'DEFAULT_TILE', label: 'Tile Floor', icon: 'tile' },
  { value: 'DEFAULT_GRID', label: 'Grid Only', icon: 'grid' },
  { value: 'CUSTOM_IMAGE', label: 'Custom Image', icon: 'image' },
] as const;

export type BackgroundMode = typeof BACKGROUND_MODES[number]['value'];
export type JsonObject = Record<string, unknown>;

export interface FloorPlan {
  id: number;
  branch: Branch;
  roomId?: number | null;
  room?: Room | null;
  name: string;
  floorNumber: number;
  width: number;
  height: number;
  floorDiagramImageUrl: string | null;
  floorDiagramImageKey?: string | null;
  floorDiagramFitMode?: 'contain' | 'cover' | 'fill' | null;
  floorDiagramX?: number | null;
  floorDiagramY?: number | null;
  floorDiagramWidth?: number | null;
  floorDiagramHeight?: number | null;
  floorDiagramScale?: number | null;
  floorDiagramRotation?: number | null;
  backgroundMode: BackgroundMode;
  backgroundImageUrl?: string | null;
  panoramaUrl: string | null;
  panoramaKey?: string | null;
  panoramaType: string | null;
  panorama360Url?: string | null;
  status: 'draft' | 'published';
  isTableSelectionEnabled?: boolean;
  createdBy: User | null;
  updatedBy: User | null;
  createdAt: string;
  updatedAt: string;
  floorPlanObjects?: FloorPlanObject[];
}

export interface FloorPlanObject {
  id: number;
  floorPlan?: FloorPlan;
  tableId?: number | null;
  objectType: string;
  label: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: string | null;
  zIndex: number;
  styleJson: JsonObject | string | null;
  metadataJson: JsonObject | string | null;
  isLocked?: boolean;
  isVisible?: boolean;
  linkedTableId?: number | null;
  createdAt?: string;
  updatedAt?: string;
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
  table: 'Ban',
  wall: 'Tuong',
  door: 'Cua',
  window: 'Cua so',
  toilet: 'WC',
  cashier: 'Quay thu ngan',
  kitchen: 'Bep',
  bar: 'Quay bar',
  stairs: 'Cau thang',
  text: 'Nhan chu',
  decoration: 'Trang tri',
  blocked_area: 'Khu vuc chan',
};

export const STATUS_COLORS: Record<string, string> = {
  available: '#22c55e',
  occupied: '#ef4444',
  reserved: '#f59e0b',
  cleaning: '#3b82f6',
  disabled: '#94a3b8',
};

export interface Booking {
  id?: number;
  eventId?: number | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  bookingTime: string;
  guests: number;
  status?: string;
  source?: string;
  depositPaid?: boolean;
  branchId: string;
  notes?: string | null;
  tableId?: number | null;
  tableLabel?: string | null;
  dietaryNotes?: string | null;
  allergyPeanut?: boolean;
  allergyGluten?: boolean;
  allergyOthers?: string | null;
  orderedItemsJson?: string | null;
  depositAmount?: number;
  paymentMethod?: string | null;
  paymentStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}