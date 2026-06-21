import React, { useState } from 'react';
import { useInventory } from './InventoryState';
import { Product } from '../types';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  PlusCircle, 
  MinusCircle, 
  Sparkles, 
  Filter, 
  ArrowUpDown, 
  Check, 
  X,
  RefreshCw,
  Info
} from 'lucide-react';

export const InventoryList: React.FC = () => {
  const { 
    products, 
    suppliers, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    adjustStock,
    transactions 
  } = useInventory();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Drawer / Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdjustingId, setIsAdjustingId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Manual cycle count updates');

  // Product Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [quantity, setQuantity] = useState('');
  const [safetyStock, setSafetyStock] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [description, setDescription] = useState('');
  const [tagsText, setTagsText] = useState('');

  // AI copywriting state
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const [aiDisclaimer, setAiDisclaimer] = useState<string | null>(null);

  // Categories list
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // handle Sort
  const toggleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered and Sorted products
  const processedProducts = React.useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        p.sku.toLowerCase().includes(lower) ||
        p.category.toLowerCase().includes(lower)
      );
    }

    // Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Stock Filter
    if (stockFilter === 'LOW') {
      result = result.filter(p => p.quantity > 0 && p.quantity <= p.safetyStock);
    } else if (stockFilter === 'OUT') {
      result = result.filter(p => p.quantity === 0);
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = (valA as string).toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, searchTerm, selectedCategory, stockFilter, sortField, sortOrder]);

  // Open Form for Adding
  const handleOpenAddForm = () => {
    setEditingProduct(null);
    setName('');
    setSku(`SKU-${Date.now().toString().slice(-6)}`);
    setCategory('Electronics');
    setPrice('49.99');
    setCost('19.50');
    setQuantity('10');
    setSafetyStock('5');
    setSupplierId(suppliers[0]?.id || '');
    setDescription('');
    setTagsText('Premium, In-Demand');
    setAiNotes('');
    setAiDisclaimer(null);
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEditForm = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setPrice(p.price.toString());
    setCost(p.cost.toString());
    setQuantity(p.quantity.toString());
    setSafetyStock(p.safetyStock.toString());
    setSupplierId(p.supplierId);
    setDescription(p.description);
    setTagsText(p.tags.join(', '));
    setAiNotes(p.description);
    setAiDisclaimer(null);
    setIsFormOpen(true);
  };

  // Submit form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTags = tagsText.split(',').map(t => t.trim()).filter(Boolean);

    const productPayload = {
      name,
      sku,
      category,
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      quantity: parseInt(quantity) || 0,
      safetyStock: parseInt(safetyStock) || 0,
      supplierId,
      description,
      tags: cleanTags,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload, 'Updated core details via manager panel');
    } else {
      addProduct(productPayload);
    }
    setIsFormOpen(false);
  };

  // Call Gemini AI on server to draft descriptions
  const handleGenerateAIDetails = async () => {
    if (!name.trim()) {
      alert('Please enter a product name first before asking Gemini!');
      return;
    }
    setIsAILoading(true);
    setAiDisclaimer(null);

    try {
      const response = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          crudeNotes: aiNotes || description,
          targetPrice: price
        })
      });

      const json = await response.json();
      if (json.success) {
        setDescription(json.description);
        if (json.tags && json.tags.length > 0) {
          setTagsText(json.tags.join(', '));
        }
        if (json.suggestedPrice) {
          setPrice(json.suggestedPrice.toFixed(2));
        }
        if (json.simulated) {
          setAiDisclaimer("Using Simulated local AI models. Set up an actual 'GEMINI_API_KEY' in the secret tab to unlock native model outputs!");
        } else {
          setAiDisclaimer("Successfully generated description and tags using Gemini 2.5 Flash!");
        }
      } else {
        alert('Server returned error: ' + json.error);
      }
    } catch (err: any) {
      console.error(err);
      alert('Network failure connecting to Express API. Ensure server is initialized.');
    } finally {
      setIsAILoading(false);
    }
  };

  // Quick Adjustment handler
  const handleApplyAdjustment = (productId: string) => {
    if (adjustAmount === 0) {
      setIsAdjustingId(null);
      return;
    }
    adjustStock(productId, adjustAmount, 'ADJUSTMENT', adjustReason);
    setIsAdjustingId(null);
    setAdjustAmount(0);
    setAdjustReason('Manual adjustment cycle count');
  };

  return (
    <div className="space-y-6" id="inventory-list-container">
      {/* Header controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="inv-header">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Inventory Directory</h2>
          <p className="text-xs text-slate-400">Add, edit, adjust counts, and run smart copywriter updates on catalog SKUs.</p>
        </div>
        <button
          id="add-product-btn"
          onClick={handleOpenAddForm}
          className="px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4.5 h-4.5" />
          Register New SKU
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-xs" id="search-filter-pills">
        {/* Search Input */}
        <div className="relative md:col-span-5">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            id="sku-search"
            type="text"
            placeholder="Search by keywords, tags, category or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 hover:border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-green-500 font-medium"
          />
        </div>

        {/* Category select dropdown */}
        <div className="md:col-span-3">
          <select
            id="cat-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-green-500 font-medium bg-white"
          >
            <option value="All">All Categories</option>
            {categories.filter(c => c !== 'All').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Stock alerts Filter buttons */}
        <div className="md:col-span-4 flex rounded-lg border border-slate-200 overflow-hidden divide-x divide-slate-200" id="filter-ratio-pills">
          <button
            id="filter-all-btn"
            onClick={() => setStockFilter('ALL')}
            className={`flex-1 py-2 text-xs font-semibold text-center transition ${stockFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            All Stock
          </button>
          <button
            id="filter-low-btn"
            onClick={() => setStockFilter('LOW')}
            className={`flex-1 py-2 text-xs font-semibold text-center transition flex items-center justify-center gap-1 ${stockFilter === 'LOW' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock
          </button>
          <button
            id="filter-out-btn"
            onClick={() => setStockFilter('OUT')}
            className={`flex-1 py-2 text-xs font-semibold text-center transition flex items-center justify-center gap-1 ${stockFilter === 'OUT' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Out of Stock
          </button>
        </div>
      </div>

      {/* Main Inventory Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="inventory-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="main-inventory-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-4 px-6 font-semibold">SKU Details</th>
                <th className="py-4 px-3 font-semibold pointer-events-none">Category</th>
                <th 
                  className="py-4 px-3 font-semibold cursor-pointer select-none hover:text-slate-900 transition flex items-center gap-1"
                  onClick={() => toggleSort('quantity')}
                >
                  Stock Level
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </th>
                <th 
                  className="py-4 px-3 font-semibold cursor-pointer select-none hover:text-slate-900 transition"
                  onClick={() => toggleSort('cost')}
                >
                  Unit Cost
                </th>
                <th 
                  className="py-4 px-3 font-semibold cursor-pointer select-none hover:text-slate-900 transition"
                  onClick={() => toggleSort('price')}
                >
                  Retail Price
                </th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {processedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="w-8 h-8 text-slate-200 animate-pulse" />
                      <p>No matching SKU numbers or products found in cache.</p>
                      <button 
                        id="reset-pills-btn"
                        onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setStockFilter('ALL'); }}
                        className="text-xs text-green-600 font-semibold underline hover:text-green-700 mt-1"
                      >
                        Reset search criteria
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                processedProducts.map(p => {
                  const isLow = p.quantity > 0 && p.quantity <= p.safetyStock;
                  const isOut = p.quantity === 0;
                  const currentSupplier = suppliers.find(s => s.id === p.supplierId);

                  return (
                    <React.Fragment key={p.id}>
                      <tr className={`hover:bg-slate-50/50 transition duration-100 ${isOut ? 'bg-red-50/10' : isLow ? 'bg-amber-50/5' : ''}`}>
                        {/* Name & SKU */}
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span className="font-mono bg-slate-100 font-semibold px-2 py-0.5 rounded text-slate-500 uppercase tracking-wide">{p.sku}</span>
                            <span>•</span>
                            <span className="text-slate-500 truncate max-w-[200px]" title={p.lastUpdated}>{new Date(p.lastUpdated).toLocaleDateString()}</span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-3">
                          <span className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
                            {p.category}
                          </span>
                        </td>

                        {/* Stock status */}
                        <td className="py-4 px-3 font-mono">
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-bold text-slate-800`}>
                              {p.quantity} / <span className="text-xs text-slate-400 font-medium">{p.safetyStock} safety</span>
                            </span>
                            {isOut ? (
                              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">OUT</span>
                            ) : isLow ? (
                              <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded">LOW</span>
                            ) : null}
                          </div>
                        </td>

                        {/* Direct monetary properties */}
                        <td className="py-4 px-3 font-mono font-medium text-slate-600">
                          ${p.cost.toFixed(2)}
                        </td>

                        <td className="py-4 px-3 font-mono font-bold text-slate-800">
                          ${p.price.toFixed(2)}
                        </td>

                        {/* Quick stock adjustments AND core edit modal keys */}
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            id={`quick-adjust-btn-${p.id}`}
                            onClick={() => {
                              setIsAdjustingId(isAdjustingId === p.id ? null : p.id);
                              setAdjustAmount(0);
                              setAdjustReason('Physical shelf counts audit');
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                          >
                            Quick Recount
                          </button>
                          <button
                            id={`edit-sku-${p.id}`}
                            onClick={() => handleOpenEditForm(p)}
                            className="p-1.5 inline-flex text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit3 className="w-4.5 h-4.5" />
                          </button>
                          <button
                            id={`delete-sku-${p.id}`}
                            onClick={() => {
                              if (window.confirm(`Are you absolutely sure you want to completely retire SKU ${p.sku} (${p.name})?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 inline-flex text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>

                      {/* Expanding Inline Recount Sub-Form */}
                      {isAdjustingId === p.id && (
                        <tr className="bg-slate-50/80" id={`adjust-row-${p.id}`}>
                          <td colSpan={6} className="px-6 py-4 border-t border-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Inline Inventory Recount</div>
                                <div className="text-xs text-slate-500">Add positives (replenishing) or negatives (theft, damaged, sold). Current: <b className="text-slate-800 font-mono font-bold">{p.quantity} units</b></div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
                                  <button
                                    id="minus-adjust"
                                    onClick={() => setAdjustAmount(prev => prev - 1)}
                                    className="p-2 transition bg-slate-50 active:bg-slate-100 hover:text-black"
                                  >
                                    <MinusCircle className="w-4 h-4 text-slate-500" />
                                  </button>
                                  <input
                                    id="adjust-amount-inp"
                                    type="number"
                                    value={adjustAmount}
                                    onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                                    className="w-16 text-center text-sm font-bold font-mono focus:outline-hidden"
                                  />
                                  <button
                                    id="plus-adjust"
                                    onClick={() => setAdjustAmount(prev => prev + 1)}
                                    className="p-2 transition bg-slate-50 active:bg-slate-100 hover:text-black"
                                  >
                                    <PlusCircle className="w-4 h-4 text-slate-500" />
                                  </button>
                                </div>
                                <input
                                  id="adjust-reason-inp"
                                  type="text"
                                  placeholder="Audit count notes..."
                                  value={adjustReason}
                                  onChange={(e) => setAdjustReason(e.target.value)}
                                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:outline-hidden min-w-[200px]"
                                />
                                <button
                                  id="confirm-adjust-btn"
                                  onClick={() => handleApplyAdjustment(p.id)}
                                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-lg transition"
                                >
                                  Apply Sync
                                </button>
                                <button
                                  id="close-adjust-btn"
                                  onClick={() => setIsAdjustingId(null)}
                                  className="p-1 px-2.5 text-xs text-slate-400 hover:text-slate-600 font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW SKU SKU / EDIT DETAILS DRAWER MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end" id="form-drawer-overlay">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between" id="form-drawer">
            {/* Drawer body scroll container */}
            <div className="overflow-y-auto p-6 md:p-8 space-y-6 flex-1">
              {/* Card top handles */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingProduct ? `Edit Registered SKU details` : `Register New Inventory SKU`}
                  </h3>
                  <p className="text-xs text-slate-400">Configure core product attributes, pricing, and associate with reliable suppliers.</p>
                </div>
                <button
                  id="close-drawer-icon"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 inline-flex text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* PRODUCT PROPERTIES INPUT FIELDS */}
              <form onSubmit={handleFormSubmit} className="space-y-5" id="product-meta-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Product Name *</label>
                    <input
                      id="form-product-name"
                      type="text"
                      required
                      placeholder="e.g. American Oak Display Stand"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-green-500 rounded-lg hover:border-slate-300 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">SKU Number (Unique) *</label>
                    <input
                      id="form-product-sku"
                      type="text"
                      required
                      placeholder="e.g. WF-OAK-091"
                      value={sku}
                      onChange={(e) => setSku(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-sm border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-green-500 rounded-lg font-mono font-semibold hover:border-slate-300 text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Product Category</label>
                    <input
                      id="form-product-category"
                      type="text"
                      placeholder="e.g. Electronics, Packaging"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-green-500 rounded-lg hover:border-slate-300 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Assigned Supplier *</label>
                    <select
                      id="form-product-supplier"
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-green-500 rounded-lg bg-white hover:border-slate-300 font-medium"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pricing values */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Cost Price ($) *</label>
                    <input
                      id="form-product-cost"
                      type="number"
                      step="0.01"
                      required
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className="w-full px-3 py-1.5 font-mono text-sm border border-slate-100 rounded-md focus:outline-hidden bg-white text-slate-700 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Retail Price ($) *</label>
                    <input
                      id="form-product-price"
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-1.5 font-mono text-sm border border-slate-100 rounded-md focus:outline-hidden bg-white text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 replacement">Units in Stock *</label>
                    <input
                      id="form-product-qty"
                      type="number"
                      required
                      value={quantity}
                      disabled={!!editingProduct} // Require recounts on edit mode
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-1.5 font-mono text-sm border border-slate-100 rounded-md focus:outline-hidden bg-white disabled:bg-slate-100 font-semibold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Safety Buffer *</label>
                    <input
                      id="form-product-safety"
                      type="number"
                      required
                      value={safetyStock}
                      onChange={(e) => setSafetyStock(e.target.value)}
                      className="w-full px-3 py-1.5 font-mono text-sm border border-slate-100 rounded-md focus:outline-hidden bg-white text-slate-700 font-semibold"
                    />
                  </div>
                </div>

                {/* AI COPYWRITING TOOLS CONNECTIONS */}
                <div className="space-y-3 bg-indigo-50/40 p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-xs" id="ai-generator-panel">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      <span className="text-sm font-bold text-slate-900">Gemini copywriting Copilot</span>
                    </div>
                    <button
                      id="generate-ai-text-btn"
                      type="button"
                      disabled={isAILoading}
                      onClick={handleGenerateAIDetails}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition shadow-xs flex items-center gap-1"
                    >
                      {isAILoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Consulting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                          Draft copy text
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Provide crude scribbled features in the draft box, click &apos;Draft copy text&apos; to generate full-scale high converting bullet descriptions and auto-tag indicators!</p>
                  
                  <textarea
                    id="ai-crude-notes"
                    placeholder="Scribble notes here (e.g. 'USB hub, 9 ports, aluminum finish, grey color, fast transfer, $50')"
                    value={aiNotes}
                    onChange={(e) => setAiNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-hidden rounded-lg bg-white"
                  />
                  {aiDisclaimer && (
                    <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50 rounded p-2 flex items-start gap-1">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{aiDisclaimer}</span>
                    </div>
                  )}
                </div>

                {/* Finished description and custom tag descriptors output */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Copywritten Product Description</label>
                    <textarea
                      id="form-product-desc"
                      placeholder="Write description or allow Gemini to compose copy from raw scribbles above."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-green-500 rounded-lg hover:border-slate-300 text-slate-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tags (Comma segregated)</label>
                    <input
                      id="form-product-tags"
                      type="text"
                      placeholder="e.g. Ergonomic, Premium, Walnut, Office"
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-green-500 rounded-lg hover:border-slate-300 font-medium"
                    />
                  </div>
                </div>

                {/* Form Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    id="cancel-add-btn"
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    id="save-product-btn"
                    type="submit"
                    className="px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-850 rounded-xl transition shadow-xs"
                  >
                    {editingProduct ? 'Commit Changes' : 'Register SKU'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
