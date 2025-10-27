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

export async function GET() {
  try {
    ensureDataFile();
    const data = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load batches' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const newBatch = await req.json();
    if (!newBatch.productId || !newBatch.costPrice || !newBatch.sellingPrice || !newBatch.quantity) {
      return NextResponse.json({ error: 'Missing batch data' }, { status: 400 });
    }

    newBatch.id = Date.now();
    newBatch.baseCode = `BATCH${newBatch.id}`;

    ensureDataFile();
    const data = fs.readFileSync(filePath, 'utf-8');
    const batches = JSON.parse(data);
    batches.push(newBatch);
    fs.writeFileSync(filePath, JSON.stringify(batches, null, 2), 'utf-8');
    triggerAccountingUpdate();
    createBatchTransaction(newBatch);
    return NextResponse.json(newBatch, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save batch' }, { status: 500 });
  }
}
