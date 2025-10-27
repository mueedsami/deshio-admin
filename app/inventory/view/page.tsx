'use client';

import { useState, useEffect } from 'react';
import { Search, Package, ChevronDown, ChevronUp } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

interface ProductAttribute {
  Color?: string;
  Image?: string;
  mainImage?: string;
  category?: string;
  subcategory?: string;
  size?: string;
  [key: string]: any;
}

interface Product {
  id: number;
  name: string;
  attributes: ProductAttribute;
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

interface Category {
  id: string | number;
  title?: string;
  name?: string;
  slug?: string;
  subcategories?: Category[];
}
interface GroupedInventory {
  product: Product;
  category: string;
  totalStock: number;
  outlets: {
    [outlet: string]: {
      available: number;
      damaged: number;
      inTransit: number;
    };
  };
  expanded: boolean;
}
const getCategoryPath = (
  attributes: Record<string, any>,
  categories: Category[]
): string => {
  const catId =
    attributes?.category ??
    attributes?.categoryId ??
    attributes?.category_id;
  const subId =
    attributes?.subcategory ??
    attributes?.subCategory ??
    attributes?.sub_category;

  if (!catId && !subId) return '-';

  if (Array.isArray(categories) && categories.length > 0) {
    const top = categories.find(
      (c) =>
        String(c.id) === String(catId) || String(c.slug) === String(catId)
    );
    const topName = top
      ? top.title ?? top.name ?? top.slug ?? String(top.id)
      : null;

    let subName: string | null = null;
    if (top && Array.isArray(top.subcategories) && subId) {
      const sub = top.subcategories.find(
        (s) =>
          String(s.id) === String(subId) ||
          String(s.slug) === String(subId) ||
          String(s.title) === String(subId)
      );
      subName = sub
        ? sub.title ?? sub.name ?? sub.slug ?? String(sub.id)
        : null;
    }

    if (topName && subName) return `${topName} / ${subName}`;
    if (topName) return topName;
    if (subName) return subName;
  }

  if (catId && subId) return `Category ${catId} / Subcategory ${subId}`;
  if (catId) return String(catId);
  return '-';
};


export default function ViewInventoryPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groupedInventory, setGroupedInventory] = useState<GroupedInventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch products
      const productsResponse = await fetch('/api/products');
      const productsData = productsResponse.ok ? await productsResponse.json() : [];

      // Fetch inventory
      const inventoryResponse = await fetch('/api/inventory');
      const inventoryData = inventoryResponse.ok ? await inventoryResponse.json() : [];

      // Fetch categories
      const categoriesResponse = await fetch('/api/categories');
      const categoriesData = categoriesResponse.ok ? await categoriesResponse.json() : [];

      setProducts(productsData);
      setInventory(inventoryData);
      setCategories(categoriesData);

      // Group inventory by product
      const grouped = groupInventoryByProduct(productsData, inventoryData, categoriesData);
      setGroupedInventory(grouped);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupInventoryByProduct = (
    products: Product[],
    inventory: InventoryItem[],
    categories: Category[]
  ): GroupedInventory[] => {
    const grouped: { [productId: number]: GroupedInventory } = {};

    products.forEach((product) => {
  // Get category name (category may be stored as a string in attributes)
  const categoryPath = getCategoryPath(product.attributes, categories);

      // Get all inventory items for this product
      const productInventory = inventory.filter(item => item.productId === product.id);

      // Group by outlet
      const outlets: { [outlet: string]: { available: number; damaged: number; inTransit: number } } = {};
      
      productInventory.forEach(item => {
        const outlet = item.location;
        if (!outlets[outlet]) {
          outlets[outlet] = { available: 0, damaged: 0, inTransit: 0 };
        }

        if (item.status === 'available') {
          outlets[outlet].available++;
        } else if (item.status === 'damaged') {
          outlets[outlet].damaged++;
        } else if (item.status === 'in-transit') {
          outlets[outlet].inTransit++;
        }
      });

      // Calculate total stock
      const totalStock = productInventory.filter(item => item.status === 'available').length;

      grouped[product.id] = {
        product,
        category: categoryPath,
        totalStock,
        outlets,
        expanded: false
      };
    });

    return Object.values(grouped);
  };

  const toggleExpand = (productId: number) => {
    setGroupedInventory(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, expanded: !item.expanded } : item
      )
    );
  };

  const filteredInventory = groupedInventory.filter(item =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductImage = (product: Product) => {
    return product.attributes.mainImage || product.attributes.Image || '/placeholder-product.png';
  };

  if (loading) {
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
              <p className="text-gray-500 dark:text-gray-400">Loading inventory...</p>
            </main>
          </div>
        </div>
      </div>
    );
  }

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
            {/* Header Section */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Inventory Overview
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View all products and their stock levels across outlets
              </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter product name or category"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Inventory List */}
            <div className="space-y-4">
              {filteredInventory.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No inventory items found
                  </p>
                </div>
              ) : (
                filteredInventory.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    {/* Product Header */}
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={getProductImage(item.product)}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-product.png';
                            }}
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {item.product.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Category:</span>
                              <span>{item.category}</span>
                            </span>
                            {item.product.attributes.Color && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium">Color:</span>
                                <span>{item.product.attributes.Color}</span>
                              </span>
                            )}
                            {item.product.attributes.size && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium">Size:</span>
                                <span>{item.product.attributes.size}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stock Summary */}
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Available Stock</p>
                            <p className="text-2xl font-semi-bold text-gray-900 dark:text-white">
                              {item.totalStock}
                            </p>
                          </div>

                          <button
                            onClick={() => toggleExpand(item.product.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            {item.expanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Outlet Details */}
                    {item.expanded && Object.keys(item.outlets).length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <div className="p-4">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Stock by Outlet
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">
                                    Outlet
                                  </th>
                                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">
                                    Available
                                  </th>
                                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">
                                    In Transit
                                  </th>
                                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">
                                    Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(item.outlets).map(([outlet, stock]) => (
                                  <tr
                                    key={outlet}
                                    className="border-b border-gray-200 dark:border-gray-700 last:border-0"
                                  >
                                    <td className="py-2 px-3 text-sm text-gray-900 dark:text-white font-medium">
                                      {outlet}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                                        {stock.available}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                                        {stock.inTransit}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                      {stock.available + stock.damaged + stock.inTransit}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}