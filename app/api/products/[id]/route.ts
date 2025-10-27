import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'product.json');

// Helper function to ensure data directory and file exist
function ensureDataFile() {
  const dataDir = path.join(process.cwd(), 'data');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf-8');
  } else {
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (!content || content === '') {
      fs.writeFileSync(filePath, '[]', 'utf-8');
    }
  }
}

// GET: fetch a single product by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    
    console.log('GET request for ID:', id);

    ensureDataFile();

    // Read existing products
    const data = fs.readFileSync(filePath, 'utf-8');
    const products = JSON.parse(data);

    // Find the product
    const product = products.find((p: any) => p.id === id);
    
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }

    console.log('Product found:', product);
    return NextResponse.json(product);
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch product',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// PUT: update an existing product
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const updatedProduct = await req.json();

    console.log('PUT request for ID:', id);
    console.log('Updated product data:', updatedProduct);

    // Validate the incoming data
    if (!updatedProduct.name) {
      return NextResponse.json({ 
        error: 'Invalid product data',
        details: 'Product name is required'
      }, { status: 400 });
    }

    ensureDataFile();

    // Read existing products
    const data = fs.readFileSync(filePath, 'utf-8');
    const products = JSON.parse(data);

    // Find and update the product
    const productIndex = products.findIndex((p: any) => p.id === id);
    
    if (productIndex === -1) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }

    // Update the product
    products[productIndex] = { ...products[productIndex], ...updatedProduct };

    // Save back to file
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
    console.log('Product updated successfully');

    return NextResponse.json(products[productIndex]);
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ 
      error: 'Failed to update product',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// DELETE: remove a product
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    console.log('DELETE request for ID:', id);

    ensureDataFile();

    // Read existing products
    const data = fs.readFileSync(filePath, 'utf-8');
    const products = JSON.parse(data);

    // Filter out the product to delete
    const updatedProducts = products.filter((p: any) => p.id !== id);

    if (products.length === updatedProducts.length) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }

    // Save back to file
    fs.writeFileSync(filePath, JSON.stringify(updatedProducts, null, 2), 'utf-8');
    console.log('Product deleted successfully');

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete product',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}