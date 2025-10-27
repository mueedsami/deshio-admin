// components/sales/ReturnProductModal.tsx
import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';

interface Sale {
  id: string;
  customer: {
    name: string;
    mobile: string;
  };
  items: Array<{
    id: number;
    productName: string;
    size: string;
    qty: number;
    price: number;
    discount: number;
    amount: number;
  }>;
  amounts: {
    subtotal: number;
    totalDiscount: number;
    vat: number;
    vatRate: number;
    transportCost: number;
    total: number;
  };
  payments: {
    totalPaid: number;
    due: number;
  };
}

interface ReturnProductModalProps {
  sale: Sale;
  onClose: () => void;
  onReturn: (returnData: any) => Promise<void>;
}

export default function ReturnProductModal({ sale, onClose, onReturn }: ReturnProductModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [returnedQuantities, setReturnedQuantities] = useState<{ [key: number]: number }>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProductCheckbox = (productId: number) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        const newSelected = prev.filter(id => id !== productId);
        const newQuantities = { ...returnedQuantities };
        delete newQuantities[productId];
        setReturnedQuantities(newQuantities);
        return newSelected;
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleQuantityChange = (productId: number, qty: number, maxQty: number) => {
    if (qty < 0 || qty > maxQty) return;
    setReturnedQuantities(prev => ({
      ...prev,
      [productId]: qty
    }));
  };

  const calculateTotals = () => {
    const returnAmount = selectedProducts.reduce((sum, productId) => {
      const product = sale.items.find(p => p.id === productId);
      if (!product) return sum;
      const qty = returnedQuantities[productId] || 0;
      return sum + (product.price * qty);
    }, 0);

    const newSubtotal = sale.items.reduce((sum, product) => {
      if (selectedProducts.includes(product.id)) {
        const returnQty = returnedQuantities[product.id] || 0;
        const remainingQty = product.qty - returnQty;
        if (remainingQty > 0) {
          return sum + (product.price * remainingQty);
        }
        return sum;
      }
      return sum + product.amount;
    }, 0);

    const vatRate = sale.amounts.vatRate || 0;
    const vatAmount = Math.round(newSubtotal * (vatRate / 100));
    const transportCost = sale.amounts.transportCost || 0;
    const totalNewAmount = newSubtotal + vatAmount + transportCost;
    const originalTotal = sale.amounts.total || 0;
    const refundAmount = originalTotal - totalNewAmount;
    const totalPaid = sale.payments.totalPaid || 0;
    const refundToCustomer = totalPaid > totalNewAmount ? totalPaid - totalNewAmount : 0;
    const newDue = totalPaid > totalNewAmount ? 0 : totalNewAmount - totalPaid;

    return {
      returnAmount,
      newSubtotal,
      vatRate,
      vatAmount,
      transportCost,
      totalNewAmount,
      originalTotal,
      refundAmount,
      totalPaid,
      refundToCustomer,
      newDue
    };
  };

  const totals = calculateTotals();

  const handleProcessReturn = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to return');
      return;
    }

    const hasInvalidQuantities = selectedProducts.some(id => {
      const qty = returnedQuantities[id];
      return !qty || qty <= 0;
    });

    if (hasInvalidQuantities) {
      alert('Please set quantities for all selected products');
      return;
    }

    const confirmMessage = totals.refundToCustomer > 0 
      ? `Refund ৳${totals.refundToCustomer.toLocaleString()} to customer?`
      : `Reduce sale total by ৳${totals.refundAmount.toLocaleString()}?`;

    if (!confirm(`Process return?\n${confirmMessage}`)) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/sales/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saleId: sale.id,
          returnedProducts: selectedProducts.map(id => ({
            productId: id,
            productName: sale.items.find(p => p.id === id)?.productName,
            quantity: returnedQuantities[id],
            price: sale.items.find(p => p.id === id)?.price,
            amount: (sale.items.find(p => p.id === id)?.price || 0) * returnedQuantities[id]
          })),
          refundAmount: totals.refundAmount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process return');
      }

      const result = await response.json();
      await onReturn(result);

      const message = result.refundToCustomer > 0 
        ? `Return successful! Refund ৳${result.refundToCustomer.toLocaleString()} to customer`
        : `Return successful! Sale total reduced by ৳${result.refundAmount.toLocaleString()}`;

      alert(message);
      onClose();
    } catch (error: any) {
      console.error('Return failed:', error);
      alert(error.message || 'Failed to process return');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Return Products - Sale #{sale.id}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select items to return and process refund</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                <p className="font-semibold text-gray-900 dark:text-white">{sale.customer.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{sale.customer.mobile}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">৳{sale.payments.totalPaid.toLocaleString()}</p>
                {sale.payments.due > 0 && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">Due: ৳{sale.payments.due.toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">Select Items to Return</h3>
            
            {sale.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No products in this sale
              </div>
            ) : (
              <div className="space-y-3">
                {sale.items.map((product) => (
                  <div key={product.id} className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleProductCheckbox(product.id)}
                        className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900 dark:text-white">{product.productName}</p>
                          <p className="font-bold text-gray-900 dark:text-white">৳{(product.price * product.qty).toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          Price: ৳{product.price.toLocaleString()} × Qty: {product.qty} = ৳{product.amount.toLocaleString()}
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
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Return Qty</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={product.qty}
                                  value={returnedQuantities[product.id] || 0}
                                  onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0, product.qty)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
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
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">Return Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Items selected:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedProducts.length}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Return Amount:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">-৳{totals.returnAmount.toLocaleString()}</span>
              </div>

              <div className="pt-2 border-t border-gray-300 dark:border-gray-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Original Total:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">৳{totals.originalTotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">New Subtotal:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">৳{totals.newSubtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">VAT ({totals.vatRate}%):</span>
                  <span className="font-semibold text-gray-900 dark:text-white">৳{totals.vatAmount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Transport:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">৳{totals.transportCost.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-base font-bold pt-2 border-t border-gray-300 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">New Total:</span>
                  <span className="text-gray-900 dark:text-white">৳{totals.totalNewAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-gray-300 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Customer Paid:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">৳{totals.totalPaid.toLocaleString()}</span>
                </div>

                {totals.refundToCustomer > 0 ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-900 dark:text-green-300">Refund to Customer:</span>
                      <span className="font-bold text-lg text-green-600 dark:text-green-400">৳{totals.refundToCustomer.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">Customer overpaid - needs refund</p>
                  </div>
                ) : (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500 dark:border-orange-600 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-orange-900 dark:text-orange-300">Remaining Due:</span>
                      <span className="font-bold text-lg text-orange-600 dark:text-orange-400">৳{totals.newDue.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">Amount still owed after return</p>
                  </div>
                )}

                <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Refund Amount:</span>
                    <span className="font-bold text-red-600 dark:text-red-400">-৳{totals.refundAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProcessReturn}
              disabled={isProcessing || selectedProducts.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <RotateCcw className="w-5 h-5" />
              {isProcessing ? 'Processing...' : 'Process Return'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}