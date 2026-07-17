import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getProducts, getCategories } from '../api/productService';
import type { Product } from '../types';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  // --- Auth & Router ---
  const { logout, currentUser, userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // --- URL Query Parameters ---
  const searchQuery = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';
  const sellerFilter = searchParams.get('seller') || '';
  const locationFilter = searchParams.get('location') || '';
  const sortOption = searchParams.get('sort') || '';

  // --- Data Fetching ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [prodData, catData] = await Promise.all([
          getProducts(),
          getCategories().catch(() => [])
        ]);
        setProducts(prodData);
        setCategories(catData);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || 'Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // --- Param Handlers ---
  const updateParams = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      newParams.set(key, value.trim());
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // --- Filtering & Sorting Logic ---
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
    const matchesSeller = sellerFilter ? p.seller.toLowerCase().includes(sellerFilter.toLowerCase()) : true;
    const matchesLocation = locationFilter ? p.location.toLowerCase().includes(locationFilter.toLowerCase()) : true;
    
    return matchesSearch && matchesCategory && matchesSeller && matchesLocation && p.active !== false;
  }).sort((a, b) => {
    const priceA = a.price - (a.price * (a.discount || 0) / 100);
    const priceB = b.price - (b.price * (b.discount || 0) / 100);
    
    if (sortOption === 'price-asc') return priceA - priceB;
    if (sortOption === 'price-desc') return priceB - priceA;
    return 0;
  });

  const hasActiveFilters = searchQuery || categoryFilter || sellerFilter || locationFilter || sortOption;

  return (
    <div className="min-h-screen bg-[#f3f6f4] font-sans overflow-x-hidden">
      
      {/* --- GLASSMORPHIC NAVBAR --- */}
      <nav className="flex items-center justify-between px-5 lg:px-10 py-3.5 bg-green-900/90 backdrop-blur-md border-b border-white/10 shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-green-400 to-yellow-300 rounded-lg shadow-md flex items-center justify-center text-green-950 font-black text-lg">
            A
          </div>
          <h1 className="text-xl font-black text-white tracking-tight drop-shadow-sm">AgriTech <span className="text-green-300 font-medium">Market</span></h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs hidden sm:inline-block font-bold text-green-50 bg-white/10 px-3 py-1.5 rounded-md border border-white/10">
            {currentUser?.email}
          </span>
          
          {userRole === 'admin' && (
            <Link to="/admin">
              <button className="px-4 py-1.5 text-xs font-extrabold text-green-950 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-lg hover:from-yellow-200 hover:to-yellow-300 transition-all shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                Admin Panel
              </button>
            </Link>
          )}

          <button 
            onClick={logout}
            className="px-4 py-1.5 text-xs font-bold text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white hover:text-green-900 transition-all shadow-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* --- FULL-WIDTH MAIN CONTENT --- */}
      <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        
        {/* Header Text */}
        <div className="mb-6 text-center sm:text-left">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">
            Fresh Arrivals
          </h2>
          <p className="text-sm text-gray-500 font-medium">Discover premium agricultural products directly from trusted sellers.</p>
        </div>

        {/* --- STICKY GLASSMORPHIC SEARCH & FILTERS BAR --- */}
        <div className="bg-white/70 backdrop-blur-xl p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-white flex flex-col lg:flex-row gap-4 items-center justify-between mb-4 sticky top-[72px] z-40 transition-all">
          
          {/* Search Bar */}
          <div className="w-full lg:w-1/3 relative group">
            <svg className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input 
              type="text" 
              placeholder="Search products or categories..." 
              value={searchQuery}
              onChange={(e) => updateParams('search', e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200/80 rounded-xl focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none text-sm text-gray-800 font-medium transition-all shadow-inner placeholder:text-gray-400"
            />
            {searchQuery && (
              <button onClick={() => updateParams('search', '')} className="absolute right-3.5 top-2.5 text-gray-400 hover:text-red-500 font-bold text-xs transition-colors">✕</button>
            )}
          </div>

          {/* Filters & Sort */}
          <div className="w-full lg:w-auto flex flex-wrap gap-2.5 items-center justify-center">
            
            {/* Custom Arrow Select: Category */}
            <select 
              value={categoryFilter} 
              onChange={(e) => updateParams('category', e.target.value)}
              className="px-3 py-2 pr-8 bg-white border border-gray-200/80 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500/30 cursor-pointer font-bold text-gray-700 transition-all shadow-sm appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em 1.2em', backgroundRepeat: 'no-repeat' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <input 
              type="text" 
              placeholder="Seller Name" 
              value={sellerFilter}
              onChange={(e) => updateParams('seller', e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200/80 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500/30 w-32 font-bold text-gray-700 transition-all shadow-sm placeholder:text-gray-400"
            />

            <input 
              type="text" 
              placeholder="Location" 
              value={locationFilter}
              onChange={(e) => updateParams('location', e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200/80 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-500/30 w-28 font-bold text-gray-700 transition-all shadow-sm placeholder:text-gray-400"
            />

            <div className="hidden lg:block w-px h-6 bg-gray-300/60 mx-1"></div>

            {/* Custom Arrow Select: Sort */}
            <select 
              value={sortOption} 
              onChange={(e) => updateParams('sort', e.target.value)}
              className="px-3 py-2 pr-8 bg-gray-900 text-white border border-transparent rounded-xl text-xs outline-none focus:ring-2 focus:ring-gray-900/30 font-bold cursor-pointer hover:bg-gray-800 transition-all shadow-md appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em 1.2em', backgroundRepeat: 'no-repeat' }}
            >
              <option value="">Sort: Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* --- ACTIVE FILTER PILLS --- */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-8 px-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Active Filters:</span>
            
            {searchQuery && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-green-800 bg-green-100 border border-green-200 rounded-md">
                "{searchQuery}"
                <button onClick={() => updateParams('search', '')} className="hover:text-red-600 transition-colors">✕</button>
              </span>
            )}
            
            {categoryFilter && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-800 bg-blue-100 border border-blue-200 rounded-md">
                {categoryFilter}
                <button onClick={() => updateParams('category', '')} className="hover:text-red-600 transition-colors">✕</button>
              </span>
            )}
            
            {sellerFilter && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-purple-800 bg-purple-100 border border-purple-200 rounded-md">
                👤 {sellerFilter}
                <button onClick={() => updateParams('seller', '')} className="hover:text-red-600 transition-colors">✕</button>
              </span>
            )}
            
            {locationFilter && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-orange-800 bg-orange-100 border border-orange-200 rounded-md">
                📍 {locationFilter}
                <button onClick={() => updateParams('location', '')} className="hover:text-red-600 transition-colors">✕</button>
              </span>
            )}

            <button onClick={clearFilters} className="text-[11px] font-bold text-red-500 hover:text-red-700 underline underline-offset-2 ml-2">
              Clear All
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-xs text-gray-500 font-bold uppercase tracking-widest">Loading products...</p>
          </div>
        )}

        {/* Error Handling */}
        {error && (
          <div className="p-4 mb-8 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl font-bold flex items-center justify-center gap-2">
             <span>⚠️</span> {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm border border-white font-medium flex flex-col items-center justify-center">
            <div className="text-5xl mb-4 drop-shadow-sm">🔍</div>
            <h3 className="text-xl font-black text-gray-800 tracking-tight">No matching products</h3>
            <p className="text-gray-500 mt-1 text-sm">Try removing some words from your filter.</p>
            {hasActiveFilters && (
              <button 
                onClick={clearFilters} 
                className="mt-6 px-5 py-2 bg-white text-red-500 border border-red-100 rounded-lg hover:bg-red-50 hover:text-red-600 font-bold transition-all shadow-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* --- ADAPTIVE GRID FOR FULL WIDTH --- */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 mt-4">
          {filteredProducts.map((product) => {
            const hasDiscount = product.discount && product.discount > 0;
            const discountedPrice = hasDiscount 
              ? product.price - (product.price * product.discount / 100)
              : product.price;

            return (
              <div key={product._id} className="relative flex flex-col bg-white/70 backdrop-blur-sm border border-white rounded-2xl shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(22,163,74,0.15)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                
                {/* Image Container */}
                <div className="relative h-48 bg-gray-100 overflow-hidden m-1.5 rounded-xl">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="block w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs font-medium bg-gray-200">No Image</div>
                  )}
                  
                  {/* Glassmorphic Discount Badge */}
                  {hasDiscount && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-1 text-[10px] font-black text-white bg-red-600/90 backdrop-blur-md rounded-md shadow-sm border border-red-400/30 tracking-wide">
                      {product.discount}% OFF
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-lg font-black text-gray-900 line-clamp-1 group-hover:text-green-700 transition-colors" title={product.name}>
                    {product.name}
                  </h3>

                  {/* Category Pill */}
                  <span className="inline-block mt-1.5 w-fit px-2 py-0.5 bg-green-50 text-green-700 text-[9px] font-black tracking-widest uppercase rounded border border-green-200/50">
                    {product.category || 'General'}
                  </span>
                  
                  {/* Seller & Location Info */}
                  <div className="mt-3 space-y-0.5">
                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5 truncate">
                      <span className="text-gray-400">👤</span>
                      <span className="font-bold text-gray-700">{product.seller}</span>
                    </p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5 truncate">
                      <span className="text-gray-400">📍</span>
                      {product.location}
                    </p>
                  </div>
                  
                  {/* Pricing Display */}
                  <div className="mt-4 flex items-end gap-1.5">
                    {hasDiscount ? (
                      <>
                        <span className="text-2xl font-black text-gray-900">₹{discountedPrice.toFixed(0)}</span>
                        <span className="text-xs font-bold text-gray-400 line-through mb-1">₹{product.price}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-black text-gray-900">₹{product.price}</span>
                    )}
                  </div>

                  {/* Glassy Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 text-xs">
                    <div className="flex flex-col justify-center">
                      <span className="font-bold text-gray-400 uppercase tracking-widest text-[8px] mb-0.5">Stock</span>
                      <span className={`font-black text-xs ${product.availableQty > 0 ? 'text-gray-800' : 'text-red-500'}`}>
                        {product.availableQty > 0 ? `${product.availableQty} left` : 'Sold Out'}
                      </span>
                    </div>
                    <div className="flex flex-col justify-center border-l border-gray-200/70 pl-2">
                      <span className="font-bold text-gray-400 uppercase tracking-widest text-[8px] mb-0.5">Min Qty</span>
                      <span className="font-black text-gray-800 text-xs">{product.minimumQty} <span className="font-bold text-gray-500">pcs</span></span>
                    </div>
                  </div>
                  
                  <div className="flex-grow"></div>
                  
                  {/* Button */}
                  <Link to={`/product/${product._id}`} className="mt-4 block w-full">
                    <button 
                      disabled={product.availableQty <= 0}
                      className={`w-full py-2.5 text-xs font-black text-white transition-all rounded-xl shadow-sm ${
                        product.availableQty > 0 
                          ? 'bg-green-600 hover:bg-green-700 hover:shadow-[0_4px_12px_rgba(22,163,74,0.3)]' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {product.availableQty > 0 ? 'View Details' : 'Unavailable'}
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};