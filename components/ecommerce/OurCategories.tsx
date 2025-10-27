'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string | number;
  name: string;
  attributes: {
    mainImage?: string;
    category?: string;
    subcategory?: string;
    [key: string]: string | undefined;
  };
}

interface InventoryItem {
  productId: string | number;
  status: string;
}

interface CategoryData {
  id: string;
  title: string;
  slug: string;
  image: string;
  available: number;
}

export default function OurCategories() {
  const [categories, setCategoriesData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesRes = await fetch('/api/categories');
        const categoriesData = await categoriesRes.json();

        // Fetch products
        const productsRes = await fetch('/api/products');
        const products: Product[] = await productsRes.json();

        // Fetch inventory
        const inventoryRes = await fetch('/api/inventory');
        const inventory: InventoryItem[] = await inventoryRes.json();

        // Flatten all categories and subcategories
        const allCategories: CategoryData[] = [];

        const flattenCategories = (cats: any[]) => {
          cats.forEach(cat => {
            allCategories.push({
              id: cat.id,
              title: cat.title,
              slug: cat.slug,
              image: cat.image,
              available: 0,
            });

            if (cat.subcategories && cat.subcategories.length > 0) {
              flattenCategories(cat.subcategories);
            }
          });
        };

        flattenCategories(categoriesData);

        // Calculate available stock for each category
        const categoriesWithStock = allCategories.map(cat => {
          const categoryProducts = products.filter(
            p => p.attributes.category === cat.id || p.attributes.subcategory === cat.id
          );

          const available = categoryProducts.reduce((total, product) => {
            const productInventory = inventory.filter(
              item => item.productId === product.id || item.productId === Number(product.id)
            );
            return total + productInventory.filter(item => item.status === 'available').length;
          }, 0);

          return { ...cat, available };
        });

        setCategoriesData(categoriesWithStock);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">Loading categories...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Categories</h2>
          <p className="text-lg text-gray-600">Browse through our curated collections</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className="group text-center cursor-pointer"
              onClick={() => router.push(`/e-commerce/${cat.slug}`)}
            >
              {/* Category Image */}
              <div className="relative aspect-square rounded-full overflow-hidden mb-5 border-4 border-gray-100 group-hover:border-red-700 transition-all duration-300 shadow-lg group-hover:shadow-2xl">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="18"%3E' +
                      encodeURIComponent(cat.title) +
                      '%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
              </div>

              {/* Category Info */}
              <h3 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-red-700 transition-colors">
                {cat.title}
              </h3>
              <p className="text-sm text-gray-500">{cat.available} Products</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}