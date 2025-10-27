import { useState, useEffect } from 'react';
import { X, Search, ArrowRightLeft } from 'lucide-react';
import { Order, Product } from '@/types/order';

interface ExchangeProductModalProps {
  order: Order;
  onClose: () => void;
  onExchange: (exchangeData: any) => Promise<void>;
}

export default function ExchangeProductModal({ order, onClose, onExchange }: ExchangeProductModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [removedQuantities, setRemovedQuantities] = useState<{ [key: number]: number }>({});
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedReplacement, setSelectedReplacement] = useState<any>(null);
  const [replacementQuantity, setReplacementQuantity] = useState('1');
  const [replacementProducts, setReplacementProducts] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch products and inventory
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setAllProducts(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/inventory');
        if (response.ok) {
          const data = await response.json();
          setInventory(data);
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };

    fetchProducts();
    fetchInventory();
  }, []);

  // Flatten products with variations into searchable items (same as your main component)
  const getFlattenedProducts = () => {
    const flattened: any[] = [];
    
    allProducts.forEach(product => {
      if (product.variations && product.variations.length > 0) {
        product.variations.forEach((variation: any, index: number) => {
          const colorAttr = variation.attributes?.Colour || `Variation ${index + 1}`;
          flattened.push({
            id: variation.id,
            name: `${product.name} - ${colorAttr}`,
            originalProductId: product.id,
            isVariation: true,
            variationIndex: index,
            attributes: {
              ...product.attributes,
              ...variation.attributes
            }
          });
        });
      } else {
        flattened.push({
          ...product,
          isVariation: false
        });
      }
    });
    
    return flattened;
  };

  // Helper function to get available inventory count for a product/variation and optional batch
  const getAvailableInventory = (productId: number | string, batchId?: number | string) => {
    return inventory.filter(item => {
      const itemProductId = typeof item.productId === 'string' ? item.productId : String(item.productId);
      const searchProductId = typeof productId === 'string' ? productId : String(productId);
      const matchesProduct = itemProductId === searchProductId && item.status === 'available';
      if (batchId !== undefined) {
        return matchesProduct && item.batchId === batchId;
      }
      return matchesProduct;
    }).length;
  };

  // Live search with inventory data
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      const flattenedProducts = getFlattenedProducts();
      
      const results: any[] = [];

      flattenedProducts.forEach((prod: any) => {
        const availableItems = inventory.filter((item: any) => 
          String(item.productId) === String(prod.id) && item.status === 'available'
        );

        if (availableItems.length === 0) return;

        const groups: { [key: string]: { batchId: any; price: number; count: number } } = {};

        availableItems.forEach((item: any) => {
          const bid = item.batchId;
          if (!groups[bid]) {
            groups[bid] = {
              batchId: bid,
              price: item.sellingPrice,
              count: 0
            };
          }
          groups[bid].count++;
        });

        if (prod.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          Object.values(groups).forEach((group) => {
            results.push({
              ...prod,
              batchId: group.batchId,
              attributes: { 
                ...prod.attributes, 
                Price: group.price 
              },
              available: group.count
            });
          });
        }
      });
      
      setSearchResults(results);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, allProducts, inventory]);

  const handleProductCheckbox = (productId: number) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        const newSelected = prev.filter(id => id !== productId);
        const newQuantities = { ...removedQuantities };
        delete newQuantities[productId];
        setRemovedQuantities(newQuantities);
        return newSelected;
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleQuantityChange = (productId: number, qty: number, maxQty: number) => {
    if (qty < 0 || qty > maxQty) return;
    setRemovedQuantities(prev => ({
      ...prev,
      [productId]: qty
    }));
  };

  const handleProductImageClick = (product: any) => {
    setSelectedReplacement(product);
    setReplacementQuantity('1');
  };

  const handleAddReplacement = () => {
    if (!selectedReplacement || !replacementQuantity) {
      alert('Please enter quantity');
      return;
    }

    const qty = parseInt(replacementQuantity);
    if (qty <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    // Get price from batch data (inventory)
    const price = selectedReplacement.attributes.Price;
    
    // Check available quantity
    const availableQty = getAvailableInventory(selectedReplacement.id, selectedReplacement.batchId);
    if (qty > availableQty) {
      alert(`Only ${availableQty} units available for this batch`);
      return;
    }

    // Check if this product with same batch already exists in the replacement list
    const existingIndex = replacementProducts.findIndex(
      p => p.id === selectedReplacement.id && p.batchId === selectedReplacement.batchId
    );
    
    if (existingIndex !== -1) {
      // Product exists - increment quantity
      const updated = [...replacementProducts];
      const newQty = updated[existingIndex].quantity + qty;
      
      if (newQty > availableQty) {
        alert(`Only ${availableQty} units available for this batch. You already have ${updated[existingIndex].quantity} in cart.`);
        return;
      }
      
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].amount = price * newQty;
      setReplacementProducts(updated);
    } else {
      // New product - add to list
      setReplacementProducts(prev => [...prev, {
        id: selectedReplacement.id,
        batchId: selectedReplacement.batchId,
        name: selectedReplacement.name,
        image: selectedReplacement.attributes.mainImage,
        price: price,
        quantity: qty,
        amount: price * qty,
        size: selectedReplacement.attributes.Size || '1',
        available: availableQty
      }]);
    }
    
    setSelectedReplacement(null);
    setReplacementQuantity('1');
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveReplacement = (productId: string, batchId: any) => {
    setReplacementProducts(prev => prev.filter(p => !(p.id === productId && p.batchId === batchId)));
  };

  const handleUpdateReplacementQty = (productId: string, batchId: any, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveReplacement(productId, batchId);
      return;
    }
    
    // Check available quantity
    const product = replacementProducts.find(p => p.id === productId && p.batchId === batchId);
    if (product && newQty > product.available) {
      alert(`Only ${product.available} units available for this batch`);
      return;
    }
    
    setReplacementProducts(prev => 
      prev.map(p => {
        if (p.id === productId && p.batchId === batchId) {
          return {
            ...p,
            quantity: newQty,
            amount: p.price * newQty
          };
        }
        return p;
      })
    );
  };

  // Calculate totals with proper logic
  const calculateTotals = () => {
    // Original amount (what's being removed)
    const originalAmount = selectedProducts.reduce((sum, productId) => {
      const product = order.products.find(p => p.id === productId);
      if (!product) return sum;
      const qty = removedQuantities[productId] || 0;
      return sum + (product.price * qty);
    }, 0);

    // New products subtotal
    const newSubtotal = replacementProducts.reduce((sum, p) => sum + p.amount, 0);

    // VAT calculation
    const vatRate = order.amounts.vatRate || 0;
    const vatAmount = Math.round(newSubtotal * (vatRate / 100));
    
    // Total new amount with VAT
    const totalNewAmount = newSubtotal + vatAmount;

    // Difference calculation (new total - original amount removed)
    const difference = totalNewAmount - originalAmount;

    return {
      originalAmount,
      newSubtotal,
      vatRate,
      vatAmount,
      totalNewAmount,
      difference
    };
  };

  const totals = calculateTotals();

  const handleProcessExchange = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to exchange');
      return;
    }

    if (replacementProducts.length === 0) {
      alert('Please select replacement products');
      return;
    }

    const hasInvalidQuantities = selectedProducts.some(id => {
      const qty = removedQuantities[id];
      return !qty || qty <= 0;
    });

    if (hasInvalidQuantities) {
      alert('Please set quantities for all selected products');
      return;
    }

    setIsProcessing(true);
    try {
      // Call the exchange API endpoint
      const response = await fetch('/api/social-orders/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          removedProducts: selectedProducts.map(id => ({
            productId: id,
            quantity: removedQuantities[id]
          })),
          replacementProducts: replacementProducts.map(p => ({
            id: p.id,
            batchId: p.batchId,
            name: p.name,
            price: p.price,
            quantity: p.quantity,
            amount: p.amount,
            size: p.size
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process exchange');
      }

      const result = await response.json();

      // Call parent's onExchange to refresh the order list
      await onExchange(result);

      const diffText = result.difference > 0 
        ? `Customer owes ৳${result.difference.toLocaleString()}` 
        : result.difference < 0 
        ? `Refund ৳${Math.abs(result.difference).toLocaleString()} to customer` 
        : 'No payment difference';

      alert(`Exchange successful! ${diffText}`);
      onClose();
    } catch (error: any) {
      console.error('Exchange failed:', error);
      alert(error.message || 'Failed to process exchange');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Exchange - Order #{order.id}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select items to exchange</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Select Items to Exchange */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">Select Items to Exchange</h3>
            
            <div className="space-y-3">
              {order.products.map((product) => (
                <div key={product.id} className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleProductCheckbox(product.id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900 dark:text-white">{product.productName}</p>
                        <p className="font-bold text-gray-900 dark:text-white">৳{(product.price * product.qty).toLocaleString()}</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        Price: ৳{product.price.toLocaleString()} × Qty: {product.qty}
                      </p>
                      
                      {selectedProducts.includes(product.id) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Original Qty</label>
                              <input
                                type="number"
                                value={product.qty}
                                readOnly
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Removed Qty</label>
                              <input
                                type="number"
                                min="0"
                                max={product.qty}
                                value={removedQuantities[product.id] || 0}
                                onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0, product.qty)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Replacement */}
          {selectedProducts.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">Search Replacement</h3>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                  type="button"
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  <Search size={18} />
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && !selectedReplacement && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto mb-4 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                  {searchResults.map((product) => (
                    <div
                      key={`${product.id}-${product.batchId}`}
                      onClick={() => handleProductImageClick(product)}
                      className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-2 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <img 
                        src={product.attributes.mainImage} 
                        alt={product.name} 
                        className="w-full h-24 object-cover rounded mb-2" 
                      />
                      <p className="text-xs text-gray-900 dark:text-white font-medium truncate">
                        {product.name} (Batch {product.batchId})
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">৳{product.attributes.Price}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">Available: {product.available}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Replacement Product - Ask for Quantity */}
              {selectedReplacement && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-600 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">✓ Selected Replacement</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReplacement(null);
                        setReplacementQuantity('1');
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="flex gap-3 mb-4">
                    <img 
                      src={selectedReplacement.attributes.mainImage} 
                      alt={selectedReplacement.name} 
                      className="w-16 h-16 object-cover rounded border-2 border-blue-400" 
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedReplacement.name} (Batch {selectedReplacement.batchId})
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Price: ৳{selectedReplacement.attributes.Price}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Available: {getAvailableInventory(selectedReplacement.id, selectedReplacement.batchId)} units
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                        Amount: ৳{(parseFloat(selectedReplacement.attributes.Price) * parseInt(replacementQuantity || '1')).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Enter Quantity</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const qty = parseInt(replacementQuantity) || 1;
                            if (qty > 1) setReplacementQuantity(String(qty - 1));
                          }}
                          className="w-10 h-10 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-lg font-bold"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={getAvailableInventory(selectedReplacement.id, selectedReplacement.batchId)}
                          value={replacementQuantity}
                          onChange={(e) => setReplacementQuantity(e.target.value)}
                          className="flex-1 px-4 py-2 text-center border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const qty = parseInt(replacementQuantity) || 1;
                            const available = getAvailableInventory(selectedReplacement.id, selectedReplacement.batchId);
                            if (qty < available) {
                              setReplacementQuantity(String(qty + 1));
                            } else {
                              alert(`Only ${available} units available`);
                            }
                          }}
                          className="w-10 h-10 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-lg font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddReplacement}
                      className="w-full px-4 py-2.5 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                    >
                      Add to Replacements
                    </button>
                  </div>
                </div>
              )}

              {/* Selected Replacements List */}
              {replacementProducts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Selected Replacements</h4>
                  {replacementProducts.map((product) => (
                    <div key={`${product.id}-${product.batchId}`} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name} (Batch {product.batchId})
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            ৳{product.price.toLocaleString()} × {product.quantity}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Available: {product.available}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateReplacementQty(product.id, product.batchId, product.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white">{product.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateReplacementQty(product.id, product.batchId, product.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              +
                            </button>
                          </div>
                          <p className="font-bold text-gray-900 dark:text-white min-w-[80px] text-right">৳{product.amount.toLocaleString()}</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveReplacement(product.id, product.batchId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Items selected:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedProducts.length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Original Amount (Removed):</span>
                <div className="flex items-center gap-2">
                  {totals.originalAmount === 0 && <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded font-semibold">NO ITEMS</span>}
                  <span className="font-semibold text-gray-900 dark:text-white">৳{totals.originalAmount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">New Products Subtotal:</span>
                <span className="font-semibold text-gray-900 dark:text-white">৳{totals.newSubtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">VAT ({totals.vatRate}%):</span>
                <span className="font-semibold text-gray-900 dark:text-white">৳{totals.vatAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total New Amount:</span>
                <span className="font-semibold text-gray-900 dark:text-white">৳{totals.totalNewAmount.toLocaleString()}</span>
              </div>
              
              <div className="pt-3 border-t border-gray-300 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-white">Difference:</span>
                  <span className={`font-bold text-lg ${totals.difference > 0 ? 'text-orange-600 dark:text-orange-400' : totals.difference < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    {totals.difference > 0 ? '+' : ''}৳{totals.difference.toLocaleString()}
                  </span>
                </div>
                {totals.difference > 0 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Customer needs to pay additional amount</p>
                )}
                {totals.difference < 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Refund amount to customer</p>
                )}
                {totals.difference === 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">No payment difference</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleProcessExchange}
              disabled={isProcessing || selectedProducts.length === 0 || replacementProducts.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <ArrowRightLeft className="w-5 h-5" />
              {isProcessing ? 'Processing...' : 'Process Exchange'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}