import React from 'react';

interface Product {
  id: number;
  name: string;
  attributes?: Record<string, any>;
}

interface BatchFormProps {
  selectedProduct: Product | undefined;
  costPrice: number | '';
  sellingPrice: number | '';
  quantity: number | '';
  onProductClick: () => void;
  onCostPriceChange: (value: number | '') => void;
  onSellingPriceChange: (value: number | '') => void;
  onQuantityChange: (value: number | '') => void;
  onAddBatch: () => void;
  onClear: () => void;
}

export default function BatchForm({
  selectedProduct,
  costPrice,
  sellingPrice,
  quantity,
  onProductClick,
  onCostPriceChange,
  onSellingPriceChange,
  onQuantityChange,
  onAddBatch,
  onClear
}: BatchFormProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={onProductClick}
          className="border rounded px-3 py-2 bg-white dark:bg-gray-700 cursor-pointer hover:border-indigo-500 transition-colors flex items-center justify-between"
        >
          <span className={selectedProduct ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
            {selectedProduct ? selectedProduct.name : 'Select Product...'}
          </span>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        <input
          type="number"
          placeholder="Cost Price"
          value={costPrice as any}
          onChange={e => onCostPriceChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none transition-colors"
        />

        <input
          type="number"
          placeholder="Selling Price"
          value={sellingPrice as any}
          onChange={e => onSellingPriceChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none transition-colors"
        />

        <input
          type="number"
          placeholder="Quantity"
          min={1}
          value={quantity as any}
          onChange={e => onQuantityChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none transition-colors"
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={onAddBatch} className="px-4 py-2 bg-gray-900 dark:bg-indigo-600 text-white rounded hover:bg-gray-800 dark:hover:bg-indigo-700 transition-colors">
          Add Batch
        </button>
        <button
          onClick={onClear}
          className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}