'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Plus } from 'lucide-react';
import FieldTable from '@/components/FieldTable';
import SearchBar from '@/components/SearchBar';
import PaginationControls from '@/components/PaginationControls';
import AddItemModal from '@/components/AddItemModal';

interface Field {
  id: number;
  name: string;
  type: string;
  mode?: string;
  description?: string;
}

export default function FieldPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const fieldsPerPage = 4;

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/fields');
        
        if (!res.ok) {
          console.error('Failed to fetch fields:', res.status);
          setFields([]);
          return;
        }
        
        const data = await res.json();
        console.log('Fetched fields:', data);
        setFields(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching fields:', error);
        setFields([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFields();
  }, []);

  const filteredFields = useMemo(() => {
    if (!Array.isArray(fields)) {
      console.warn('fields is not an array:', fields);
      return [];
    }
    
    return fields.filter((f) =>
      f?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [fields, searchTerm]);

  const totalPages = Math.ceil(filteredFields.length / fieldsPerPage);
  const startIndex = (currentPage - 1) * fieldsPerPage;
  const currentFields = filteredFields.slice(startIndex, startIndex + fieldsPerPage);

  const handleAddField = async (data: Record<string, string | number>) => {
    try {
      const newField = { 
        id: Date.now(), 
        name: data.name as string,
        type: data.type as string,
        mode: data.mode as string, 
      };

      console.log('Sending new field:', newField);

      const res = await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newField),
      });

      if (res.ok) {
        const savedField = await res.json();
        console.log('Saved field:', savedField);
        setFields((prev) => [...prev, savedField]);
        setShowForm(false);
      } else {
        const errorData = await res.json();
        console.error('Server error:', errorData);
        alert(`Failed to save field: ${errorData.details || errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving field:', error);
      alert('Network error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleEditField = async (data: Record<string, string | number>) => {
    if (!editingField) return;

    try {
      const updatedField = {
        ...editingField,
        name: data.name as string,
        type: data.type as string,
        mode: data.mode as string,
      };

      console.log('Updating field:', updatedField);

      const res = await fetch(`/api/fields/${editingField.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedField),
      });

      if (res.ok) {
        const savedField = await res.json();
        console.log('Updated field:', savedField);
        setFields((prev) => 
          prev.map((f) => (f.id === editingField.id ? savedField : f))
        );
        setShowForm(false);
        setEditingField(null);
      } else {
        const errorData = await res.json();
        console.error('Server error:', errorData);
        alert(`Failed to update field: ${errorData.details || errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating field:', error);
      alert('Network error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this field?')) return;

    try {
      const res = await fetch(`/api/fields/${id}`, {
        method: 'DELETE' 
      });

      if (res.ok) {
        setFields(fields.filter((f) => f.id !== id));
        console.log('Field deleted successfully');
      } else {
        const errorData = await res.json();
        alert(`Failed to delete field: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting field:', error);
      alert('Failed to delete field');
    }
  };

  const handleEdit = (field: Field) => {
    setEditingField(field);
    setShowForm(true);
  };

  const handleCloseModal = () => {
    setShowForm(false);
    setEditingField(null);
  };

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen`}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 bg-gray-50 dark:bg-gray-900 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fields
            </h2>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add Field
            </button>
          </div>

          <SearchBar value={searchTerm} onChange={setSearchTerm} />
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading fields...
            </div>
          ) : (
            <>
              <FieldTable 
                fields={currentFields} 
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}

          <AddItemModal
            open={showForm}
            title={editingField ? 'Edit Field' : 'Add New Field'}
            fields={[
              { name: 'name', label: 'Field Name', type: 'text' },
              { name: 'type', label: 'Type', type: 'select', options: ['Text', 'Number', 'Image'] },
              { name: 'mode', label: 'Selection Mode', type: 'radio', options: ['Single', 'Multiple'] },
            ]}
            initialData={
              editingField
                ? { name: editingField.name, type: editingField.type, mode: 'Single' }
                : undefined
            }
            onClose={handleCloseModal}
            onSave={editingField ? handleEditField : handleAddField}
          />

        </main>
      </div>
    </div>
  );
}