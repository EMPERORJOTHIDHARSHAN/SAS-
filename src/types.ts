export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  safetyStock: number;
  supplierId: string;
  description: string;
  tags: string[];
  lastUpdated: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
}

export interface POItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  cost: number;
}

export type POStatus = 'DRAFT' | 'SENT' | 'RECEIVED';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: POItem[];
  status: POStatus;
  totalAmount: number;
  createdAt: string;
  sentAt?: string;
  receivedAt?: string;
  notes?: string;
}

export type TransactionType = 'INCOMING' | 'SALE' | 'ADJUSTMENT' | 'PO_RECEIPT';

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  type: TransactionType;
  quantity: number; // positive or negative
  previousQuantity: number;
  newQuantity: number;
  costOrPrice: number;
  notes: string;
  timestamp: string;
}

export interface InventoryOverview {
  totalItems: number;
  totalStockValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
}
