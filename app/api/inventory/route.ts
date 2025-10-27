import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'inventory.json');

function ensureDataFile() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]', 'utf-8');
}

export async function GET() {
  try {
    ensureDataFile();
    const data = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load inventory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const newInventoryItem = await req.json();
    
    // Validate required fields
    if (!newInventoryItem.productId || !newInventoryItem.barcode || !newInventoryItem.costPrice || !newInventoryItem.sellingPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Add timestamp and ID if not present
    if (!newInventoryItem.id) {
      newInventoryItem.id = Date.now();
    }
    if (!newInventoryItem.createdAt) {
      newInventoryItem.createdAt = new Date().toISOString();
    }

    ensureDataFile();
    const data = fs.readFileSync(filePath, 'utf-8');
    const inventory = JSON.parse(data);
    inventory.push(newInventoryItem);
    fs.writeFileSync(filePath, JSON.stringify(inventory, null, 2), 'utf-8');

    return NextResponse.json(newInventoryItem, { status: 201 });
  } catch (err) {
    console.error('Error saving inventory:', err);
    return NextResponse.json({ error: 'Failed to save inventory item' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    ensureDataFile();
    const data = fs.readFileSync(filePath, 'utf-8');
    let inventory = JSON.parse(data);
    
    const index = inventory.findIndex((item: any) => item.id === body.id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    
    // Update the item with all fields from body
    inventory[index] = {
      ...inventory[index],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(inventory, null, 2), 'utf-8');
    
    return NextResponse.json(inventory[index]);
  } catch (err) {
    console.error('Error updating inventory:', err);
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    
    ensureDataFile();
    const data = fs.readFileSync(filePath, 'utf-8');
    let inventory = JSON.parse(data);
    
    inventory = inventory.filter((item: any) => item.id !== id);
    fs.writeFileSync(filePath, JSON.stringify(inventory, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}