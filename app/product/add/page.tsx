'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, X, Upload, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

// --- Types -----------------------------------------------------------------
interface Field {
  id: number;
  name: string;
  type: string;
  mode?: string;
}

interface Category {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  image?: string;
  subcategories?: Category[];
}

interface FieldValue {
  fieldId: number;
  fieldName: string;
  fieldType: string;
  value: any;
  instanceId: string;
}

interface VariationData {
  id: string;
  values: {
    color: string;
    size: string;
    image: string[];
  };
}

// --- Component -------------------------------------------------------------
export default function AddEditProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  const isEditMode = !!productId;

  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(v => !v);
  const [activeTab, setActiveTab] = useState<'general' | 'variations'>('general');

  // General Information Section
  const [formData, setFormData] = useState({
    name: '',
    mainImage: '',
  });
  
  // Dynamic category selection using individual keys
  const [categorySelection, setCategorySelection] = useState<Record<string, string>>({});
  
  const [generalFields, setGeneralFields] = useState<FieldValue[]>([]);
  const [uploadingMain, setUploadingMain] = useState(false);

  // Variations Section - Fixed fields: color, size, image
  const variationFieldsConfig = {
    color: { name: 'Color', type: 'text' },
    size: { name: 'Size', type: 'dropdown', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
    image: { name: 'Image', type: 'image' }
  };

  const [variations, setVariations] = useState<VariationData[]>([]);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get category path as array from selection object
  const getCategoryPathArray = (): string[] => {
    const path: string[] = [];
    let level = 0;
    
    while (categorySelection[`level${level}`]) {
      path.push(categorySelection[`level${level}`]);
      level++;
    }
    
    return path;
  };

  // Helper function to find a category by path
  const findCategoryByPath = (path: string[]): Category | null => {
    if (path.length === 0) return null;
    
    let current: Category[] = categories;
    let found: Category | null = null;
    
    for (const id of path) {
      found = current.find(c => c.id === id) || null;
      if (!found) return null;
      current = found.subcategories || [];
    }
    
    return found;
  };

  // Fetch initial data (categories and fields)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const fetchPromises = [
          fetch('/api/fields'),
          fetch('/api/categories')
        ];

        const responses = await Promise.all(fetchPromises);
        const [fieldsRes, categoriesRes] = responses;

        let fieldsData: Field[] = [];
        if (fieldsRes.ok) {
          const data = await fieldsRes.json();
          fieldsData = Array.isArray(data) ? data : [];
        } else {
          console.error('Failed to fetch fields:', fieldsRes.statusText);
        }

        let categoriesData: Category[] = [];
        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          categoriesData = Array.isArray(data) ? data : [];
        } else {
          console.error('Failed to fetch categories:', categoriesRes.statusText);
        }

        setAvailableFields(fieldsData);
        setCategories(categoriesData);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch existing product data if editing
  useEffect(() => {
    if (!isEditMode || !productId || availableFields.length === 0) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch product');
        }

        const product = await res.json();
        
        // Set basic form data
        setFormData({
          name: product.name || '',
          mainImage: product.attributes?.mainImage || '',
        });

        // Reconstruct category selection from attributes
        if (product.attributes) {
          const newSelection: Record<string, string> = {};
          
          // Check for old format (category, subcategory, subSubcategory)
          if (product.attributes.category) {
            newSelection.level0 = product.attributes.category;
          }
          if (product.attributes.subcategory) {
            newSelection.level1 = product.attributes.subcategory;
          }
          if (product.attributes.subSubcategory) {
            newSelection.level2 = product.attributes.subSubcategory;
          }
          
          // Check for new format (categoryPath array)
          if (product.attributes.categoryPath && Array.isArray(product.attributes.categoryPath)) {
            product.attributes.categoryPath.forEach((id: string, index: number) => {
              newSelection[`level${index}`] = id;
            });
          }
          
          setCategorySelection(newSelection);
        }

        // Reconstruct general fields from attributes
        const attrs = product.attributes || {};
        const reconstructedFields: FieldValue[] = [];
        
        Object.keys(attrs).forEach((key) => {
          // Skip the base attributes but INCLUDE variation-specific attributes (color, size, variationImages)
          if (['mainImage', 'category', 'subcategory', 'subSubcategory', 'categoryPath', 'groupMainImage'].includes(key)) return;
          
          // Handle variation images specially
          if (key === 'variationImages') {
            // Find or create an image field for variation images
            const imageFieldDef = availableFields.find(f => f.type.toLowerCase() === 'image');
            if (imageFieldDef) {
              reconstructedFields.push({
                fieldId: imageFieldDef.id,
                fieldName: 'Variation Images',
                fieldType: 'image',
                value: attrs[key],
                instanceId: `gen-varimages-${Date.now()}`
              });
            }
            return;
          }
          
          // Handle color field
          if (key === 'color') {
            const fieldDef = availableFields.find(f => f.name.toLowerCase() === 'color');
            if (fieldDef) {
              reconstructedFields.push({
                fieldId: fieldDef.id,
                fieldName: fieldDef.name,
                fieldType: fieldDef.type,
                value: attrs[key],
                instanceId: `gen-${fieldDef.id}-${Date.now()}-${Math.random()}`
              });
            }
            return;
          }
          
          // Handle size field - create it even if field doesn't exist in availableFields
          if (key === 'size') {
            const fieldDef = availableFields.find(f => f.name.toLowerCase() === 'size');
            if (fieldDef) {
              reconstructedFields.push({
                fieldId: fieldDef.id,
                fieldName: fieldDef.name,
                fieldType: fieldDef.type,
                value: attrs[key],
                instanceId: `gen-${fieldDef.id}-${Date.now()}-${Math.random()}`
              });
            } else {
              // Create a size field even if it doesn't exist in availableFields
              reconstructedFields.push({
                fieldId: 9999, // Temporary ID for size
                fieldName: 'Size',
                fieldType: 'text',
                value: attrs[key],
                instanceId: `gen-size-${Date.now()}-${Math.random()}`
              });
            }
            return;
          }
          
          // Find the matching field definition for other fields
          const fieldDef = availableFields.find(f => f.name === key);
          if (fieldDef) {
            reconstructedFields.push({
              fieldId: fieldDef.id,
              fieldName: key,
              fieldType: fieldDef.type,
              value: attrs[key],
              instanceId: `gen-${fieldDef.id}-${Date.now()}-${Math.random()}`
            });
          }
        });

        setGeneralFields(reconstructedFields);

      } catch (error) {
        console.error('Error fetching product:', error);
        alert('Failed to load product data');
      }
    };

    fetchProduct();
  }, [isEditMode, productId, availableFields]);

  // ========== GENERAL INFORMATION SECTION ==========
  const addGeneralField = (field: Field) => {
    const instanceId = `gen-${field.id}-${Date.now()}-${Math.random()}`;
    const newFieldValue: FieldValue = {
      fieldId: field.id,
      fieldName: field.name,
      fieldType: field.type,
      value: field.type === 'image' ? [] : '',
      instanceId
    };
    setGeneralFields([...generalFields, newFieldValue]);
  };

  const removeGeneralField = (instanceId: string) => {
    setGeneralFields(generalFields.filter(f => f.instanceId !== instanceId));
  };

  const updateGeneralFieldValue = (instanceId: string, value: any) => {
    setGeneralFields(generalFields.map(f => 
      f.instanceId === instanceId ? { ...f, value } : f
    ));
  };

  const uploadImageHelper = async (file: File): Promise<string | null> => {
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.url || null;
    } catch (e) {
      console.error('Upload error', e);
      return null;
    }
  };

  const handleGeneralImageUpload = async (file: File, isMainImage: boolean, instanceId: string = '') => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (isMainImage) setUploadingMain(true);

    try {
      const url = await uploadImageHelper(file);
      if (!url) throw new Error('Upload returned no url');

      if (isMainImage) {
        setFormData(prev => ({ ...prev, mainImage: url }));
      } else if (instanceId) {
        setGeneralFields(prev => prev.map(f => {
          if (f.instanceId === instanceId) {
            // Always treat as array for image fields
            const currentImages = Array.isArray(f.value) ? f.value : (f.value ? [f.value] : []);
            return { ...f, value: [...currentImages, url] };
          }
          return f;
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      if (isMainImage) setUploadingMain(false);
    }
  };

  // ========== VARIATION SECTION ==========
  const addVariation = () => {
    const newVarId = `var-${Date.now()}-${Math.random()}`;
    setVariations([...variations, { 
      id: newVarId, 
      values: { color: '', size: '', image: [] }
    }]);
  };

  const removeVariation = (varId: string) => {
    setVariations(variations.filter(v => v.id !== varId));
  };

  const updateVariationValue = (varId: string, field: 'color' | 'size', value: string) => {
    setVariations(variations.map(v => 
      v.id === varId ? { ...v, values: { ...v.values, [field]: value } } : v
    ));
  };

  const handleVariationImageUpload = async (file: File, varId: string) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    const url = await uploadImageHelper(file);
    if (url) {
      setVariations(prev => prev.map(v => {
        if (v.id === varId) {
          return {
            ...v,
            values: { ...v.values, image: [...v.values.image, url] }
          };
        }
        return v;
      }));
    }
  };

  const removeVariationImage = (varId: string, imgUrl: string) => {
    setVariations(prev => prev.map(v => {
      if (v.id === varId) {
        return {
          ...v,
          values: { ...v.values, image: v.values.image.filter(img => img !== imgUrl) }
        };
      }
      return v;
    }));
  };

  // Helper to generate variation name
  const generateVariationName = (baseName: string, variation: VariationData): string => {
    const parts = [baseName];
    if (variation.values.color) parts.push(variation.values.color);
    if (variation.values.size) parts.push(variation.values.size);
    return parts.join('-');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Product name is required');
      return;
    }
    if (!formData.mainImage) {
      alert('Main image is required');
      return;
    }
    
    const categoryPath = getCategoryPathArray();
    if (categoryPath.length === 0) {
      alert('Category is required');
      return;
    }

    // Validate variations if they exist
    if (variations.length > 0) {
      for (const variation of variations) {
        if (variation.values.image.length === 0) {
          alert('All variations must have at least one image');
          return;
        }
        // Only validate that at least color OR size is provided
        if (!variation.values.color && !variation.values.size) {
          alert('Each variation must have at least color or size specified');
          return;
        }
      }
    }

    try {
      // Build base attributes using the old format (category, subcategory, subSubcategory, etc.)
      const baseAttributes: Record<string, any> = {
        mainImage: formData.mainImage,
      };
      
      // Add category levels in old format - always add them even if empty string
      baseAttributes.category = categoryPath[0] || '';
      baseAttributes.subcategory = categoryPath[1] || '';
      if (categoryPath.length > 2 || categoryPath[2]) {
        baseAttributes.subSubcategory = categoryPath[2] || '';
      }
      
      // For levels beyond 3, use level3, level4, level5, etc.
      for (let i = 3; i < categoryPath.length; i++) {
        if (categoryPath[i]) {
          baseAttributes[`level${i}`] = categoryPath[i];
        }
      }

      // Add general fields
      generalFields.forEach(gf => {
        baseAttributes[gf.fieldName] = gf.value;
      });

      if (isEditMode) {
        // UPDATE existing product
        // Check if this is a variation product and update accordingly
        const variationImagesField = generalFields.find(f => f.fieldName === 'Variation Images');
        const colorField = generalFields.find(f => f.fieldName.toLowerCase() === 'color');
        const sizeField = generalFields.find(f => f.fieldName.toLowerCase() === 'size');
        
        if (variationImagesField && variationImagesField.value && Array.isArray(variationImagesField.value) && variationImagesField.value.length > 0) {
          // This is a variation product - update with variation-specific fields
          baseAttributes.mainImage = variationImagesField.value[0]; // First image as main
          baseAttributes.variationImages = variationImagesField.value;
          
          if (colorField) {
            baseAttributes.color = colorField.value;
          }
          if (sizeField) {
            baseAttributes.size = sizeField.value;
          }
        }

        const product = {
          id: parseInt(productId!),
          name: formData.name,
          attributes: baseAttributes
        };

        const res = await fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });

        if (res.ok) {
          alert('Product updated successfully!');
          router.push('/product/list');
        } else {
          alert('Failed to update product');
        }
      } else {
        // CREATE new product(s)
        const savePromises = [];

        if (variations.length > 0) {
          // Save each variation as a separate product with variation name
          variations.forEach((variation, idx) => {
            const variationName = generateVariationName(formData.name, variation);
            
            // Use variation image as main image, keep original main image for grouping reference
            const variationAttributes = {
              ...baseAttributes,
              mainImage: variation.values.image[0], // Use first variation image as main
              groupMainImage: formData.mainImage, // Keep original for grouping
              color: variation.values.color,
              size: variation.values.size,
              variationImages: variation.values.image
            };

            const varProduct = {
              id: Date.now() + idx,
              name: variationName,
              attributes: variationAttributes
            };

            savePromises.push(
              fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(varProduct)
              })
            );
          });
        } else {
          // Save single product
          const product = {
            id: Date.now(),
            name: formData.name,
            attributes: baseAttributes
          };

          savePromises.push(
            fetch('/api/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(product)
            })
          );
        }

        const results = await Promise.all(savePromises);
        const allSuccess = results.every(res => res.ok);

        if (allSuccess) {
          const count = variations.length > 0 ? variations.length : 1;
          alert(`Successfully saved ${count} product(s)!`);
          router.push('/product/list');
        } else {
          alert('Some products failed to save');
        }
      }
    } catch (error) {
      console.error('Error saving products:', error);
      alert('Failed to save product');
    }
  };

  // Get readable category path for display
  const getCategoryPathDisplay = (): string => {
    const path = getCategoryPathArray();
    const names: string[] = [];
    let current: Category[] = categories;
    
    for (const id of path) {
      const cat = current.find(c => c.id === id);
      if (cat) {
        names.push(cat.title);
        current = cat.subcategories || [];
      }
    }
    
    return names.join(' > ') || 'None selected';
  };

  const renderFieldValue = (field: FieldValue) => {
    const { instanceId, fieldType, fieldName, value } = field;

    // Check if this is a Size field - use dropdown
    if (fieldName.toLowerCase() === 'size') {
      return (
        <select
          value={value || ''}
          onChange={(e) => updateGeneralFieldValue(instanceId, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Select size</option>
          {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      );
    }

    // Check if this is a Color field - use text input with color styling
    if (fieldName.toLowerCase() === 'color') {
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => updateGeneralFieldValue(instanceId, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="e.g., Blue, Red, Black"
        />
      );
    }

    switch (fieldType.toLowerCase()) {
      case 'text':
      case 'number':
        return (
          <input
            type={fieldType === 'number' ? 'number' : 'text'}
            value={value || ''}
            onChange={(e) => updateGeneralFieldValue(instanceId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder={`Enter ${field.fieldName.toLowerCase()}`}
          />
        );

      case 'image':
        const images = Array.isArray(value) ? value : (value ? [value] : []);
        const isVariationImages = fieldName === 'Variation Images';
        
        return (
          <div className="space-y-2">
            {isVariationImages && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                These are the product variation images. First image is used as the main image for this variation.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {images.map((img: string, idx: number) => (
                <div key={idx} className="relative">
                  <img 
                    src={img} 
                    alt={`Preview ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600" 
                  />
                  {isVariationImages && idx === 0 && (
                    <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                      Main
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = images.filter((_: any, i: number) => i !== idx);
                      updateGeneralFieldValue(instanceId, newImages);
                    }}
                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <label className="cursor-pointer w-20 h-20 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                <Plus className="w-6 h-6 text-gray-400" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleGeneralImageUpload(file, false, instanceId);
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-600 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen`}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              {isEditMode ? 'Edit Product' : 'Add New Product'}
            </h1>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-300 dark:border-gray-700 mb-8">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                General Information
              </button>
              {!isEditMode && (
                <button
                  onClick={() => setActiveTab('variations')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'variations'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  Add Variations
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* ========== GENERAL INFORMATION TAB ========== */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter product name"
                    />
                  </div>

                  {/* Main Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Main Image <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {variations.length > 0 ? 'This image will be used for grouping variations together on the e-commerce platform' : 'This will be the main product image'}
                    </p>
                    <label className="cursor-pointer block">
                      <div className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                        <Upload className="w-5 h-5" />
                        <span className="text-sm">{uploadingMain ? 'Uploading...' : 'Choose Main Image'}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleGeneralImageUpload(file, true);
                        }}
                        disabled={uploadingMain}
                        className="hidden"
                      />
                    </label>

                    {formData.mainImage && (
                      <div className="mt-3 relative">
                        <img src={formData.mainImage} alt="Main preview" className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, mainImage: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category Path <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Display current path */}
                    <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Current selection:</div>
                      <div className="font-medium text-gray-900 dark:text-white">{getCategoryPathDisplay()}</div>
                    </div>

                    {/* Category path selection */}
                    <div className="space-y-3">
                      {/* Render category dropdowns based on current selection */}
                      {[...Array(Object.keys(categorySelection).length + 1)].map((_, level) => {
                        const pathUpToLevel = getCategoryPathArray().slice(0, level);
                        let availableOptions: Category[] = [];
                        
                        if (level === 0) {
                          availableOptions = categories;
                        } else {
                          const parent = findCategoryByPath(pathUpToLevel);
                          availableOptions = parent?.subcategories || [];
                        }

                        // Only render if there are options available
                        if (availableOptions.length === 0) return null;

                        const currentValue = categorySelection[`level${level}`] || '';
                        const levelLabel = level === 0 ? 'Category' : level === 1 ? 'Subcategory' : level === 2 ? 'Sub-subcategory' : `Level ${level + 1}`;

                        return (
                          <div key={level}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {levelLabel} {level === 0 && <span className="text-red-500">*</span>}
                            </label>
                            <select
                              value={currentValue}
                              onChange={(e) => {
                                const newSelection: Record<string, string> = {};
                                
                                // Keep all selections up to this level
                                for (let i = 0; i < level; i++) {
                                  if (categorySelection[`level${i}`]) {
                                    newSelection[`level${i}`] = categorySelection[`level${i}`];
                                  }
                                }
                                
                                // Add the new selection
                                if (e.target.value) {
                                  newSelection[`level${level}`] = e.target.value;
                                }
                                
                                setCategorySelection(newSelection);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">Select {levelLabel.toLowerCase()}</option>
                              {availableOptions.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.title}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reset button */}
                    {Object.keys(categorySelection).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCategorySelection({})}
                        className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                      >
                        Clear category selection
                      </button>
                    )}
                  </div>

                  {/* Dynamic General Fields */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Fields</h3>
                    
                    {generalFields.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No additional fields added yet.</p>
                    ) : (
                      <div className="space-y-4 mb-4">
                        {generalFields.map((field) => (
                          <div key={field.instanceId}>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {field.fieldName}
                              </label>
                              <button
                                type="button"
                                onClick={() => removeGeneralField(field.instanceId)}
                                className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {renderFieldValue(field)}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Available Fields to Add */}
                    <div className="border-t border-gray-300 dark:border-gray-700 pt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Select fields to add:</p>
                      <div className="flex flex-wrap gap-2">
                        {availableFields
                          .filter(f => !generalFields.find(gf => gf.fieldId === f.id))
                          .map((field) => (
                            <button
                              key={field.id}
                              type="button"
                              onClick={() => addGeneralField(field)}
                              className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              {field.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== ADD VARIATIONS TAB ========== */}
              {activeTab === 'variations' && !isEditMode && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Product Variations</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Create variations with different colors, sizes, and images. Each variation will be saved with a name like: "{formData.name || 'Product'}-Blue-XS"
                    </p>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">How Variations Work:</h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                        <li>• <strong>Main Image (General Info)</strong>: Used for grouping variations together on the e-commerce platform</li>
                        <li>• <strong>Variation Image</strong>: Displayed when viewing individual product variations</li>
                        <li>• Each variation requires at least one image and either color or size (or both)</li>
                        <li>• You can add only color variations, only size variations, or both</li>
                      </ul>
                    </div>
                  </div>

                  {/* Variations */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Variations</h3>

                    {variations.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No variations yet. Click "Add Variation" to create one.</p>
                    ) : null}

                    <div className="space-y-4 mb-4">
                      {variations.map((variation, varIdx) => {
                        const previewName = generateVariationName(formData.name || 'Product', variation);
                        
                        return (
                          <div key={variation.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-300 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">Variation {varIdx + 1}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  Will be saved as: <span className="font-medium text-gray-900 dark:text-white">{previewName}</span>
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeVariation(variation.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-4">
                              {/* Color Field */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Color <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={variation.values.color || ''}
                                  onChange={(e) => updateVariationValue(variation.id, 'color', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                  placeholder="e.g., Blue, Red, Black"
                                />
                              </div>

                              {/* Size Field */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Size <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={variation.values.size || ''}
                                  onChange={(e) => updateVariationValue(variation.id, 'size', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                >
                                  <option value="">Select size</option>
                                  {variationFieldsConfig.size.options.map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Image Field */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Variation Images <span className="text-red-500">*</span>
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  First image will be used as the main image for this variation
                                </p>
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {variation.values.image.map((imgUrl: string, imgIdx: number) => (
                                      <div key={imgIdx} className="relative">
                                        <img
                                          src={imgUrl}
                                          alt="Variation"
                                          className="w-20 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                                        />
                                        {imgIdx === 0 && (
                                          <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                                            Main
                                          </div>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => removeVariationImage(variation.id, imgUrl)}
                                          className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}

                                    <label className="cursor-pointer w-20 h-20 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                                      <Plus className="w-6 h-6 text-gray-400" />
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleVariationImageUpload(file, variation.id);
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={addVariation}
                      className="w-full py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium transition-colors"
                    >
                      Add Another Variation
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium transition-colors"
              >
                {isEditMode ? 'Update Product' : `Save Product${variations.length > 0 ? `s (${variations.length})` : ''}`}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}