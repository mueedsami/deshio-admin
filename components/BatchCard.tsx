import React from 'react';
import Barcode from 'react-barcode';
import BatchPrinter from './BatchPrinter';

interface Product {
  id: number;
  name: string;
  attributes?: Record<string, any>;
}

interface Batch {
  id: number;
  productId: number;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  baseCode: string;
}

interface BatchCardProps {
  batch: Batch;
  product?: Product;
  onDelete?: (batchId: number) => void;
}

export default function BatchCard({ batch, product, onDelete }: BatchCardProps) {
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    
    try {
      const res = await fetch(`/api/batch/${batch.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        onDelete?.(batch.id);
      } else {
        alert('Failed to delete batch');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete batch');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="text-sm text-gray-500">Product</div>
          <div className="font-medium text-gray-900 dark:text-white">{product?.name ?? '—'}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500">Qty</div>
            <div className="font-medium">{batch.quantity}</div>
          </div>
          <button
            onClick={handleDelete}
            className="group relative p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-800 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 shadow-sm hover:shadow"
            title="Delete batch"
          >
            <svg className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Cost:</span>
            <span className="font-medium ml-1">{batch.costPrice}</span>
          </div>
          <div>
            <span className="text-gray-500">Selling:</span>
            <span className="font-medium ml-1">{batch.sellingPrice}</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-2">Base Barcode Preview</div>
      <div className="flex justify-center mb-4 p-3 border rounded bg-gray-50 dark:bg-gray-700">
        <div className="flex flex-col items-center">
          <Barcode value={batch.baseCode} format="CODE128" renderer="svg" width={1.5} height={50} displayValue={true} margin={4} />
          <div className="text-xs mt-2 text-center text-gray-600 dark:text-gray-300">
            Will print {batch.quantity} codes<br />
            ({batch.baseCode}-01 to -{String(batch.quantity).padStart(2, '0')})
          </div>
        </div>
      </div>

      <BatchPrinter batch={batch} product={product} />
    </div>
  );
}