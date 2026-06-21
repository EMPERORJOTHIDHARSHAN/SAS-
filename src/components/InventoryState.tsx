import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Supplier, PurchaseOrder, InventoryTransaction, InventoryOverview } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SUPPLIERS, INITIAL_POS, INITIAL_TRANSACTIONS } from '../mockData';

interface InventoryContextType {
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  transactions: InventoryTransaction[];
  overview: InventoryOverview;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'lastUpdated'>) => void;
  updateProduct: (id: string, updated: Partial<Product>, reason?: string) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, amount: number, type: 'INCOMING' | 'SALE' | 'ADJUSTMENT', notes: string) => void;
  
  // Supplier actions
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updated: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  // PO actions
  createPurchaseOrder: (supplierId: string, items: { productId: string; quantity: number }[], notes?: string) => void;
  updatePOStatus: (id: string, status: 'DRAFT' | 'SENT' | 'RECEIVED') => void;
  deletePurchaseOrder: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('saas_inventory_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('saas_inventory_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('saas_inventory_pos');
    return saved ? JSON.parse(saved) : INITIAL_POS;
  });

  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() => {
    const saved = localStorage.getItem('saas_inventory_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('saas_inventory_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('saas_inventory_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('saas_inventory_pos', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('saas_inventory_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Compute Overview Stats
  const overview: InventoryOverview = React.useMemo(() => {
    let totalItems = 0;
    let totalStockValue = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(p => {
      totalItems += p.quantity;
      totalStockValue += p.quantity * p.cost;
      totalRetailValue += p.quantity * p.price;
      
      if (p.quantity === 0) {
        outOfStockCount++;
      } else if (p.quantity <= p.safetyStock) {
        lowStockCount++;
      }
    });

    return {
      totalItems,
      totalStockValue,
      totalRetailValue,
      potentialProfit: totalRetailValue - totalStockValue,
      lowStockCount,
      outOfStockCount
    };
  }, [products]);

  // LOG A TRANSACTION
  const logTransaction = (
    productId: string,
    type: 'INCOMING' | 'SALE' | 'ADJUSTMENT' | 'PO_RECEIPT',
    quantity: number,
    prevQty: number,
    newQty: number,
    costOrPrice: number,
    notes: string
  ) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newTx: InventoryTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId,
      productName: product.name,
      productSku: product.sku,
      type,
      quantity,
      previousQuantity: prevQty,
      newQuantity: newQty,
      costOrPrice,
      notes,
      timestamp: new Date().toISOString(),
    };

    setTransactions(prev => [newTx, ...prev]);
  };

  // PRODUCT ACTIONS
  const addProduct = (newProduct: Omit<Product, 'id' | 'lastUpdated'>) => {
    const id = `prod-${Date.now()}`;
    const product: Product = {
      ...newProduct,
      id,
      lastUpdated: new Date().toISOString(),
    };

    setProducts(prev => [...prev, product]);
    
    // Log replenishment
    logTransaction(
      id,
      'INCOMING',
      product.quantity,
      0,
      product.quantity,
      product.cost,
      'Initial stock creation'
    );
  };

  const updateProduct = (id: string, updated: Partial<Product>, reason = 'Direct manual updates') => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const merged = { ...p, ...updated, lastUpdated: new Date().toISOString() };
          
          // If stock quantity was updated directly
          if (updated.quantity !== undefined && updated.quantity !== p.quantity) {
            const difference = updated.quantity - p.quantity;
            logTransaction(
              id,
              difference > 0 ? 'INCOMING' : 'ADJUSTMENT',
              difference,
              p.quantity,
              updated.quantity,
              difference > 0 ? p.cost : p.price,
              reason
            );
          }
          
          return merged;
        }
        return p;
      })
    );
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setTransactions(prev => prev.filter(t => t.productId !== id));
  };

  const adjustStock = (productId: string, amount: number, type: 'INCOMING' | 'SALE' | 'ADJUSTMENT', notes: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const prevQty = p.quantity;
          const newQty = Math.max(0, p.quantity + amount);
          const finalChange = newQty - prevQty;
          
          logTransaction(
            productId,
            type,
            finalChange,
            prevQty,
            newQty,
            type === 'SALE' ? p.price : p.cost,
            notes
          );

          return {
            ...p,
            quantity: newQty,
            lastUpdated: new Date().toISOString()
          };
        }
        return p;
      })
    );
  };

  // SUPPLIER ACTIONS
  const addSupplier = (newSupplier: Omit<Supplier, 'id'>) => {
    const supplier: Supplier = {
      ...newSupplier,
      id: `sup-${Date.now()}`,
    };
    setSuppliers(prev => [...prev, supplier]);
  };

  const updateSupplier = (id: string, updated: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...updated } : s)));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    // Set associated products supplier to empty/null or keep as is
    setProducts(prev => prev.map(p => (p.supplierId === id ? { ...p, supplierId: '' } : p)));
  };

  // PURCHASE ORDER ACTIONS
  const createPurchaseOrder = (supplierId: string, itemsInput: { productId: string; quantity: number }[], notes?: string) => {
    const supplierObj = suppliers.find(s => s.id === supplierId);
    if (!supplierObj) return;

    let totalAmount = 0;
    const items = itemsInput.map(input => {
      const p = products.find(prod => prod.id === input.productId);
      const cost = p ? p.cost : 0.0;
      totalAmount += input.quantity * cost;
      return {
        productId: input.productId,
        name: p ? p.name : 'Unknown Product',
        sku: p ? p.sku : 'N/A',
        quantity: input.quantity,
        cost
      };
    });

    const poNumber = `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(3, '0')}`;
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierId,
      supplierName: supplierObj.name,
      items,
      status: 'DRAFT',
      totalAmount,
      createdAt: new Date().toISOString(),
      notes
    };

    setPurchaseOrders(prev => [newPO, ...prev]);
  };

  const updatePOStatus = (id: string, status: 'DRAFT' | 'SENT' | 'RECEIVED') => {
    setPurchaseOrders(prev =>
      prev.map(po => {
        if (po.id === id) {
          const nowS = new Date().toISOString();
          const pStatusUpdates: Partial<PurchaseOrder> = { status };
          
          if (status === 'SENT') {
            pStatusUpdates.sentAt = nowS;
          } else if (status === 'RECEIVED' && po.status !== 'RECEIVED') {
            pStatusUpdates.receivedAt = nowS;
            
            // AUTOMATICALLY INCREMENT STOCK COUNTS!
            po.items.forEach(item => {
              setProducts(currentProducts =>
                currentProducts.map(p => {
                  if (p.id === item.productId) {
                    const prevQty = p.quantity;
                    const newQty = p.quantity + item.quantity;
                    
                    // Log PO Receipt transaction
                    const txId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    const tx: InventoryTransaction = {
                      id: txId,
                      productId: p.id,
                      productName: p.name,
                      productSku: p.sku,
                      type: 'PO_RECEIPT',
                      quantity: item.quantity,
                      previousQuantity: prevQty,
                      newQuantity: newQty,
                      costOrPrice: item.cost,
                      notes: `Received via purchase order ${po.poNumber}`,
                      timestamp: nowS
                    };
                    
                    setTransactions(txs => [tx, ...txs]);
                    return {
                      ...p,
                      quantity: newQty,
                      lastUpdated: nowS
                    };
                  }
                  return p;
                })
              );
            });
          }
          
          return { ...po, ...pStatusUpdates };
        }
        return po;
      })
    );
  };

  const deletePurchaseOrder = (id: string) => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== id));
  };

  return (
    <InventoryContext.Provider value={{
      products,
      suppliers,
      purchaseOrders,
      transactions,
      overview,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      createPurchaseOrder,
      updatePOStatus,
      deletePurchaseOrder
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
