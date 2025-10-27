import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { triggerAccountingUpdate } from '@/lib/accounting-helper';
import { createBatchTransaction, removeTransaction } from '@/lib/transaction-helper';

const filePath = path.join(process.cwd(), 'data', 'batch.json');

function ensureDataFile() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]', 'utf-8');
}

// DELETE — already working
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    ensureDataFile();
    const data = fs.readFileSync(filePath, 'utf-8');
    let batches = JSON.parse(data);
    const id = parseInt(params.id);

    batches = batches.filter((b: any) => b.id !== id);
    fs.writeFileSync(filePath, JSON.stringify(batches, null, 2), 'utf-8');
   removeTransaction('batch', String(id));
    triggerAccountingUpdate();

    return NextResponse.json({ message: 'Batch deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    ensureDataFile();
    const id = parseInt(params.id);
    const body = await req.json();

    const data = fs.readFileSync(filePath, 'utf-8');
    let batches = JSON.parse(data);

    const index = batches.findIndex((b: any) => b.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Merge existing + new data
    batches[index] = { ...batches[index], ...body };

    fs.writeFileSync(filePath, JSON.stringify(batches, null, 2), 'utf-8');

    return NextResponse.json({ message: 'Batch updated', batch: batches[index] });
  } catch (err) {
    console.error('PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 });
  }
}
