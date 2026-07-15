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

export type TableStyle = 'ROUND' | 'SQUARE' | 'RECTANGLE' | 'VIP';

export const TABLE_STYLE_OPTIONS: { value: TableStyle; label: string; icon: string }[] = [
  { value: 'ROUND', label: 'Bàn tròn', icon: '⭕' },
  { value: 'SQUARE', label: 'Bàn vuông', icon: '⬜' },
  { value: 'RECTANGLE', label: 'Bàn chữ nhật', icon: '▬' },
  { value: 'VIP', label: 'VIP Booth', icon: '🛋️' },
];

export function getTableStyleLabel(style?: TableStyle | null): string {
  return TABLE_STYLE_OPTIONS.find(s => s.value === style)?.label ?? 'Tròn';
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
}

export interface Room {
  id: number;
  name: string;
  branch: Branch;
  floorPlanImageUrl?: string | null;
  backgroundMode?: 'DEFAULT_WOOD' | 'DEFAULT_MARBLE' | 'DEFAULT_DARK' | 'DEFAULT_OUTDOOR' | 'DEFAULT_TILE' | 'DEFAULT_GRID' | 'CUSTOM_IMAGE';
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
  sizeName: string;
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
  backgroundMode: 'DEFAULT_WOOD' | 'DEFAULT_MARBLE' | 'DEFAULT_DARK' | 'DEFAULT_OUTDOOR' | 'DEFAULT_TILE' | 'DEFAULT_GRID' | 'CUSTOM_IMAGE';
  panoramaUrl: string | null;
  panoramaKey?: string | null;
  panoramaType: string | null;
  status: 'draft' | 'published';
  createdBy: User | null;
  updatedBy: User | null;
  createdAt: string;
  updatedAt: string;
  floorPlanObjects?: FloorPlanObject[];
}

export const BACKGROUND_MODES = [
  { value: 'DEFAULT_WOOD', label: 'Wood Floor', icon: '🪵' },
  { value: 'DEFAULT_MARBLE', label: 'Luxury Marble', icon: '💎' },
  { value: 'DEFAULT_DARK', label: 'Dark Restaurant', icon: '🌙' },
  { value: 'DEFAULT_OUTDOOR', label: 'Outdoor Grass', icon: '🌿' },
  { value: 'DEFAULT_TILE', label: 'Tile Floor', icon: '🧱' },
  { value: 'DEFAULT_GRID', label: 'Grid Only', icon: '📐' },
  { value: 'CUSTOM_IMAGE', label: 'Custom Image', icon: '🖼️' },
] as const;

export type BackgroundMode = typeof BACKGROUND_MODES[number]['value'];
export type JsonObject = Record<string, unknown>;

export interface FloorPlanObject {
  id: number;
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
