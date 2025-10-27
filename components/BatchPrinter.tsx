"use client";
import React, { useState, useEffect } from "react";
import BarcodeSelectionModal from "./BarcodeSelectionModal";

interface Product {
  id: number;
  name: string;
}

interface Batch {
  id: number;
  productId: number;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  baseCode: string;
}

interface BatchPrinterProps {
  batch: Batch;
  product?: Product;
}

export default function BatchPrinter({ batch, product }: BatchPrinterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQzLoaded, setIsQzLoaded] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20; // Try for ~2 seconds

    const checkQZ = () => {
      attempts++;
      console.log(`Attempt ${attempts}: Checking for QZ Tray...`);
      
      if (typeof window !== "undefined" && (window as any).qz) {
        console.log("✅ QZ Tray library found!");
        console.log("QZ object:", (window as any).qz);
        setIsQzLoaded(true);
        return true;
      }
      
      console.log("❌ QZ Tray not found yet");
      return false;
    };

    // Try immediate check
    if (checkQZ()) return;

    // Set up interval to keep checking
    const interval = setInterval(() => {
      if (checkQZ() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          console.error("Failed to load QZ Tray after maximum attempts");
          console.log("Available on window:", Object.keys(window).filter(k => k.toLowerCase().includes('qz')));
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Generate barcode strings
  const codes = Array.from({ length: batch.quantity }).map(
    (_, i) => `${batch.baseCode}-${String(i + 1).padStart(2, "0")}`
  );

  // Print using QZ Tray
  const handleQZPrint = async (
    selected: string[],
    quantities: Record<string, number>
  ) => {
    // Check if QZ Tray is loaded
    if (!(window as any).qz) {
      alert("QZ Tray library not loaded. Please refresh the page.");
      return;
    }

    try {
      // Check if QZ Tray is running
      if (!(await (window as any).qz.websocket.isActive())) {
        await (window as any).qz.websocket.connect();
      }

      // Get default printer or specify one
      const config = (window as any).qz.configs.create(null);

      // Create print data with multiple copies based on quantity
      const data: any[] = [];
      selected.forEach((code) => {
        const qty = quantities[code] || 1;
        for (let i = 0; i < qty; i++) {
          data.push({
            type: "html",
            format: "plain",
            data: `
              <html>
                <head>
                  <script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js"></script>
                  <style>
                    body { margin: 0; padding: 10px; font-family: Arial, sans-serif; }
                    .barcode-container { text-align: center; }
                    .product-name { font-weight: bold; font-size: 14px; margin-bottom: 3px; }
                    .price { font-size: 16px; font-weight: bold; color: #000; margin-bottom: 5px; }
                  </style>
                </head>
                <body>
                  <div class="barcode-container">
                    <div class="product-name">${product?.name || 'Product'}</div>
                    <div class="price">৳${batch.sellingPrice}</div>
                    <svg id="barcode-${code}-${i}"></svg>
                    <script>
                      JsBarcode("#barcode-${code}-${i}", "${code}", {
                        format:"CODE128",
                        width: 2,
                        height: 50,
                        displayValue: true
                      });
                    </script>
                  </div>
                </body>
              </html>
            `,
          });
        }
      });

      await (window as any).qz.print(config, data);
      alert("Barcodes sent to printer successfully!");
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Print error:", err);
      
      if (err.message && err.message.includes("Unable to establish connection")) {
        alert("QZ Tray is not running. Please start QZ Tray and try again.");
      } else {
        alert(`Print failed: ${err.message || "Unknown error"}`);
      }
    } finally {
      try {
        if ((window as any).qz.websocket.isActive()) {
          await (window as any).qz.websocket.disconnect();
        }
      } catch (e) {
        console.error("Disconnect error:", e);
      }
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!isQzLoaded}
        title={!isQzLoaded ? "Loading QZ Tray..." : ""}
      >
        {isQzLoaded ? "Print Barcodes" : "Loading QZ Tray..."}
      </button>

      <BarcodeSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        codes={codes}
        productName={product?.name || "Product"}
        price={batch.sellingPrice}
        onPrint={handleQZPrint}
      />
    </div>
  );
}