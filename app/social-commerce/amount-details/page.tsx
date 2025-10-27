'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function AmountDetailsPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Amount details
  const [vatRate, setVatRate] = useState('5');
  const [transportCost, setTransportCost] = useState('0');
  const [sslCommerzPaid, setSslCommerzPaid] = useState('0');
  const [advancePaid, setAdvancePaid] = useState('0');
  const [transactionId, setTransactionId] = useState('');

  const getTodayDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    const storedOrder = sessionStorage.getItem('pendingOrder');
    if (storedOrder) {
      setOrderData(JSON.parse(storedOrder));
    } else {
      router.push('/social-commerce');
    }
  }, [router]);

  if (!orderData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const subtotal = orderData.subtotal || 0;
  const totalDiscount = orderData.products.reduce((sum: number, item: any) => sum + item.discount, 0);
  const vat = (subtotal * parseFloat(vatRate)) / 100;
  const transport = parseFloat(transportCost) || 0;
  const total = subtotal + vat + transport;
  
  const paidSslCommerz = parseFloat(sslCommerzPaid) || 0;
  const paidAdvance = parseFloat(advancePaid) || 0;
  const totalPaid = paidSslCommerz + paidAdvance;
  const dueAmount = Math.max(0, total - totalPaid);
  const returnAmount = Math.max(0, totalPaid - total);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
      // Create the complete order data with all payment details
      const completeOrderData = {
        ...orderData,
        date: orderData.date || getTodayDate(),
        amounts: {
          subtotal,
          totalDiscount,
          vat,
          vatRate: parseFloat(vatRate),
          transportCost: transport,
          total
        },
        payments: {
          sslCommerz: paidSslCommerz,
          advance: paidAdvance,
          transactionId,
          totalPaid,
          due: dueAmount
        }
      };

      // Send order to API - inventory allocation happens in the backend
      const response = await fetch('/api/social-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeOrderData),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Order placed successfully!');
        sessionStorage.removeItem('pendingOrder');
        router.push('/orders');
      } else {
        alert(result.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error placing order');
    } finally {
      setIsProcessing(false);
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
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-4 md:mb-6">Amount Details</h1>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Left Column - Order Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
                  
                  {/* Customer Info */}
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-2">Customer Information</p>
                    <p className="text-sm text-gray-900 dark:text-white">{orderData.customer.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{orderData.customer.email}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{orderData.customer.phone}</p>
                  </div>

                  {/* Delivery Address */}
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-800 dark:text-green-300 font-medium mb-2">Delivery Address</p>
                    <p className="text-xs text-gray-900 dark:text-white">
                      {orderData.deliveryAddress.division}, {orderData.deliveryAddress.district}, {orderData.deliveryAddress.city}
                    </p>
                    {orderData.deliveryAddress.zone && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">Zone: {orderData.deliveryAddress.zone}</p>
                    )}
                    {orderData.deliveryAddress.address && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{orderData.deliveryAddress.address}</p>
                    )}
                    {orderData.deliveryAddress.postalCode && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">Postal Code: {orderData.deliveryAddress.postalCode}</p>
                    )}
                  </div>

                  {/* Products List */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Products ({orderData.products.length})</p>
                    <div className="space-y-2 max-h-60 md:max-h-80 overflow-y-auto">
                      {orderData.products.map((product: any) => (
                        <div key={product.id} className={`flex justify-between items-center p-2 rounded ${
                          product.isDefective 
                            ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700' 
                            : 'bg-gray-50 dark:bg-gray-700'
                        }`}>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-900 dark:text-white truncate">
                              {product.productName}
                              {product.isDefective && (
                                <span className="ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                                  Defective
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Qty: {product.qty} × {product.price.toFixed(2)} Tk
                            </p>
                            {product.barcode && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                Barcode: {product.barcode}
                              </p>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white ml-2">{product.amount.toFixed(2)} Tk</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-gray-900 dark:text-white">Subtotal</span>
                      <span className="text-gray-900 dark:text-white">{subtotal.toFixed(2)} Tk</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Payment Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Details</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Sub Total</span>
                      <span className="text-gray-900 dark:text-white">{subtotal.toFixed(2)} Tk</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Discount</span>
                      <span className="text-gray-900 dark:text-white">{totalDiscount.toFixed(2)} Tk</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">VAT</label>
                        <input
                          type="text"
                          value={vat.toFixed(2)}
                          readOnly
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">VAT Rate %</label>
                        <input
                          type="number"
                          value={vatRate}
                          onChange={(e) => setVatRate(e.target.value)}
                          disabled={isProcessing}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Transport Cost</label>
                      <input
                        type="number"
                        value={transportCost}
                        onChange={(e) => setTransportCost(e.target.value)}
                        disabled={isProcessing}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-lg font-semibold mb-2">
                        <span className="text-gray-900 dark:text-white">Total</span>
                        <span className="text-gray-900 dark:text-white">{total.toFixed(2)} Tk</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Paid Amount</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">SSL Commerz</label>
                          <input
                            type="number"
                            value={sslCommerzPaid}
                            onChange={(e) => setSslCommerzPaid(e.target.value)}
                            disabled={isProcessing}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">Advance</label>
                          <input
                            type="number"
                            value={advancePaid}
                            onChange={(e) => setAdvancePaid(e.target.value)}
                            disabled={isProcessing}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">Transaction ID (Optional)</label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          disabled={isProcessing}
                          placeholder="Enter transaction ID"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Return</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {returnAmount.toFixed(2)} Tk
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Due Amount</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">{dueAmount.toFixed(2)} Tk</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <button 
                        onClick={() => router.back()}
                        disabled={isProcessing}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Processing...
                          </>
                        ) : (
                          'Place Order'
                        )}
                      </button>
                    </div>
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