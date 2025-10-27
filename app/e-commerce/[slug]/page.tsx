'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/ecommerce/Navigation';
import Breadcrumb from '@/components/ecommerce/category/Breadcrumb';
import CategorySidebar from '@/components/ecommerce/category/CategorySidebar';
import ProductsToolbar from '@/components/ecommerce/category/ProductsToolbar';
import ProductsGrid from '@/components/ecommerce/category/ProductsGrid';

export default function CategoryProductsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [categoryInfo, setCategoryInfo] = useState<any>(null);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid-3' | 'grid-4' | 'grid-5'>('grid-4');

  // Extract base product name (removes color/size suffix)
  const getBaseName = (name: string): string => {
    // Remove color/size suffix like "Product-Blue-XL" -> "Product"
    const parts = name.split('-');
    return parts.length > 1 ? parts[0].trim() : name;
  };

  // Check if a product is a variation (has groupMainImage)
  const isVariation = (product: any): boolean => {
    return !!(product.attributes?.groupMainImage && 
              (product.attributes?.color || product.attributes?.size || product.attributes?.variationImages));
  };

  // Group products by groupMainImage or standalone
  const groupProductsByVariations = (productsWithInventory: any[]): any[] => {
    const grouped = new Map<string, any>();
    const standalone: any[] = [];

    productsWithInventory.forEach(product => {
      const groupKey = product.attributes?.groupMainImage;
      
      if (groupKey && isVariation(product)) {
        // This is a variation product - group by groupMainImage
        if (!grouped.has(groupKey)) {
          const baseName = getBaseName(product.name);
          grouped.set(groupKey, {
            baseId: groupKey,
            baseName,
            image: groupKey, // Use groupMainImage as the main image
            priceRange: product.price,
            totalAvailable: 0,
            variations: [],
            isVariationGroup: true
          });
        }

        const group = grouped.get(groupKey)!;
        group.variations.push({
          id: product.id,
          name: product.name,
          attributes: product.attributes || {},
          price: product.price,
          available: product.available,
          image: product.image
        });
        group.totalAvailable += product.available;
      } else {
        // Standalone product - no grouping
        standalone.push({
          baseId: `standalone-${product.id}`,
          baseName: product.name,
          image: product.image,
          priceRange: product.price,
          totalAvailable: product.available,
          variations: [{
            id: product.id,
            name: product.name,
            attributes: product.attributes || {},
            price: product.price,
            available: product.available,
            image: product.image
          }],
          isVariationGroup: false
        });
      }
    });

    // Calculate price range for each group
    grouped.forEach(group => {
      if (group.variations.length > 1) {
        const prices = group.variations.map((v: any) => parseFloat(v.price) || 0);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (minPrice === maxPrice) {
          group.priceRange = minPrice.toString();
        } else {
          group.priceRange = `${minPrice} - ${maxPrice}`;
        }
      } else {
        group.priceRange = group.variations[0].price;
      }
    });

    return [...Array.from(grouped.values()), ...standalone];
  };

  const getAllDescendantIds = (category: any): string[] => {
    let ids = [category.id];
    if (category.subcategories) {
      category.subcategories.forEach((sub: any) => {
        ids = [...ids, ...getAllDescendantIds(sub)];
      });
    }
    return ids;
  };

  const getCategoryPathFromProduct = (product: any): string[] => {
    const attrs = product.attributes;
    
    // Check for categoryPath array first
    if (attrs.categoryPath && Array.isArray(attrs.categoryPath)) {
      return attrs.categoryPath.filter((id: any) => id && id !== '');
    }
    
    // Fallback to old format
    const path: string[] = [];
    
    if (attrs.category) path.push(String(attrs.category));
    if (attrs.subcategory) path.push(String(attrs.subcategory));
    if (attrs.subSubcategory) path.push(String(attrs.subSubcategory));
    
    let level = 3;
    while (attrs[`level${level}`]) {
      path.push(String(attrs[`level${level}`]));
      level++;
    }
    
    return path.filter(id => id && id !== '');
  };

  const productBelongsToCategory = (product: any, categoryIds: string[]): boolean => {
    const productPath = getCategoryPathFromProduct(product);
    return productPath.some(catId => categoryIds.includes(catId));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesRes = await fetch('/api/categories');
        const categoriesData = await categoriesRes.json();
        setAllCategories(categoriesData);

        let foundCategory: any = null;
        let breadcrumb: string[] = [];
        let parentCategoryIds: string[] = [];
        
        const findCategoryBySlug = (cats: any[], path: string[] = [], parentIds: string[] = []): any => {
          for (const cat of cats) {
            const currentPath = [...path, cat.title];
            const currentParentIds = [...parentIds];
            
            if (cat.slug === slug) {
              breadcrumb = currentPath;
              parentCategoryIds = currentParentIds;
              return cat;
            }
            if (cat.subcategories && cat.subcategories.length > 0) {
              const found = findCategoryBySlug(cat.subcategories, currentPath, [...currentParentIds, cat.id]);
              if (found) return found;
            }
          }
          return null;
        };

        foundCategory = findCategoryBySlug(categoriesData);

        if (!foundCategory) {
          setLoading(false);
          return;
        }

        setExpandedCategories(new Set([...parentCategoryIds, foundCategory.id]));

        setCategoryInfo({ 
          id: foundCategory.id, 
          title: foundCategory.title,
          description: foundCategory.description,
          image: foundCategory.image,
          breadcrumb 
        });

        const categoryIds = getAllDescendantIds(foundCategory);

        const productsRes = await fetch('/api/products');
        const allProducts = await productsRes.json();

        const inventoryRes = await fetch('/api/inventory');
        const inventory = await inventoryRes.json();

        const categoryProducts = allProducts.filter((p: any) => 
          productBelongsToCategory(p, categoryIds)
        );

        const productsWithInventory = categoryProducts.map((product: any) => {
          const productInventory = inventory.filter(
            (item: any) => item.productId === product.id || item.productId === Number(product.id)
          );

          const available = productInventory.filter((item: any) => item.status === 'available').length;

          let price = product.attributes.Price || '0';
          if (!product.attributes.Price && productInventory.length > 0) {
            const firstItem = productInventory[0];
            price = firstItem.sellingPrice?.toString() || '0';
          }

          return {
            id: product.id,
            name: product.name,
            image: product.attributes.mainImage || '',
            price: price,
            available,
            attributes: product.attributes
          };
        });

        const availableProducts = productsWithInventory.filter((p: any) => p.available > 0);
        const groupedProducts = groupProductsByVariations(availableProducts);
        setProducts(groupedProducts);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': {
        const aPrice = parseFloat(String(a.priceRange).split('-')[0]) || 0;
        const bPrice = parseFloat(String(b.priceRange).split('-')[0]) || 0;
        return aPrice - bPrice;
      }
      case 'price-high': {
        const aPrice = parseFloat(String(a.priceRange).split('-')[0]) || 0;
        const bPrice = parseFloat(String(b.priceRange).split('-')[0]) || 0;
        return bPrice - aPrice;
      }
      case 'name':
        return a.baseName.localeCompare(b.baseName);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!categoryInfo) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
            <p className="text-gray-600">The category you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <Breadcrumb 
        breadcrumb={categoryInfo.breadcrumb}
        title={categoryInfo.title}
        productCount={products.length}
        onBack={() => router.back()}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-8">
          <CategorySidebar 
            categories={allCategories}
            expandedCategories={expandedCategories}
            onToggleCategory={toggleCategory}
            activeSlug={slug}
          />

          <div className="flex-1">
            <ProductsToolbar 
              viewMode={viewMode}
              sortBy={sortBy}
              onViewModeChange={setViewMode}
              onSortChange={setSortBy}
            />

            <ProductsGrid 
              products={sortedProducts}
              viewMode={viewMode}
            />
          </div>
        </div>
      </div>      
    </div>
  );
}