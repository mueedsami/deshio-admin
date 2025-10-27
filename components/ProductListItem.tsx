'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

interface Product {
  id: number | string;
  name: string;
  attributes: Record<string, any>;
  variations?: {
    id: string | number;
    attributes: Record<string, any>;
  }[];
}

interface ProductListItemProps {
  product: Product;
  image: string | null;
  categoryPath: string;
  onDelete: (id: number | string) => void;
  onEdit: (product: Product) => void;
  onView: (id: number | string) => void;
  onSelect?: (product: Product) => void;
  selectable?: boolean;
  selected?: boolean;
  toggleSelect?: (id: number | string) => void;
  onViewVariations?: () => void;
  variationCount?: number;
}

export default function ProductListItem({
  product,
  image,
  categoryPath,
  onDelete,
  onEdit,
  onView,
  onSelect,
  selectable,
  selected,
  toggleSelect,
  onViewVariations,
  variationCount,
}: ProductListItemProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setShowDropdown(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX - 180
      });
    }
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
      <div
        className={`flex items-center gap-4 p-4 ${
          selected ? 'ring-2 ring-blue-500 rounded-lg' : ''
        }`}
      >
        {/* Checkbox if selectable */}
        {selectable && (
          <div className="flex-shrink-0">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => toggleSelect?.(product.id)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Product Image */}
        <button
          type="button"
          onClick={() => onView(product.id)}
          className="flex-shrink-0 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
          aria-label={`View ${product.name}`}
        >
          <ImageWithFallback
            src={image || ERROR_IMG_SRC}
            alt={product.name}
            className="w-20 h-20 object-cover"
          />
        </button>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-gray-900 dark:text-white truncate mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {categoryPath}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* View Variations Button */}
          {variationCount && variationCount > 1 && onViewVariations && (
            <button
              onClick={onViewVariations}
              className="px-3 py-1.5 text-sm bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors whitespace-nowrap dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              Variations ({variationCount})
            </button>
          )}

          {/* Select button (optional) - only show if product has no variations */}
          {onSelect && (!variationCount || variationCount <= 1) && (
            <button
              onClick={() => onSelect(product)}
              className="px-3 py-1.5 text-sm bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              Select
            </button>
          )}

          {/* Dropdown menu */}
          <button
            ref={buttonRef}
            onClick={handleMenuClick}
            className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          {showDropdown &&
            createPortal(
              <div
                ref={dropdownRef}
                className="fixed w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 py-2"
                style={{
                  top: `${dropdownPos.top}px`,
                  left: `${dropdownPos.left}px`
                }}
              >
                <button
                  onClick={() => {
                    onEdit(product);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this product?')) {
                      onDelete(product.id);
                    }
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>,
              document.body
            )}
        </div>
      </div>
    </div>
  );
}