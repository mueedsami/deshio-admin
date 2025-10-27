// app/orders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import StatsCards from '@/components/orders/StatsCards';
import OrderFilters from '@/components/orders/OrderFilters';
import OrdersTable from '@/components/orders/OrdersTable';
import OrderDetailsModal from '@/components/orders/OrderDetailsModal';
import EditOrderModal from '@/components/orders/EditOrderModal';
import ExchangeProductModal from '@/components/orders/ExchangeProductModal';
import ReturnProductModal from '@/components/orders/ReturnProductModal';
import { Order } from '@/types/order';

export default function OrdersDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  // Get user info from localStorage
  useEffect(() => {
    const role = localStorage.getItem('userRole') || '';
    const name = localStorage.getItem('userName') || '';
    setUserRole(role);
    setUserName(name);
  }, []);

  // Get today's date in DD-MM-YYYY format
  const getTodayDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/social-orders');
      if (response.ok) {
        const data = await response.json();
        // Ensure all orders have proper dates
        const ordersWithDates = data.map((order: Order) => ({
          ...order,
          date: order.date || getTodayDate()
        }));
        
        // Filter orders based on user role
        const role = localStorage.getItem('userRole') || '';
        const name = localStorage.getItem('userName') || '';
        
        let filteredData = ordersWithDates;
        if (role === 'social_commerce_manager') {
          // Social commerce managers only see their own orders
          filteredData = ordersWithDates.filter((order: Order) => order.salesBy === name);
        }
        // Super admin and store managers see all orders
        
        setOrders(filteredData);
        setFilteredOrders(filteredData);
        return;
      }
    } catch (error) {
      console.error('Failed to load from API:', error);
    }
    
    try {
      const data = (await import('@/data/orders.json')).default;
      const ordersWithDates = data.map((order: Order) => ({
        ...order,
        date: order.date || getTodayDate()
      }));
      
      // Filter orders based on user role
      const role = localStorage.getItem('userRole') || '';
      const name = localStorage.getItem('userName') || '';
      
      let filteredData = ordersWithDates;
      if (role === 'social_commerce_manager') {
        // Social commerce managers only see their own orders
        filteredData = ordersWithDates.filter((order: Order) => order.salesBy === name);
      }
      // Super admin and store managers see all orders
      
      setOrders(filteredData);
      setFilteredOrders(filteredData);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  useEffect(() => {
    let filtered = orders;

    // Search filter
    if (search.trim()) {
      filtered = filtered.filter((o) =>
        o.id.toString().includes(search.trim()) ||
        o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.phone.includes(search.trim())
      );
    }

    // Date filter - handle both DD-MM-YYYY and YYYY-MM-DD formats
    if (dateFilter.trim()) {
      filtered = filtered.filter((o) => {
        const orderDate = o.date;
        
        // If dateFilter is in YYYY-MM-DD format (from input), convert to DD-MM-YYYY
        let filterDateFormatted = dateFilter;
        if (dateFilter.includes('-') && dateFilter.split('-')[0].length === 4) {
          const [year, month, day] = dateFilter.split('-');
          filterDateFormatted = `${day}-${month}-${year}`;
        }
        
        return orderDate === filterDateFormatted;
      });
    }

    // Status filter
    if (statusFilter !== 'All Status') {
      filtered = filtered.filter((o) =>
        statusFilter === 'Paid' ? o.payments.due === 0 : o.payments.due > 0
      );
    }

    setFilteredOrders(filtered);
  }, [search, dateFilter, statusFilter, orders]);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    setActiveMenu(null);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleSaveOrder = async (updatedOrder: Order) => {
    try {
      const response = await fetch(`/api/social-orders?id=${updatedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedOrder),
      });

      if (response.ok) {
        await loadOrders();
        alert('Order updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update order: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  };

  const handleExchangeOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowExchangeModal(true);
    setActiveMenu(null);
  };

  const handleReturnOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowReturnModal(true);
    setActiveMenu(null);
  };

  const handleProcessExchange = async (exchangeData: any) => {
    try {
      console.log('Processing exchange:', exchangeData);
      await loadOrders();
      // Success message already shown in the modal
    } catch (error) {
      console.error('Error processing exchange:', error);
      throw error;
    }
  };

  const handleProcessReturn = async (returnData: any) => {
    try {
      console.log('Processing return:', returnData);
      await loadOrders();
      alert('Return processed successfully!');
    } catch (error) {
      console.error('Error processing return:', error);
      throw error;
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await fetch(`/api/social-orders?id=${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        alert('API endpoint not found. Please ensure /api/social-orders/route.ts exists with DELETE method.');
        return;
      }
      
      if (response.ok) {
        await loadOrders();
        setActiveMenu(null);
        alert('Order cancelled successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to cancel order: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(`API Error: Make sure /api/social-orders/route.ts exists with a DELETE export function`);
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (order.amounts?.total || order.subtotal), 0);
  const paidOrders = orders.filter(o => o.payments.due === 0).length;
  const pendingOrders = orders.filter(o => o.payments.due > 0).length;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-100 dark:bg-black">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />

          <main className="flex-1 overflow-auto bg-gray-100 dark:bg-black">
            <div className="px-4 md:px-8 pt-6 pb-4">
              <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Orders Dashboard</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {userRole === 'social_commerce_manager' 
                      ? 'Overview of your orders and sales' 
                      : 'Overview of all orders and sales'}
                  </p>
                </div>

                <StatsCards 
                  totalOrders={orders.length}
                  paidOrders={paidOrders}
                  pendingOrders={pendingOrders}
                  totalRevenue={totalRevenue}
                />
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 pb-6">
              <OrderFilters
                search={search}
                setSearch={setSearch}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />

              <OrdersTable
                filteredOrders={filteredOrders}
                totalOrders={orders.length}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onViewDetails={handleViewDetails}
                onEditOrder={handleEditOrder}
                onExchangeOrder={handleExchangeOrder}
                onReturnOrder={handleReturnOrder}
                onCancelOrder={handleCancelOrder}
              />
            </div>
          </main>
        </div>
      </div>

      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
          onEdit={handleEditOrder}
        />
      )}

      {showEditModal && selectedOrder && (
        <EditOrderModal
          order={selectedOrder}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveOrder}
        />
      )}

      {showExchangeModal && selectedOrder && (
        <ExchangeProductModal
          order={selectedOrder}
          onClose={() => setShowExchangeModal(false)}
          onExchange={handleProcessExchange}
        />
      )}

      {showReturnModal && selectedOrder && (
        <ReturnProductModal
          order={selectedOrder}
          onClose={() => setShowReturnModal(false)}
          onReturn={handleProcessReturn}
        />
      )}

      {activeMenu !== null && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}