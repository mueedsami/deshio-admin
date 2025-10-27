// app/defects/sell/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

interface DefectItem {
  id: string;
  barcode: string;
  productId: number;
  productName: string;
  reason: string;
  sellingPrice?: number;
}

export default function SellDefectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defectId = searchParams.get('id');
  
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [defect, setDefect] = useState<DefectItem | null>(null);
  const [sellingPrice, setSellingPrice] = useState('');
  const [saleType, setSaleType] = useState<'pos' | 'social'>('pos');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (defectId) {
      fetchDefect();
    }
  }, [defectId]);

  const fetchDefect = async () => {
    try {
      const response = await fetch(`/api/defects?id=${defectId}`);
      if (response.ok) {
        const data = await response.json();
        setDefect(data);
        setSellingPrice(data.sellingPrice?.toString() || '');
      }
    } catch (error) {
      console.error('Error fetching defect:', error);
    }
  };

  const handleSell = async () => {
    if (!defect || !sellingPrice) return;

    setLoading(true);
    try {
      // Update defect status
      await fetch(`/api/defects/${defect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'sold',
          sellingPrice: parseFloat(sellingPrice)
        }),
      });

      // Redirect to appropriate selling interface
      if (saleType === 'pos') {
        router.push(`/pos?defect=${defect.id}&price=${sellingPrice}`);
      } else {
        router.push(`/social-commerce?defect=${defect.id}&price=${sellingPrice}`);
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error processing sale');
    } finally {
      setLoading(false);
    }
  };

  if (!defect) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Sell Defective Item
                </h1>

                {/* Product Info */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Product Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Product:</span>
                      <p className="text-gray-900 dark:text-white font-medium">{defect.productName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Barcode:</span>
                      <p className="text-gray-900 dark:text-white font-mono">{defect.barcode}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Defect Reason:</span>
                      <p className="text-gray-900 dark:text-white capitalize">{defect.reason.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Product ID:</span>
                      <p className="text-gray-900 dark:text-white">{defect.productId}</p>
                    </div>
                  </div>
                </div>

                {/* Sale Configuration */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sale Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setSaleType('pos')}
                        className={`p-4 border rounded-lg text-center transition-colors ${
                          saleType === 'pos'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        POS Sale
                      </button>
                      <button
                        onClick={() => setSaleType('social')}
                        className={`p-4 border rounded-lg text-center transition-colors ${
                          saleType === 'social'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        Social Commerce
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selling Price (৳)
                    </label>
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="Enter selling price"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => router.back()}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSell}
                      disabled={loading || !sellingPrice}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                    >
                      {loading ? 'Processing...' : `Sell via ${saleType === 'pos' ? 'POS' : 'Social Commerce'}`}
                    </button>
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