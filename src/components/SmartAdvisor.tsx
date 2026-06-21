import React, { useState } from 'react';
import { useInventory } from './InventoryState';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  Bot, 
  HelpCircle, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  Lightbulb,
  Building2,
  Lock
} from 'lucide-react';
import Markdown from 'react-markdown';

export const SmartAdvisor: React.FC = () => {
  const { products, suppliers } = useInventory();
  
  // States
  const [activeTab, setActiveTab] = useState<'MACROS' | 'CHAT'>('MACROS');
  const [responseOutput, setResponseOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulatedResponse, setIsSimulatedResponse] = useState(false);

  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Hello! I am your SaaS Supply Chain Copilot. Choose one of the quick optimization audits under "Smart Tool Macros" or ask me anything directly about margins, carrying costs, or replenishment strategies!' }
  ]);

  // Selected supplier for email drafting macro
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');

  // MACRO 1: Running carrying cost optimization
  const handleRunOptimization = async () => {
    setIsLoading(true);
    setResponseOutput('');
    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allProducts: products })
      });
      const data = await res.json();
      if (data.success) {
        setResponseOutput(data.recommendation);
        setIsSimulatedResponse(!!data.simulated);
      } else {
        alert('Server returned error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Network failure connecting to Express server.');
    } finally {
      setIsLoading(false);
    }
  };

  // MACRO 2: Drafting professional purchase order email
  const handleDraftRestockEmail = async () => {
    const supplierObj = suppliers.find(s => s.id === selectedSupplierId);
    
    // Find low stock products associated with this supplier
    const supplierLowStock = products.filter(
      p => p.supplierId === selectedSupplierId && p.quantity <= p.safetyStock
    );

    if (supplierLowStock.length === 0) {
      alert(`There are currently no items under safety stock levels for "${supplierObj?.name || 'this supplier'}"!`);
      // Proceed anyway with basic products to show the draft
    }

    setIsLoading(true);
    setResponseOutput('');
    try {
      const res = await fetch('/api/ai/advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lowStockProducts: supplierLowStock.length > 0 ? supplierLowStock : products.filter(p => p.supplierId === selectedSupplierId),
          supplier: supplierObj
        })
      });
      const data = await res.json();
      if (data.success) {
        setResponseOutput(data.guidance);
        setIsSimulatedResponse(!!data.simulated);
      } else {
        alert('Server returned error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Network failure connecting to Express server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Custom chat message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      // Simulate real context feed or proxy to server optimizer
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allProducts: products,
          customQuery: userText // Not strictly parsed on backend yet, but forces the endpoint fallback
        })
      });
      const data = await res.json();
      
      let aiText = '';
      if (data.success) {
        if (data.simulated) {
          aiText = `[AI SIMULATION RESPONSE] Thank you for asking: "${userText}".\n\nTo answer precisely: Your inventory carries **${products.length} registered SKUs** with a total carrying cost of **$${products.reduce((acc, curr) => acc + (curr.quantity * curr.cost), 0).toFixed(2)}**. To receive specialized supply chain planning models tuned to: "${userText}", please paste your live GMINI_API_KEY into the secrets tab in AI Studio!`;
        } else {
          aiText = data.recommendation; // backend returns optimization analysis or customized result
        }
      } else {
        aiText = "Apologies, the Express backend encountered a connection problem generating details.";
      }

      setChatHistory(prev => [...prev, { role: 'assistant', text: aiText }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'assistant', text: "Disconnected. Please verify that the local server is running on port 3000." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="ai-advisor-container">
      {/* Top Banner section */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800" id="advisor-upper-head">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Bot className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-4 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Gemini GenAI Supply Analyst
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">AI Restock Forecasting & Strategic Guidance</h1>
          <p className="text-slate-300 text-sm">Convert complex balance sheets and low stock variables into immediate supplier order draft emails and storage capital optimized audits.</p>
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setActiveTab('MACROS')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${activeTab === 'MACROS' ? 'bg-white text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
            >
              Smart Tool Macros
            </button>
            <button
              onClick={() => setActiveTab('CHAT')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${activeTab === 'CHAT' ? 'bg-white text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
            >
              Consulting Chat Console
            </button>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT SPLITS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="advisor-body-splits">
        {/* Left Side Tab Panels */}
        <div className="lg:col-span-5 space-y-6">
          {activeTab === 'MACROS' ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5" id="macros-panel">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Select Macro Execution</h3>
                <p className="text-xs text-slate-400">Execute parameterized analytics procedures leveraging deep model capabilities.</p>
              </div>

              {/* Macro 1: Space carrying weights */}
              <div className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-900 text-sm">Capital Carrying Optimization</h4>
                    <p className="text-xs text-slate-500">Scan active stock weights, compile slow sales items suggestions and storage recommendations.</p>
                  </div>
                </div>
                <button
                  id="trigger-optimize-macro"
                  onClick={handleRunOptimization}
                  disabled={isLoading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                  Audit Space & Capital
                </button>
              </div>

              {/* Macro 2: supplier Restock Email */}
              <div className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-900 text-sm">Supplier Reorder Email Builder</h4>
                    <p className="text-xs text-slate-500">Draft professional restock emails specifying low stock safety count discrepancies per supplier.</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Select Supplier</label>
                  <select
                    id="advisor-supplier-select"
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border focus:outline-hidden rounded-lg bg-white font-medium"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  id="trigger-reorder-email-macro"
                  onClick={handleDraftRestockEmail}
                  disabled={isLoading || !selectedSupplierId}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-indigo-200" />}
                  Draft Order Email Details
                </button>
              </div>
            </div>
          ) : (
            /* CONSOLE CHAT VIEW */
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[400px] justify-between" id="chat-panel">
              <div className="space-y-1 pb-3 border-b">
                <h3 className="font-bold text-slate-900 text-base">Direct Supply Copilot</h3>
                <p className="text-xs text-slate-400">Ask strategic questions about stock configurations.</p>
              </div>

              {/* Chat history frames */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
                {chatHistory.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-2xl max-w-[85%] ${m.role === 'user' ? 'bg-slate-900 text-white ml-auto rounded-tr-none' : 'bg-slate-50 text-slate-700 mr-auto rounded-tl-none border border-slate-100'}`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-slate-50 border p-3 rounded-2xl mr-auto max-w-[80%] rounded-tl-none text-slate-400 flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Gemini is synthesizing catalog details...</span>
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChatMessage} className="flex gap-2" id="chat-box-form">
                <input
                  id="chat-console-input"
                  type="text"
                  placeholder="Ask advisor: e.g. How to lower holding counts?"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border focus:outline-hidden rounded-xl bg-white focus:border-slate-400"
                />
                <button
                  id="submit-chat-msg"
                  type="submit"
                  disabled={isLoading || !chatInput.trim()}
                  className="bg-slate-950 text-white p-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-45"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Side Outputs panel (Displays generated markdown/details) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[400px]" id="advisor-outputs">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-50">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-base">Generated Intelligence Analytics</h3>
                <p className="text-xs text-slate-400">Structured action plan outlines curated from your operational telemetry</p>
              </div>
            </div>

            {isSimulatedResponse && (
              <div className="mt-3 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-1.5">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Using integrated AI simulations. Register your professional **GEMINI_API_KEY** in AI Studio secrets menu to allow full live dynamic analytics.
                </span>
              </div>
            )}

            {/* Markdown rendered result output */}
            <div className="py-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans prose max-w-none prose-slate" id="markdown-display-box">
              {responseOutput ? (
                <div className="markdown-body">
                  <Markdown>{responseOutput}</Markdown>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400 font-semibold space-y-2 flex flex-col items-center justify-center">
                  <Bot className="w-10 h-10 text-slate-200 animate-bounce" />
                  <p className="text-slate-500">Awaiting parameterized analysis request.</p>
                  <p className="text-xs text-slate-400 max-w-xs leading-normal font-normal">Click any macro audits on the left panel to execute smart restocking forecasting or carry cost optimization instantly.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-green-500" />
              Tuned to model: gemini-2.5-flash
            </span>
            <span>Refreshed live</span>
          </div>
        </div>
      </div>
    </div>
  );
};
