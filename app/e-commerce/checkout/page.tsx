'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import Navigation from '@/components/ecommerce/Navigation';
import { ShoppingBag, MapPin, CreditCard, Check, Minus, Plus, Trash2, User, X } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string | number>>(new Set());
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(true);

  // Form states
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [deliveryAddress, setDeliveryAddress] = useState({
    division: '',
    district: '',
    city: '',
    zone: '',
    area: '',
    address: '',
    postalCode: '',
  });

  const [divisions, setDivisions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');

  // Pre-fill customer information if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setCustomer(prev => ({
        name: user.username || prev.name,
        email: user.email || prev.email,
        phone: prev.phone,
      }));
      setShowLoginPrompt(false);
    }
  }, [isAuthenticated, user]);

  // Get selected items from localStorage
  useEffect(() => {
    try {
      const savedSelectedIds = localStorage.getItem('checkout-selected-items');
      if (savedSelectedIds) {
        const parsedIds = JSON.parse(savedSelectedIds);
        setSelectedItemIds(new Set(parsedIds));
        
        const selectedItems = cartItems.filter((item: any) => parsedIds.includes(item.id));
        setCheckoutItems(selectedItems);
      } else {
        router.push('/e-commerce/cart');
      }
    } catch (error) {
      console.error('Error loading selected items:', error);
      router.push('/e-commerce/cart');
    }
  }, []);

  // Fetch divisions
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

  // Fetch districts when division changes
  useEffect(() => {
    if (!deliveryAddress.division) return;

    const selectedDivision = divisions.find((d) => d.name === deliveryAddress.division);
    if (!selectedDivision) return;

    const fetchDistricts = async () => {
      try {
        const res = await fetch(`https://bdapi.vercel.app/api/v.1/district/${selectedDivision.id}`);
        const data = await res.json();
        setDistricts(data.data);
        setDeliveryAddress(prev => ({ ...prev, district: '', city: '' }));
      } catch (err) {
        console.error('Error fetching districts:', err);
      }
    };

    fetchDistricts();
  }, [deliveryAddress.division, divisions]);

  const removeFromCheckout = (itemId: string | number) => {
    const newCheckoutItems = checkoutItems.filter(item => item.id !== itemId);
    setCheckoutItems(newCheckoutItems);
    
    const newSelectedIds = new Set(selectedItemIds);
    newSelectedIds.delete(itemId);
    setSelectedItemIds(newSelectedIds);
    
    localStorage.setItem('checkout-selected-items', JSON.stringify(Array.from(newSelectedIds)));
    
    if (newCheckoutItems.length === 0) {
      router.push('/e-commerce/cart');
    }
  };

  const updateCheckoutQuantity = (itemId: string | number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCheckout(itemId);
      return;
    }
    
    setCheckoutItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
    
    updateQuantity(itemId, newQuantity);
  };

  const getCheckoutTotal = () => {
    return checkoutItems.reduce((total, item) => {
      const price = parseFloat(item.price || 0);
      return total + (price * item.quantity);
    }, 0);
  };

  const subtotal = getCheckoutTotal();
  const shippingCost = subtotal >= 5000 ? 0 : 60;
  const vatRate = 0;
  const vat = (subtotal * vatRate) / 100;
  const total = subtotal + shippingCost + vat;

  const handleLoginRedirect = () => {
    localStorage.setItem('redirect-after-login', '/e-commerce/checkout');
    router.push('/e-commerce/login');
  };

  const handleSubmitOrder = async () => {
    if (!customer.name || !customer.phone) {
      alert('Please fill in all required customer information');
      return;
    }

    if (!deliveryAddress.division || !deliveryAddress.district || !deliveryAddress.city || !deliveryAddress.address) {
      alert('Please fill in all required delivery address fields');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        userId: isAuthenticated ? user?.id : null,
        salesBy: 'E-Commerce Order',
        date: new Date().toISOString().split('T')[0],
        customer: {
          name: customer.name,
          email: customer.email || '',
          phone: customer.phone,
        },
        deliveryAddress: deliveryAddress,
        products: checkoutItems.map((item) => ({
          productId: item.id,
          productName: item.name,
          size: item.attributes?.Size || 'N/A',
          qty: item.quantity,
          price: parseFloat(item.price),
          discount: 0,
          amount: parseFloat(item.price) * item.quantity,
        })),
        subtotal: subtotal,
        amounts: {
          subtotal: subtotal,
          totalDiscount: 0,
          vat: vat,
          vatRate: vatRate,
          transportCost: shippingCost,
          total: total,
        },
        payments: {
          sslCommerz: paymentMethod === 'online' ? total : 0,
          advance: 0,
          transactionId: paymentMethod === 'online' ? `TXN${Date.now()}` : '',
          totalPaid: paymentMethod === 'online' ? total : 0,
          due: paymentMethod === 'cash_on_delivery' ? total : 0,
        },
      };

      const response = await fetch('/api/social-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        checkoutItems.forEach(item => removeFromCart(item.id));
        localStorage.removeItem('checkout-selected-items');
        router.push(`/e-commerce/order-success?orderId=${result.order.id}`);
      } else {
        throw new Error(result.error || 'Failed to place order');
      }
    } catch (error: any) {
      console.error('Order submission error:', error);
      alert(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No items selected for checkout</h2>
          <p className="text-gray-600 mb-6">Please select items from your cart</p>
          <button
            onClick={() => router.push('/e-commerce/cart')}
            className="bg-red-700 text-white px-6 py-3 rounded font-semibold hover:bg-red-800"
          >
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Login Prompt Banner - Only show if not authenticated */}
        {!isAuthenticated && showLoginPrompt && (
          <div className="mb-6 bg-blue-600 text-white rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User size={24} />
              <div>
                <p className="font-semibold">Returning customer?</p>
                <p className="text-sm text-blue-100">Click here to login for faster checkout</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLoginRedirect}
                className="bg-white text-blue-600 px-6 py-2 rounded font-semibold hover:bg-blue-50 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="p-2 hover:bg-blue-700 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 1 ? 'bg-red-700 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {currentStep > 1 ? <Check size={20} /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Customer Info</span>
            </div>
            
            <div className={`w-24 h-1 mx-4 ${currentStep >= 2 ? 'bg-red-700' : 'bg-gray-300'}`} />
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 2 ? 'bg-red-700 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {currentStep > 2 ? <Check size={20} /> : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Delivery</span>
            </div>
            
            <div className={`w-24 h-1 mx-4 ${currentStep >= 3 ? 'bg-red-700' : 'bg-gray-300'}`} />
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 3 ? 'bg-red-700 text-white' : 'bg-gray-300 text-gray-600'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Payment</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Forms Section - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information Step */}
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <ShoppingBag size={24} className="text-red-700" />
                  Customer Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                      placeholder="01XXXXXXXXX"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!customer.name || !customer.phone}
                  className="w-full mt-6 bg-red-700 text-white py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continue to Delivery
                </button>
              </div>
            )}

            {/* Delivery Address */}
            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin size={24} className="text-red-700" />
                  Delivery Address
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Division <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={deliveryAddress.division}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, division: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                      required
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={deliveryAddress.district}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, district: e.target.value })}
                      disabled={!deliveryAddress.division}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">Select District</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                      placeholder="Enter city"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area (Optional)
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress.area}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, area: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                      placeholder="Enter area"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Address <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={deliveryAddress.address}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                      rows={3}
                      placeholder="House/Flat no., Road, Block"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={deliveryAddress.postalCode}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, postalCode: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                      placeholder="Enter postal code"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!deliveryAddress.division || !deliveryAddress.district || !deliveryAddress.city || !deliveryAddress.address}
                    className="flex-1 bg-red-700 text-white py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Payment Method */}
            {currentStep === 3 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard size={24} className="text-red-700" />
                  Payment Method
                </h2>

                <div className="space-y-4">
                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-red-700 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="cash_on_delivery"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-red-700"
                    />
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">Cash on Delivery</p>
                      <p className="text-sm text-gray-600">Pay when you receive your order</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-red-700 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-red-700"
                    />
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">Online Payment</p>
                      <p className="text-sm text-gray-600">Pay securely with SSL Commerce</p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={isProcessing}
                    className="flex-1 bg-red-700 text-white py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary - Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
                <span className="text-sm text-gray-600">({checkoutItems.length} items)</span>
              </div>
              
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {checkoutItems.map((item) => (
                  <div key={item.id} className="relative border border-gray-200 rounded-lg p-3">
                    <button
                      onClick={() => removeFromCheckout(item.id)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="flex gap-3 mb-3 pr-6">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                        <p className="text-sm text-gray-600">{parseFloat(item.price).toLocaleString()}৳</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-300 rounded">
                        <button
                          onClick={() => updateCheckoutQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateCheckoutQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-red-700">
                        {(parseFloat(item.price) * item.quantity).toLocaleString()}৳
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{subtotal.toLocaleString()}৳</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">
                    {shippingCost === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `${shippingCost}৳`
                    )}
                  </span>
                </div>
                {vat > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VAT ({vatRate}%)</span>
                    <span className="font-semibold">{vat.toLocaleString()}৳</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-red-700">{total.toLocaleString()}৳</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}