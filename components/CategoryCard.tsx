'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Trash2, Edit, Plus } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export interface Category {
  id: string;
  title: string;
  description: string;
  slug: string;
  image: string;
  subcategories?: Category[];
}

interface CategoryCardProps {
  category: Category;
  onDelete: (id: string) => void;
  onEdit: (category: Category) => void;
  onAddSubcategory: (parentId: string) => void;
}

// ---------- Dropdown with Portal ----------
function Dropdown({
  targetRef,
  onClose,
  children,
}: {
  targetRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Create portal container
  useEffect(() => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    setContainer(el);

    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  // Position dropdown
  useEffect(() => {
    function updatePosition() {
      if (targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY,
          left: rect.right + window.scrollX - 200, // align to right
        });
      }
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [targetRef]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        container &&
        !container.contains(e.target as Node) &&
        !targetRef.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [container, targetRef, onClose]);

  if (!container) return null;

  return createPortal(
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl flex flex-col p-2 z-[9999]"
      style={{ position: 'absolute', top: position.top, left: position.left, width: 200 }}
    >
      {children}
    </div>,
    container
  );
}

// ---------- Main Category Card ----------
export default function CategoryCard({
  category,
  onDelete,
  onEdit,
  onAddSubcategory,
}: CategoryCardProps) {
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownButtonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowSubcategories(true)}
      onMouseLeave={() => setShowSubcategories(false)}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
          <ImageWithFallback
            src={category.image}
            alt={category.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-gray-900 dark:text-white mb-1">{category.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {category.description}
              </p>
            </div>

            {/* Dropdown trigger */}
            <button
              ref={dropdownButtonRef}
              onClick={() => setShowDropdown(!showDropdown)}
              className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">/{category.slug}</span>
            {category.subcategories && category.subcategories.length > 0 && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                {category.subcategories.length} sub
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown menu */}
      {showDropdown && (
        <Dropdown targetRef={dropdownButtonRef} onClose={() => setShowDropdown(false)}>
          <button
            onClick={() => {
              onEdit(category);
              setShowDropdown(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={() => {
              onAddSubcategory(category.id);
              setShowDropdown(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Plus className="w-4 h-4" /> Add Subcategory
          </button>
          <button
            onClick={() => {
              onDelete(category.id);
              setShowDropdown(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </Dropdown>
      )}

      {/* Subcategories on hover */}
      {showSubcategories && category.subcategories && category.subcategories.length > 0 && (
        <div className="absolute left-0 top-full mt-2 w-full z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 max-h-96 overflow-y-auto">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Subcategories</p>
          <div className="space-y-2">
            {category.subcategories.map((sub) => (
              <SubcategoryItem
                key={sub.id}
                category={sub}
                onDelete={onDelete}
                onEdit={onEdit}
                onAddSubcategory={onAddSubcategory}
                level={1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Subcategory ----------
function SubcategoryItem({
  category,
  onDelete,
  onEdit,
  onAddSubcategory,
  level,
}: {
  category: Category;
  onDelete: (id: string) => void;
  onEdit: (category: Category) => void;
  onAddSubcategory: (parentId: string) => void;
  level: number;
}) {
  const [showNested, setShowNested] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownButtonRef = useRef<HTMLButtonElement | null>(null);
  const itemRef = useRef<HTMLDivElement | null>(null);
  const [nestedPosition, setNestedPosition] = useState({ top: 0, left: 0 });

  const hasNestedSubcategories = category.subcategories && category.subcategories.length > 0;

  // Calculate nested dropdown position
  useEffect(() => {
    if (showNested && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setNestedPosition({
        top: rect.top + window.scrollY,
        left: rect.right + window.scrollX + 8,
      });
    }
  }, [showNested]);

  return (
    <>
      <div
        ref={itemRef}
        className="relative"
        onMouseEnter={() => setShowNested(true)}
        onMouseLeave={() => setShowNested(false)}
      >
        <div className="flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded group/item">
          <ImageWithFallback
            src={category.image}
            alt={category.title}
            className="w-12 h-12 rounded object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm text-gray-900 dark:text-white truncate">{category.title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{category.description}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500">/{category.slug}</span>
              {hasNestedSubcategories && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded">
                  {category.subcategories?.length} sub
                </span>
              )}
            </div>
          </div>

          {/* Dropdown trigger */}
          <button
            ref={dropdownButtonRef}
            onClick={() => setShowDropdown(!showDropdown)}
            className="h-6 w-6 flex items-center justify-center opacity-0 group-hover/item:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>

        {/* Dropdown menu */}
        {showDropdown && (
          <Dropdown targetRef={dropdownButtonRef} onClose={() => setShowDropdown(false)}>
            <button
              onClick={() => {
                onEdit(category);
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() => {
                onAddSubcategory(category.id);
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Plus className="w-4 h-4" /> Add Subcategory
            </button>
            <button
              onClick={() => {
                onDelete(category.id);
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </Dropdown>
        )}
      </div>

      {/* Nested subcategories using portal for proper positioning */}
      {showNested && hasNestedSubcategories && createPortal(
        <div
          className="fixed w-64 z-[9998] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2"
          style={{ top: nestedPosition.top, left: nestedPosition.left }}
          onMouseEnter={() => setShowNested(true)}
          onMouseLeave={() => setShowNested(false)}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">Nested Subcategories</p>
          <div className="space-y-1">
            {category.subcategories?.map((nested) => (
              <SubcategoryItem
                key={nested.id}
                category={nested}
                onDelete={onDelete}
                onEdit={onEdit}
                onAddSubcategory={onAddSubcategory}
                level={level + 1}
              />
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}