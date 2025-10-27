import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'inventory-dispatch.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read dispatch records
async function readDispatches() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Write dispatch records
async function writeDispatches(dispatches: any[]) {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(dispatches, null, 2));
}

// GET - Fetch all dispatch records
export async function GET(request: Request) {
  try {
    const dispatches = await readDispatches();
    
    // Optional: Filter by query parameters
    const { searchParams } = new URL(request.url);
    const fromStore = searchParams.get('fromStore');
    const toStore = searchParams.get('toStore');
    const status = searchParams.get('status');
    
    let filtered = dispatches;
    
    if (fromStore) {
      filtered = filtered.filter((d: any) => d.fromStore === fromStore);
    }
    if (toStore) {
      filtered = filtered.filter((d: any) => d.toStore === toStore);
    }
    if (status) {
      filtered = filtered.filter((d: any) => d.status === status);
    }
    
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching dispatches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dispatch records' },
      { status: 500 }
    );
  }
}

// POST - Create new dispatch records (bulk or single)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dispatches = await readDispatches();
    
    // Handle both single object and array
    const newRecords = Array.isArray(body) ? body : [body];
    
    // Add records with IDs if not present
    const recordsWithIds = newRecords.map(record => ({
      ...record,
      id: record.id || Date.now() + Math.random(),
      createdAt: record.createdAt || new Date().toISOString()
    }));
    
    dispatches.push(...recordsWithIds);
    await writeDispatches(dispatches);
    
    return NextResponse.json(recordsWithIds, { status: 201 });
  } catch (error) {
    console.error('Error creating dispatch records:', error);
    return NextResponse.json(
      { error: 'Failed to create dispatch records' },
      { status: 500 }
    );
  }
}

// PUT - Update dispatch record (e.g., mark as delivered)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const dispatches = await readDispatches();
    
    const index = dispatches.findIndex((d: any) => d.id === body.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Dispatch record not found' },
        { status: 404 }
      );
    }
    
    // Update the record
    dispatches[index] = {
      ...dispatches[index],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    await writeDispatches(dispatches);
    
    return NextResponse.json(dispatches[index]);
  } catch (error) {
    console.error('Error updating dispatch record:', error);
    return NextResponse.json(
      { error: 'Failed to update dispatch record' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a dispatch record
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Dispatch ID is required' },
        { status: 400 }
      );
    }
    
    const dispatches = await readDispatches();
    const filtered = dispatches.filter((d: any) => d.id != id);
    
    if (filtered.length === dispatches.length) {
      return NextResponse.json(
        { error: 'Dispatch record not found' },
        { status: 404 }
      );
    }
    
    await writeDispatches(filtered);
    
    return NextResponse.json({ message: 'Dispatch record deleted successfully' });
  } catch (error) {
    console.error('Error deleting dispatch record:', error);
    return NextResponse.json(
      { error: 'Failed to delete dispatch record' },
      { status: 500 }
    );
  }
}