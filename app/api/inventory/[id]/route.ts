import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'inventory.json');

function ensureDataFile() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
    }
  } catch (error) {
    console.error('Error ensuring data file:', error);
    throw error;
  }
}

// GET single inventory item by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    ensureDataFile();
    const data = fs.readFileSync(filePath, 'utf-8');
    const inventory = JSON.parse(data);
    
    const item = inventory.find((inv: any) => inv.id === Number(params.id));
    
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    
    return NextResponse.json(item);
  } catch (err) {
    console.error('GET Error:', err);
    return NextResponse.json({ error: 'Failed to load inventory item' }, { status: 500 });
  }
}

// PATCH - Update specific fields of inventory item
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const itemId = Number(params.id);
    
    ensureDataFile();
    const data = fs.readFileSync(filePath, 'utf-8');
    let inventory = JSON.parse(data);
    
    const index = inventory.findIndex((item: any) => item.id === itemId);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    
    // Partial update - only update provided fields
    inventory[index] = {
      ...inventory[index],
      ...body,
      id: itemId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(inventory, null, 2), 'utf-8');
    
    return NextResponse.json(inventory[index]);
  } catch (err) {
    console.error('PATCH Error:', err);
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}

// DELETE inventory item
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = Number(params.id);
    
    ensureDataFile();
    const data = fs.readFileSync(filePath, 'utf-8');
    let inventory = JSON.parse(data);
    
    const filteredInventory = inventory.filter((item: any) => item.id !== itemId);
    
    if (filteredInventory.length === inventory.length) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(filteredInventory, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, message: 'Inventory item deleted' });
  } catch (err) {
    console.error('DELETE Error:', err);
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}