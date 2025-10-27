'use client';

import { useState, useEffect } from 'react';
import { Search, Barcode, User, Package, Trash2, ShoppingCart, AlertCircle, Store, ChevronDown, ChevronUp, Calendar, DollarSign, MapPin, Phone, FileText, Image as ImageIcon } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SellDefectModal from '@/components/SellDefectModal';

interface StoreItem {
  id: string;
  name: string;
  location?: string;
}

interface DefectItem {
  id: string;
  barcode: string;
  productId: number;
  productName: string;
  status: 'pending' | 'approved' | 'sold';
  addedBy: string;
  addedAt: string;
  originalOrderId?: number;
  customerPhone?: string;
  sellingPrice?: number;
  originalSellingPrice?: number;
  costPrice?: number;
  returnReason?: string;
  store?: string;
  image?: string;
}

interface InventoryItem {
  id: number;
  barcode: string;
  productId: number;
  productName: string;
  status: string;
  location?: string;
  sellingPrice: number;
}

interface Order {
  id: number;
  customerName?: string;
  customerPhone?: string;
  customer?: {
    name: string;
    phone: string;
  };
  total?: number;
  amounts?: {
    total: number;
  };
  products: Array<{
    id: number;
    productId: number;
    productName: string;
    qty: number;
    price: number;
    barcodes?: string[];
  }>;
}

export default function DefectsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [defects, setDefects] = useState<DefectItem[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'identification' | 'returns'>('identification');
  const [expandedDefect, setExpandedDefect] = useState<string | null>(null);
  
  // Defect Identification
  const [barcodeInput, setBarcodeInput] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [storeForDefect, setStoreForDefect] = useState('');
  const [scannedProduct, setScannedProduct] = useState<InventoryItem | null>(null);
  const [defectImage, setDefectImage] = useState<File | null>(null);
  
  // Customer Returns
  const [searchType, setSearchType] = useState<'phone' | 'orderId'>('phone');
  const [searchValue, setSearchValue] = useState('');
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);
  const [storeForReturn, setStoreForReturn] = useState('');
  const [customerReturnReason, setCustomerReturnReason] = useState('');
  const [returnImage, setReturnImage] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Sell modal
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<DefectItem | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [sellType, setSellType] = useState<'pos' | 'social'>('pos');

  useEffect(() => {
    fetchStores();
    fetchDefects();
  }, []);

  useEffect(() => {
    fetchDefects();
  }, [selectedStore]);

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores');
      if (response.ok) {
        const data = await response.json();
        setStores(data);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const fetchDefects = async () => {
    try {
      const url = selectedStore === 'all' 
        ? '/api/defects'
        : `/api/defects?store=${selectedStore}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDefects(data);
      }
    } catch (error) {
      console.error('Error fetching defects:', error);
    }
  };

  const findProductByBarcode = async (barcode: string): Promise<InventoryItem | null> => {
    try {
      const response = await fetch('/api/inventory');
      const inventory: InventoryItem[] = await response.json();
      return inventory.find(inv => inv.barcode === barcode) || null;
    } catch (error) {
      console.error('Error finding product:', error);
      return null;
    }
  };

  const handleBarcodeCheck = async (value: string) => {
    setBarcodeInput(value);
    if (value.trim().length > 3) {
      const product = await findProductByBarcode(value);
      setScannedProduct(product);
    } else {
      setScannedProduct(null);
    }
  };

  const handleDefectImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDefectImage(e.target.files[0]);
    }
  };

  const handleReturnImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReturnImage(e.target.files[0]);
    }
  };

  const handleMarkAsDefective = async () => {
    if (!barcodeInput.trim() || !returnReason) {
      alert('Please enter barcode and return reason');
      return;
    }

    const product = await findProductByBarcode(barcodeInput);
    if (!product) {
      alert('Product not found in inventory');
      return;
    }

    if (!storeForDefect) {
      alert('Please select the store location where this defect is being recorded.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('barcode', barcodeInput);
      formData.append('returnReason', returnReason);
      formData.append('store', storeForDefect);
      formData.append('isDefectIdentification', 'true');
      if (defectImage) formData.append('image', defectImage);

      const response = await fetch('/api/defects', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Item marked as defective successfully!');
        setBarcodeInput('');
        setReturnReason('');
        setStoreForDefect('');
        setScannedProduct(null);
        setDefectImage(null);
        fetchDefects();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert(data.error || 'Failed to mark as defective');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing defect');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCustomer = async () => {
    if (!searchValue.trim()) {
      alert('Please enter search value');
      return;
    }

    if (!storeForReturn) {
      alert('Please select a store first before searching for returns');
      return;
    }

    try {
      const [ordersResponse, salesResponse] = await Promise.all([
        fetch('/api/social-orders'),
        fetch('/api/sales')
      ]);

      let foundOrders: Order[] = [];

      if (ordersResponse.ok) {
        const orders = await ordersResponse.json();
        if (searchType === 'phone') {
          foundOrders = orders.filter((order: Order) => {
            const phone = order.customerPhone || order.customer?.phone || '';
            return phone.includes(searchValue);
          });
        } else {
          const order = orders.find((o: Order) => o.id.toString() === searchValue);
          if (order) foundOrders = [order];
        }
      }

      if (salesResponse.ok) {
        const sales = await salesResponse.json();
        if (searchType === 'phone') {
          const phoneSales = sales.filter((sale: any) => 
            sale.customer?.mobile?.includes(searchValue)
          );
          foundOrders = [...foundOrders, ...phoneSales.map((sale: any) => ({
            id: sale.id,
            customerName: sale.customer?.name,
            customerPhone: sale.customer?.mobile,
            total: sale.amounts?.total,
            products: sale.items?.map((item: any) => ({
              id: item.id,
              productId: item.productId || item.id,
              productName: item.productName,
              qty: item.qty,
              price: item.price,
              barcodes: item.barcodes || []
            })) || []
          }))];
        } else {
          const sale = sales.find((s: any) => s.id.toString() === searchValue);
          if (sale) {
            foundOrders.push({
              id: sale.id,
              customerName: sale.customer?.name,
              customerPhone: sale.customer?.mobile,
              total: sale.amounts?.total,
              products: sale.items?.map((item: any) => ({
                id: item.id,
                productId: item.productId || item.id,
                productName: item.productName,
                qty: item.qty,
                price: item.price,
                barcodes: item.barcodes || []
              })) || []
            });
          }
        }
      }

      if (foundOrders.length === 0) {
        alert('No orders found');
      }

      setCustomerOrders(foundOrders);
      setSelectedOrder('');
      setSelectedBarcodes([]);
    } catch (error) {
      console.error('Error searching:', error);
      alert('Error searching orders');
    }
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrder(orderId);
    setSelectedBarcodes([]);
  };

  const handleBarcodeToggle = (barcode: string) => {
    setSelectedBarcodes(prev =>
      prev.includes(barcode)
        ? prev.filter(b => b !== barcode)
        : [...prev, barcode]
    );
  };

  const handleProcessReturn = async () => {
    if (!selectedOrder || selectedBarcodes.length === 0 || !storeForReturn || !customerReturnReason) {
      alert('Please select order, barcodes, store, and provide return reason');
      return;
    }

    setLoading(true);
    try {
      const order = customerOrders.find(o => o.id.toString() === selectedOrder);
      if (!order) return;

      for (const barcode of selectedBarcodes) {
        const formData = new FormData();
        formData.append('barcode', barcode);
        formData.append('returnReason', customerReturnReason);
        formData.append('store', storeForReturn);
        formData.append('orderId', selectedOrder);
        formData.append('customerPhone', order.customerPhone || order.customer?.phone || '');
        if (returnImage) formData.append('image', returnImage);

        await fetch('/api/defects', {
          method: 'POST',
          body: formData
        });
      }

      setSuccessMessage(`Successfully processed return for ${selectedBarcodes.length} items!`);
      setSearchValue('');
      setSelectedOrder('');
      setCustomerOrders([]);
      setSelectedBarcodes([]);
      setCustomerReturnReason('');
      setReturnImage(null);
      fetchDefects();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Error processing return');
    } finally {
      setLoading(false);
    }
  };

  const handleSellClick = (defect: DefectItem) => {
    setSelectedDefect(defect);
    setSellPrice(defect.sellingPrice?.toString() || '');
    setSellType('pos');
    setSellModalOpen(true);
  };

  const handleSell = async () => {
    if (!selectedDefect || !sellPrice) {
      alert('Please enter selling price');
      return;
    }

    setLoading(true);
    try {
      setSellModalOpen(false);

      const defectData = {
        id: selectedDefect.id,
        barcode: selectedDefect.barcode,
        productId: selectedDefect.productId,
        productName: selectedDefect.productName,
        sellingPrice: parseFloat(sellPrice),
        store: selectedDefect.store
      };

      sessionStorage.setItem('defectItem', JSON.stringify(defectData));

      const url = sellType === 'pos'
        ? `/pos?defect=${selectedDefect.id}`
        : `/social-commerce?defect=${selectedDefect.id}`;
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing sale');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (defectId: string) => {
    if (!confirm('Are you sure you want to remove this defect?')) return;

    try {
      const response = await fetch(`/api/defects?id=${defectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchDefects();
        alert('Defect removed successfully');
      }
    } catch (error) {
      console.error('Error removing defect:', error);
      alert('Error removing defect');
    }
  };

  const toggleDefectDetails = (defectId: string) => {
    setExpandedDefect(expandedDefect === defectId ? null : defectId);
  };

  const pendingDefects = defects.filter(d => d.status === 'pending' || d.status === 'approved');
  const soldDefects = defects.filter(d => d.status === 'sold');

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          />

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Defect & Return Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage defective items and process customer returns
                </p>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-green-800 dark:text-green-300">{successMessage}</p>
                </div>
              )}

              {/* Store Selection */}
              <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Store Selection</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select store to view defects • Barcode scanning auto-detects store • Selling requires store selection
                      </p>
                    </div>
                  </div>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">View all stores</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('identification')}
                  className={`px-4 py-2 font-medium ${
                    activeTab === 'identification'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Defect Identification
                </button>
                <button
                  onClick={() => setActiveTab('returns')}
                  className={`px-4 py-2 font-medium ${
                    activeTab === 'returns'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Customer Returns
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Form (keeping the existing form code) */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  {activeTab === 'identification' ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Barcode className="w-5 h-5" />
                        Scan Barcode
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Barcode Scanner / Manual Entry
                          </label>
                          <input
                            type="text"
                            value={barcodeInput}
                            onChange={(e) => handleBarcodeCheck(e.target.value)}
                            placeholder="Scan or enter barcode..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          {scannedProduct && (
                            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
                              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                {scannedProduct.productName}
                              </p>
                              <p className="text-xs text-green-700 dark:text-green-400">
                                Status: {scannedProduct.status} • Location: {scannedProduct.location}
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Return Reason
                          </label>
                          <textarea
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            placeholder="Enter return reason..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Defect Image
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleDefectImageChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Store Location (if required)
                          </label>
                          <select
                            value={storeForDefect}
                            onChange={(e) => setStoreForDefect(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Select store...</option>
                            {stores.map(store => (
                              <option key={store.id} value={store.id}>
                                {store.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={handleMarkAsDefective}
                          disabled={loading}
                          className="w-full py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-md"
                        >
                          {loading ? 'Processing...' : 'Mark as Defective'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Customer Return
                      </h3>
                      
                      {/* Customer Returns Form - keeping existing code */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Return to Store (Required)
                          </label>
                          <select
                            value={storeForReturn}
                            onChange={(e) => setStoreForReturn(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Select store first...</option>
                            {stores.map(store => (
                              <option key={store.id} value={store.id}>
                                {store.name}
                              </option>
                            ))}
                          </select>
                          {!storeForReturn && (
                            <p className="mt-1 text-xs text-red-500">
                              Please select a store before searching
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Return Reason (Required)
                          </label>
                          <textarea
                            value={customerReturnReason}
                            onChange={(e) => setCustomerReturnReason(e.target.value)}
                            placeholder="Enter customer return reason..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Return Image
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleReturnImageChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Search Type
                          </label>
                          <div className="flex gap-2 mb-2">
                            <button
                              onClick={() => {
                                setSearchType('phone');
                                setSearchValue('');
                                setCustomerOrders([]);
                              }}
                              className={`flex-1 py-2 px-3 border rounded text-sm font-medium ${
                                searchType === 'phone'
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              Phone Number
                            </button>
                            <button
                              onClick={() => {
                                setSearchType('orderId');
                                setSearchValue('');
                                setCustomerOrders([]);
                              }}
                              className={`flex-1 py-2 px-3 border rounded text-sm font-medium ${
                                searchType === 'orderId'
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              Order/Sale ID
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {searchType === 'phone' ? 'Customer Phone Number' : 'Order/Sale ID'}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={searchValue}
                              onChange={(e) => setSearchValue(e.target.value)}
                              placeholder={searchType === 'phone' ? '018...' : 'Enter order ID...'}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              disabled={!storeForReturn}
                            />
                            <button
                              onClick={handleSearchCustomer}
                              disabled={!storeForReturn}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md"
                            >
                              <Search className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {customerOrders.length > 0 && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Order
                              </label>
                              <select
                                value={selectedOrder}
                                onChange={(e) => handleOrderSelect(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="">Select order...</option>
                                {customerOrders.map(order => {
                                  const name = order.customerName || order.customer?.name || 'Unknown';
                                  const total = order.total || order.amounts?.total || 0;
                                  return (
                                    <option key={order.id} value={order.id}>
                                      Order #{order.id} - {name} (৳{total})
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            {selectedOrder && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Order Details
                                  </label>
                                  {(() => {
                                    const order = customerOrders.find(o => o.id.toString() === selectedOrder);
                                    if (!order) return null;
                                    return (
                                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md text-sm space-y-1">
                                        <p className="text-gray-900 dark:text-white">
                                          <span className="font-medium">Customer:</span> {order.customerName || order.customer?.name}
                                        </p>
                                        <p className="text-gray-900 dark:text-white">
                                          <span className="font-medium">Phone:</span> {order.customerPhone || order.customer?.phone}
                                        </p>
                                        <p className="text-gray-900 dark:text-white">
                                          <span className="font-medium">Total:</span> ৳{order.total || order.amounts?.total}
                                        </p>
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Products & Barcodes ({selectedBarcodes.length} selected)
                                  </label>
                                  <div className="border border-gray-300 dark:border-gray-600 rounded-md max-h-64 overflow-y-auto">
                                    {customerOrders
                                      .find(o => o.id.toString() === selectedOrder)
                                      ?.products.map((product, idx) => (
                                        <div key={idx} className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                          <div className="mb-2">
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                                              {product.productName}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                              Qty: {product.qty} × ৳{product.price} = ৳{(product.qty * product.price).toFixed(2)}
                                            </p>
                                          </div>
                                          <div className="space-y-1">
                                            {product.barcodes && product.barcodes.length > 0 ? (
                                              product.barcodes.map((barcode, bIdx) => (
                                                <label
                                                  key={bIdx}
                                                  className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={selectedBarcodes.includes(barcode)}
                                                    onChange={() => handleBarcodeToggle(barcode)}
                                                    className="w-4 h-4"
                                                  />
                                                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                    {barcode}
                                                  </span>
                                                </label>
                                              ))
                                            ) : (
                                              <p className="text-xs text-red-500 italic p-2">
                                                No barcodes available for this product
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>

                                <button
                                  onClick={handleProcessReturn}
                                  disabled={loading || selectedBarcodes.length === 0}
                                  className="w-full py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-md"
                                >
                                  {loading ? 'Processing...' : `Return ${selectedBarcodes.length} Item(s) to ${stores.find(s => s.id === storeForReturn)?.name}`}
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Right Panel - Defects List with Expandable Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Pending Defects */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Defective Items ({pendingDefects.length})
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedStore === 'all' ? 'All stores' : stores.find(s => s.id === selectedStore)?.name}
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {pendingDefects.length === 0 ? (
                        <div className="p-8 text-center">
                          <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-500 dark:text-gray-400">No defective items found</p>
                        </div>
                      ) : (
                        pendingDefects.map((defect) => (
                          <div key={defect.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            {/* Main Row */}
                            <div className="px-4 py-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                      {defect.productName}
                                    </h4>
                                    {defect.returnReason && (
                                      <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                                        Return
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <Barcode className="w-3 h-3" />
                                      {defect.barcode}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {defect.store || 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(defect.addedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleDefectDetails(defect.id)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                    title="Toggle details"
                                  >
                                    {expandedDefect === defect.id ? (
                                      <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleSellClick(defect)}
                                    className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                    title="Sell"
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRemove(defect.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Remove"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedDefect === defect.id && (
                              <div className="px-4 pb-4 pt-2 bg-gray-50 dark:bg-gray-900/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Left: Image */}
                                  {defect.image ? (
                                    <div className="space-y-2">
                                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                        <ImageIcon className="w-3 h-3" />
                                        Defect Image
                                      </h5>
                                      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                        <img
                                          src={defect.image}
                                          alt="Defect"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg">
                                      <div className="text-center">
                                        <ImageIcon className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                                        <p className="text-xs text-gray-500">No image available</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Right: Details */}
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <p className="text-gray-500 dark:text-gray-400 mb-0.5">Product ID</p>
                                        <p className="text-gray-900 dark:text-white font-medium">#{defect.productId}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500 dark:text-gray-400 mb-0.5">Added By</p>
                                        <p className="text-gray-900 dark:text-white font-medium">{defect.addedBy}</p>
                                      </div>
                                    </div>

                                    {defect.returnReason && (
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                          <FileText className="w-3 h-3" />
                                          Return Reason
                                        </p>
                                        <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                                          {defect.returnReason}
                                        </p>
                                      </div>
                                    )}

                                    {defect.customerPhone && (
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                          <Phone className="w-3 h-3" />
                                          Customer Phone
                                        </p>
                                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                                          {defect.customerPhone}
                                        </p>
                                      </div>
                                    )}

                                    {defect.originalOrderId && (
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original Order ID</p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                          #{defect.originalOrderId}
                                        </p>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                      {defect.costPrice && (
                                        <div>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Cost Price</p>
                                          <p className="text-sm text-gray-900 dark:text-white font-medium">
                                            ৳{defect.costPrice.toFixed(2)}
                                          </p>
                                        </div>
                                      )}
                                      {defect.originalSellingPrice && (
                                        <div>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Original Price</p>
                                          <p className="text-sm text-gray-900 dark:text-white font-medium">
                                            ৳{defect.originalSellingPrice.toFixed(2)}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Sold Defects */}
                  {soldDefects.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Sold Defective Items ({soldDefects.length})
                        </h3>
                      </div>

                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {soldDefects.map((defect) => (
                          <div key={defect.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            {/* Main Row */}
                            <div className="px-4 py-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                      {defect.productName}
                                    </h4>
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                                      Sold
                                    </span>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <Barcode className="w-3 h-3" />
                                      {defect.barcode}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {defect.store || 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      ৳{defect.sellingPrice?.toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => toggleDefectDetails(defect.id)}
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                  title="Toggle details"
                                >
                                  {expandedDefect === defect.id ? (
                                    <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Expanded Details for Sold Items */}
                            {expandedDefect === defect.id && (
                              <div className="px-4 pb-4 pt-2 bg-gray-50 dark:bg-gray-900/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Image */}
                                  {defect.image ? (
                                    <div className="space-y-2">
                                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                        <ImageIcon className="w-3 h-3" />
                                        Defect Image
                                      </h5>
                                      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                        <img
                                          src={defect.image}
                                          alt="Defect"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg">
                                      <div className="text-center">
                                        <ImageIcon className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                                        <p className="text-xs text-gray-500">No image available</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Details */}
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <p className="text-gray-500 dark:text-gray-400 mb-0.5">Product ID</p>
                                        <p className="text-gray-900 dark:text-white font-medium">#{defect.productId}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500 dark:text-gray-400 mb-0.5">Sold Price</p>
                                        <p className="text-green-600 dark:text-green-400 font-bold">
                                          ৳{defect.sellingPrice?.toFixed(2) || '0.00'}
                                        </p>
                                      </div>
                                    </div>

                                    {defect.returnReason && (
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                          <FileText className="w-3 h-3" />
                                          Return Reason
                                        </p>
                                        <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                                          {defect.returnReason}
                                        </p>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Added</p>
                                        <p className="text-xs text-gray-900 dark:text-white">
                                          {new Date(defect.addedAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      {defect.originalSellingPrice && (
                                        <div>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Original Price</p>
                                          <p className="text-xs text-gray-900 dark:text-white">
                                            ৳{defect.originalSellingPrice.toFixed(2)}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Sell Modal */}
      {selectedDefect && (
        <SellDefectModal
          isOpen={sellModalOpen}
          onClose={() => setSellModalOpen(false)}
          defect={selectedDefect}
          sellPrice={sellPrice}
          setSellPrice={setSellPrice}
          sellType={sellType}
          setSellType={setSellType}
          onSell={handleSell}
          loading={loading}
        />
      )}
    </div>
  );
}