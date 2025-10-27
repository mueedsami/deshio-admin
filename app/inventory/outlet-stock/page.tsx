'use client';

import { useState, useEffect } from 'react';
import { Phone, Package, Search, X, Scan, CheckCircle2, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useSearchParams } from 'next/navigation';

interface Product {
  productId: number;
  productName: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
}

interface InventoryItem {
  id: number;
  productId: number;
  batchId: number;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  location: string;
  status: string;
  admittedAt: string;
  createdAt: string;
}

interface Store {
  id: string;
  name: string;
  location: string;
  contact: string;
  totalStock: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function OutletManageStockPage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('storeId');
  
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [destinationOutlet, setDestinationOutlet] = useState('');
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [upcomingProducts, setUpcomingProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Map<number, number>>(new Map());
  const [stores, setStores] = useState<Store[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [admittingBarcode, setAdmittingBarcode] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferScannerActive, setTransferScannerActive] = useState(true);
  const [transferBarcodeInput, setTransferBarcodeInput] = useState('');
  const [scannedTransferItems, setScannedTransferItems] = useState<string[]>([]);
  const [lastTransferScannedCode, setLastTransferScannedCode] = useState('');

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch('/api/stores');
        if (response.ok) {
          const data = await response.json();
          setStores(data);
          const foundStore = data.find((s: any) => s.id == storeId);
          if (foundStore) {
            setStore({
              id: foundStore.id,
              name: foundStore.name,
              location: foundStore.location,
              contact: foundStore.contact || '01764257445',
              totalStock: foundStore.products || 99
            });
          } else {
            setStore({
              id: storeId || '0',
              name: 'Store Name',
              location: 'Location',
              contact: '01764257445',
              totalStock: 99
            });
          }
        } else {
          setStore({
            id: storeId || '0',
            name: 'Store Name',
            location: 'Location',
            contact: '01764257445',
            totalStock: 99
          });
        }
      } catch (error) {
        console.error('Error fetching store:', error);
        setStore({
          id: storeId || '0',
          name: 'Store Name',
          location: 'Location',
          contact: '01764257445',
          totalStock: 99
        });
      }
    };

    if (storeId) {
      fetchStore();
    } else {
      setStore({
        id: '0',
        name: 'Store Name',
        location: 'Location',
        contact: '01764257445',
        totalStock: 99
      });
    }
  }, [storeId]);

  useEffect(() => {
    if (store) {
      const fetchProducts = async () => {
        try {
          const inventoryResponse = await fetch('/api/inventory');
          if (!inventoryResponse.ok) {
            console.error('Failed to fetch inventory');
            return;
          }
          const inventoryData: InventoryItem[] = await inventoryResponse.json();
          
          const productsResponse = await fetch('/api/products');
          let productsData: any[] = [];
          if (productsResponse.ok) {
            productsData = await productsResponse.json();
            setAllProducts(productsData);
          }
          
          const batchResponse = await fetch('/api/batch');
          let batchData: any[] = [];
          if (batchResponse.ok) {
            batchData = await batchResponse.json();
          }
          
          const storeInventory = inventoryData.filter(
            (item) => item.location === store.name && item.status === 'available'
          );
          
          // Use a Map with composite key: productId + costPrice + sellingPrice
          const productMap = new Map<string, Product>();
          
          storeInventory.forEach((item) => {
            const batchInfo = batchData.find(b => b.id === item.batchId);
            const costPrice = batchInfo ? batchInfo.costPrice : item.costPrice;
            const sellingPrice = batchInfo ? batchInfo.sellingPrice : item.sellingPrice;
            
            // Create composite key to differentiate products with different prices
            const compositeKey = `${item.productId}-${costPrice}-${sellingPrice}`;
            
            if (productMap.has(compositeKey)) {
              const existing = productMap.get(compositeKey)!;
              existing.quantity += 1;
            } else {
              const productInfo = productsData.find(p => p.id === item.productId);
              const productName = productInfo ? productInfo.name : `Product #${item.productId}`;
              
              productMap.set(compositeKey, {
                productId: item.productId,
                productName,
                costPrice,
                sellingPrice,
                quantity: 1
              });
            }
          });
          
          const groupedProducts = Array.from(productMap.values());
          setProducts(groupedProducts);
          
          setStore({
            ...store,
            totalStock: storeInventory.length
          });
        } catch (error) {
          console.error('Error fetching products:', error);
        }
      };

      fetchProducts();
    }
  }, [store?.name]);

  // Barcode Scanner Logic for Transfer Modal
  useEffect(() => {
    if (!transferScannerActive || !showTransferModal) return;

    let barcode = '';
    let barcodeTimeout: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        
        if (barcode.trim()) {
          const scannedCode = barcode.trim();
          setLastTransferScannedCode(scannedCode);
          setTransferBarcodeInput(scannedCode);
          barcode = '';
          
          handleAddTransferBarcode(scannedCode);
        }
        return;
      }

      if (e.key.length > 1) return;

      barcode += e.key;

      clearTimeout(barcodeTimeout);
      barcodeTimeout = setTimeout(() => {
        barcode = '';
      }, 100);
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(barcodeTimeout);
    };
  }, [transferScannerActive, showTransferModal, scannedTransferItems]);

  // Barcode Scanner Logic for Upcoming Products Modal
  useEffect(() => {
    if (!scannerActive || !showUpcomingModal) return;

    let barcode = '';
    let barcodeTimeout: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        
        if (barcode.trim()) {
          const scannedCode = barcode.trim();
          setLastScannedCode(scannedCode);
          setBarcodeInput(scannedCode);
          barcode = '';
          
          handleBarcodeAdmit(scannedCode);
        }
        return;
      }

      if (e.key.length > 1) return;

      barcode += e.key;

      clearTimeout(barcodeTimeout);
      barcodeTimeout = setTimeout(() => {
        barcode = '';
      }, 100);
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(barcodeTimeout);
    };
  }, [scannerActive, showUpcomingModal, upcomingProducts, store]);

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShowUpcoming = () => {
    setShowUpcomingModal(true);
    fetchUpcomingStock();
  };

  const fetchUpcomingStock = async () => {
    try {
      const response = await fetch(`/api/inventory-dispatch?toStore=${encodeURIComponent(store?.name || '')}&status=in-transit`);
      if (response.ok) {
        const dispatches = await response.json();
        
        const productsResponse = await fetch('/api/products');
        let productsData: any[] = [];
        if (productsResponse.ok) {
          productsData = await productsResponse.json();
        }
        
        const enrichedDispatches = dispatches.map((dispatch: any) => {
          const product = productsData.find(p => p.id === dispatch.productId);
          return {
            ...dispatch,
            productName: product ? product.name : `Product #${dispatch.productId}`
          };
        });
        
        setUpcomingProducts(enrichedDispatches);
        
        if (enrichedDispatches.length > 0 && !showUpcomingModal) {
          setScannerActive(true);
        }
      }
    } catch (error) {
      console.error('Error fetching upcoming stock:', error);
    }
  };

  const handleAddTransferBarcode = (code?: string) => {
    const barcodeToAdd = code || transferBarcodeInput.trim();
    
    if (!barcodeToAdd) {
      showToast('Barcode is required', 'error');
      return;
    }

    if (scannedTransferItems.includes(barcodeToAdd)) {
      showToast('This item has already been scanned', 'error');
      setTransferBarcodeInput('');
      return;
    }

    fetch('/api/inventory')
      .then(res => res.json())
      .then((inventoryData: InventoryItem[]) => {
        const item = inventoryData.find(
          inv => inv.barcode === barcodeToAdd && 
                 inv.location === store?.name && 
                 inv.status === 'available'
        );

        if (!item) {
          showToast(`Barcode ${barcodeToAdd} not found in available inventory`, 'error');
          setTransferBarcodeInput('');
          return;
        }

        setScannedTransferItems(prev => [...prev, barcodeToAdd]);
        showToast(`Added ${barcodeToAdd} to transfer list`, 'success');
        setTransferBarcodeInput('');
      })
      .catch(error => {
        console.error('Error verifying barcode:', error);
        showToast('Failed to verify barcode', 'error');
      });
  };

  const handleRemoveTransferBarcode = (barcode: string) => {
    setScannedTransferItems(prev => prev.filter(b => b !== barcode));
    showToast(`Removed ${barcode} from transfer list`, 'success');
  };

  const handleBarcodeAdmit = async (code?: string) => {
    const barcodeToAdmit = code || barcodeInput.trim();
    
    if (!barcodeToAdmit || !store) {
      showToast('Barcode is required', 'error');
      return;
    }

    setAdmittingBarcode(true);

    try {
      const dispatchItem = upcomingProducts.find(item => item.barcode === barcodeToAdmit);
      
      if (!dispatchItem) {
        showToast(`Barcode ${barcodeToAdmit} not found in upcoming stock for this store`, 'error');
        setAdmittingBarcode(false);
        setBarcodeInput('');
        return;
      }

      const inventoryEntry = {
        id: dispatchItem.inventoryId,
        productId: dispatchItem.productId,
        batchId: dispatchItem.batchId,
        barcode: dispatchItem.barcode,
        costPrice: dispatchItem.costPrice || 0,
        sellingPrice: dispatchItem.sellingPrice || 0,
        location: store.name,
        status: 'available',
        admittedAt: new Date().toISOString(),
        createdAt: dispatchItem.createdAt
      };

      const inventoryResponse = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inventoryEntry)
      });

      if (!inventoryResponse.ok) {
        throw new Error('Failed to update inventory');
      }

      const dispatchUpdateResponse = await fetch('/api/inventory-dispatch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dispatchItem.id,
          status: 'completed',
          receivedAt: new Date().toISOString()
        })
      });

      if (!dispatchUpdateResponse.ok) {
        throw new Error('Failed to update dispatch record');
      }

      showToast(`Successfully admitted ${dispatchItem.productName} to inventory`, 'success');
      
      setBarcodeInput('');
      fetchUpcomingStock();
      
    } catch (error) {
      console.error('Error admitting barcode:', error);
      showToast('Failed to admit product. Please try again.', 'error');
    } finally {
      setAdmittingBarcode(false);
    }
  };

  const handleQuantityChange = (productId: number, quantity: number | string) => {
    const newSelected = new Map(selectedProducts);
    const parsedQuantity = parseInt(quantity as string) || 0; // Handle empty input as 0
    if (parsedQuantity >= 0 && parsedQuantity <= products.find(p => p.productId === productId)!.quantity) {
      newSelected.set(productId, parsedQuantity);
    } else if (parsedQuantity < 0) {
      newSelected.delete(productId); // Optional: Remove if quantity is negative
    }
    setSelectedProducts(newSelected);
  };

const handleTransfer = async () => {
  if (!destinationOutlet) {
    showToast('Please select a destination outlet', 'error');
    return;
  }

  const hasScannedItems = scannedTransferItems.length > 0;
  const validSelectedProducts = Array.from(selectedProducts.entries()).filter(
    ([_, quantity]) => quantity > 0
  );
  const hasSelectedProducts = validSelectedProducts.length > 0;

  if (!hasScannedItems && !hasSelectedProducts) {
    showToast('Please scan items or select products with valid quantities to transfer', 'error');
    return;
  }

  setIsTransferring(true);

  try {
    const inventoryResponse = await fetch('/api/inventory');
    if (!inventoryResponse.ok) throw new Error('Failed to fetch inventory');
    const inventoryData: InventoryItem[] = await inventoryResponse.json();

    const destinationStore = stores.find(s => s.id == destinationOutlet);
    if (!destinationStore) throw new Error('Destination store not found');

    const dispatchRecords = [];
    const inventoryUpdates = [];

    if (hasScannedItems) {
      // ... (existing code for scanned items)
    }

    if (hasSelectedProducts) {
      for (const [productId, quantity] of validSelectedProducts) {
        const availableItems = inventoryData.filter(
          item => item.productId === productId && 
                  item.location === store?.name && 
                  item.status === 'available'
        ).slice(0, quantity);

        if (availableItems.length < quantity) {
          showToast(`Not enough stock for product ${productId}. Available: ${availableItems.length}, Requested: ${quantity}`, 'error');
          setIsTransferring(false);
          return;
        }

        for (const item of availableItems) {
          dispatchRecords.push({
            id: Date.now() + Math.random(),
            inventoryId: item.id,
            productId: item.productId,
            batchId: item.batchId,
            barcode: item.barcode,
            costPrice: item.costPrice,
            sellingPrice: item.sellingPrice,
            fromStore: store?.name,
            fromStoreId: store?.id,
            fromLocation: store?.location,
            toStore: destinationStore.name,
            toStoreTo: destinationStore.id,
            toLocation: destinationStore.location,
            status: 'in-transit',
            dispatchedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });

          inventoryUpdates.push({
            ...item,
            status: 'in-transit',
            location: `In Transit to ${destinationStore.name}`
          });
        }
      }
    }

    const dispatchResponse = await fetch('/api/inventory-dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dispatchRecords)
    });

    if (!dispatchResponse.ok) throw new Error('Failed to create dispatch records');

    for (const update of inventoryUpdates) {
      await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      });
    }

    showToast(`Successfully dispatched ${inventoryUpdates.length} items to ${destinationStore.name}`, 'success');
    
    setSelectedProducts(new Map());
    setScannedTransferItems([]);
    setDestinationOutlet('');
    setShowTransferModal(false);
    
    window.location.reload();
  } catch (error) {
    console.error('Transfer error:', error);
    showToast('Failed to transfer stock. Please try again.', 'error');
  } finally {
    setIsTransferring(false);
  }
};

  if (!store) {
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
            <main className="flex-1 overflow-auto p-6 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading store details...</p>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-[60] space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                toast.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              } animate-slideIn`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              )}
              <p className={`text-sm font-medium ${
                toast.type === 'success'
                  ? 'text-green-900 dark:text-green-300'
                  : 'text-red-900 dark:text-red-300'
              }`}>
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className={`ml-2 ${
                  toast.type === 'success'
                    ? 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                    : 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">Contact</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {store.contact}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Package className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Stock</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {store.totalStock}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Transfer Stock
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Transfer inventory from this outlet to another location
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Scan className="w-4 h-4" />
                    Scan to Transfer
                  </button>
                  <button
                    onClick={handleShowUpcoming}
                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    Upcoming Quantity
                  </button>
                </div>
              </div>

              <select
                value={destinationOutlet}
                onChange={(e) => setDestinationOutlet(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500"
              >
                <option value="">Select destination outlet</option>
                {stores
                  .filter(s => s.id != storeId)
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.location}
                    </option>
                  ))}
              </select>

              {(selectedProducts.size > 0 || scannedTransferItems.length > 0) && destinationOutlet && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleTransfer}
                    disabled={isTransferring}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {isTransferring ? 'Transferring...' : `Transfer ${scannedTransferItems.length + Array.from(selectedProducts.values()).reduce((a, b) => a + b, 0)} Items`}
                  </button>
                </div>
              )}

              {scannedTransferItems.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Scanned Items ({scannedTransferItems.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {scannedTransferItems.map((barcode, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                      >
                        <span className="text-sm font-mono text-gray-900 dark:text-white">{barcode}</span>
                        <button
                          onClick={() => handleRemoveTransferBarcode(barcode)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Filters
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Product Name (Press Enter to continue)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Current Inventory
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Stock levels at this outlet location
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Select
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Product Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Cost Price
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Selling Price
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Available Stock
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Quantity to Transfer
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No products found
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr
                          key={product.productId}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.productId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleQuantityChange(product.productId, 1); // Set default quantity to 1
                              } else {
                                handleQuantityChange(product.productId, 0); // Remove from selected
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            {product.productName}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            ${product.costPrice}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            ${product.sellingPrice}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            {product.quantity}
                          </td>
                          <td className="py-3 px-4">
                            {selectedProducts.has(product.productId) ? (
                              <input
                                type="number"
                                min="0"
                                max={product.quantity}
                                value={selectedProducts.get(product.productId) || ''}
                                onChange={(e) => handleQuantityChange(product.productId, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              />
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Upcoming Stock Modal */}
      {showUpcomingModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-20 dark:bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Upcoming Stock Information
                </h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setScannerActive(!scannerActive)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      scannerActive
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <Scan className={`w-4 h-4 ${
                      scannerActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`} />
                    <div className="text-left">
                      <div className={`text-xs font-semibold ${
                        scannerActive ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'
                      }`}>
                        Scanner
                      </div>
                      <div className={`text-xs ${
                        scannerActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {scannerActive ? 'Active' : 'Manual'}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      scannerActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`} />
                  </button>
                  <button
                    onClick={() => {
                      setShowUpcomingModal(false);
                      setBarcodeInput('');
                      setLastScannedCode('');
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {scannerActive ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="relative inline-block mb-4">
                      <Scan className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Barcode Scanner Active
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Scan barcode to admit products into inventory
                    </p>
                    {lastScannedCode && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last scanned: <span className="font-mono font-semibold">{lastScannedCode}</span>
                      </p>
                    )}
                  </div>

                  {upcomingProducts.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Expected Items ({upcomingProducts.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {upcomingProducts.map((product, index) => (
                          <div
                            key={index}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {product.productName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                                  {product.barcode}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  From: {product.fromStore}
                                </p>
                              </div>
                              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded">
                                In Transit
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {upcomingProducts.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No upcoming products found for this outlet.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Click the admit button next to each product to add it to inventory
                    </p>
                  </div>

                  {upcomingProducts.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Expected Items ({upcomingProducts.length})
                      </h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {upcomingProducts.map((product, index) => (
                          <div
                            key={index}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                                  {product.productName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-1">
                                  Barcode: {product.barcode}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  From: {product.fromStore}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded">
                                  In Transit
                                </span>
                                <button
                                  onClick={() => handleBarcodeAdmit(product.barcode)}
                                  disabled={admittingBarcode}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Admit
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No upcoming products found for this outlet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUpcomingModal(false);
                  setBarcodeInput('');
                  setLastScannedCode('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-20 dark:bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Scan Items to Transfer
                </h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setTransferScannerActive(!transferScannerActive)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      transferScannerActive
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <Scan className={`w-4 h-4 ${
                      transferScannerActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`} />
                    <div className="text-left">
                      <div className={`text-xs font-semibold ${
                        transferScannerActive ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'
                      }`}>
                        Scanner
                      </div>
                      <div className={`text-xs ${
                        transferScannerActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transferScannerActive ? 'Active' : 'Manual'}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      transferScannerActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`} />
                  </button>
                  <button
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferBarcodeInput('');
                      setLastTransferScannedCode('');
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {transferScannerActive ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="relative inline-block mb-4">
                      <Scan className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Barcode Scanner Active
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Scan barcodes to add items to transfer list
                    </p>
                    {lastTransferScannedCode && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last scanned: <span className="font-mono font-semibold">{lastTransferScannedCode}</span>
                      </p>
                    )}
                  </div>

                  {scannedTransferItems.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Scanned Items ({scannedTransferItems.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {scannedTransferItems.map((barcode, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                          >
                            <span className="text-sm font-mono text-gray-900 dark:text-white">{barcode}</span>
                            <button
                              onClick={() => handleRemoveTransferBarcode(barcode)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-600 dark:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {scannedTransferItems.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No items scanned yet. Start scanning to add items.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Enter barcode manually to add items to transfer list
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter Barcode
                      </label>
                      <input
                        type="text"
                        value={transferBarcodeInput}
                        onChange={(e) => setTransferBarcodeInput(e.target.value)}
                        placeholder="Type barcode here..."
                        autoFocus
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <button
                      onClick={() => handleAddTransferBarcode()}
                      disabled={!transferBarcodeInput.trim()}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Add to Transfer List
                    </button>
                  </div>

                  {scannedTransferItems.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Items to Transfer ({scannedTransferItems.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {scannedTransferItems.map((barcode, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                          >
                            <span className="text-sm font-mono text-gray-900 dark:text-white">{barcode}</span>
                            <button
                              onClick={() => handleRemoveTransferBarcode(barcode)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-600 dark:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {scannedTransferItems.length} items ready to transfer
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferBarcodeInput('');
                    setLastTransferScannedCode('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                  }}
                  disabled={scannedTransferItems.length === 0}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}