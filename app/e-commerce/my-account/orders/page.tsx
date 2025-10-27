'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/e-commerce/AuthContext';
import Navigation from '@/components/ecommerce/Navigation';
import AccountSidebar from '@/components/ecommerce/my-account/AccountSidebar';
import { Package, Calendar, CreditCard, Eye, ShoppingBag, ChevronDown, ChevronUp, MapPin } from 'lucide-react';

interface Order {
  id: string;
  date: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  deliveryAddress: {
    division: string;
    district: string;
    city: string;
    area?: string;
    address: string;
    postalCode?: string;
  };
  products: Array<{
    productId: string;
    productName: string;
    size: string;
    qty: number;
    price: number;
    amount: number;
  }>;
  amounts: {
    subtotal: number;
    totalDiscount: number;
    vat: number;
    transportCost: number;
    total: number;
  };
  payments: {
    sslCommerz: number;
    advance: number;
    transactionId?: string;
    totalPaid: number;
    due: number;
  };
  userId?: string;
  salesBy: string;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/e-commerce/login');
      } else if (user) {
        fetchUserOrders();
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchUserOrders = async () => {
    try {
      const response = await fetch('/api/social-orders');
      const allOrders = await response.json();
      
      // Filter orders for the current user and sort by date (most recent first)
      const userOrders = allOrders
        .filter((order: Order) => order.userId === user?.id)
        .sort((a: Order, b: Order) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setOrders(userOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusColor = (order: Order) => {
    if (order.payments.due > 0) {
      return 'text-orange-600 bg-orange-50';
    }
    return 'text-green-600 bg-green-50';
  };

  const getStatusText = (order: Order) => {
    if (order.payments.due > 0) {
      return 'Pending (COD)';
    }
    return 'Paid';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-gray-600">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="text-sm text-gray-600">
            <button onClick={() => router.push('/e-commerce')} className="text-red-700 hover:underline">
              Home
            </button>
            <span className="mx-2">&gt;</span>
            <button onClick={() => router.push('/e-commerce/my-account')} className="text-red-700 hover:underline">
              My Account
            </button>
            <span className="mx-2">&gt;</span>
            <span>Orders</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <AccountSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package size={28} className="text-red-700" />
                My Orders
              </h1>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
                  <button
                    onClick={() => router.push('/e-commerce')}
                    className="bg-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isExpanded = expandedOrders.has(order.id);
                    return (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {/* Order Header */}
                        <div className="bg-gray-50 p-4 border-b border-gray-200">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="text-sm text-gray-600">Order ID</p>
                                <p className="font-bold text-gray-900">#{order.id}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order)}`}>
                                {getStatusText(order)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar size={16} />
                                {new Date(order.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <button
                                onClick={() => toggleOrderExpanded(order.id)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                              >
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Order Content */}
                        <div className="p-4">
                          {/* Order Items Preview */}
                          <div className="mb-3 space-y-2">
                            {order.products.slice(0, isExpanded ? undefined : 2).map((product, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                  {product.productName} 
                                  <span className="text-gray-500 ml-1">
                                    (Size: {product.size}) x{product.qty}
                                  </span>
                                </span>
                                <span className="font-medium text-gray-900">{product.amount.toLocaleString()}৳</span>
                              </div>
                            ))}
                            {!isExpanded && order.products.length > 2 && (
                              <p className="text-sm text-gray-500">+ {order.products.length - 2} more items</p>
                            )}
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                              {/* Delivery Address */}
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                  <MapPin size={16} className="text-red-700" />
                                  Delivery Address
                                </h3>
                                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                  <p>{order.deliveryAddress.address}</p>
                                  {order.deliveryAddress.area && (
                                    <p>{order.deliveryAddress.area}, {order.deliveryAddress.city}</p>
                                  )}
                                  {!order.deliveryAddress.area && (
                                    <p>{order.deliveryAddress.city}</p>
                                  )}
                                  <p>{order.deliveryAddress.district}, {order.deliveryAddress.division}</p>
                                  {order.deliveryAddress.postalCode && (
                                    <p>Postal Code: {order.deliveryAddress.postalCode}</p>
                                  )}
                                </div>
                              </div>

                              {/* Price Breakdown */}
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                  <CreditCard size={16} className="text-red-700" />
                                  Payment Details
                                </h3>
                                <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">{order.amounts.subtotal.toLocaleString()}৳</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="font-medium">
                                      {order.amounts.transportCost === 0 ? (
                                        <span className="text-green-600">Free</span>
                                      ) : (
                                        `${order.amounts.transportCost}৳`
                                      )}
                                    </span>
                                  </div>
                                  {order.amounts.vat > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">VAT</span>
                                      <span className="font-medium">{order.amounts.vat.toLocaleString()}৳</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                                    <span>Total</span>
                                    <span className="text-red-700">{order.amounts.total.toLocaleString()}৳</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Total and Actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Total:</span>
                              <span className="font-bold text-red-700 text-lg">{order.amounts.total.toLocaleString()}৳</span>
                            </div>
                            <button
                              onClick={() => router.push(`/e-commerce/order-success?orderId=${order.id}`)}
                              className="flex items-center gap-1 text-sm text-white bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              <Eye size={16} />
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}