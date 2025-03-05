import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the farcaster.json file from the .well-known directory
    const filePath = path.join(process.cwd(), '.well-known', 'farcaster.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);

    // Return the JSON data with the appropriate content type
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error serving farcaster.json:', error);
    return NextResponse.json(
      { error: 'Failed to serve farcaster.json' },
      { status: 500 }
    );
  }
} 