import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, calculatePrice } from '../api/productService';
import { createEnquiry } from '../api/enquiryService'; 
import type { Product, CalculationResult } from "../types/index";
import { useAuth } from '../context/AuthContext';

export const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth(); 
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string>('');
  
  // Calculator State - updated to allow empty string so deleting doesn't force a '0'
  const [quantity, setQuantity] = useState<number | ''>('');
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [calcError, setCalcError] = useState<string>('');

  // Enquiry State
  const [buyerName, setBuyerName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [mobile, setMobile] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [message, setMessage] = useState('');
  
  const [enquiryStatus, setEnquiryStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [enquiryResult, setEnquiryResult] = useState<{ referenceNumber: string, status: string } | null>(null);
  const [enquiryError, setEnquiryError] = useState<string>('');

  // 1. Fetch Product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) return;
        const data = await getProductById(id);
        setProduct(data);
        setQuantity(data.minimumQty); 
      } catch (err: any) {
        console.error(err);
        setPageError(err.response?.data?.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // 2. Fetch Calculation when Quantity Changes
  useEffect(() => {
    const fetchCalculation = async () => {
      if (!product || !id) return;
      
      if (quantity === '' || quantity < product.minimumQty) {
        setCalcError(`Min order: ${product.minimumQty}`);
        setCalculation(null);
        return;
      }
      if (quantity > product.availableQty) {
        setCalcError(`Max stock: ${product.availableQty}`);
        setCalculation(null);
        return;
      }

      setCalcError('');
      try {
        const result = await calculatePrice(id, quantity);
        setCalculation(result);
      } catch (err) {
        setCalcError('Failed to calculate price.');
      }
    };

    const timer = setTimeout(() => {
      fetchCalculation();
    }, 500);
    return () => clearTimeout(timer);
  }, [quantity, product, id]);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || calcError || quantity === '') return;
    
    setEnquiryStatus('loading');
    setEnquiryError('');

    try {
      const response = await createEnquiry({
        productId: id,
        buyerName,
        email,
        mobile,
        deliveryLocation,
        requiredQuantity: Number(quantity),
        message
      });
      
      setEnquiryStatus('success');
      setEnquiryResult({
        referenceNumber: response.referenceNumber || `ENQ-${Math.floor(Math.random() * 100000)}`,
        status: response.status || 'Pending Review'
      });
      
      setMobile(''); setDeliveryLocation(''); setMessage('');
      
    } catch (err: any) {
      setEnquiryStatus('error');
      setEnquiryError(err.response?.data?.message || 'Failed to submit enquiry.');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f3f6f4]">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-sm text-gray-500 font-bold">Loading product...</p>
    </div>
  );

  if (pageError || !product) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f3f6f4] p-4">
      <div className="max-w-sm w-full p-6 text-center bg-white/70 backdrop-blur-xl border border-white rounded-2xl shadow-lg">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Oops!</h2>
        <p className="text-sm text-red-600 font-semibold mb-6">{pageError || 'Product not found'}</p>
        <button 
          onClick={() => navigate('/')} 
          className="w-full px-4 py-2.5 text-sm text-white font-bold bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
        >
          Return to Marketplace
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f6f4] font-sans pb-12">
      
      {/* Navbar */}
      <nav className="px-6 py-3 bg-green-900/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white hover:text-green-900 transition-colors"
          >
            &larr; Back to Store
          </button>
        </div>
      </nav>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT COLUMN: PRODUCT INFO ================= */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl shadow-sm overflow-hidden">
              
              {/* Product Image */}
              <div className="relative w-full h-64 md:h-80 bg-gray-100 p-2 pb-0">
                <div className="relative w-full h-full overflow-hidden rounded-t-xl shadow-inner">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="block w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium bg-gray-200">No Image Available</div>
                  )}
                  {product.discount > 0 && (
                    <div className="absolute top-4 right-4 px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-md shadow-md">
                      {product.discount}% OFF
                    </div>
                  )}
                </div>
              </div>

              {/* Product Details Area */}
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-green-100 text-green-800 text-[10px] font-bold tracking-widest uppercase rounded-md border border-green-200">
                    {product.category || 'General'}
                  </span>
                  <span className={`px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded-md border ${product.availableQty > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {product.availableQty > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  {product.name}
                </h1>
                
                <div className="flex gap-4 mt-3 pb-5 border-b border-gray-100">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="text-gray-400">👤</span>
                    <span className="font-semibold text-gray-800">{product.seller}</span>
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="text-gray-400">📍</span>
                    <span className="font-semibold text-gray-800">{product.location}</span>
                  </p>
                </div>
                
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">₹{product.price}</span>
                  <span className="text-sm font-semibold text-gray-400">/ unit</span>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Product Description</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Available</p>
                    <p className="text-lg font-black text-gray-800">{product.availableQty}</p>
                  </div>
                  <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Min. Order</p>
                    <p className="text-lg font-black text-gray-800">{product.minimumQty}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: CALCULATOR & FORM ================= */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5 sticky top-20">
            
            <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl shadow-sm p-6">
              
              {/* Order Calculator */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-green-600">📊</span> Order Calculator
                </h2>
                
                <div className="mb-4">
                  <label className="block mb-1.5 text-xs font-bold text-gray-500 uppercase">Quantity</label>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => {
                      const val = e.target.value;
                      // 1. Allow clearing the input completely without forcing a 0
                      if (val === '') {
                        setQuantity('');
                        return;
                      }
                      
                      // 2. Parse number and absolutely prevent 0 or negatives
                      const num = Number(val);
                      if (num > 0) {
                        setQuantity(num);
                      }
                    }}
                    onBlur={() => {
                      // 3. If left totally empty on unfocus, reset back to minimum qty safely
                      if (quantity === '' || quantity < product.minimumQty) {
                        setQuantity(product.minimumQty);
                      }
                    }}
                    min={product.minimumQty}
                    max={product.availableQty}
                    className={`w-full px-3 py-2 text-base font-bold bg-white border ${calcError ? 'border-red-300 focus:ring-red-500/20' : 'border-gray-200 focus:ring-green-500/20'} rounded-lg focus:ring-2 focus:border-green-500 outline-none text-gray-800 transition-all`} 
                  />
                  {calcError && <p className="mt-1.5 text-[11px] font-bold text-red-500">{calcError}</p>}
                </div>

                {/* Receipt-style Summary */}
                {calculation && !calcError && quantity !== '' && (
                  <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>Base Price <span className="text-gray-400 text-xs">(x{quantity})</span></span>
                        <span className="font-semibold">₹{calculation.basePrice.toLocaleString()}</span>
                      </div>
                      
                      {calculation.discountApplied > 0 && (
                        <div className="flex justify-between text-sm text-red-600 font-medium">
                          <span>Discount Savings</span>
                          <span>-₹{calculation.discountApplied.toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div className="pt-3 mt-1 border-t border-dashed border-green-200 flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-bold uppercase">Total</span>
                        <span className="text-xl font-black text-green-700">₹{calculation.totalOrderValue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full h-px bg-gray-200/50 my-6"></div>

              {/* Enquiry Form */}
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-600">✉️</span> Submit Enquiry
              </h2>
              
              {enquiryStatus === 'success' && enquiryResult ? (
                <div className="p-5 bg-green-50 rounded-xl border border-green-100 text-center">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center text-xl mx-auto mb-3 shadow-md">✓</div>
                  <h3 className="font-bold text-green-900 text-base mb-1">Enquiry Sent!</h3>
                  <p className="text-xs text-gray-600 mb-4">The seller will contact you shortly.</p>
                  
                  <div className="bg-white rounded-lg p-3 mb-4 shadow-sm text-left space-y-1.5 border border-green-50">
                    <p className="text-xs text-gray-500 flex justify-between">
                      <span className="font-semibold">Ref No:</span> 
                      <span className="font-bold text-gray-900">{enquiryResult.referenceNumber}</span>
                    </p>
                    <p className="text-xs text-gray-500 flex justify-between items-center">
                      <span className="font-semibold">Status:</span> 
                      <span className="px-2 py-0.5 text-[10px] font-bold text-blue-800 bg-blue-100 rounded-md uppercase">
                        {enquiryResult.status}
                      </span>
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => setEnquiryStatus('idle')} 
                    className="text-xs font-semibold text-green-700 hover:text-green-800 underline"
                  >
                    Submit another enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-4">
                  {enquiryError && <div className="p-3 text-xs font-bold text-red-700 bg-red-100 rounded-lg">{enquiryError}</div>}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Name</label>
                      <input 
                        type="text" required
                        value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Email</label>
                      <input 
                        type="email" required
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Mobile</label>
                      <input 
                        type="tel" required
                        value={mobile} onChange={(e) => setMobile(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">City</label>
                      <input 
                        type="text" required
                        value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Message</label>
                    <textarea 
                      required rows={2}
                      value={message} onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none" 
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!!calcError || enquiryStatus === 'loading' || quantity === '' || quantity < product.minimumQty}
                    className={`w-full py-2.5 mt-2 text-sm font-bold text-white transition-all rounded-xl shadow-sm ${
                      calcError || quantity === '' || quantity < product.minimumQty
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {enquiryStatus === 'loading' ? 'Processing...' : `Send Enquiry`}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};