'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ArrowLeft, Save, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function AddStorePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('id'); // if provided → edit mode

  const [formData, setFormData] = useState({
    id: '',
    storeName: '',
    address: '',
    pathaoKey: '',
    type: 'store',
     isOnline: false,
  });

  // Load store data when editing
  useEffect(() => {
    if (editId) {
      fetch('/api/stores')
        .then(res => res.json())
        .then(data => {
          const store = data.find((s: any) => String(s.id) === String(editId));
          if (store) {
            setFormData({
              id: store.id,
              storeName: store.name,
              address: store.location,
              pathaoKey: store.pathao_key,
              type: store.type?.toLowerCase() || 'store',
              isOnline: store.isOnline || false,
            });
          }
        });
    }
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editId ? 'PUT' : 'POST';
    const payload = editId ? formData : { ...formData, id: Date.now() };

    try {
      const response = await fetch('/api/stores', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/store'); // back to store list
      } else {
        console.error('Failed to save store');
      }
    } catch (error) {
      console.error('Error saving store:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const selectType = (type: string) => {
    setFormData(prev => ({ ...prev, type }));
    setIsTypeOpen(false);
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-xl mx-auto">
              <div className="mb-4">
                <Link href="/store">
                  <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-3">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Stores</span>
                  </button>
                </Link>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  {editId ? 'Edit Store' : 'Add New Store'}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {editId ? 'Update this store information' : 'Create a new store location'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Store Name */}
                  <div>
                    <label htmlFor="storeName" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Store Name</label>
                    <input
                      type="text"
                      id="storeName"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleChange}
                      placeholder="Enter store name"
                      required
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 transition-colors"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="address" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address</label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter full address"
                      required
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Pathao Key */}
                  <div>
                    <label htmlFor="pathaoKey" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pathao Key</label>
                    <input
                      type="text"
                      id="pathaoKey"
                      name="pathaoKey"
                      value={formData.pathaoKey}
                      onChange={handleChange}
                      placeholder="Enter Pathao key"
                      required
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 transition-colors"
                    />
                  </div>

                  {/* Type Selection - Dropdown */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                    <div className="relative">
                      <button type="button" onClick={() => setIsTypeOpen(!isTypeOpen)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 transition-colors flex items-center justify-between">
                        <span className="capitalize">{formData.type}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isTypeOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isTypeOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
                          <button type="button" onClick={() => selectType('store')} className="w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Store</button>
                          <button type="button" onClick={() => selectType('warehouse')} className="w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Warehouse</button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Online Status */}
<div>
  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
    Online Status
  </label>
  <div className="flex items-center gap-4">
    <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
      <input
        type="radio"
        name="isOnline"
        checked={formData.isOnline === true}
        onChange={() => setFormData(prev => ({ ...prev, isOnline: true }))}
        className="text-gray-900 focus:ring-gray-900 dark:focus:ring-gray-500"
      />
      Online
    </label>
    <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
      <input
        type="radio"
        name="isOnline"
        checked={formData.isOnline === false}
        onChange={() => setFormData(prev => ({ ...prev, isOnline: false }))}
        className="text-gray-900 focus:ring-gray-900 dark:focus:ring-gray-500"
      />
      Offline
    </label>
  </div>
</div>


                  {/* Form Actions */}
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Link href="/store" className="flex-1">
                      <button type="button" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                    </Link>
                    <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                      <Save className="w-4 h-4" />
                      {editId ? 'Update Store' : 'Save Store'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
