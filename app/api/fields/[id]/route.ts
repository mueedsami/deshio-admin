import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'field.json');

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

// PUT: update an existing field
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const updatedField = await req.json();

    console.log('PUT request for ID:', id);
    console.log('Updated field data:', updatedField);

    // Validate the incoming data
    if (!updatedField.name || !updatedField.type) {
      return NextResponse.json({ 
        error: 'Invalid field data',
        details: 'Field name and type are required'
      }, { status: 400 });
    }

    ensureDataFile();

    // Read existing fields
    const data = fs.readFileSync(filePath, 'utf-8');
    const fields = JSON.parse(data);

    // Find and update the field
    const fieldIndex = fields.findIndex((f: any) => f.id === id);
    
    if (fieldIndex === -1) {
      return NextResponse.json({ 
        error: 'Field not found' 
      }, { status: 404 });
    }

    // Update the field
    fields[fieldIndex] = { ...fields[fieldIndex], ...updatedField };

    // Save back to file
    fs.writeFileSync(filePath, JSON.stringify(fields, null, 2), 'utf-8');
    console.log('Field updated successfully');

    return NextResponse.json(fields[fieldIndex]);
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ 
      error: 'Failed to update field',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// DELETE: remove a field
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    console.log('DELETE request for ID:', id);

    ensureDataFile();

    // Read existing fields
    const data = fs.readFileSync(filePath, 'utf-8');
    const fields = JSON.parse(data);

    // Filter out the field to delete
    const updatedFields = fields.filter((f: any) => f.id !== id);

    if (fields.length === updatedFields.length) {
      return NextResponse.json({ 
        error: 'Field not found' 
      }, { status: 404 });
    }

    // Save back to file
    fs.writeFileSync(filePath, JSON.stringify(updatedFields, null, 2), 'utf-8');
    console.log('Field deleted successfully');

    return NextResponse.json({ message: 'Field deleted successfully' });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete field',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}