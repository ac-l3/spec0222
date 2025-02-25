'use client';

import { useState, useEffect } from 'react';
import { SPECTRAL_TYPES } from '../../lib/constants';
import Layout from './Layout';
import { Fira_Code } from 'next/font/google';
import MetricBar from './MetricBar';

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '600', '700'], // Regular (400), semi-bold (600), and bold (700)
});

export default function HomeComponent({ fid: initialFid, initialData }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(initialData?.analysis || null);
  const [fid, setFid] = useState(initialFid);
  const [userFid, setUserFid] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(null);
  const [userInfo, setUserInfo] = useState(
    initialData ? {
      username: initialData.username,
      display_name: initialData.displayName,
      pfp_url: initialData.pfpUrl,
      profile: { bio: { text: initialData.bio } }
    } : null
  );
  const [isSharing, setIsSharing] = useState(false);

  // Listen for userFid changes
  useEffect(() => {
    const checkUserFid = () => {
      const currentUserFid = window.userFid;
      
      if (currentUserFid !== userFid) {
        setUserFid(currentUserFid);
        setIsOwnProfile(currentUserFid ? (currentUserFid && fid && Number(currentUserFid) === Number(fid)) : null);
        console.log('Profile comparison:', { userFid: currentUserFid, fid });
      }
    };
    
    // Check immediately
    checkUserFid();

    // Set up an interval to check periodically
    const interval = setInterval(checkUserFid, 1000);

    // Clean up
    return () => clearInterval(interval);
  }, [fid, userFid]);

  async function analyzeWithRetry(data) {
    if (!data || typeof data !== 'object') {
      console.error('Invalid data structure:', data);
      throw new Error('Invalid data structure');
    }

    // Validate the analysis object structure
    if (!data.analysis?.spectralType || !data.analysis?.researchProfile) {
      console.log('Response data:', data);
      throw new Error('Invalid analysis structure');
    }

    return data;
  }

  // Load analysis if we have an FID in the URL but no initial data
  useEffect(() => {
    async function loadAnalysis() {
      if (!initialFid || initialData) return;
      
      try {
        // Fetch the analysis data from the API
        const response = await fetch(`/api/analyze-profile?fid=${initialFid}`);
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        const validatedData = await analyzeWithRetry(data);
        
        console.log('Loaded analysis for FID:', initialFid, 'Data:', validatedData);
        setAnalysis(validatedData.analysis);
        setFid(validatedData.fid);
        setUserInfo({
          username: validatedData.username,
          display_name: validatedData.displayName,
          pfp_url: validatedData.pfpUrl,
          profile: { bio: { text: validatedData.bio } }
        });
      } catch (error) {
        console.error('Error loading analysis:', error);
        alert('Failed to load analysis. Please try again.');
      }
    }

    loadAnalysis();
  }, [initialFid, initialData]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const userFid = window.userFid;
      if (!userFid) {
        console.error('No user FID found');
        return;
      }

      // Fetch the analysis data from the API
      const response = await fetch(`/api/analyze-profile?fid=${userFid}`);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      const validatedData = await analyzeWithRetry(data);
      
      console.log('Analysis result:', validatedData);
      
      // Update the URL with the new FID
      window.history.pushState({}, '', `/?fid=${userFid}`);
      
      setAnalysis(validatedData.analysis);
      setFid(userFid);
      setUserInfo({
        username: validatedData.username,
        display_name: validatedData.displayName,
        pfp_url: validatedData.pfpUrl,
        profile: { bio: { text: validatedData.bio } }
      });
      
      // Since this is the user's own analysis, set isOwnProfile to true
      setIsOwnProfile(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    setIsSharing(true);
    
    try {
      // Generate share image
      const response = await fetch('/api/generate-share-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid })
      });
      
      if (!response.ok) throw new Error('Failed to generate share image');
      const { imageUrl } = await response.json();

      // Create share text with spectral type
      const shareText = `I've been classified as a ${SPECTRAL_TYPES[analysis.spectralType].name} in the Spectral Lab! Discover your research designation below.`;
      
      // Create Warpcast share URL with app URL and image as embeds
      const encodedText = encodeURI(shareText);
      const encodedAppUrl = encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL}?fid=${fid}`);
      const shareUrl = `https://warpcast.com/~/compose?text=${encodedText}&embeds[]=${encodedAppUrl}`;

      // Open share URL using Frame SDK
      if (window.frame?.sdk?.actions?.openUrl) {
        window.frame.sdk.actions.openUrl(shareUrl);
      } else {
        console.error('Frame SDK not available for sharing');
        throw new Error('Unable to open share dialog');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const getSpectralTypeClass = (type) => {
    if (!type) return '';
    const typeName = SPECTRAL_TYPES[type].name.toLowerCase();
    return `bg-spectral-${typeName}-main text-spectral-${typeName}-accent`;
  };

  // Get the appropriate Zora URL based on spectral type
  const getZoraUrl = (spectralType) => {
    if (!spectralType) return 'https://zora.co';
    
    const zoraUrls = {
      1: 'https://zora.co/collect/base:0xa2d7f2b23e55d4816c02b84675007761b683be46/6?referrer=0xd51f298dd8d0fc36b858c37c7b34531be277f160',
      2: 'https://zora.co/collect/base:0x0910c0e7cbe84fa0575e6002924c617afe820b44/1?referrer=0xd51f298dd8d0fc36b858c37c7b34531be277f160',
      3: 'https://zora.co/collect/base:0xa2d7f2b23e55d4816c02b84675007761b683be46/7?referrer=0xd51f298dd8d0fc36b858c37c7b34531be277f160',
      4: 'https://zora.co/collect/base:0x0910c0e7cbe84fa0575e6002924c617afe820b44/2?referrer=0xd51f298dd8d0fc36b858c37c7b34531be277f160',
      5: 'https://zora.co/collect/base:0x0910c0e7cbe84fa0575e6002924c617afe820b44/3?referrer=0xd51f298dd8d0fc36b858c37c7b34531be277f160',
      6: 'https://zora.co/collect/base:0xa2d7f2b23e55d4816c02b84675007761b683be46/9?referrer=0xd51f298dd8d0fc36b858c37c7b34531be277f160'
    };
    
    return zoraUrls[spectralType] || 'https://zora.co';
  };

  // Add safety checks and use correct path
  const metrics = analysis?.researchProfile?.researchDeployment?.metrics;

  return (
    <Layout>
      <div className={`min-h-screen bg-[#191919] ${firaCode.className} font-normal`}>
        <div className="max-w-3xl mx-auto px-6 py-12">
          {analysis && (
            <div className="text-center mb-12">
              <h1 className="text-4xl font-semibold mb-8 text-[#C0C2C5]">
                The Spectral Lab welcomes @{userInfo?.username || ''}
              </h1>
              <p className="text-lg text-[#C0C2C5] mb-8">
              Finalize the induction by <span className="text-[#C8FA1A]">acquiring a share of your assigned Spectral</span>—an official confirmation of alignment.
              </p>
              
              <div className="flex justify-between w-full gap-4">
                <button
                  onClick={() => window.open(getZoraUrl(analysis?.spectralType), '_blank')}
                  className="w-1/2 py-2 bg-[#C8FA1A] text-[#191919] font-bold hover:brightness-110 transition-all text-center"
                >
                  OWN YOUR SPECTRAL
                </button>
                
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="w-1/2 py-2 bg-[#C8FA1A] text-[#191919] font-bold hover:brightness-110 transition-all disabled:opacity-50 text-center"
                >
                  {isSharing ? 'SHARING...' : 'SHARE RESULTS'}
                </button>
              </div>
            </div>
          )}
          
          {!analysis && (
            <div className="text-center mb-12 border border-[#333333] p-12 max-w-2xl mx-auto">
              <h2 className="text-xl font-normal mb-12 text-[#C0C2C5] leading-relaxed">
                The Spectral Lab is looking for researchers. Do you fit in?
              </h2>

              <div className="mb-12">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-2 bg-[#C8FA1A] text-[#191919] font-bold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? 'ANALYZING...' : 'SUBMIT APPLICATION'}
                </button>
              </div>
              
              <div className="text-left text-[#C0C2C5] space-y-8">
                <p className="leading-relaxed">
                  The Lab researches unseen structures, emergent behaviors, and hidden frequencies. Every researcher plays a role—some break systems, others stabilize or explore new frontiers.
                </p>
                
                <p className="leading-relaxed">
                  Your application is based on your profile and activity. We'll analyze your research instincts, assign your role, and place you in the Lab.
                </p>
              </div>
            </div>
          )}

          {analysis && (
            <div className="text-[#C0C2C5]">
              <div className="mb-12">
                <hr className="border-t border-[#333333] my-12" />
                <h2 className="text-3xl font-bold mb-3">
                  {SPECTRAL_TYPES[analysis.spectralType].name}
                </h2>
                <div className="font-normal">
                  {(() => {
                    // Split the core identity at the first sentence
                    const coreIdentity = analysis.researchProfile.coreIdentity;
                    const firstSentenceMatch = coreIdentity.match(/^[^.!?]+[.!?]/);
                    
                    if (firstSentenceMatch) {
                      const firstSentence = firstSentenceMatch[0];
                      const restOfText = coreIdentity.substring(firstSentence.length).trim();
                      
                      return (
                        <>
                          <p className="text-lg leading-relaxed mb-4">{firstSentence}</p>
                          <p className="text-lg leading-relaxed">{restOfText}</p>
                        </>
                      );
                    } else {
                      // Fallback if we can't find a clear first sentence
                      return <p className="text-lg leading-relaxed">{coreIdentity}</p>;
                    }
                  })()}
                </div>
              </div>

              <div className="space-y-8">
                <details className="group" open>
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center mb-4">
                      <h3 className="text-xl font-normal">Functional Impact</h3>
                      <span className="ml-auto text-[#C8FA1A] text-xl">+</span>
                    </div>
                  </summary>
                  <div className="bg-[#222222] border border-[#333333] p-6">
                    <p className="leading-relaxed">{analysis.researchProfile.functionalImpact}</p>
                  </div>
                </details>

                <details className="group" open>
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center mb-4">
                      <h3 className="text-xl font-normal">Alignment Considerations</h3>
                      <span className="ml-auto text-[#C8FA1A] text-xl">+</span>
                    </div>
                  </summary>
                  <div className="bg-[#222222] border border-[#333333] p-6">
                    <p className="leading-relaxed">{analysis.researchProfile.alignmentConsiderations}</p>
                  </div>
                </details>

                <details className="group" open>
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center mb-4">
                      <h3 className="text-xl font-normal">Research Deployment</h3>
                      <span className="ml-auto text-[#C8FA1A] text-xl">+</span>
                    </div>
                  </summary>
                  <div className="bg-[#222222] border border-[#333333] p-6">
                    {metrics && (
                      <>
                        {/* Deployment Verdict - without redundant title */}
                        <div className="mb-8 border-b border-[#333333] pb-6">
                          <p className="leading-relaxed text-[#C0C2C5] whitespace-pre-line">
                            {analysis.researchProfile.researchDeployment.verdict.replace(/^As a [^,]+, assigned to [^:]+:\s*/i, '')}
                          </p>
                        </div>

                        {/* Supporting Metrics */}
                        <div>
                          <h4 className="text-lg mb-4 text-[#888888]">Supporting Metrics</h4>
                          <div className="space-y-4">
                            <MetricBar
                              label="Exploratory Depth"
                              value={metrics.exploratoryDepth}
                            />
                            <MetricBar
                              label="Data Retention"
                              value={metrics.dataRetention}
                            />
                            <MetricBar
                              label="Systematic Thinking"
                              value={metrics.systematicThinking}
                            />
                            <MetricBar
                              label="Risk Tolerance"
                              value={metrics.riskTolerance}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 