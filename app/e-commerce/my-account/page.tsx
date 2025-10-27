'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AccountSidebar from '@/components/ecommerce/my-account/AccountSidebar';
import Navigation from '@/components/ecommerce/Navigation';
import { 
  ShoppingBag, 
  Download, 
  MapPin, 
  User, 
  Heart, 
  LogOut,
  Package,
  Calendar,
  CreditCard,
  Eye
} from 'lucide-react';

export default function AccountDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchUserOrders(parsedUser.id);
      } else {
        // Redirect to login if not authenticated
        router.push('/e-commerce/login');
      }
      setLoading(false);
    }
  }, [router]);

  const fetchUserOrders = async (userId: string) => {
    try {
      const response = await fetch('/api/social-orders');
      const allOrders = await response.json();
      
      // Filter orders for the current user and sort by date (most recent first)
      const userOrders = allOrders
        .filter((order: any) => order.userId === userId)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3); // Get only the 3 most recent orders
      
      setRecentOrders(userOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
    }
    router.push('/e-commerce');
  };

  const getStatusColor = (order: any) => {
    if (order.payments.due > 0) {
      return 'text-orange-600 bg-orange-50';
    }
    return 'text-green-600 bg-green-50';
  };

  const getStatusText = (order: any) => {
    if (order.payments.due > 0) {
      return 'Pending (COD)';
    }
    return 'Paid';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const dashboardCards = [
    {
      title: 'Orders',
      icon: ShoppingBag,
      path: '/e-commerce/my-account/orders',
    },
    {
      title: 'Downloads',
      icon: Download,
      path: '/e-commerce/my-account/downloads',
    },
    {
      title: 'Addresses',
      icon: MapPin,
      path: '/e-commerce/my-account/addresses',
    },
    {
      title: 'Account details',
      icon: User,
      path: '/e-commerce/my-account/account-details',
    },
    {
      title: 'Wishlist',
      icon: Heart,
      path: '/e-commerce/my-account/wishlist',
    },
    {
      title: 'Logout',
      icon: LogOut,
      onClick: handleLogout,
    },
  ];

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
            <span>My account</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <AccountSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">

            {/* Recent Orders Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Package size={24} className="text-red-700" />
                  Recent Orders
                </h2>
                {recentOrders.length > 0 && (
                  <button
                    onClick={() => router.push('/e-commerce/my-account/orders')}
                    className="text-red-700 hover:underline text-sm font-medium"
                  >
                    View All Orders
                  </button>
                )}
              </div>

              {loadingOrders ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading orders...</p>
                </div>
              ) : recentOrders.length === 0 ? (
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
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                          <div>
                            <p className="text-sm text-gray-600">Order ID</p>
                            <p className="font-bold text-gray-900">#{order.id}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order)}`}>
                            {getStatusText(order)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={16} />
                          {new Date(order.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-3 space-y-2">
                        {order.products.slice(0, 2).map((product: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {product.productName} <span className="text-gray-500">x{product.qty}</span>
                            </span>
                            <span className="font-medium text-gray-900">{product.amount.toLocaleString()}৳</span>
                          </div>
                        ))}
                        {order.products.length > 2 && (
                          <p className="text-sm text-gray-500">+ {order.products.length - 2} more items</p>
                        )}
                      </div>

                      {/* Total and Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} className="text-gray-600" />
                          <span className="text-sm text-gray-600">Total:</span>
                          <span className="font-bold text-red-700">{order.amounts.total.toLocaleString()}৳</span>
                        </div>
                        <button
                          onClick={() => router.push(`/e-commerce/order-success?orderId=${order.id}`)}
                          className="flex items-center gap-1 text-sm text-red-700 hover:underline font-medium"
                        >
                          <Eye size={16} />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}