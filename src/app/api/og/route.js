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

// Define colors for each spectral type
const spectralColors = {
  1: '#FF69B4', // Pink for Axis
  2: '#0000FF', // Blue for Flux
  3: '#FF0000', // Red for Edge
  landing: '#191919' // Default dark background
};

// Image paths for each spectral type
const imagePaths = {
  1: `${process.env.NEXT_PUBLIC_BASE_URL}/images/axis-framer.png`,
  2: `${process.env.NEXT_PUBLIC_BASE_URL}/images/flux-drifter.png`,
  3: `${process.env.NEXT_PUBLIC_BASE_URL}/images/edge-disruptor.png`,
  landing: `${process.env.NEXT_PUBLIC_BASE_URL}/images/spectral-landing.png`
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
    const username = searchParams.get('username');
    const type = searchParams.get('type');

    let analysis;

    // If username and type are provided directly, use them
    if (username && type) {
      // Get the spectral type from the type parameter
      const spectralTypeNumber = parseInt(type.match(/\d+/)?.[0] || type);
      const spectralTypeName = type.replace(/\d+/g, '').trim();
      
      let spectralType;
      if (isNaN(spectralTypeNumber)) {
        // Try to find the type by name
        const typeEntry = Object.entries(SPECTRAL_TYPES).find(([_, typeData]) => 
          typeData.name.toLowerCase().includes(spectralTypeName.toLowerCase())
        );
        spectralType = typeEntry ? SPECTRAL_TYPES[typeEntry[0]] : SPECTRAL_TYPES[1];
      } else {
        spectralType = SPECTRAL_TYPES[spectralTypeNumber] || SPECTRAL_TYPES[1];
      }

      analysis = {
        username,
        pfp: "https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_400x400.jpg", // Default profile pic
        type: {
          number: spectralTypeNumber || 1,
          name: spectralType.name,
          title: spectralType.name,
          motto: spectralType.motto,
          colors: spectralType.colors
        }
      };
    } else if (fid) {
      // Use the existing getAnalysis function if only fid is provided
      analysis = await getAnalysis(fid);
    } else {
      return new Response('Missing required parameters', { status: 400 });
    }

    const [regularFontData, mediumFontData, boldFontData] = await Promise.all([
      firaCodeRegularData,
      firaCodeMediumData,
      firaCodeBoldData
    ]);

    // Get the correct color for this spectral type
    const backgroundColor = spectralColors[analysis.type.number] || spectralColors[1];

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
          backgroundColor: '#191919',
          padding: '70px 40px 50px',
          color: '#C0C2C5',
          fontFamily: 'Fira Code',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}>
            <span style={{
              fontSize: '24px',
              fontWeight: 500,
              color: '#C0C2C5',
              textAlign: 'center',
              marginBottom: '10px',
            }}>
              How do you explore the unknown?
            </span>
            <span style={{
              fontSize: '24px',
              fontWeight: 500,
              color: '#C0C2C5',
              textAlign: 'center',
            }}>
              Spectral Lab has the data.
            </span>
          </div>

          <div style={{
            width: '250px',
            height: '250px',
            borderRadius: '125px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            marginTop: '30px',
            backgroundColor: backgroundColor,
          }}>
            {/* Removed image, using solid color background instead */}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            marginTop: '30px',
          }}>
            <span style={{
              fontSize: '24px',
              fontWeight: 400,
              color: '#C0C2C5',
              textAlign: 'center',
              marginBottom: '8px',
            }}>
              @{analysis.username} aligns with:
            </span>
            <span style={{
              fontSize: '66px',
              fontWeight: 700,
              color: '#C0C2C5',
              textAlign: 'center',
            }}>
              {analysis.type.name}
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
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