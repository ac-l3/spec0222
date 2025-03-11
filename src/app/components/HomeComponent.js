'use client';

import { useState, useEffect } from 'react';
import { SPECTRAL_TYPES } from '../../lib/constants';
import Layout from './Layout';
import { Fira_Code } from 'next/font/google';
import MetricBar from './MetricBar';
import SpectralVisual from './SpectralVisual';
import Image from 'next/image';

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
      // Get the spectral type name and number
      const spectralTypeName = SPECTRAL_TYPES[analysis.spectralType].name;
      const spectralTypeNumber = analysis.spectralType;
      
      // Create share text with spectral type
      const shareText = `I've been classified as a ${spectralTypeName} in the Spectral Lab! Discover your research alignment below.`;
      
      // Add a timestamp to force a refresh of the metadata
      const timestamp = Date.now();
      
      // Create a simplified URL with JUST the type parameter and a timestamp
      const resultUrl = `${process.env.NEXT_PUBLIC_BASE_URL}?type=${spectralTypeNumber}&t=${timestamp}`;
      
      console.log('Sharing URL with timestamp:', resultUrl);
      
      // Detect if user is on mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      let warpcastUrl;
      
      if (isMobile) {
        // On mobile, use the farcaster:// scheme for deep linking
        // This format works better on mobile devices to open the app directly
        warpcastUrl = `farcaster://compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(resultUrl)}`;
        console.log('Opening mobile Warpcast URL:', warpcastUrl);
      } else {
        // On desktop, use the web URL
        warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(resultUrl)}`;
        console.log('Opening desktop Warpcast URL:', warpcastUrl);
      }
      
      // Open in a new tab
      window.open(warpcastUrl, '_blank');
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
        <div className="max-w-4xl mx-auto px-3 py-12">
          {analysis && (
            <div className="text-center text-[#C0C2C5] max-w-3xl mx-auto">
              {/* Removed the first "How do you explore the unknown?" heading */}
              
              {/* Spectral Type Visual - This will be different for each type */}
              <div className="mb-9 flex justify-center">
                <SpectralVisual spectralType={analysis.spectralType} />
              </div>
              
              {/* Username and Spectral Type */}
              <div className="mb-8">
                <p className="text-base mb-2">@{userInfo?.username || ''} aligns with</p>
                <h2 className="text-3xl font-bold mb-9">
                  {SPECTRAL_TYPES[analysis.spectralType].name}
                </h2>
              </div>
              
              {/* Call to Action in a darker box */}
              <div className="bg-[#222222] p-4 mb-6">
                <p className={`text-center mb-4 text-[13px] text-[#999999] ${firaCode.className}`}>
                  Alignments reveal Spectrals. This one matches you. Take ownership.
                </p>
                
                {/* Action Buttons */}
                <div className="flex justify-between w-full gap-4">
                  <button
                    onClick={() => window.open(getZoraUrl(analysis?.spectralType), '_blank')}
                    className="w-1/2 py-1 bg-[#C8FA1A] text-[#191919] font-bold hover:brightness-110 transition-all text-center text-xs"
                  >
                    ACQUIRE {SPECTRAL_TYPES[analysis.spectralType].name.split(' ')[0]}
                  </button>
                  
                  <button
                    onClick={handleShare}
                    disabled={isSharing}
                    className="w-1/2 py-1 bg-[#C8FA1A] text-[#191919] font-bold hover:brightness-110 transition-all disabled:opacity-50 text-center text-xs"
                  >
                    {isSharing ? 'SHARING...' : 'SHARE FINDINGS'}
                  </button>
                </div>
              </div>
              
              {/* Core Identity Summary */}
              <div className="text-left mb-12">
                <p className="leading-relaxed text-sm mb-6">
                  {(() => {
                    // Get the first paragraph of the core identity
                    const coreIdentity = analysis.researchProfile.coreIdentity;
                    const firstSentenceMatch = coreIdentity.match(/^[^.!?]+[.!?]/);
                    
                    if (firstSentenceMatch) {
                      return firstSentenceMatch[0];
                    } else {
                      // Fallback if we can't find a clear first sentence
                      return coreIdentity.substring(0, 150) + "...";
                    }
                  })()}
                </p>
                <p className="leading-relaxed text-sm">
                  {(() => {
                    // Get everything after the first sentence
                    const coreIdentity = analysis.researchProfile.coreIdentity;
                    const firstSentenceMatch = coreIdentity.match(/^[^.!?]+[.!?]/);
                    
                    if (firstSentenceMatch) {
                      // Return everything after the first sentence
                      return coreIdentity.substring(firstSentenceMatch[0].length).trim();
                    } else {
                      // Fallback if we can't find a clear first sentence
                      return coreIdentity;
                    }
                  })()}
                </p>
              </div>
              
              {/* How do you explore the unknown? - Updated to focus on poetic, philosophical exploration */}
              <div className="text-left mb-12">
                <div className="mb-4">
                  <h3 className="text-base font-normal">How do you explore the unknown?</h3>
                </div>
                <div className="bg-[#222222] border border-[#333333] p-6">
                  <div className="space-y-6">
                    <p className="leading-relaxed text-sm text-[#999999]">
                      {(() => {
                        // Use the AI-generated explorationStyle if available
                        if (analysis.researchProfile.explorationStyle) {
                          return analysis.researchProfile.explorationStyle;
                        }
                        
                        // Fallback to the poetic templates if explorationStyle is not available
                        // Get the spectral type to determine the exploration style
                        const spectralType = analysis.spectralType;
                        
                        // Create a poetic description based on spectral type
                        let explorationStyle = "";
                        
                        if (spectralType === 1) { // $AXIS Framer
                          explorationStyle = "You explore through patterns and resonance, finding the hidden rhythms in seemingly random data. Your mind transforms abstract concepts into geometric frameworks that reveal underlying truths. Where others see chaos, you perceive the mathematical harmonies that connect disparate elements. You navigate uncertainty by creating structures that illuminate the unseen - building bridges between intuition and analysis. Your frameworks aren't just tools, but windows into deeper understanding, allowing you to map territories where logic and imagination converge.";
                        } else if (spectralType === 2) { // $FLUX Drifter
                          explorationStyle = "You explore by immersing yourself in emerging patterns, adapting and flowing with new information rather than forcing predetermined paths. You gather insights through deep listening and observation, allowing connections to reveal themselves naturally. Your strength lies in recognizing meaningful signals within apparent noise, finding coherence where others see only randomness. This receptive approach lets you discover hidden relationships between concepts, creating a living map that evolves with each new discovery.";
                        } else if (spectralType === 3) { // $EDGE Disruptor
                          explorationStyle = "You explore by challenging established boundaries and questioning fundamental assumptions. Your approach combines critical analysis with creative reimagining, breaking open conventional thinking to discover what lies beyond. You systematically identify blind spots in existing models, then experiment with alternative perspectives that reveal new possibilities. This balanced tension between deconstruction and creation allows you to transform limitations into gateways, uncovering insights that remain hidden to those who stay within comfortable frameworks.";
                        } else {
                          // Fallback to a generic poetic exploration style if spectral type is unknown
                          explorationStyle = "You explore the unknown through a balanced interplay of structure and intuition, creating frameworks that organize complexity while remaining open to unexpected discoveries. Your approach combines methodical analysis with creative leaps, allowing you to map territories while recognizing that no map is ever complete. You excel at finding patterns within apparent randomness, transforming abstract concepts into tangible models that reveal hidden connections. This dynamic balance between order and possibility creates a unique lens through which new understanding emerges.";
                        }
                        
                        return explorationStyle;
                      })()}
                    </p>
                    
                    <div className="pt-4 mt-4 border-t border-[#333333]">
                      <p className="text-[#888888] mb-3 text-sm">Field Evidence</p>
                      <ul className="list-none pl-0 space-y-3 text-[#BEBFC2] text-sm">
                        {(() => {
                          // Get all field evidence
                          const allEvidence = analysis.researchProfile.fieldEvidence || [];
                          
                          // Filter out problematic content
                          const filteredEvidence = allEvidence.filter(evidence => {
                            const observation = evidence.observation || '';
                            return !(
                              observation.toLowerCase().includes("hitler") || 
                              observation.toLowerCase().includes("nazi") ||
                              observation.toLowerCase().includes("rodeo") ||
                              observation.toLowerCase().includes("zora") ||
                              observation.toLowerCase().includes("fuck")
                            );
                          });
                          
                          // Only use actual casts from the user's content, up to 3
                          return filteredEvidence.slice(0, 3).map((evidence, index) => (
                            <li key={index} className="leading-relaxed mb-3">
                              <p className="mb-1">• "{evidence.observation.replace(/^"+|"+$/g, '')}"</p>
                              {evidence.title && evidence.analysis && (
                                <div className="ml-4">
                                  <span className="text-[#999999] text-sm">{evidence.title}: </span>
                                  <span className="text-[#999999] text-sm">{evidence.analysis}</span>
                                </div>
                              )}
                            </li>
                          ));
                        })()}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Outside Your Frequency - Updated to a simpler format */}
              <div className="text-left mb-12">
                <div className="mb-4">
                  <h3 className="text-base font-normal">Where do you diverge from other researchers?</h3>
                </div>
                <div className="bg-[#222222] border border-[#333333] p-6">
                  <p className="leading-relaxed text-sm mb-8 text-[#999999]">
                    {(() => {
                      // Get the spectral type to determine the contrast explanation
                      const spectralType = analysis.spectralType;
                      
                      // Get the metrics to determine second and third alignments
                      const axisScore = typeof metrics?.exploratoryDepth === 'object' ? metrics?.exploratoryDepth.score : metrics?.exploratoryDepth || 0;
                      const fluxScore = typeof metrics?.dataRetention === 'object' ? metrics?.dataRetention.score : metrics?.dataRetention || 0;
                      const edgeScore = typeof metrics?.systematicThinking === 'object' ? metrics?.systematicThinking.score : metrics?.systematicThinking || 0;
                      
                      // Set the primary type to 5
                      let primaryScore = 5;
                      let secondaryType, secondaryScore, tertiaryType, tertiaryScore;
                      
                      // Determine secondary and tertiary types based on spectral type
                      if (spectralType === 1) { // $AXIS Framer
                        secondaryType = fluxScore >= edgeScore ? 2 : 3;
                        secondaryScore = Math.min(4, Math.max(fluxScore, edgeScore));
                        tertiaryType = fluxScore >= edgeScore ? 3 : 2;
                        tertiaryScore = Math.min(3, Math.min(fluxScore, edgeScore));
                      } else if (spectralType === 2) { // $FLUX Drifter
                        secondaryType = axisScore >= edgeScore ? 1 : 3;
                        secondaryScore = Math.min(4, Math.max(axisScore, edgeScore));
                        tertiaryType = axisScore >= edgeScore ? 3 : 1;
                        tertiaryScore = Math.min(3, Math.min(axisScore, edgeScore));
                      } else if (spectralType === 3) { // $EDGE Disruptor
                        secondaryType = axisScore >= fluxScore ? 1 : 2;
                        secondaryScore = Math.min(4, Math.max(axisScore, fluxScore));
                        tertiaryType = axisScore >= fluxScore ? 2 : 1;
                        tertiaryScore = Math.min(3, Math.min(axisScore, fluxScore));
                      } else {
                        // Fallback for unknown spectral type
                        secondaryType = 1;
                        secondaryScore = 4;
                        tertiaryType = 2;
                        tertiaryScore = 3;
                      }
                      
                      // Create contrast explanation based on spectral type and secondary/tertiary types
                      let contrastExplanation = "";
                      
                      if (spectralType === 1) { // $AXIS Framer
                        if (secondaryType === 2) { // Secondary is FLUX
                          contrastExplanation = `While you may occasionally engage with the fluid connections of $FLUX exploration, you prefer structured analysis over intuitive leaps. You're drawn to establishing clear frameworks rather than navigating by instinct. Your approach to the $EDGE perspective is even more distant—you seek to build and refine systems rather than stress-test them to breaking points. Your strength lies in creating order from chaos, not in thriving within it.`;
                        } else { // Secondary is EDGE
                          contrastExplanation = `Though you might recognize value in challenging assumptions like an $EDGE explorer, you ultimately prefer to refine and optimize systems rather than disrupt them. The $FLUX approach of fluid adaptation and intuitive navigation feels even less aligned with your methodical process. You excel by creating structured knowledge systems that others can build upon, not by rapid iteration or introducing perspectives that force recalibration.`;
                        }
                      } else if (spectralType === 2) { // $FLUX Drifter
                        if (secondaryType === 1) { // Secondary is AXIS
                          contrastExplanation = `While you can appreciate the structured approach of $AXIS exploration, you find rigid frameworks limiting to your intuitive process. You prefer discovering connections through movement rather than methodical analysis. The $EDGE tendency to challenge core premises feels even less natural—you navigate uncertainty through engagement and adaptation, not by pushing systems to their breaking points. Your strength lies in flowing between contexts, not in creating or disrupting established structures.`;
                        } else { // Secondary is EDGE
                          contrastExplanation = `Though you share some of the $EDGE willingness to challenge norms, you prefer to navigate ambiguity through adaptation rather than disruption. The structured $AXIS approach of breaking down and reconstructing systems feels especially distant from your intuitive process. You thrive by discovering unexpected patterns through direct experience, not by establishing clear parameters or stress-testing fundamental assumptions.`;
                        }
                      } else if (spectralType === 3) { // $EDGE Disruptor
                        if (secondaryType === 1) { // Secondary is AXIS
                          contrastExplanation = `While you might occasionally employ the analytical methods of $AXIS exploration, you prefer to challenge frameworks rather than refine them. You're more interested in exposing limitations than in creating structured models. The $FLUX approach of fluid adaptation feels even less aligned with your disruptive nature—you thrive by introducing perspectives that force recalibration, not by navigating intuitively between contexts. Your strength lies in finding value where others see only disorder.`;
                        } else { // Secondary is FLUX
                          contrastExplanation = `Though you may share some of the $FLUX adaptability, you navigate chaos by challenging assumptions rather than flowing with them. You prefer to expose contradictions rather than discover unexpected connections. The structured $AXIS approach of methodical analysis and optimization is furthest from your natural mode—you excel by pushing systems to their breaking points, not by creating frameworks that transform chaos into order.`;
                        }
                      } else {
                        // Fallback for unknown spectral type
                        contrastExplanation = `While you may engage with different research approaches, your primary alignment shows where you naturally excel. You might occasionally employ methods from other spectral types, but they don't reflect your core strengths and natural tendencies when exploring the unknown.`;
                      }
                      
                      return contrastExplanation;
                    })()}
                  </p>
                  
                  {/* Supporting Metrics - Now part of Outside Your Frequency */}
                  <div>
                    <h4 className="text-sm mb-3 text-[#888888] mt-4 pt-4 border-t border-[#333333]">Alignment Metrics</h4>
                    <div className="space-y-4 text-[#999999] text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[#BEBFC2] text-sm">$AXIS Framer</span>
                        <span className="text-right text-[#BEBFC2] text-sm">
                          {(() => {
                            // If this is the user's spectral type, always show 5/5
                            if (analysis.spectralType === 1) {
                              return "5/5";
                            } else {
                              // Otherwise use the calculated score, max 4
                              const score = typeof metrics?.exploratoryDepth === 'object' ? 
                                metrics?.exploratoryDepth.score : metrics?.exploratoryDepth || 0;
                              return `${Math.min(4, score)}/5`;
                            }
                          })()}
                        </span>
                      </div>
                      <div className="w-full bg-[#333333] h-2">
                        <div className="bg-[#C8FA1A] h-2" style={{ 
                          width: `${analysis.spectralType === 1 ? 100 : Math.min(4, (typeof metrics?.exploratoryDepth === 'object' ? metrics?.exploratoryDepth.score : metrics?.exploratoryDepth || 0)) * 20}%` 
                        }}></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[#BEBFC2] text-sm">$FLUX Drifter</span>
                        <span className="text-right text-[#BEBFC2] text-sm">
                          {(() => {
                            // If this is the user's spectral type, always show 5/5
                            if (analysis.spectralType === 2) {
                              return "5/5";
                            } else {
                              // Otherwise use the calculated score, max 4
                              const score = typeof metrics?.dataRetention === 'object' ? 
                                metrics?.dataRetention.score : metrics?.dataRetention || 0;
                              return `${Math.min(4, score)}/5`;
                            }
                          })()}
                        </span>
                      </div>
                      <div className="w-full bg-[#333333] h-2">
                        <div className="bg-[#C8FA1A] h-2" style={{ 
                          width: `${analysis.spectralType === 2 ? 100 : Math.min(4, (typeof metrics?.dataRetention === 'object' ? metrics?.dataRetention.score : metrics?.dataRetention || 0)) * 20}%` 
                        }}></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[#BEBFC2] text-sm">$EDGE Disruptor</span>
                        <span className="text-right text-[#BEBFC2] text-sm">
                          {(() => {
                            // If this is the user's spectral type, always show 5/5
                            if (analysis.spectralType === 3) {
                              return "5/5";
                            } else {
                              // Otherwise use the calculated score, max 4
                              const score = typeof metrics?.systematicThinking === 'object' ? 
                                metrics?.systematicThinking.score : metrics?.systematicThinking || 0;
                              return `${Math.min(4, score)}/5`;
                            }
                          })()}
                        </span>
                      </div>
                      <div className="w-full bg-[#333333] h-2">
                        <div className="bg-[#C8FA1A] h-2" style={{ 
                          width: `${analysis.spectralType === 3 ? 100 : Math.min(4, (typeof metrics?.systematicThinking === 'object' ? metrics?.systematicThinking.score : metrics?.systematicThinking || 0)) * 20}%` 
                        }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {!analysis && (
            <div className="text-center mb-12 max-w-3xl mx-auto">
              <div className="flex justify-center mb-4">
                <Image 
                  src="/title.png" 
                  alt="SPECTRAL ALIGNMENT" 
                  width={400} 
                  height={200}
                  priority
                />
              </div>
              
              <p className="text-[#C0C2C5] text-sm mb-4 text-left">
                The Spectral Lab studies hidden structures, emergent behaviors, and unseen frequencies.
              </p>
              
              <p className="text-[#C0C2C5] text-sm mb-6 text-left">
                Approaches to the unknown reveal distinct realities—some disrupt boundaries, others flow across systems, and some create frameworks.
              </p>
              
              <div className="bg-[#222222] p-4 mb-6">
                <p className={`text-center mb-4 text-[13px] text-[#999999] ${firaCode.className}`}>
                  Alignments reveal both insight into your methods and a corresponding Spectral position worth preserving.
                </p>
                
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-1 bg-[#C8FA1A] text-[#191919] font-bold hover:brightness-110 transition-all disabled:opacity-50 text-xs"
                >
                  {isAnalyzing ? 'ANALYZING...' : 'REVEAL YOUR SPECTRAL ALIGNMENT'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 