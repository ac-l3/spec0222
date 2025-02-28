import { ImageResponse } from 'next/og';
import { getFromKV } from '@/lib/cloudflare-kv';
import { SPECTRAL_TYPES } from '@/lib/constants';

export const runtime = 'edge';

// Load fonts
const firaCodeRegularData = fetch(
  'https://fonts.gstatic.com/s/firacode/v21/uU9eCBsR6Z2vfE9aq3bL0fxyUs4tcw4W_D1sJVD7MOzlojwUKaJO.woff'
).then(res => res.arrayBuffer());

const firaCodeMediumData = fetch(
  'https://fonts.gstatic.com/s/firacode/v21/uU9eCBsR6Z2vfE9aq3bL0fxyUs4tcw4W_A9sJVD7MOzlojwUKaJO.woff'
).then(res => res.arrayBuffer());

const firaCodeBoldData = fetch(
  'https://fonts.gstatic.com/s/firacode/v21/uU9eCBsR6Z2vfE9aq3bL0fxyUs4tcw4W_NprJVD7MOzlojwUKaJO.woff'
).then(res => res.arrayBuffer());

// Image paths for each spectral type
const imagePaths = {
  1: 'http://localhost:3000/images/axis-framer.png',
  2: 'http://localhost:3000/images/flux-drifter.png',
  3: 'http://localhost:3000/images/edge-disruptor.png',
  landing: 'http://localhost:3000/images/spectral-landing.png'
};

async function getAnalysis(fid) {
  const cacheKey = `spectral:analysis:${fid}`;
  const cachedData = await getFromKV(cacheKey);
  
  if (!cachedData) {
    // For testing: Return mock data when KV lookup fails
    console.log('No data found in KV, using test data');
    
    // Use the FID to determine which spectral type to use (for testing)
    const spectralType = (parseInt(fid) % 3) + 1; // Will be 1, 2, or 3
    
    return {
      username: "testuser",
      pfp: "https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_400x400.jpg", // Example profile pic
      type: {
        number: spectralType,
        name: SPECTRAL_TYPES[spectralType].name,
        title: SPECTRAL_TYPES[spectralType].name,
        motto: SPECTRAL_TYPES[spectralType].motto,
        colors: SPECTRAL_TYPES[spectralType].colors
      }
    };
  }

  const data = JSON.parse(cachedData);
  const analysis = data.value ? JSON.parse(data.value) : data;

  if (!analysis?.username || !analysis?.pfpUrl || !analysis?.analysis?.spectralType) {
    throw new Error('Invalid analysis data');
  }

  const spectralType = SPECTRAL_TYPES[analysis.analysis.spectralType];

  return {
    username: analysis.username,
    pfp: analysis.pfpUrl,
    type: {
      number: analysis.analysis.spectralType,
      name: spectralType.name,
      title: spectralType.name,
      motto: spectralType.motto,
      colors: spectralType.colors
    }
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return new Response('Missing FID', { status: 400 });
    }

    const [analysis, regularFontData, mediumFontData, boldFontData] = await Promise.all([
      getAnalysis(fid),
      firaCodeRegularData,
      firaCodeMediumData,
      firaCodeBoldData
    ]);

    // Get the correct image path for this spectral type
    const imagePath = imagePaths[analysis.type.number] || imagePaths[1];

    // Generate the image
    return new ImageResponse(
      (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#191919', // Dark background
          padding: '60px 40px',
          color: '#FFFFFF',
          fontFamily: 'Fira Code',
        }}>
          {/* Header text */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '20px',
          }}>
            <span style={{
              fontSize: '24px',
              fontWeight: 500, // Medium weight
              color: '#C0C2C5',
              display: 'flex',
              textAlign: 'center',
              marginBottom: '10px',
            }}>
              How do you explore the unknown?
            </span>
            <span style={{
              fontSize: '24px',
              fontWeight: 500, // Medium weight
              color: '#C0C2C5',
              display: 'flex',
              textAlign: 'center',
            }}>
              Spectral Lab has the data.
            </span>
          </div>

          {/* Spectral Visual - using the actual image */}
          <div style={{
            width: '300px',
            height: '300px',
            borderRadius: '150px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src={imagePath}
              alt={`Spectral Type ${analysis.type.number} Visual`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'flex',
              }}
            />
          </div>

          {/* Alignment text and spectral type */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <span style={{
              fontSize: '24px',
              fontWeight: 400, // Regular weight
              color: '#C0C2C5',
              display: 'flex',
              marginBottom: '20px',
            }}>
              @{analysis.username} aligns with:
            </span>
            <span style={{
              fontSize: '66px',
              fontWeight: 700, // Bold weight
              color: '#FFFFFF',
              display: 'flex',
              textAlign: 'center',
            }}>
              {analysis.type.name}
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630, // Standard OG image ratio
        fonts: [
          {
            name: 'Fira Code',
            data: regularFontData,
            style: 'normal',
            weight: 400,
          },
          {
            name: 'Fira Code',
            data: mediumFontData,
            style: 'normal',
            weight: 500,
          },
          {
            name: 'Fira Code',
            data: boldFontData,
            style: 'normal',
            weight: 700,
          },
        ],
      }
    );
  } catch (error) {
    console.error('OG image generation error:', error);
    return new Response(error.message || 'Failed to generate image', { status: 500 });
  }
} 