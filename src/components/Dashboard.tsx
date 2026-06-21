import React from 'react';
import { useInventory } from './InventoryState';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  Layers, 
  ArrowUpRight, 
  CheckCircle,
  FileText,
  Clock
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onSelectSupplierForReorder?: (supplierId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectSupplierForReorder }) => {
  const { products, overview, transactions, suppliers } = useInventory();

  // Prepare data for Category Chart
  const categoryData = React.useMemo(() => {
    const data: { [key: string]: { category: string; costValue: number; retailValue: number; items: number } } = {};
    
    products.forEach(p => {
      const cat = p.category || 'General';
      if (!data[cat]) {
        data[cat] = { category: cat, costValue: 0, retailValue: 0, items: 0 };
      }
      data[cat].costValue += (p.quantity * p.cost);
      data[cat].retailValue += (p.quantity * p.price);
      data[cat].items += p.quantity;
    });

    return Object.values(data).map(item => ({
      ...item,
      costValue: parseFloat(item.costValue.toFixed(2)),
      retailValue: parseFloat(item.retailValue.toFixed(2)),
    }));
  }, [products]);

  // Prepare data for Stock Level vs Safety Level
  const stockLevelData = React.useMemo(() => {
    return products.slice(0, 8).map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      current: p.quantity,
      safety: p.safetyStock,
    }));
  }, [products]);

  // Highlight urgent low-stock items
  const lowStockItems = React.useMemo(() => {
    return products
      .filter(p => p.quantity <= p.safetyStock)
      .sort((a, b) => {
        const ratioA = a.quantity / (a.safetyStock || 1);
        const ratioB = b.quantity / (b.safetyStock || 1);
        return ratioA - ratioB; // show lowest ratio first
      })
      .slice(0, 5);
  }, [products]);

  const recentTxs = React.useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const colors = ['#4f46e5', '#3b82f6', '#0ea5e9', '#8b5cf6', '#6366f1', '#64748b'];

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* SaaS App Header Summary Status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" id="dashboard-welcome">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time status of your physical inventory assets, stock alerts, and fulfillment valuations.</p>
        </div>
        <div className="flex gap-2">
          <button 
            id="nav-to-adjust"
            onClick={() => onNavigate('inventory')}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition duration-150 flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" />
            Adjust Inventory
          </button>
          <button 
            id="nav-to-advisor"
            onClick={() => onNavigate('advisor')}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow transition duration-150 flex items-center gap-1.5"
          >
            <TrendingUp className="w-4 h-4 text-indigo-200" />
            AI restock advice
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        {/* Total Stock Cost Carrying Worth */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between" id="metric-stock-value">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset Valuation</span>
            <div className="text-2xl font-bold font-mono text-slate-900">${overview.totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-400 font-medium">Carrying cost of current inventory</p>
          </div>
          <div className="p-3.5 bg-indigo-50 rounded-xl">
            <DollarSign className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        {/* Expected Selling Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between" id="metric-retail-value">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expected Revenue</span>
            <div className="text-2xl font-bold font-mono text-slate-900">${overview.totalRetailValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Est. Profit: ${overview.potentialProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-3.5 bg-blue-50 rounded-xl">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Total Item count */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between" id="metric-total-items">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit Inventory</span>
            <div className="text-2xl font-bold font-mono text-slate-900">{overview.totalItems.toLocaleString()}</div>
            <p className="text-xs text-slate-400 font-medium">Total registered units on shelves</p>
          </div>
          <div className="p-3.5 bg-violet-50 rounded-xl">
            <Layers className="w-6 h-6 text-violet-600" />
          </div>
        </div>

        {/* Alerts count */}
        <div className={`p-6 rounded-2xl border shadow-xs flex items-center justify-between transition-colors ${
          overview.lowStockCount > 0 ? 'bg-amber-50/50 border-amber-250' : 'bg-white border-slate-200'
        }`} id="metric-alerts">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Health Alerts</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold font-mono ${overview.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {overview.lowStockCount}
              </span>
              {overview.outOfStockCount > 0 && (
                <span className="text-xs font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                  {overview.outOfStockCount} OUT
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-400">
              {overview.lowStockCount > 0 ? 'Urgent attention recommended' : 'All items at healthy levels'}
            </p>
          </div>
          <div className={`p-3.5 rounded-xl ${overview.lowStockCount > 0 ? 'bg-amber-100' : 'bg-slate-50'}`}>
            <AlertTriangle className={`w-6 h-6 ${overview.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
        </div>
      </div>

      {/* CHART SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="charts-and-alerts">
        {/* Category distribution Recharts */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="chart-panel">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-900 text-base">Category Valuation Comparison</h3>
              <p className="text-xs text-slate-400">Total Capital Cost vs Potential Revenue generated per catalog sector</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg font-medium border border-slate-100 font-mono">
              {categoryData.length} active sectors
            </span>
          </div>

          <div className="h-80 w-full" id="bar-chart-recharts">
            {categoryData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-1 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Package className="w-8 h-8 text-slate-300" />
                <p className="text-sm font-medium">No items registered to generate charts.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="category" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickFormatter={(value) => `$${value}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                    contentStyle={{ background: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="costValue" name="Asset Capital Cost ($)" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="retailValue" name="Expected Sales Revenue ($)" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Stock Level safety thresholds */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between" id="pie-chart-panel">
          <div className="space-y-4">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-900 text-base">Capital Weight Density</h3>
              <p className="text-xs text-slate-400">Proportional breakdown of total carrying capital assets</p>
            </div>
            
            <div className="h-56 w-full relative flex items-center justify-center">
              {categoryData.length === 0 ? (
                <p className="text-xs text-slate-400">Ready to compute profiles</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="costValue"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Capital']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {categoryData.length > 0 && (
                <div className="absolute text-center">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Grand Asset</div>
                  <div className="text-lg font-bold font-mono text-slate-950">${overview.totalStockValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5 mt-2 overflow-y-auto max-h-24">
            {categoryData.map((cat, i) => {
              const percentage = overview.totalStockValue > 0 
                ? ((cat.costValue / overview.totalStockValue) * 100).toFixed(0) 
                : '0';
              return (
                <div key={cat.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                    <span className="text-slate-600 truncate font-medium">{cat.category}</span>
                  </div>
                  <span className="text-slate-400 font-mono font-semibold">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CRITICAL ALERTS & RECENT HISTORY TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="alerts-and-history-panel">
        
        {/* Urgent action items list */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between" id="low-stock-alert-panel">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-50">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-base">Low Stock Flag Alerts</h3>
                <p className="text-xs text-slate-400">Items where stock is less than safety buffer</p>
              </div>
              <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {lowStockItems.length} listed
              </span>
            </div>

            <div className="divide-y divide-slate-50 py-2">
              {lowStockItems.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <p className="text-sm font-semibold text-slate-700">All shelves fully loaded!</p>
                  <p className="text-xs text-slate-400">No safety thresholds breached at this time.</p>
                </div>
              ) : (
                lowStockItems.map(p => {
                  const percent = Math.min(100, (p.quantity / (p.safetyStock || 1)) * 100);
                  const supplierName = suppliers.find(s => s.id === p.supplierId)?.name || 'Direct';
                  return (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 text-sm truncate">{p.name}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1 py-0.5 rounded uppercase">{p.sku}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          <span>Supplier: <span className="text-slate-600 font-medium">{supplierName}</span></span>
                          <span>•</span>
                          <span>Stock: <span className="text-slate-700 font-bold">{p.quantity}</span>/{p.safetyStock}</span>
                        </div>
                        {/* Custom status bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${p.quantity === 0 ? 'bg-red-500' : 'bg-amber-500'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <button
                          id={`reorder-link-for-${p.id}`}
                          onClick={() => {
                            if (onSelectSupplierForReorder && p.supplierId) {
                              onSelectSupplierForReorder(p.supplierId);
                            }
                            onNavigate('pos');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 rounded-lg transition duration-150"
                        >
                          Draft PO
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {lowStockItems.length > 0 && (
            <button 
              id="goto-advisor-restock"
              onClick={() => onNavigate('advisor')}
              className="mt-4 w-full py-2 bg-slate-50 active:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-center gap-1 transition-colors"
            >
              Consult Gemini AI restock forecast
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Audit Transaction logs */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between" id="recent-transactions-panel">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-50">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-base">Real-time Activity Logs</h3>
                <p className="text-xs text-slate-400">Traceable audit records of shipments, adjustments, and counter sales</p>
              </div>
              <button 
                id="view-trans-link"
                onClick={() => onNavigate('inventory')}
                className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
              >
                Track stock changes
              </button>
            </div>

            <div className="py-2 divide-y divide-slate-50">
              {recentTxs.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Clock className="w-8 h-8 text-slate-300 mb-2" />
                  <p>Audit trail has no active elements yet.</p>
                </div>
              ) : (
                recentTxs.map(tx => {
                  let badgeBg = 'bg-slate-100 text-slate-700';
                  let iconLabel = 'Adjustment';
                  if (tx.type === 'INCOMING') {
                    badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    iconLabel = 'Restocked';
                  } else if (tx.type === 'SALE') {
                    badgeBg = 'bg-blue-50 text-blue-700 border-blue-100';
                    iconLabel = 'Order Out';
                  } else if (tx.type === 'PO_RECEIPT') {
                    badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-100 border';
                    iconLabel = 'Received PO';
                  }

                  return (
                    <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeBg}`}>
                            {iconLabel}
                          </span>
                          <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
                            {tx.productName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                          <span className="font-mono text-[11px] font-medium bg-slate-50 border border-slate-100 px-1 py-0.2 rounded">{tx.productSku}</span>
                          <span>•</span>
                          <span className="truncate max-w-[180px] sm:max-w-xs">{tx.notes}</span>
                          <span>•</span>
                          <span>{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold font-mono text-xs sm:text-sm ${tx.quantity > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {tx.previousQuantity} → {tx.newQuantity} u
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" />
              SaaS server active
            </span>
            <span>Local DB synced</span>
          </div>
        </div>

      </div>
    </div>
  );
};
