'use client';

import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import StoreCard from '@/components/StoreCard';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar'; 
import Header from '@/components/Header'; 

export default function StoresPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem('userRole') || '';
    setUserRole(role);
  }, []);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        if (response.ok) {
          const data = await response.json();
          setStores(data); // Set the stores to state
        } else {
          console.error('Failed to fetch stores');
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      }
    };
    fetchStores(); // Fetch stores data when component mounts
  }, []);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />

          <main className="flex-1 overflow-auto p-6 relative">
            {/* Top Bar: Search + Add Store */}
            <div className="flex justify-between items-center mb-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stores..."
                  className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm w-80 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500"
                />
              </div>

              {/* Add Store Button - Hidden for social_commerce_manager */}
              {userRole == 'super_admin' && (
                <Link href="/store/add-store">
                  <button className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add Store</span>
                  </button>
                </Link>
              )}
            </div>

            {/* Stores Section Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                Stores
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage and monitor all your store locations
              </p>
            </div>

            {/* Store Cards */}
            <div className="grid grid-cols-3 gap-6">
              {stores.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No stores available.</p>
              ) : (
                stores.map((store) => <StoreCard key={store.id} store={store} />)
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}