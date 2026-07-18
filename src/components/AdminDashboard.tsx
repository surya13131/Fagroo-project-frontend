import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createProduct, getAdminProducts, getDashboardStats, 
  updateStock, 
  updateDiscount, 
  updateProduct, 
  createCategory, 
  getCategories,
  activateProduct,
  deactivateProduct,
  deleteProduct
} from '../api/productService';
import { getAdminEnquiries } from '../api/enquiryService';

export const AdminDashboard = () => {
  const navigate = useNavigate();

  // --- API Data States ---
  const [stats, setStats] = useState({ total: 0, active: 0, enquiries: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  
  // --- Category States ---
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);

  // --- Form States ---
  const [loading, setLoading] = useState<boolean>(false);
  const [editModeId, setEditModeId] = useState<string | null>(null);

  // Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Product Fields (Using number | '' to prevent forcing '0' when deleting)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [seller, setSeller] = useState('');
  const [location, setLocation] = useState('');
  const [discount, setDiscount] = useState<number | ''>(0);
  const [availableQty, setAvailableQty] = useState<number | ''>('');
  const [minimumQty, setMinimumQty] = useState<number | ''>(1);
  const [image, setImage] = useState('');

  // --- Inline Editing States (For Table) ---
  const [inlineStockEdit, setInlineStockEdit] = useState<{id: string, val: number | ''} | null>(null);
  const [inlineDiscountEdit, setInlineDiscountEdit] = useState<{id: string, val: number | ''} | null>(null);

  // --- Initial Data Fetch ---
  const fetchDashboardData = async () => {
    try {
      const [statsData, productsData, enquiriesData] = await Promise.all([
        getDashboardStats().catch(() => ({ total: 0, active: 0, enquiries: 0 })),
        getAdminProducts().catch(() => []),
        getAdminEnquiries().catch(() => [])
      ]);
      setStats({
        total: statsData.products || 0, 
        active: statsData.activeProducts || 0,
        enquiries: statsData.enquiries || 0
      });
      setProducts(productsData);
      setEnquiries(enquiriesData);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      const cats = data.map((cat: any) => ({ id: cat.id || cat._id, name: cat.name }));
      setCategories(cats);
    } catch (err) {
      console.error("Error fetching categories", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchCategories();
  }, []);

  // --- Toast Notification Helper (Disappears after 2 secs) ---
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 2000);
  };

  // --- Safe Number Input Handler (Blocks negatives) ---
  const handleNumberInput = (val: string, setter: React.Dispatch<React.SetStateAction<number | ''>>) => {
    if (val === '') {
      setter('');
      return;
    }
    const num = Number(val);
    if (num >= 0) setter(num);
  };

  // --- Handlers ---
  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCategoryLoading(true);
    try {
      const newCategory = await createCategory({ name: newCategoryName });
      const addedId = newCategory.id || newCategory._id || Date.now().toString();
      
      setCategories([...categories, { id: addedId, name: newCategory.name }]);
      setCategory(newCategoryName);
      setShowNewCategory(false);
      setNewCategoryName('');
      showToast('success', 'Category added successfully');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to add new category.');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (price === '' || availableQty === '' || minimumQty === '') {
      showToast('error', 'Please fill all numeric fields correctly.');
      return;
    }

    setLoading(true);
    try {
      const productPayload = {
        name,
        description,
        price: Number(price),
        category,
        seller,
        location,
        discount: Number(discount || 0),
        availableQty: Number(availableQty),
        minimumQty: Number(minimumQty),
        image
      };

      if (editModeId) {
        await updateProduct(editModeId, productPayload);
        showToast('success', 'Product updated successfully!');
        setEditModeId(null);
      } else {
        await createProduct(productPayload);
        showToast('success', 'Product added successfully!');
      }
      
      // Reset form
      setName(''); setDescription(''); setPrice(''); setCategory(''); setSeller(''); 
      setLocation(''); setDiscount(0); setAvailableQty(''); setMinimumQty(1); 
      setImage('');

      fetchDashboardData(); 
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const triggerFullEdit = (p: any) => {
    setEditModeId(p._id || p.id);
    setName(p.name); setDescription(p.description); setPrice(p.price);
    setCategory(p.category); setSeller(p.seller); setLocation(p.location);
    setDiscount(p.discount); setAvailableQty(p.availableQty); setMinimumQty(p.minimumQty);
    setImage(p.image || ''); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleActivate = async (id: string) => {
    if (!window.confirm("Do you want to activate this product?")) return;
    try {
      await activateProduct(id);
      showToast('success', 'Product Activated');
      fetchDashboardData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to activate product.');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Do you want to deactivate this product?")) return;
    try {
      await deactivateProduct(id);
      showToast('success', 'Product Deactivated');
      fetchDashboardData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to deactivate product.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to completely delete this product?")) return;
    try {
      await deleteProduct(id);
      showToast('success', 'Product Deleted');
      fetchDashboardData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const saveInlineStock = async (id: string) => {
    if (!inlineStockEdit || inlineStockEdit.val === '') return;
    try {
      await updateStock(id, Number(inlineStockEdit.val));
      setInlineStockEdit(null);
      showToast('success', 'Stock updated');
      fetchDashboardData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update stock.');
    }
  };

  const saveInlineDiscount = async (id: string) => {
    if (!inlineDiscountEdit || inlineDiscountEdit.val === '') return;
    try {
      await updateDiscount(id, Number(inlineDiscountEdit.val));
      setInlineDiscountEdit(null);
      showToast('success', 'Discount updated');
      fetchDashboardData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update discount.');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-[#f3f6f4] font-sans relative">
      
      {/* FLOATING TOAST NOTIFICATION (Disappears automatically) */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 animate-fade-in-down ${
          toast.type === 'success' ? 'bg-green-600 text-white shadow-green-500/30' : 'bg-red-600 text-white shadow-red-500/30'
        }`}>
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
        </div>
      )}

      <div className="w-full max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 text-white bg-green-900 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Admin Dashboard</h2>
            <p className="text-green-200 text-xs mt-0.5 font-medium">Manage marketplace inventory and enquiries.</p>
          </div>
          <button onClick={() => navigate('/')} className="px-4 py-2 text-xs font-bold text-green-900 bg-white rounded-xl hover:bg-gray-100 shadow-sm transition-colors">
            Return to Store &rarr;
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', val: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active Listings', val: stats.active, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pending Enquiries', val: stats.enquiries, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Categories', val: categories.length, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((stat, i) => (
            <div key={i} className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</h4>
                <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.val}</p>
              </div>
              <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center`}>
                <span className={`text-lg ${stat.color}`}>✦</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Add/Edit Product Form */}
          <div className="xl:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
            <div className={`p-4 ${editModeId ? 'bg-blue-600' : 'bg-gray-900'} text-white flex justify-between items-center`}>
              <h3 className="text-sm font-bold flex items-center gap-2">
                {editModeId ? '✏️ Edit Product' : '📦 Add New Product'}
              </h3>
              {editModeId && (
                <button onClick={() => { setEditModeId(null); }} className="text-xs font-medium underline hover:text-gray-200">
                  Cancel Edit
                </button>
              )}
            </div>
            
            <div className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Product Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 transition-all" />
                </div>
                
                {/* Fixed Custom Select Arrow */}
                <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-200/60">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1 mb-1 block">Category</label>
                  <select 
                    required 
                    value={showNewCategory ? 'NEW' : category} 
                    onChange={(e) => {
                      if (e.target.value === 'NEW') setShowNewCategory(true);
                      else { setShowNewCategory(false); setCategory(e.target.value); }
                    }}
                    className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white mb-2 appearance-none shadow-sm cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em', backgroundRepeat: 'no-repeat' }}
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    <option value="NEW" className="font-bold text-green-600">+ Add New Category</option>
                  </select>

                  {showNewCategory && (
                    <div className="flex gap-2">
                      <input type="text" placeholder="e.g. Exotic Fruits" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none shadow-sm" />
                      <button type="button" onClick={handleAddNewCategory} disabled={categoryLoading}
                        className="px-4 py-2 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm">
                        {categoryLoading ? '...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Price (₹)</label>
                    <input type="number" required value={price} onChange={(e) => handleNumberInput(e.target.value, setPrice)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Discount (%)</label>
                    <input type="number" required value={discount} onChange={(e) => handleNumberInput(e.target.value, setDiscount)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Available Qty</label>
                    <input type="number" required value={availableQty} onChange={(e) => handleNumberInput(e.target.value, setAvailableQty)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Min. Order Qty</label>
                    <input type="number" required value={minimumQty} onChange={(e) => handleNumberInput(e.target.value, setMinimumQty)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Seller Name</label>
                    <input type="text" required value={seller} onChange={(e) => setSeller(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Location</label>
                    <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 transition-all" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Description</label>
                  <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 transition-all resize-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Image URL</label>
                  <input type="url" placeholder="https://..." required value={image} onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 transition-all" />
                  {image && (
                    <img src={image} alt="Preview" className="h-16 w-16 mt-2 object-cover rounded-lg border shadow-sm" />
                  )}
                </div>

                <button type="submit" disabled={loading}
                  className={`w-full py-2.5 mt-2 text-sm font-bold text-white rounded-xl shadow-md transition-all ${editModeId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'}`}>
                  {loading ? 'Processing...' : (editModeId ? 'Update Product' : 'Add Product')}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Tables Container */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            
            {/* Products Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800">Inventory Management</h3>
                <span className="text-xs bg-white border border-gray-200 text-gray-600 font-bold px-2.5 py-1 rounded-lg shadow-sm">{products.length} Products</span>
              </div>
              
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-gray-500 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3 font-bold">Product</th>
                      <th className="px-5 py-3 font-bold">Price / Disc</th>
                      <th className="px-5 py-3 font-bold">Stock</th>
                      <th className="px-5 py-3 font-bold text-center">Status</th>
                      <th className="px-5 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400 font-medium">No products found.</td></tr>
                    ) : (
                      products.map((p) => (
                        <tr key={p._id || p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 flex items-center gap-3 min-w-[200px]">
                            {p.image && <img src={p.image} className="w-10 h-10 rounded-lg object-cover shadow-sm border border-gray-100" alt="thumb"/>}
                            <div>
                              <div className="font-bold text-gray-900 line-clamp-1">{p.name}</div>
                              <div className="text-[10px] text-gray-500 font-medium mt-0.5">{p.category} • {p.seller}</div>
                            </div>
                          </td>
                          
                          {/* Inline Edit Discount */}
                          <td className="px-5 py-3 min-w-[120px]">
                            <div className="font-black text-gray-800">₹{p.price}</div>
                            {inlineDiscountEdit?.id === (p._id || p.id) ? (
                              <div className="flex items-center gap-1 mt-1">
                                <input type="number" className="w-14 px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-green-500 bg-white" 
                                  value={inlineDiscountEdit?.val} onChange={e => handleNumberInput(e.target.value, (val) => {
                                    if (inlineDiscountEdit) {
                                      setInlineDiscountEdit({...inlineDiscountEdit, val: val as number | ''});
                                    }
                                  }
                                  )} />
                                <button onClick={() => saveInlineDiscount(p._id || p.id)} className="text-green-600 hover:text-green-800 font-bold">✓</button>
                                <button onClick={() => setInlineDiscountEdit(null)} className="text-red-500 font-bold">✕</button>
                              </div>
                            ) : (
                              <div className="text-[11px] text-red-600 font-bold mt-0.5 cursor-pointer hover:underline" 
                                   onClick={() => setInlineDiscountEdit({id: p._id || p.id, val: p.discount})}>
                                {p.discount}% OFF ✎
                              </div>
                            )}
                          </td>
                          
                          {/* Inline Edit Stock */}
                          <td className="px-5 py-3 min-w-[120px]">
                            {inlineStockEdit?.id === (p._id || p.id) ? (
                              <div className="flex items-center gap-1">
                                <input type="number" className="w-14 px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-green-500 bg-white" 
                                  value={inlineStockEdit?.val} onChange={e => handleNumberInput(e.target.value, (val) => {
                                    if (inlineStockEdit) {
                                      setInlineStockEdit({...inlineStockEdit, val: val as number | ''});
                                    }
                                  }
                                  )} />
                                <button onClick={() => saveInlineStock(p._id || p.id)} className="text-green-600 hover:text-green-800 font-bold">✓</button>
                                <button onClick={() => setInlineStockEdit(null)} className="text-red-500 font-bold">✕</button>
                              </div>
                            ) : (
                              <div className="font-bold text-gray-800 cursor-pointer hover:text-blue-600 flex items-center gap-1.5"
                                   onClick={() => setInlineStockEdit({id: p._id || p.id, val: p.availableQty})}>
                                {p.availableQty} <span className="text-[10px] text-gray-400">✎</span>
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-3 text-center">
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${p.active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {p.active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => triggerFullEdit(p)} className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors">Edit</button>
                              {p.active !== false ? (
                                <button onClick={() => handleDeactivate(p._id || p.id)} className="text-xs font-bold text-orange-600 hover:text-orange-800 px-2 py-1 rounded hover:bg-orange-50 transition-colors">
                                  Deactivate
                                </button>
                              ) : (
                                <button onClick={() => handleActivate(p._id || p.id)} className="text-xs font-bold text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition-colors">
                                  Activate
                                </button>
                              )}
                              <button onClick={() => handleDelete(p._id || p.id)} className="text-xs font-bold text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enquiries Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-4 bg-purple-50/50 border-b border-purple-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-purple-900">Buyer Enquiries</h3>
                <span className="text-xs bg-white border border-purple-200 text-purple-700 font-bold px-2.5 py-1 rounded-lg shadow-sm">{enquiries.length} Messages</span>
              </div>
              
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-gray-500 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100 sticky top-0">
                    <tr>
                      <th className="px-5 py-3 font-bold">Ref No</th>
                      <th className="px-5 py-3 font-bold">Buyer Details</th>
                      <th className="px-5 py-3 font-bold">Product Req</th>
                      <th className="px-5 py-3 font-bold">Qty</th>
                      <th className="px-5 py-3 font-bold">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {enquiries.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400 font-medium">No enquiries received yet.</td></tr>
                    ) : (
                      enquiries.map((enq, idx) => (
                        <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                          <td className="px-5 py-3 font-bold text-gray-700 text-xs">{enq.referenceNumber || `REQ-${idx}`}</td>
                          <td className="px-5 py-3">
                            <div className="font-bold text-gray-900 text-sm">{enq.buyerName}</div>
                            <div className="text-[11px] text-gray-500 font-medium">{enq.mobile} • {enq.deliveryLocation}</div>
                          </td>
                          <td className="px-5 py-3 text-gray-700 font-semibold text-xs">{enq.productName || 'Deleted Product'}</td>
                          <td className="px-5 py-3 font-black text-purple-700">{enq.requiredQuantity || enq.requiredQty}</td>
                          <td className="px-5 py-3 text-xs text-gray-600 max-w-[200px] truncate font-medium" title={enq.message}>{enq.message}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};