import { ImageResponse } from 'next/og';
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
  1: `${process.env.NEXT_PUBLIC_BASE_URL}/images/axis-framer.png`,
  2: `${process.env.NEXT_PUBLIC_BASE_URL}/images/flux-drifter.png`,
  3: `${process.env.NEXT_PUBLIC_BASE_URL}/images/edge-disruptor.png`,
  landing: `${process.env.NEXT_PUBLIC_BASE_URL}/images/spectral-landing.png`
};

// Simplified function to get analysis directly from parameters
function getAnalysisFromParams(type, username = 'researcher') {
  // Default to type 1 if not specified or invalid
  const typeNumber = isNaN(parseInt(type)) ? 1 : parseInt(type);
  const spectralType = typeNumber >= 1 && typeNumber <= 3 ? typeNumber : 1;
  
  return {
    username: username,
    pfp: "https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_400x400.jpg", // Default profile pic
    type: {
      number: spectralType,
      name: SPECTRAL_TYPES[spectralType].name,
      title: SPECTRAL_TYPES[spectralType].name,
      motto: SPECTRAL_TYPES[spectralType].motto,
      colors: SPECTRAL_TYPES[spectralType].colors
    }
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const username = searchParams.get('username') || 'researcher';
    const type = searchParams.get('type');

    // Cache busting parameter - helps prevent unwanted caching
    const cacheBuster = searchParams.get('cb') || Date.now().toString();
    console.log('Generating OG image with cache buster:', cacheBuster);

    let analysis;

    // If username and type are provided directly, use them
    if (type) {
      analysis = getAnalysisFromParams(type, username);
    } 
    // If only FID is provided, use it to generate a deterministic type for demo
    else if (fid) {
      const deterministicType = (parseInt(fid) % 3) + 1; // 1, 2, or 3 based on FID
      analysis = getAnalysisFromParams(deterministicType, username);
    } 
    else {
      // Default to type 1 if no parameters provided
      analysis = getAnalysisFromParams(1, username);
    }

    const [regularFontData, mediumFontData, boldFontData] = await Promise.all([
      firaCodeRegularData,
      firaCodeMediumData,
      firaCodeBoldData
    ]);

    // Get the correct image path for this spectral type
    const imagePath = imagePaths[analysis.type.number] || imagePaths[1];

    // Generate the image
    const imageResponse = new ImageResponse(
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
          }}>
            <img
              src={imagePath}
              alt={`Spectral Type ${analysis.type.number} Visual`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
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
              ${analysis.type.name}
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

    // Set cache control headers
    const headers = new Headers(imageResponse.headers);
    headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    headers.set('Content-Type', 'image/png');
    
    return new Response(imageResponse.body, {
      status: imageResponse.status,
      headers
    });
  } catch (error) {
    console.error('OG image generation error:', error);
    return new Response(error.message || 'Failed to generate image', { status: 500 });
  }
} 