'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/e-commerce/CartContext';
import CartSidebar from './cart/CartSidebar';

interface Product {
  id: string | number;
  name: string;
  attributes: {
    mainImage?: string;
    category?: string;
    subcategory?: string;
    Price?: string;
    SKU?: string;
    [key: string]: string | undefined;
  };
  variations?: Product[];
}

interface InventoryItem {
  productId: string | number;
  status: string;
  sellingPrice?: number;
}

interface ProductWithStats {
  id: string | number;
  name: string;
  image: string;
  price: string; // Formatted for display
  priceRange?: string; // Formatted for display
  soldCount: number;
  variations: Array<Product & { price: number }>; // Raw number for calculations
}

export default function BestSellerProducts() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const [bestSellers, setBestSellers] = useState<ProductWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingProductId, setAddingProductId] = useState<string | number | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await fetch('/api/products');
        const products: Product[] = await productsRes.json();
        const inventoryRes = await fetch('/api/inventory');
        const inventory: InventoryItem[] = await inventoryRes.json();

        // Log API data for debugging
        console.log('Products:', products);
        console.log('Inventory:', inventory);

        // Group products by their base product (for variations)
        const groupedProducts: { [key: string]: Product[] } = {};
        products.forEach(product => {
          const baseId = product.attributes.SKU?.split('-')[0] || product.id;
          if (!groupedProducts[baseId]) {
            groupedProducts[baseId] = [];
          }
          groupedProducts[baseId].push(product);
        });

        // Calculate stats for grouped products
        const productsWithStats: ProductWithStats[] = Object.entries(groupedProducts).map(([baseId, variations]) => {
          const mainProduct = variations[0];
          const productInventory = inventory.filter(item => 
            variations.some(v => v.id === item.productId || Number(v.id) === item.productId)
          );

          const soldCount = productInventory.filter(item => item.status === 'sold').length;

          // Calculate price for each variation as a number
          const variationsWithPrice = variations.map(variation => {
            const inventoryPrice = productInventory.find(i => i.productId === variation.id || Number(i.productId) === variation.id)?.sellingPrice;
            const rawPrice = parseFloat(variation.attributes.Price || inventoryPrice?.toString() || '0');
            if (isNaN(rawPrice) || rawPrice <= 0) {
              console.warn(`Invalid price for product ${variation.id}:`, {
                Price: variation.attributes.Price,
                sellingPrice: inventoryPrice,
              });
            }
            return { ...variation, price: isNaN(rawPrice) ? 0 : rawPrice };
          });

          // Calculate price range for display
          const prices = variationsWithPrice
            .map(v => v.price)
            .filter(p => !isNaN(p) && p > 0);
          
          const priceRange = prices.length > 1 
            ? `${Math.min(...prices).toLocaleString()}-${Math.max(...prices).toLocaleString()}`
            : prices[0]?.toLocaleString() || '0';

          return {
            id: baseId,
            name: mainProduct.name,
            image: mainProduct.attributes.mainImage || '',
            price: priceRange, // Formatted for display
            priceRange,
            soldCount,
            variations: variationsWithPrice,
          };
        });

        // Sort by sold count and get top 5
        const sorted = productsWithStats
          .filter(p => p.soldCount > 0)
          .sort((a, b) => b.soldCount - a.soldCount)
          .slice(0, 5);

        setBestSellers(sorted);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const navigateToProduct = (productId: string | number) => {
    router.push(`/e-commerce/product/${productId}`);
  };

  const handleAddToCart = async (product: ProductWithStats, e: React.MouseEvent) => {
    e.stopPropagation();

    if (product.variations.length > 1) {
      navigateToProduct(product.variations[0].id);
      return;
    }

    setAddingProductId(product.id);
    
    const variation = product.variations[0];
    const cartItem = {
      id: variation.id,
      name: product.name,
      image: product.image,
      price: variation.price, // Use raw number price from variation
      sku: variation.attributes.SKU || '',
      quantity: 1,
    };

    // Log cart item for debugging
    console.log('Adding to cart:', cartItem);

    addToCart(cartItem, 1);

    setTimeout(() => {
      setAddingProductId(null);
      setIsCartOpen(true); // Open cart sidebar after adding
    }, 1200);
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">Loading best sellers...</p>
          </div>
        </div>
      </section>
    );
  }

  if (bestSellers.length === 0) {
    return null;
  }

  return (
    <>
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Best Sellers</h2>
            <p className="text-lg text-gray-600">Our customers' favorite picks</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {bestSellers.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200"
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div 
                  onClick={() => navigateToProduct(product.variations[0].id)}
                  className="relative aspect-square overflow-hidden bg-gray-50 cursor-pointer"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect fill="%23f3f4f6" width="300" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="16"%3E' +
                        encodeURIComponent(product.name) +
                        '%3C/text%3E%3C/svg%3E';
                    }}
                  />

                  {product.variations.length > 1 && (
                    <span className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1.5 text-xs font-bold rounded-full shadow-lg">
                      {product.variations.length} VARIANTS
                    </span>
                  )}

                  <div
                    className={`absolute top-2 right-2 flex flex-col gap-2 transition-all duration-300 ${
                      hoveredId === product.id ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    }`}
                  >
                    <button className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors">
                      <Heart size={16} className="text-gray-700" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToProduct(product.variations[0].id);
                      }}
                      className="p-2 bg-white rounded-full shadow-lg hover:bg-blue-50 transition-colors"
                    >
                      <Eye size={16} className="text-gray-700" />
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={addingProductId === product.id}
                    className={`absolute bottom-0 left-0 right-0 bg-red-700 text-white py-3 text-sm font-bold transition-transform duration-300 flex items-center justify-center gap-2 hover:bg-red-800 ${
                      hoveredId === product.id ? 'translate-y-0' : 'translate-y-full'
                    } ${addingProductId === product.id ? 'bg-green-600' : ''}`}
                  >
                    {addingProductId === product.id ? (
                      <>✓ ADDED</>
                    ) : product.variations.length > 1 ? (
                      'SELECT OPTION'
                    ) : (
                      <>
                        <ShoppingCart size={16} />
                        ADD TO CART
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 text-center">
                  <h3 
                    onClick={() => navigateToProduct(product.variations[0].id)}
                    className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors cursor-pointer"
                  >
                    {product.name}
                  </h3>
                  <span className="text-lg font-bold text-red-700">
                    {product.priceRange?.includes('-')
                      ? `${product.priceRange}৳`
                      : `${product.variations[0].price.toLocaleString()}.00৳`} {/* Use variation price for single-variation products */}
                  </span>
                  {product.variations.length > 1 && (
                    <p className="text-xs text-gray-500 mt-1">{product.variations.length} variations available</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CartSidebar isOpen={isCartOpen} onClose={handleCloseCart} />
    </>
  );
}