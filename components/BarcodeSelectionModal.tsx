"use client";
import React, { useState } from "react";
import BarcodeItem from "./BarcodeItem";

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  codes: string[];
  productName: string;
  price?: number;
  onPrint: (selected: string[], quantities: Record<string, number>) => void;
}

export default function BarcodeSelectionModal({
  isOpen,
  onClose,
  codes,
  productName,
  price,
  onPrint,
}: BarcodeModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const toggleSelect = (code: string) => {
    setSelected((prev) => {
      const isCurrentlySelected = prev.includes(code);
      if (isCurrentlySelected) {
        const newQuantities = { ...quantities };
        delete newQuantities[code];
        setQuantities(newQuantities);
        return prev.filter((c) => c !== code);
      } else {
        setQuantities({ ...quantities, [code]: 1 });
        return [...prev, code];
      }
    });
  };

  const updateQuantity = (code: string, qty: number) => {
    setQuantities({ ...quantities, [code]: Math.max(1, qty) });
  };

  const toggleSelectAll = () => {
    if (selected.length === codes.length) {
      setSelected([]);
      setQuantities({});
    } else {
      setSelected([...codes]);
      const newQuantities: Record<string, number> = {};
      codes.forEach((code) => {
        newQuantities[code] = quantities[code] || 1;
      });
      setQuantities(newQuantities);
    }
  };

  const handlePrint = () => {
    if (selected.length === 0) {
      alert("Please select at least one barcode.");
      return;
    }
    onPrint(selected, quantities);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[85vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b">
          <h2 className="text-base font-semibold">Barcodes for {productName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-3 py-2.5">
          {/* Select All Checkbox */}
          <div className="mb-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.length === codes.length}
                onChange={toggleSelectAll}
                className="w-4 h-4"
              />
              <span className="font-medium text-sm">Select All</span>
            </label>
          </div>

          {/* Barcode List */}
          <div className="space-y-2">
            {codes.map((code) => (
              <BarcodeItem
                key={code}
                code={code}
                isSelected={selected.includes(code)}
                quantity={quantities[code] || 1}
                productName={productName}
                price={price}
                onToggle={toggleSelect}
                onQuantityChange={updateQuantity}
              />
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-3 py-2.5 border-t bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-800 flex items-center gap-2"
          >
            Print Barcodes
          </button>
        </div>
      </div>
    </div>
  );
}