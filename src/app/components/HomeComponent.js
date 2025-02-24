'use client';

import { useState, useEffect } from 'react';
import { SPECTRAL_TYPES } from '../../lib/constants';
import Layout from './Layout';
import { Fira_Code } from 'next/font/google';
import MetricBar from './MetricBar';

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '700'], // Only regular (400) and bold (700)
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
        const data = await analyzeWithRetry(initialData);
        console.log('Loaded analysis for FID:', initialFid, 'Data:', data);
        setAnalysis(data.analysis);
        setFid(data.fid);
        setUserInfo({
          username: data.username,
          display_name: data.displayName,
          pfp_url: data.pfpUrl,
          profile: { bio: { text: data.bio } }
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

      const data = await analyzeWithRetry(userFid);
      console.log('Analysis result:', data);
      
      // Update the URL with the new FID
      window.history.pushState({}, '', `/?fid=${userFid}`);
      
      setAnalysis(data.analysis);
      setFid(userFid);
      setUserInfo({
        username: data.username,
        display_name: data.displayName,
        pfp_url: data.pfpUrl,
        profile: { bio: { text: data.bio } }
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

  // Add safety checks and use correct path
  const metrics = analysis?.researchProfile?.researchDeployment?.metrics;

  return (
    <Layout>
      <div className={`min-h-screen bg-[#191919] ${firaCode.className} font-normal`}>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-8 text-[#C0C2C5]">
              SPECTRAL LAB RECRUITMENT EVALUATION
            </h1>

            <button
              onClick={analysis ? handleShare : handleAnalyze}
              disabled={isAnalyzing || isSharing}
              className="px-6 py-3 bg-[#C8FA1A] text-[#191919] font-bold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? 'ANALYZING...' : isSharing ? 'SHARING...' : analysis ? 'SHARE RESULT' : 'ANALYZE PROFILE'}
            </button>
          </div>

          {analysis && (
            <div className="text-[#C0C2C5]">
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-3">
                  {SPECTRAL_TYPES[analysis.spectralType].name}
                </h2>
                <p className="text-lg font-normal mb-8 text-[#C0C2C5]">
                  {SPECTRAL_TYPES[analysis.spectralType].motto}
                </p>
                <div className="font-normal">
                  <p className="text-lg leading-relaxed">{analysis.researchProfile.coreIdentity}</p>
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
                      <h3 className="text-xl font-normal">Stability Warning</h3>
                      <span className="ml-auto text-[#C8FA1A] text-xl">+</span>
                    </div>
                  </summary>
                  <div className="bg-[#222222] border border-[#333333] p-6">
                    <p className="leading-relaxed">{analysis.researchProfile.stabilityWarning}</p>
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
                            {analysis.researchProfile.researchDeployment.verdict}
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