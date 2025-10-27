import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronDown } from 'lucide-react';

export default function CategorySidebar({ categories, expandedCategories, onToggleCategory, activeSlug }: any) {
  const router = useRouter();

  const renderCategoryTree = (cats: any[], level: number = 0) => {
    return cats.map((cat: any) => {
      const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
      const isExpanded = expandedCategories.has(cat.id);
      const isActive = activeSlug === cat.slug;

      return (
        <div key={cat.id}>
          <div
            className={`flex items-center justify-between py-2.5 px-3 cursor-pointer transition-colors ${
              isActive ? 'text-red-700 font-semibold' : 'text-gray-700 hover:text-gray-900'
            }`}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
          >
            <span
              onClick={() => router.push(`/e-commerce/${cat.slug}`)}
              className="flex-1"
            >
              {cat.title}
            </span>
            <div className="flex items-center gap-2">
              {hasSubcategories && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCategory(cat.id);
                  }}
                  className="p-0.5"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              )}
            </div>
          </div>
          {hasSubcategories && isExpanded && (
            <div>{renderCategoryTree(cat.subcategories, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <div className="bg-white border border-gray-200 rounded-lg sticky top-4">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">PRODUCT CATEGORIES</h3>
        </div>
        <div className="p-4 max-h-[600px] overflow-y-auto">
          {renderCategoryTree(categories)}
        </div>
      </div>
    </aside>
  );
}