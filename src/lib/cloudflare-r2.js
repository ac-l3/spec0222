import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  }
});

export async function checkIfExists(filename) {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
    }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

export async function uploadToR2(buffer, filename) {
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: 'image/png',
      ACL: 'public-read',
    }));

    return `${process.env.R2_PUBLIC_URL}/${filename}`;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error(`Failed to upload to R2: ${error.message}`);
  }
}

export function getPublicUrl(filename) {
  return `${process.env.R2_PUBLIC_URL}/${filename}`;
} 