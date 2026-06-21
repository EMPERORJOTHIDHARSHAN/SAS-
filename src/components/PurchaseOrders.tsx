import React, { useState } from 'react';
import { useInventory } from './InventoryState';
import { PurchaseOrder, POItem, POStatus, Product } from '../types';
import { 
  FileText, 
  Plus, 
  Send, 
  PackageCheck, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  ShoppingCart, 
  ChevronRight, 
  X,
  AlertCircle
} from 'lucide-react';

interface PurchaseOrdersProps {
  initialSupplierSelection?: string;
}

export const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ initialSupplierSelection }) => {
  const { 
    purchaseOrders, 
    suppliers, 
    products, 
    createPurchaseOrder, 
    updatePOStatus, 
    deletePurchaseOrder 
  } = useInventory();

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(initialSupplierSelection || suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [poNotes, setPoNotes] = useState('');

  // Suppliers items
  const supplierProducts = React.useMemo(() => {
    return products.filter(p => p.supplierId === selectedSupplierId);
  }, [products, selectedSupplierId]);

  const handleOpenCreator = () => {
    const sId = initialSupplierSelection || suppliers[0]?.id || '';
    setSelectedSupplierId(sId);
    setPoItems([]);
    setPoNotes('');
    setIsCreatorOpen(true);
  };

  // Adjust item reorder quantity inside modal
  const handleSetItemQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setPoItems(prev => prev.filter(item => item.productId !== productId));
    } else {
      setPoItems(prev => {
        const existing = prev.find(item => item.productId === productId);
        if (existing) {
          return prev.map(item => item.productId === productId ? { ...item, quantity } : item);
        } else {
          return [...prev, { productId, quantity }];
        }
      });
    }
  };

  // Create final PO
  const handleConfirmPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      alert('Please add at least one item with quantity greater than zero.');
      return;
    }
    createPurchaseOrder(selectedSupplierId, poItems, poNotes);
    setIsCreatorOpen(false);
  };

  // Calculate Running Draft total
  const draftTotalAmount = React.useMemo(() => {
    return poItems.reduce((acc, curr) => {
      const p = products.find(prod => prod.id === curr.productId);
      return acc + (curr.quantity * (p ? p.cost : 0));
    }, 0);
  }, [poItems, products]);

  return (
    <div className="space-y-6" id="po-management-container">
      {/* Header section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="po-heading-sec">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Supplier Purchase Orders</h2>
          <p className="text-xs text-slate-400">Order inventory restocks, draft requirements, and verify inbound freight sheets to replenish physical counts.</p>
        </div>
        <button
          id="draft-po-trigger"
          onClick={handleOpenCreator}
          className="px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
        >
          <Plus className="w-4.5 h-4.5 text-indigo-200" />
          Create Purchase Order
        </button>
      </div>

      {/* PO List cards */}
      <div className="space-y-4" id="po-cards-stack">
        {purchaseOrders.length === 0 ? (
          <div className="bg-white py-16 px-6 border rounded-2xl border-dashed border-slate-200 text-center text-slate-400 font-semibold flex flex-col items-center justify-center space-y-2">
            <ShoppingCart className="w-8 h-8 text-slate-300" />
            <p className="text-slate-600 text-sm">No recorded purchase orders found.</p>
            <p className="text-xs text-slate-400">Draft your first restock PO using the creator above.</p>
          </div>
        ) : (
          purchaseOrders.map(po => {
            let statusColor = 'text-slate-500 bg-slate-50 border-slate-200';
            let statusIcon = <Clock className="w-3.5 h-3.5" />;
            if (po.status === 'SENT') {
              statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
              statusIcon = <Send className="w-3.5 h-3.5 animate-pulse" />;
            } else if (po.status === 'RECEIVED') {
              statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
              statusIcon = <CheckCircle2 className="w-3.5 h-3.5" />;
            }

            return (
              <div key={po.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4" id={`po-record-card-${po.id}`}>
                {/* Upper metrics and statuses */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono text-sm sm:text-base">{po.poNumber}</span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${statusColor}`}>
                          {statusIcon}
                          {po.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Supplier: <span className="text-slate-700 font-semibold">{po.supplierName}</span> • Drafted {new Date(po.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Transaction Actions based on status */}
                  <div className="flex items-center gap-2">
                    {po.status === 'DRAFT' && (
                      <button
                        id={`mark-po-sent-${po.id}`}
                        onClick={() => updatePOStatus(po.id, 'SENT')}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-1 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Mark as Sent
                      </button>
                    )}
                    {po.status === 'SENT' && (
                      <button
                        id={`mark-po-received-${po.id}`}
                        onClick={() => {
                          if (window.confirm(`Receive items from ${po.poNumber}? Product stock levels will be incremented instantly!`)) {
                            updatePOStatus(po.id, 'RECEIVED');
                          }
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition flex items-center gap-1 shadow-xs animate-bounce"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        Mark as Received
                      </button>
                    )}
                    {po.status === 'RECEIVED' && (
                      <span className="text-xs font-medium text-emerald-800 bg-emerald-50/50 border border-emerald-100 rounded-lg px-2.5 py-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Fulfilled & Repopulated
                      </span>
                    )}

                    <button
                      id={`delete-po-${po.id}`}
                      onClick={() => {
                        if (window.confirm('Are you absolutely sure you want to completely discard this purchase order record?')) {
                          deletePurchaseOrder(po.id);
                        }
                      }}
                      className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items and totals list */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Order payload details</div>
                  <div className="bg-slate-50/60 rounded-xl overflow-hidden border border-slate-100">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[10px]">
                          <th className="py-2.5 px-4 font-semibold">SKU / Item</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Unit Cost</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Ordered Qty</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Ext. Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-medium font-mono">
                        {po.items.map(item => (
                          <tr key={item.productId} className="hover:bg-slate-50/20">
                            <td className="py-2.5 px-4">
                              <span className="text-slate-800 font-semibold text-xs font-sans block">{item.name}</span>
                              <span className="text-[10px] text-slate-400">{item.sku}</span>
                            </td>
                            <td className="py-2.5 px-3 text-center">${item.cost.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">{item.quantity} units</td>
                            <td className="py-2.5 px-4 text-right text-slate-900 font-bold">${(item.quantity * item.cost).toFixed(2)}</td>
                          </tr>
                        ))}
                        {/* Summary totals */}
                        <tr className="bg-slate-50/80 font-sans border-t border-slate-100">
                          <td colSpan={2} className="py-3 px-4 font-semibold text-slate-500 text-left">Total Value</td>
                          <td className="py-3 px-3 font-bold text-slate-800 font-mono text-center">
                            {po.items.reduce((acc, curr) => acc + curr.quantity, 0)} units
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-700 text-right font-mono text-sm">
                            ${po.totalAmount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {po.notes && (
                  <div className="text-xs text-slate-400 italic bg-amber-50/30 p-2.5 rounded-lg border border-amber-100/30">
                    * Notes: {po.notes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* PO DRAFT CREATION MODAL */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4" id="po-creator-overlay">
          <div className="bg-white rounded-2xl w-full max-w-2xl border flex flex-col max-h-[85vh] shadow-2xl overflow-hidden" id="po-creator-block">
            {/* Modal header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Compile Purchase Order Draft</h3>
              </div>
              <button 
                id="close-po-creator-icon"
                onClick={() => setIsCreatorOpen(false)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPO} className="flex-1 overflow-y-auto p-6 space-y-5" id="po-creator-form">
              {/* Select Supplier */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Configure Target Supplier</label>
                <select
                  id="creator-supplier-select"
                  value={selectedSupplierId}
                  onChange={(e) => {
                    setSelectedSupplierId(e.target.value);
                    setPoItems([]);
                  }}
                  className="w-full px-3 py-2 text-sm border focus:outline-hidden rounded-lg bg-white"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">Selecting a supplier will instantly load active inventory catalog items associated with them.</p>
              </div>

              {/* Items select slider */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Select Item Quantities to Order</label>
                {supplierProducts.length === 0 ? (
                  <div className="p-6 bg-red-50 rounded-xl border border-red-100 text-center flex items-center gap-2 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>This supplier currently has no items assigned to them in your catalog. Please add catalog items or assign existing products to them first.</span>
                  </div>
                ) : (
                  <div className="divide-y border rounded-xl overflow-hidden bg-slate-50/50 max-h-56 overflow-y-auto">
                    {supplierProducts.map(p => {
                      const itemInDraft = poItems.find(item => item.productId === p.id);
                      const currentQty = itemInDraft ? itemInDraft.quantity : 0;

                      return (
                        <div key={p.id} className="p-3.5 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/50 transition">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 block truncate">{p.name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span className="font-mono bg-slate-100 px-1 py-0.2 rounded font-semibold text-slate-500">{p.sku}</span>
                              <span>•</span>
                              <span>Stock level: <b className="text-slate-600 font-mono">{p.quantity} units</b> (Safety: {p.safetyStock})</span>
                              <span>•</span>
                              <span>Est Cost: ${p.cost.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 border rounded-lg bg-slate-50 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleSetItemQty(p.id, currentQty - 1)}
                              className="px-2 py-1 text-slate-500 hover:text-red-700 text-xs font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={currentQty}
                              onChange={(e) => handleSetItemQty(p.id, parseInt(e.target.value) || 0)}
                              className="w-10 text-center bg-transparent text-xs font-bold font-mono focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => handleSetItemQty(p.id, currentQty + 1)}
                              className="px-2 py-1 text-slate-500 hover:text-indigo-600 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Order Delivery Notes</label>
                <input
                  id="creator-po-notes"
                  type="text"
                  placeholder="e.g. Expedited shipping, door delivery requested, fragile items bundle"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border focus:outline-hidden rounded-lg bg-white"
                />
              </div>

              {/* Running total section */}
              <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between text-white shadow-inner font-sans">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Accumulated Total Amount</span>
                  <div className="text-xs text-slate-300 font-semibold">{poItems.length} styles included</div>
                </div>
                <div className="text-2xl font-bold font-mono text-indigo-400">
                  ${draftTotalAmount.toFixed(2)}
                </div>
              </div>

              {/* Submit footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  id="cancel-creator-btn"
                  type="button"
                  onClick={() => setIsCreatorOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-black"
                >
                  Cancel
                </button>
                <button
                  id="submit-creator-btn"
                  type="submit"
                  disabled={poItems.length === 0}
                  className="px-4.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition"
                >
                  Draft Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
