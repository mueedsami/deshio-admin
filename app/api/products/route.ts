import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'product.json');

// Helper function to ensure data directory and file exist
function ensureDataFile() {
  const dataDir = path.join(process.cwd(), 'data');
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create file with empty array if it doesn't exist or is empty
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf-8');
  } else {
    // Check if file is empty or has invalid content
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (!content || content === '') {
      fs.writeFileSync(filePath, '[]', 'utf-8');
    }
  }
}

// GET: fetch all products
export async function GET() {
  try {
    ensureDataFile();
    
    const data = fs.readFileSync(filePath, 'utf-8');
    const products = JSON.parse(data);
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}

// POST: add a new product
export async function POST(req: NextRequest) {
  try {
    console.log('POST request received');
    
    const newProduct = await req.json();
    console.log('New product data:', newProduct);

    // Validate the incoming data
    if (!newProduct.name) {
      return NextResponse.json({ 
        error: 'Invalid product data',
        details: 'Product name is required'
      }, { status: 400 });
    }

    // Ensure file exists with valid content
    ensureDataFile();

    // Read existing products
    const data = fs.readFileSync(filePath, 'utf-8');
    const products = JSON.parse(data);
    console.log('Existing products:', products);

    // Add new product
    products.push(newProduct);

    // Save back to file with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
    console.log('Product saved successfully');

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ 
      error: 'Failed to save product',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

