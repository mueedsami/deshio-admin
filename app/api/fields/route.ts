import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'field.json');

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

// GET: fetch all fields
export async function GET() {
  try {
    ensureDataFile();
    
    const data = fs.readFileSync(filePath, 'utf-8');
    const fields = JSON.parse(data);
    
    return NextResponse.json(fields);
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'Failed to load fields' }, { status: 500 });
  }
}

// POST: add a new field
export async function POST(req: NextRequest) {
  try {
    console.log('POST request received');
    
    const newField = await req.json();
    console.log('New field data:', newField);

    // Validate the incoming data
    if (!newField.name || !newField.type) {
      return NextResponse.json({ 
        error: 'Invalid field data',
        details: 'Field name and type are required'
      }, { status: 400 });
    }

    // Ensure file exists with valid content
    ensureDataFile();

    // Read existing fields
    const data = fs.readFileSync(filePath, 'utf-8');
    const fields = JSON.parse(data);
    console.log('Existing fields:', fields);

    // Add new field
    fields.push(newField);

    // Save back to file with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(fields, null, 2), 'utf-8');
    console.log('Field saved successfully');

    return NextResponse.json(newField, { status: 201 });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ 
      error: 'Failed to save field',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}