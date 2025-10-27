'use client';

import { useState, useEffect } from 'react';
import { Search, Package, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import StoreCard from '@/components/StoreCard';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

interface Batch {
  id: number;
  baseCode: string;
  productId: number;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  admitted?: string; 
}

interface Store {
  id: string;
  name: string;
  location: string;
  type: 'Warehouse' | 'Store';
  pathao_key: string;
  revenue: number;
  revenueChange: number;
  products: number;
  orders: number;
}

export default function ManageStockPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [userStoreId, setUserStoreId] = useState<string>('');

  useEffect(() => {
    // Get user role and store info from localStorage
    const role = localStorage.getItem('userRole') || '';
    const storeId = localStorage.getItem('storeId') || '';
    console.log('User role from localStorage:', role);
    console.log('User storeId from localStorage:', storeId);
    setUserRole(role);
    setUserStoreId(storeId);

    // Fetch data immediately with the role and storeId
    fetchData(role, storeId);
  }, []);

  const fetchData = async (role: string, storeId: string) => {
    // Fetch batches (only for super_admin)
    const fetchBatches = async () => {
      if (role === 'store_manager') return; // Don't fetch for store managers
      
      try {
        const response = await fetch('/api/batch');
        if (response.ok) {
          const data = await response.json();
          setBatches(data);
        } else {
          console.error('Failed to fetch batches:', response.status);
        }
      } catch (error) {
        console.error('Error fetching batches:', error);
      }
    };

    // Fetch stores
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        if (response.ok) {
          const data = await response.json();
          console.log('All stores from API:', data);
          
          // Filter stores based on user role
          if (role === 'store_manager' && storeId) {
            // Store managers only see their assigned store
            // Convert both IDs to strings for comparison
            const userStore = data.find((store: Store) => String(store.id) === String(storeId));
            console.log('Looking for storeId:', storeId);
            console.log('Found store:', userStore);
            setStores(userStore ? [userStore] : []);
          } else {
            // Super admin sees all stores
            console.log('Super admin - showing all stores');
            setStores(data);
          }
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      }
    };

    await fetchBatches();
    await fetchStores();
  };

  const handleAdmitBatch = (batchId: number) => {
    // Navigate to admit batch page with batch ID
    window.location.href = `/inventory/admit-batch?batchId=${batchId}`;
  };

  const handleManageStock = (storeId: string) => {
    // Navigate to outlet manage stock page
    window.location.href = `/inventory/outlet-stock?storeId=${storeId}`;
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="flex-1 overflow-auto p-6">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                Manage Stock
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userRole === 'store_manager' 
                  ? 'Manage your store inventory' 
                  : 'Admit upcoming batches and manage store inventory'}
              </p>
            </div>

            {/* Upcoming Batches Section - Only for Super Admin */}
            {userRole !== 'store_manager' && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Upcoming Batches
                  </h2>
                </div>

                {batches.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No upcoming batches</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                    {batches
                      .filter((batch) => batch.admitted === 'no')
                      .map((batch) => (
                        <div
                          key={batch.id}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {batch.baseCode}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Quantity: {batch.quantity} units
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAdmitBatch(batch.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Admit
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Stores Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {userRole === 'store_manager' ? 'My Store' : 'Store Inventory'}
                </h2>
                {/* Search Bar - Only show for super admin with multiple stores */}
                {userRole !== 'store_manager' && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search stores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500"
                    />
                  </div>
                )}
              </div>

              {/* Store Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm 
                        ? 'No stores found matching your search' 
                        : userRole === 'store_manager'
                          ? 'No store assigned to you'
                          : 'No stores available'}
                    </p>
                  </div>
                ) : (
                  filteredStores.map((store) => (
                    <StoreCard
                      key={store.id}
                      store={store}
                      showManageStock={true}
                      onManageStock={handleManageStock}
                    />
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}