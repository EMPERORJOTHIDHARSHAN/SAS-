import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './components/InventoryState';
import { Dashboard } from './components/Dashboard';
import { InventoryList } from './components/InventoryList';
import { SuppliersList } from './components/SuppliersList';
import { PurchaseOrders } from './components/PurchaseOrders';
import { SmartAdvisor } from './components/SmartAdvisor';
import { 
  LayoutDashboard, 
  Package, 
  Building2, 
  ShoppingCart, 
  Sparkles, 
  Menu, 
  X, 
  Bell, 
  User, 
  LogOut,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Inbox
} from 'lucide-react';

function AppContent() {
  const { overview, purchaseOrders, products } = useInventory();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSupplierForReorder, setSelectedSupplierForReorder] = useState<string>('');

  // Count pending items
  const sentPoCount = purchaseOrders.filter(po => po.status === 'SENT').length;

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', name: 'SKU Inventory', icon: Package },
    { id: 'suppliers', name: 'Suppliers', icon: Building2 },
    { id: 'pos', name: 'Restock Orders', icon: ShoppingCart, badge: sentPoCount },
    { id: 'advisor', name: 'Gemini Advisor', icon: Sparkles, highlight: true },
  ];

  const handleSelectSupplierForReorder = (supplierId: string) => {
    setSelectedSupplierForReorder(supplierId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="main-saas-layout">
      {/* UPPER BRAND HEADER */}
      <header className="bg-white border-b border-slate-100 h-16 shrink-0 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between shadow-xs" id="upper-header">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button 
            id="mobile-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 md:hidden text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl flex items-center justify-center font-bold font-mono text-sm tracking-widest shadow-xs shadow-indigo-500/10">
              INV
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-slate-900 text-sm sm:text-base">SaaS Inventory Platform</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Small Business Suite</span>
            </div>
          </div>
        </div>

        {/* Global info controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notification count */}
          <div className="relative" id="alert-trigger-box">
            <button className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition relative">
              <Bell className="w-5 h-5" />
              {overview.lowStockCount > 0 && (
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>
          </div>

          {/* Connected User session widget */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-100" id="user-profile-widget">
            <div className="bg-slate-100 text-slate-600 p-1.5 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800">Administrator</span>
              <span className="text-[10px] text-slate-400 truncate max-w-[150px]">jothidharsh@gmail.com</span>
            </div>
          </div>
        </div>
      </header>

      {/* LOWER STAGE AND SIDEBAR STRUCTURE */}
      <div className="flex flex-1 relative overflow-hidden" id="stage-structure">
        {/* Navigation Sidebar */}
        <aside 
          id="navigation-sidebar"
          className={`fixed inset-y-16 left-0 z-30 w-64 bg-white border-r border-slate-100 flex flex-col justify-between transform md:transform-none transition-transform duration-200 ease-in-out md:static ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-4 space-y-6">
            <nav className="space-y-1" id="nav-tabs">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    id={`sidebar-tab-${tab.id}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false); // Close sidebar on mobile select
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                      isActive 
                        ? 'text-indigo-600 bg-indigo-50' 
                        : tab.highlight 
                          ? 'text-indigo-600 bg-indigo-50/40 hover:bg-indigo-50/80 border border-indigo-100' 
                          : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span>{tab.name}</span>
                    </div>
                    
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="bg-indigo-600 text-white rounded-full text-[10px] font-bold px-2 py-0.5">
                        {tab.badge}
                      </span>
                    )}

                    {tab.highlight && !isActive && (
                      <span className="bg-indigo-500 w-1.5 h-1.5 rounded-full animate-ping shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">Live Telemetry</div>
              <div className="mt-2.5 bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Low Stock Alert</span>
                    <span className={`font-mono font-bold ${overview.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>{overview.lowStockCount} items</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${overview.lowStockCount > 0 ? 'bg-amber-500' : 'bg-indigo-600'}`} 
                      style={{ width: `${Math.max(10, Math.min(100, (overview.lowStockCount / Math.max(1, products.length)) * 100))}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Grand Valuation</span>
                    <span className="font-bold text-slate-700 font-mono">${overview.totalStockValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full w-[82%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200 bg-white space-y-2.5 mt-auto">
            <div className="bg-indigo-900 rounded-lg p-4 text-white">
              <p className="text-[10px] font-semibold uppercase opacity-60 mb-1">SaaS Status</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="font-medium text-xs">Synced Local Cache</p>
              </div>
              <p className="text-[10px] mt-2 opacity-80 leading-relaxed">Platform runs offline-first. Restocks instantly log into browser storage.</p>
            </div>
          </div>
        </aside>

        {/* Mobile menu mask backdrop */}
        {sidebarOpen && (
          <div 
            id="mobile-sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-slate-900/45 md:hidden"
          />
        )}

        {/* Dynamic Main Stage Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8" id="stage-viewport">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard 
                onNavigate={(tab) => setActiveTab(tab)} 
                onSelectSupplierForReorder={handleSelectSupplierForReorder} 
              />
            )}
            
            {activeTab === 'inventory' && (
              <InventoryList />
            )}
            
            {activeTab === 'suppliers' && (
              <SuppliersList />
            )}
            
            {activeTab === 'pos' && (
              <PurchaseOrders initialSupplierSelection={selectedSupplierForReorder} />
            )}
            
            {activeTab === 'advisor' && (
              <SmartAdvisor />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}
