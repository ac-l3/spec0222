// This is a server component (no 'use client' directive)
import { redirect } from 'next/navigation';
import { generateFrameMetadata } from '../../lib/page-metadata';

// Generate metadata for the frame
export async function generateMetadata({ searchParams }) {
  return generateFrameMetadata({ searchParams });
}

// Redirect to the main page with the same parameters
export default function FramePage({ searchParams }) {
  // Get the parameters
  const { fid, type, username } = searchParams;
  
  // Construct the redirect URL
  let redirectUrl = '/';
  const params = [];
  
  if (fid) params.push(`fid=${fid}`);
  if (type) params.push(`type=${type}`);
  if (username) params.push(`username=${encodeURIComponent(username)}`);
  
  if (params.length > 0) {
    redirectUrl += `?${params.join('&')}`;
  }
  
  // Redirect to the main page
  redirect(redirectUrl);
  
  // This won't be rendered, but is needed for the function
  return null;
} 