'use client';

import { useState, useEffect } from 'react';
import { Search, X, Package } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';

interface DefectItem {
  id: string;
  barcode: string;
  productId: number;
  productName: string;
  sellingPrice?: number;
  store?: string;
}

interface CartProduct {
  id: number | string;
  productId?: number | string;
  batchId?: number | string;
  productName: string;
  size: string;
  qty: number;
  price: number;
  discount: number;
  amount: number;
  isDefective?: boolean;
  defectId?: string;
  barcode?: string;
}

export default function SocialCommercePage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  
  const [date, setDate] = useState('06-Oct-2025');
  const [salesBy, setSalesBy] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [socialId, setSocialId] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [area, setArea] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [divisions, setDivisions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [upazillas, setUpazillas] = useState<any[]>([]);

  // Get user info from localStorage
  useEffect(() => {
    const userName = localStorage.getItem('userName') || '';
    setSalesBy(userName);
  }, []);

  // Product search and selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cart, setCart] = useState<CartProduct[]>([]);
  
  const [quantity, setQuantity] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountTk, setDiscountTk] = useState('');
  const [amount, setAmount] = useState('0.00');

  const [defectiveProduct, setDefectiveProduct] = useState<DefectItem | null>(null);

  useEffect(() => {
    const defectData = sessionStorage.getItem('defectItem');
    if (defectData) {
      try {
        const defect = JSON.parse(defectData);
        setDefectiveProduct(defect);
        
        const defectiveProductData = {
          id: defect.productId,
          name: defect.productName,
          batchId: 'defective',
          attributes: {
            mainImage: '',
            Price: defect.sellingPrice || 0
          },
          available: 1,
          isDefective: true,
          defectId: defect.id,
          barcode: defect.barcode
        };
        
        setSelectedProduct(defectiveProductData);
        setQuantity('1');
        setAmount((defect.sellingPrice || 0).toFixed(2));
        
        alert('Defective product loaded. Complete the order to sell this item.');
      } catch (error) {
        console.error('Error parsing defect data:', error);
      }
    }
  }, []);

  const getFlattenedProducts = () => {
    const flattened: any[] = [];
    
    allProducts.forEach(product => {
      if (product.variations && product.variations.length > 0) {
        product.variations.forEach((variation: any, index: number) => {
          const colorAttr = variation.attributes?.Colour || `Variation ${index + 1}`;
          flattened.push({
            id: variation.id,
            name: `${product.name} - ${colorAttr}`,
            originalProductId: product.id,
            isVariation: true,
            variationIndex: index,
            attributes: {
              ...product.attributes,
              ...variation.attributes
            }
          });
        });
      } else {
        flattened.push({
          ...product,
          isVariation: false
        });
      }
    });
    
    return flattened;
  };

  const calculateAmount = (
    basePrice: number,
    qty: number,
    discountPercent: number,
    discountTk: number
  ) => {
    const baseAmount = basePrice * qty;
    const percentDiscount = (baseAmount * discountPercent) / 100;
    const totalDiscount = percentDiscount + discountTk;
    const finalAmount = baseAmount - totalDiscount;
    
    return {
      baseAmount,
      percentDiscount,
      totalDiscount,
      finalAmount: Math.max(0, finalAmount)
    };
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setAllProducts(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/inventory');
        if (response.ok) {
          const data = await response.json();
          setInventory(data);
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };
    
    fetchProducts();
    fetchInventory();
  }, []);
  
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const res = await fetch('https://bdapi.vercel.app/api/v.1/division');
        const data = await res.json();
        setDivisions(data.data);
      } catch (err) {
        console.error('Error fetching divisions:', err);
      }
    };
    fetchDivisions();
  }, []);
  
  useEffect(() => {
    if (!division) return;

    const selectedDivision = divisions.find((d) => d.name === division);
    if (!selectedDivision) return;

    const fetchDistricts = async () => {
      try {
        const res = await fetch(`https://bdapi.vercel.app/api/v.1/district/${selectedDivision.id}`);
        const data = await res.json();
        setDistricts(data.data);
        setUpazillas([]);
      } catch (err) {
        console.error('Error fetching districts:', err);
      }
    };

    fetchDistricts();
  }, [division, divisions]);
  
  useEffect(() => {
    if (!district) return;

    const selectedDistrict = districts.find((d) => d.name === district);
    if (!selectedDistrict) return;

    const fetchUpazillas = async () => {
      try {
        const res = await fetch(`https://bdapi.vercel.app/api/v.1/upazilla/${selectedDistrict.id}`);
        const data = await res.json();
        setUpazillas(data.data);
      } catch (err) {
        console.error('Error fetching upazillas:', err);
      }
    };

    fetchUpazillas();
  }, [district, districts]);

  const getAvailableInventory = (productId: number | string, batchId?: number | string) => {
    return inventory.filter(item => {
      const itemProductId = typeof item.productId === 'string' ? item.productId : String(item.productId);
      const searchProductId = typeof productId === 'string' ? productId : String(productId);
      const matchesProduct = itemProductId === searchProductId && item.status === 'available';
      if (batchId !== undefined) {
        return matchesProduct && item.batchId === batchId;
      }
      return matchesProduct;
    }).length;
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      const flattenedProducts = getFlattenedProducts();
      const results: any[] = [];

      flattenedProducts.forEach((prod: any) => {
        const availableItems = inventory.filter((item: any) => 
          String(item.productId) === String(prod.id) && item.status === 'available'
        );

        if (availableItems.length === 0) return;

        const groups: { [key: string]: { batchId: any; price: number; count: number } } = {};

        availableItems.forEach((item: any) => {
          const bid = item.batchId;
          if (!groups[bid]) {
            groups[bid] = {
              batchId: bid,
              price: item.sellingPrice,
              count: 0
            };
          }
          groups[bid].count++;
        });

        if (prod.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          Object.values(groups).forEach((group) => {
            results.push({
              ...prod,
              batchId: group.batchId,
              attributes: { ...prod.attributes, Price: group.price },
              available: group.count
            });
          });
        }
      });
      
      setSearchResults(results);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, allProducts, inventory]);

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setSearchQuery('');
    setSearchResults([]);
    setQuantity('1');
    setDiscountPercent('');
    setDiscountTk('');
    setAmount('0.00');
  };

  useEffect(() => {
    if (selectedProduct && quantity) {
      const price = parseFloat(selectedProduct.attributes.Price);
      const qty = parseFloat(quantity) || 0;
      const discPer = parseFloat(discountPercent) || 0;
      const discTk = parseFloat(discountTk) || 0;
      
      const { finalAmount } = calculateAmount(price, qty, discPer, discTk);
      setAmount(finalAmount.toFixed(2));
    } else {
      setAmount('0.00');
    }
  }, [selectedProduct, quantity, discountPercent, discountTk]);

  const addDefectiveToCart = () => {
    if (!selectedProduct || !selectedProduct.isDefective) {
      alert('No defective product selected');
      return;
    }

    const price = parseFloat(selectedProduct.attributes.Price);
    
    const newItem: CartProduct = {
      id: Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      size: '1',
      qty: 1,
      price: price,
      discount: 0,
      amount: price,
      isDefective: true,
      defectId: selectedProduct.defectId,
      barcode: selectedProduct.barcode
    };
    
    setCart([...cart, newItem]);
    alert('Defective product added to cart');
    
    setSelectedProduct(null);
    setDefectiveProduct(null);
    setQuantity('');
    setAmount('0.00');
    sessionStorage.removeItem('defectItem');
  };

  const addToCart = () => {
    if (selectedProduct && selectedProduct.isDefective) {
      return addDefectiveToCart();
    }

    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
      alert('Please select a product and enter a valid quantity');
      return;
    }

    const availableQty = getAvailableInventory(selectedProduct.id, selectedProduct.batchId);
    const requestedQty = parseInt(quantity);
    
    const existingItem = cart.find(
      item => String(item.productId) === String(selectedProduct.id) && item.batchId === selectedProduct.batchId
    );
    const cartQty = existingItem ? existingItem.qty : 0;
    
    if (cartQty + requestedQty > availableQty) {
      alert(`Only ${availableQty} units available. You already have ${cartQty} in cart.`);
      return;
    }

    const price = parseFloat(selectedProduct.attributes.Price);
    const qty = parseFloat(quantity);
    const discPer = parseFloat(discountPercent) || 0;
    const discTk = parseFloat(discountTk) || 0;
    
    const { finalAmount, totalDiscount } = calculateAmount(price, qty, discPer, discTk);
    
    const existingItemIndex = cart.findIndex(
      item => String(item.productId) === String(selectedProduct.id) && item.batchId === selectedProduct.batchId && item.price === price
    );
    
    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      const existingItem = updatedCart[existingItemIndex];
      const newQty = existingItem.qty + qty;
      const { finalAmount: newAmount } = calculateAmount(price, newQty, discPer, discTk);
      
      updatedCart[existingItemIndex] = {
        ...existingItem,
        qty: newQty,
        discount: existingItem.discount + totalDiscount,
        amount: newAmount
      };
      
      setCart(updatedCart);
    } else {
      const newItem: CartProduct = {
        id: Date.now(),
        productId: selectedProduct.id,
        batchId: selectedProduct.batchId,
        productName: selectedProduct.name,
        size: '1',
        qty: qty,
        price: price,
        discount: totalDiscount,
        amount: finalAmount
      };
      
      setCart([...cart, newItem]);
    }
    
    setSelectedProduct(null);
    setQuantity('');
    setDiscountPercent('');
    setDiscountTk('');
    setAmount('0.00');
  };

  const removeFromCart = (id: number | string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.amount, 0);

  const handleConfirmOrder = async () => {
    if (!userName || !userEmail || !userPhone) {
      alert('Please fill in customer information');
      return;
    }
    if (cart.length === 0) {
      alert('Please add products to cart');
      return;
    }
    
    try {
      const orderData = {
        salesBy,
        date,
        customer: {
          name: userName,
          email: userEmail,
          phone: userPhone,
          socialId: socialId
        },
        deliveryAddress: {
          division,
          district,
          city,
          zone,
          area,
          address: deliveryAddress,
          postalCode
        },
        products: cart,
        subtotal
      };
      
      sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
      router.push('/social-commerce/amount-details');
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Failed to process order. Please try again.');
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-4 md:mb-6">Social Commerce</h1>
              
              <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="w-full sm:w-auto">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sales By</label>
                  <input
                    type="text"
                    value={salesBy}
                    readOnly
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>



              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-4 md:space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-5">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Customer Information</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">User Name*</label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">User Email*</label>
                        <input
                          type="email"
                          placeholder="sample@email.com"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">User Phone Number*</label>
                        <input
                          type="text"
                          placeholder="Phone Number"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Social ID</label>
                        <input
                          type="text"
                          placeholder="Enter Social ID"
                          value={socialId}
                          onChange={(e) => setSocialId(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-5">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Delivery Address</h3>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Division*</label>
                          <select
                            value={division}
                            onChange={(e) => setDivision(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Select Division</option>
                            {divisions.map((d) => (
                              <option key={d.id} value={d.name}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">District*</label>
                          <select
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            disabled={!division}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                          >
                            <option value="">Select District</option>
                            {districts.map((d) => (
                              <option key={d.id} value={d.name}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Upazilla*</label>
                          <select
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            disabled={!district}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                          >
                            <option value="">Select Upazilla</option>
                            {upazillas.map((u) => (
                              <option key={u.id} value={u.name}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Zone*</label>
                          <input
                            type="text"
                            placeholder="Search Zone..."
                            value={zone}
                            onChange={(e) => setZone(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Area (Optional)</label>
                        <input
                          type="text"
                          placeholder="Search Area..."
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Delivery Address</label>
                        <textarea
                          placeholder="Delivery Address"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                        <input
                          type="text"
                          placeholder="e.g., 1212"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                  <div className={`bg-white dark:bg-gray-800 rounded-lg border p-4 md:p-5 ${selectedProduct && selectedProduct.isDefective ? 'border-orange-300 dark:border-orange-700' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Search Product</h3>
                      {selectedProduct && selectedProduct.isDefective && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded">Defective Product</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Search product name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                      <button className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded transition-colors flex-shrink-0">
                        <Search size={18} />
                      </button>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 md:max-h-80 overflow-y-auto mb-4 p-1">
                        {searchResults.map((product) => {
                          const availableQty = product.available;
                          return (
                            <div
                              key={`${product.id}-${product.batchId}`}
                              onClick={() => handleProductSelect(product)}
                              className="border border-gray-200 dark:border-gray-600 rounded p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <img 
                                src={product.attributes.mainImage} 
                                alt={product.name} 
                                className="w-full h-24 sm:h-32 object-cover rounded mb-2" 
                              />
                              <p className="text-xs text-gray-900 dark:text-white font-medium truncate">{product.name} (Batch {product.batchId})</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{product.attributes.Price} Tk</p>
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">Available: {availableQty}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedProduct && (
                      <div className={`mt-4 p-3 border rounded mb-4 ${
                        selectedProduct.isDefective 
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700' 
                          : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Selected Product</span>
                            {selectedProduct.isDefective && (
                              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                                Defective - No Stock
                              </span>
                            )}
                          </div>
                          <button onClick={() => {
                            setSelectedProduct(null);
                            setQuantity('');
                            setDiscountPercent('');
                            setDiscountTk('');
                            setAmount('0.00');
                            if (defectiveProduct) {
                              setDefectiveProduct(null);
                              sessionStorage.removeItem('defectItem');
                            }
                          }} className="text-red-600 hover:text-red-700">
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex gap-3">
                          {selectedProduct.attributes.mainImage && (
                            <img 
                              src={selectedProduct.attributes.mainImage} 
                              alt={selectedProduct.name} 
                              className="w-16 h-16 object-cover rounded flex-shrink-0" 
                            />
                          )}
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              selectedProduct.isDefective 
                                ? 'text-orange-900 dark:text-orange-200' 
                                : 'text-gray-900 dark:text-white'
                            }`}>{selectedProduct.name}</p>
                            {!selectedProduct.isDefective && selectedProduct.batchId && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">(Batch {selectedProduct.batchId})</p>
                            )}
                            <p className={`text-sm ${
                              selectedProduct.isDefective 
                                ? 'text-orange-600 dark:text-orange-400' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>Price: {selectedProduct.attributes.Price} Tk</p>
                            {!selectedProduct.isDefective ? (
                              <p className="text-sm text-green-600 dark:text-green-400">
                                Available: {getAvailableInventory(selectedProduct.id, selectedProduct.batchId)} units
                              </p>
                            ) : (
                              <p className="text-sm text-orange-600 dark:text-orange-400">
                                Barcode: {selectedProduct.barcode}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                          Quantity {selectedProduct?.isDefective && <span className="text-orange-600">(Fixed: 1)</span>}
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const currentQty = parseInt(quantity) || 0;
                              if (currentQty > 1) {
                                setQuantity(String(currentQty - 1));
                              }
                            }}
                            disabled={!selectedProduct || !quantity || parseInt(quantity) <= 1 || selectedProduct?.isDefective}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-lg"
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            placeholder="0"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={!selectedProduct || selectedProduct?.isDefective}
                            readOnly={selectedProduct?.isDefective}
                            min="1"
                            className={`flex-1 px-3 py-2 text-sm text-center border rounded disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              selectedProduct?.isDefective
                                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600 text-orange-900 dark:text-orange-200 font-medium'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const currentQty = parseInt(quantity) || 0;
                              setQuantity(String(currentQty + 1));
                            }}
                            disabled={!selectedProduct || selectedProduct?.isDefective}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-lg"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Discount %</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(e.target.value)}
                            disabled={!selectedProduct || selectedProduct?.isDefective}
                            min="0"
                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Discount Tk</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={discountTk}
                            onChange={(e) => setDiscountTk(e.target.value)}
                            disabled={!selectedProduct || selectedProduct?.isDefective}
                            min="0"
                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                          <input
                            type="text"
                            value={amount}
                            readOnly
                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <button
                        onClick={addToCart}
                        disabled={!selectedProduct}
                        className={`w-full px-4 py-2.5 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedProduct?.isDefective
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-black hover:bg-gray-800'
                        }`}
                      >
                        {selectedProduct?.isDefective ? 'Add Defective Product to Cart' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Cart ({cart.length} items)</h3>
                    </div>
                    <div className="max-h-60 md:max-h-96 overflow-y-auto overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Product</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Qty</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Price</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Amount</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                No products in cart
                              </td>
                            </tr>
                          ) : (
                            cart.map((item) => (
                              <tr key={item.id} className={`border-b border-gray-200 dark:border-gray-700 ${item.isDefective ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                                <td className="px-3 py-2 text-gray-900 dark:text-white">
                                  <div className="max-w-[120px]">
                                    <p className="truncate">{item.productName}</p>
                                    {item.batchId && <p className="text-xs text-gray-500">(Batch {item.batchId})</p>}
                                    {item.isDefective && (
                                      <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                                        Defective
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{item.qty}</td>
                                <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{item.price.toFixed(2)}</td>
                                <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{item.amount.toFixed(2)}</td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-red-600 hover:text-red-700 text-xs font-medium whitespace-nowrap"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {cart.length > 0 && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between text-sm mb-3">
                          <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{subtotal.toFixed(2)} Tk</span>
                        </div>
                        <button
                          onClick={handleConfirmOrder}
                          className="w-full px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded transition-colors"
                        >
                          Confirm Order
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}