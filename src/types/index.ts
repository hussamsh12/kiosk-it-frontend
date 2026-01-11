// ===== Enums =====

export type OrderSource = 'POS' | 'KIOSK' | 'QR_TABLE' | 'ONLINE';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type ModifierDisplayType = 'AUTO' | 'CHIPS' | 'SEGMENTED' | 'RADIO' | 'CHECKBOX' | 'CARDS';
export type VariantDisplayType = 'AUTO' | 'CHIPS' | 'SEGMENTED' | 'RADIO' | 'CARDS';

// ===== Tenant & Store =====

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  settings: TenantSettings;
}

export interface TenantSettings {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  fontFamily?: string;
  [key: string]: unknown;
}

export interface Store {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  settings: StoreSettings;
}

export interface StoreSettings {
  taxRate?: number;
  [key: string]: unknown;
}

export interface StoreBrief {
  id: string;
  name: string;
  code: string;
  address?: string;
}

// ===== Menu =====

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  items: MenuItemBrief[];
}

// Brief item info returned in menu listing
export interface MenuItemBrief {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  imageUrl?: string;
  isAvailable: boolean;
  displayOrder: number;
  variantCount: number;
  modifierGroupCount: number;
}

// Full item details with variants and modifiers
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  galleryImages?: string[];
  isAvailable: boolean;
  displayOrder: number;
  variantDisplayType: VariantDisplayType;
  variants: ItemVariant[];
  modifierGroups: ModifierGroup[];
}

export interface ItemVariant {
  id: string;
  name: string;
  priceAdjustment: number;
  isAvailable: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  displayType: ModifierDisplayType;
  modifiers: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

// ===== Cart =====

export interface CartItem {
  id: string; // Client-generated UUID for cart tracking
  itemId: string;
  itemName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  modifiers: CartItemModifier[];
}

export interface CartItemModifier {
  id: string;
  name: string;
  price: number;
}

// ===== Orders =====

export interface OrderItemRequest {
  itemId: string;
  variantId?: string;
  quantity: number;
  notes?: string;
  modifierIds?: string[];
}

export interface CreateOrderRequest {
  storeId: string;
  source: OrderSource;
  customerId?: string;
  items: OrderItemRequest[];
  notes?: string;
}

export interface OrderResponse {
  id: string;
  storeId: string;
  storeName: string;
  customerId?: string;
  customerName?: string;
  employeeId?: string;
  employeeName?: string;
  orderNumber: string;
  source: OrderSource;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  isPaid: boolean;
  items: OrderItemResponse[];
  lowStockWarnings: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemResponse {
  id: string;
  itemId: string;
  itemName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  modifiers: OrderItemModifierResponse[];
}

export interface OrderItemModifierResponse {
  id: string;
  modifierId: string;
  modifierName: string;
  price: number;
}

// ===== Auth =====

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string;
}

// ===== Device Auth =====

export interface DeviceAuthRequest {
  email: string;
  password: string;
  deviceName: string;
  storeId?: string;
}

export interface DeviceInfo {
  sessionId: string;
  tenantId: string;
  storeId?: string;
  deviceName: string;
  tenantName: string;
  storeName?: string;
}

export interface DeviceAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  device: DeviceInfo;
}

// ===== API =====

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
