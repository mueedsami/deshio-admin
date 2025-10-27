'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ProductTable from '@/components/ProductTable';

interface Field {
  id: number;
  name: string;
  type: string;
}

interface Product {
  id: number | string;
  name: string;
  image?: string;
  attributes: Record<string, any>;
}

interface Category {
  id: string | number;
  title?: string;
  name?: string;
  slug?: string;
  subcategories?: Category[];
}

export default function ProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectMode = searchParams.get('selectMode') === 'true';
  const redirectPath = searchParams.get('redirect') || '';
  
  const [darkMode, setDarkMode] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 6;

  // Fetch products, fields, categories
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fieldRes, productRes, categoryRes] = await Promise.all([
          fetch('/api/fields'),
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);

        const fieldData = await fieldRes.json();
        const productData = await productRes.json();
        const categoryData = await categoryRes.json();

        setFields(Array.isArray(fieldData) ? fieldData : []);
        setProducts(Array.isArray(productData) ? productData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (err) {
        console.error('Error fetching:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper function to get category path array from product attributes
  const getCategoryPathFromProduct = (product: Product): string[] => {
    const attrs = product.attributes || {};
    
    // Check new format first (if it exists)
    if (attrs.categoryPath && Array.isArray(attrs.categoryPath)) {
      return attrs.categoryPath;
    }
    
    // Check old format
    const path: string[] = [];
    if (attrs.category) path.push(String(attrs.category));
    if (attrs.subcategory) path.push(String(attrs.subcategory));
    if (attrs.subSubcategory) path.push(String(attrs.subSubcategory));
    
    // Check for additional levels (level3, level4, level5, etc.)
    let level = 3;
    while (attrs[`level${level}`]) {
      path.push(String(attrs[`level${level}`]));
      level++;
    }
    
    // Filter out empty strings
    return path.filter(id => id && id !== '');
  };

  // Helper function to get full category display name
  const getCategoryDisplayName = (product: Product): string => {
    const path = getCategoryPathFromProduct(product);
    if (path.length === 0) return 'Uncategorized';
    
    const names: string[] = [];
    let current: Category[] = categories;
    
    for (let i = 0; i < path.length; i++) {
      const id = path[i];
      const cat = current.find(c => String(c.id) === String(id));
      
      if (cat) {
        names.push(cat.title || cat.name || String(cat.id));
        current = cat.subcategories || [];
      } else {
        names.push(`Unknown (${id})`);
        break;
      }
    }
    
    return names.length > 0 ? names.join(' / ') : 'Uncategorized';
  };

  // Filtered products (just filter, don't group yet)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const categoryMatch = getCategoryDisplayName(p).toLowerCase().includes(q);
      return nameMatch || categoryMatch;
    });
  }, [products, searchQuery, categories]);

  // Pagination on filtered products
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginated = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CRUD
  const handleDelete = async (id: string | number) => {
    if (!confirm('Delete this product?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  const handleEdit = (product: Product) => {
    router.push(`/product/add?id=${product.id}`);
  };

  const handleAdd = () => router.push('/product/add');

  const handleSelect = (product: Product) => {
    if (selectMode && redirectPath) {
      const url = `${redirectPath}?productId=${product.id}&productName=${encodeURIComponent(product.name)}`;
      router.push(url);
    }
  };

  const handleSelectVariation = (
    product: Product,
    variation: { id: string | number; attributes: Record<string, any> }
  ) => {
    if (selectMode && redirectPath) {
      // Find the actual product by variation id
      const variationProduct = products.find(p => String(p.id) === String(variation.id));
      if (variationProduct) {
        const url = `${redirectPath}?productId=${variation.id}&productName=${encodeURIComponent(variationProduct.name)}`;
        router.push(url);
      }
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />

          <main className="flex-1 overflow-auto p-6">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                    {selectMode ? 'Select a Product' : 'Products'}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectMode 
                      ? 'Choose a product to add to your batch operation' 
                      : "Manage and organize your store's products efficiently."}
                  </p>
                </div>
                {!selectMode && (
                  <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name or category..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500"
                />
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No products found matching your search.' : 'No products found.'}
              </div>
            ) : (
              <ProductTable
                products={paginated}
                fields={fields}
                categories={categories}
                getCategoryDisplayName={getCategoryDisplayName}
                onDelete={handleDelete}
                onEdit={handleEdit}
                {...(selectMode && { 
                  onSelect: handleSelect,
                  onSelectVariation: handleSelectVariation 
                })}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-10 w-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors text-gray-900 dark:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-10 w-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors text-gray-900 dark:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}