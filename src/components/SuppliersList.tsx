import React, { useState } from 'react';
import { useInventory } from './InventoryState';
import { Supplier } from '../types';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  ExternalLink,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const SuppliersList: React.FC = () => {
  const { suppliers, products, addSupplier, updateSupplier, deleteSupplier } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal setup
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Filtering suppliers
  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddForm = () => {
    setEditingSupplier(null);
    setName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactName(s.contactName);
    setEmail(s.email);
    setPhone(s.phone);
    setAddress(s.address);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, contactName, email, phone, address };

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, payload);
    } else {
      addSupplier(payload);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6" id="suppliers-list-view">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="supplier-head">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Partner Suppliers</h2>
          <p className="text-xs text-slate-400">Track vendor contact details, locations, and catalogs. Automatically sync items per partner.</p>
        </div>
        <button
          id="add-supplier-btn"
          onClick={handleOpenAddForm}
          className="px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center justify-center gap-1 shrink-0 shadow-xs"
        >
          <Building2 className="w-4 h-4" />
          Onboard Supplier
        </button>
      </div>

      <div className="relative max-w-md bg-white rounded-lg shadow-2xs" id="supplier-search-cont">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4.5 w-4.5 text-slate-400" />
        </span>
        <input
          id="supplier-keyword-inp"
          type="text"
          placeholder="Filter vendors by name, representative or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="suppliers-tiles">
        {filteredSuppliers.length === 0 ? (
          <div className="md:col-span-2 bg-white py-12 px-6 border rounded-xl border-dashed border-slate-200 text-center text-slate-450 font-semibold flex flex-col items-center justify-center space-y-2">
            <Building2 className="w-8 h-8 text-slate-300" />
            <p className="text-slate-500 text-sm">No onboarded suppliers fit your current filter parameters.</p>
          </div>
        ) : (
          filteredSuppliers.map(s => {
            // Find items supplied by this supplier
            const vendorProducts = products.filter(p => p.supplierId === s.id);
            const totalVendorStock = vendorProducts.reduce((acc, curr) => acc + curr.quantity, 0);

            return (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-200 space-y-6" id={`vendor-card-${s.id}`}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl border border-indigo-100">
                        <Building2 className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{s.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Contact: <span className="text-slate-600 font-semibold">{s.contactName}</span></p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        id={`edit-vendor-${s.id}`}
                        onClick={() => handleOpenEditForm(s)}
                        className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-50 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        id={`delete-vendor-${s.id}`}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete supplier "${s.name}"? Active catalog items associated with them will become unassigned.`)) {
                            deleteSupplier(s.id);
                          }
                        }}
                        className="p-1 text-red-400 hover:text-red-700 rounded hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Supplier contact values */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-50 text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{s.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 sm:col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{s.address}</span>
                    </div>
                  </div>
                </div>

                {/* Sub items supplied count */}
                <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between text-xs" id={`vendor-aggregate-${s.id}`}>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>Catalog Items: <span className="font-bold text-slate-900">{vendorProducts.length} items</span></span>
                  </div>
                  <span className="text-[11px] bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-mono font-bold shadow-3xs">
                    {totalVendorStock} Units Total
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SUPPLIER ONBOARD MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg border overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{editingSupplier ? 'Edit Vendor Details' : 'Onboard Partner Vendor'}</h3>
              <button 
                id="close-sup-modal-btn"
                onClick={() => setIsFormOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4" id="supplier-detail-form">
               <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Company Trade Name *</label>
                <input
                  id="sup-input-name"
                  type="text"
                  required
                  placeholder="e.g. Apex Manufacturing Inc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Commercial Rep Name *</label>
                <input
                  id="sup-input-rep"
                  type="text"
                  required
                  placeholder="e.g. Robert Kowalski"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Enterprise Email *</label>
                  <input
                    id="sup-input-email"
                    type="email"
                    required
                    placeholder="sales@apexparts.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Direct Phone Lines *</label>
                  <input
                    id="sup-input-phone"
                    type="text"
                    required
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Headquarters Address</label>
                <input
                  id="sup-input-address"
                  type="text"
                  placeholder="Street No, Tech Hub City, State, ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  id="cancel-sup-modal-btn"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  id="submit-sup-modal-btn"
                  type="submit"
                  className="px-4.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                >
                  {editingSupplier ? 'Commit Changes' : 'Confirm Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
