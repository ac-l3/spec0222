'use client';

import { useState, useEffect, useRef } from 'react';
import { SPECTRAL_TYPES } from '../../lib/constants';
import Layout from './Layout';
import { Fira_Code } from 'next/font/google';
import MetricBar from './MetricBar';
import SpectralVisual from './SpectralVisual';
import TypewriterEffect from './TypewriterEffect';
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
  const buttonSoundRef = useRef(null);

  // Initialize audio on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      buttonSoundRef.current = new Audio('/sounds/button-sound.mp3');
    }
  }, []);

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
        const response = await fetch(`/api/analyze-profile?fid=${initialFid}&nocache=${Date.now()}`);
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
    // Play sound when button is clicked
    if (buttonSoundRef.current) {
      buttonSoundRef.current.currentTime = 0; // Reset sound to beginning
      buttonSoundRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
    
    setIsAnalyzing(true);
    try {
      const userFid = window.userFid;
      if (!userFid) {
        console.error('No user FID found');
        return;
      }

      // Fetch the analysis data from the API
      const response = await fetch(`/api/analyze-profile?fid=${userFid}&nocache=${Date.now()}`);
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
      
      // Use warpcast.com/~/ link format which works on both mobile and desktop
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(resultUrl)}`;
      console.log('Opening Warpcast URL:', warpcastUrl);
      
      // Use the Frame SDK to open the URL
      window.frame.sdk.actions.openUrl(warpcastUrl);
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
        <div className={`max-w-4xl mx-auto ${analysis ? 'px-4 sm:px-6 md:px-8' : 'px-3'} py-12`}>
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
              <div className="bg-[#222222] p-4 sm:p-5 mb-6">
                <p className={`text-center mb-4 text-[13px] text-[#999999] ${firaCode.className}`}>
                  Alignments reveal Spectrals. This one matches you. Take ownership.
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between w-full gap-3 sm:gap-4">
                  <button
                    onClick={() => window.open(getZoraUrl(analysis?.spectralType), '_blank')}
                    className="w-full sm:w-1/2 py-2 sm:py-1 bg-[#C8FA1A] text-[#191919] font-bold hover:brightness-110 transition-all text-center text-xs"
                  >
                    ACQUIRE {SPECTRAL_TYPES[analysis.spectralType].name.split(' ')[0]}
                  </button>
                  
                  <button
                    onClick={handleShare}
                    disabled={isSharing}
                    className="w-full sm:w-1/2 py-2 sm:py-1 bg-[#C8FA1A] text-[#191919] font-bold hover:brightness-110 transition-all disabled:opacity-50 text-center text-xs"
                  >
                    {isSharing ? 'SHARING...' : 'SHARE FINDINGS'}
                  </button>
                </div>
              </div>
              
              {/* Core Identity Summary */}
              <div className="text-left mb-12 px-2 sm:px-3">
                <p className="leading-relaxed text-sm mb-6 mx-1">
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
                <p className="leading-relaxed text-sm mx-1">
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
              <div className="text-left mb-12 px-2 sm:px-3">
                <div className="mb-4">
                  <h3 className="text-base font-normal">How do you explore the unknown?</h3>
                </div>
                <div className="bg-[#222222] border border-[#333333] p-5 sm:p-8">
                  <div className="space-y-6">
                    <p className="leading-relaxed text-sm text-[#999999] mx-1">
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
                  </div>
                </div>
              </div>
              
              {/* Field Evidence - Now in its own box with new title */}
              <div className="text-left mb-12 px-2 sm:px-3">
                <div className="mb-4">
                  <h3 className="text-base font-normal">What do your casts whisper about you?</h3>
                </div>
                <div className="bg-[#222222] border border-[#333333] p-5 sm:p-8">
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
                          
                          // Track used interpretations to prevent duplicates
                          const usedInterpretations = new Set();
                          
                          // If we have less than 3 evidence items, add fictional ones to ensure exactly 3
                          const additionalCasts = [
                            {
                              observation: "https://warpcast.com/apex777.eth/0×d0c3a19f",
                              interpretation: "You sense the ebb and flow of Farcaster's conversations like a social tide chart."
                            },
                            {
                              observation: "how do you think this design is perceived by mainstream audiences?",
                              interpretation: "You and AI are having a conversation the rest of us can only partially hear."
                            },
                            {
                              observation: "alignment",
                              interpretation: "What's revealing is that I bet even your casual thoughts come with metadata and tags."
                            }
                          ];
                          
                          let displayEvidence = [];
                          
                          // Process real evidence first, ensuring unique interpretations
                          for (const evidence of filteredEvidence) {
                            // Generate interpretation for current evidence
                            const observation = evidence.observation || "";
                            const observationLower = observation.toLowerCase();
                            const spectralType = analysis.spectralType;
                            
                            // Only add it if we don't already have 3 items and the interpretation is unique
                            if (displayEvidence.length < 3) {
                              displayEvidence.push(evidence);
                            }
                          }
                          
                          // Add fictional casts if needed to reach exactly 3 casts, ensuring unique interpretations
                          for (const additionalCast of additionalCasts) {
                            if (displayEvidence.length >= 3) break;
                            
                            // Skip if the observation or a similar interpretation already exists
                            if (displayEvidence.some(e => 
                              e.observation === additionalCast.observation || 
                              e.interpretation === additionalCast.interpretation ||
                              (e.interpretation && e.interpretation.toLowerCase().includes(additionalCast.interpretation.toLowerCase().substring(10)))
                            )) {
                              continue;
                            }
                            
                            displayEvidence.push({
                              observation: additionalCast.observation,
                              interpretation: additionalCast.interpretation
                            });
                          }
                          
                          // Ensure we display exactly 3 casts
                          displayEvidence = displayEvidence.slice(0, 3);
                          
                          return displayEvidence.map((evidence, index) => {
                            // Generate holistic interpretation based on spectral type and the entire cast content
                            let humorousInterpretation = "";
                            const observation = evidence.observation || "";
                            const observationLower = observation.toLowerCase();
                            const spectralType = analysis.spectralType;
                          
                            // If we already have an interpretation from the additional casts, use it
                            if (evidence.interpretation) {
                              humorousInterpretation = evidence.interpretation;
                            } else {
                              // Function to check if observation contains any of the terms
                              const containsAny = (terms) => terms.some(term => observationLower.includes(term));
                              
                              // Function to ensure interpretation uniqueness
                              const ensureUnique = (interpretation) => {
                                // If this exact interpretation has been used before, modify it slightly
                                if (usedInterpretations.has(interpretation)) {
                                  // Add a variation marker to make it unique
                                  const variations = [
                                    "Interestingly, ", 
                                    "What's revealing is that ", 
                                    "It's telling that ",
                                    "Notably, ",
                                    "Characteristically, "
                                  ];
                                  const variation = variations[Math.floor(Math.random() * variations.length)];
                                  return ensureUnique(variation + interpretation.charAt(0).toLowerCase() + interpretation.slice(1));
                                }
                                
                                // Add to used set and return
                                usedInterpretations.add(interpretation);
                                return interpretation;
                              };
                              
                              // SPECIFIC CAST PATTERN MATCHING
                              // These take precedence over general patterns to ensure unique interpretations
                              
                              // Memory Shift specific interpretations
                              if (observationLower.includes("memory shift") && observationLower.includes("beat") && /\d+\.\d+s/.test(observationLower)) {
                                // Extract the time from the cast
                                const timeMatch = observationLower.match(/(\d+\.\d+)s/);
                                const time = timeMatch ? timeMatch[1] : "fast";
                                
                                if (spectralType === 1) {
                                  humorousInterpretation = ensureUnique(`You track your game scores to two decimal places. Very $AXIS of you.`);
                                } else if (spectralType === 2) {
                                  humorousInterpretation = ensureUnique(`Most people just play games. You're over here merging with them like some digital performance art.`);
                                } else if (spectralType === 3) {
                                  humorousInterpretation = ensureUnique(`You're probably analyzing the game mechanics while playing. Fun is just a side effect of your research.`);
                                }
                                return (
                                  <li key={index} className="leading-relaxed mb-3">
                                    <p className="mb-1 break-words pr-1 overflow-hidden text-ellipsis">• "{evidence.observation.replace(/^"+|"+$/g, '')}"</p>
                                    <div className="ml-4 mr-1">
                                      <span className="text-[#999999] text-sm">{humorousInterpretation}</span>
                                    </div>
                                  </li>
                                );
                              }
                              
                              // Market sentiment specific interpretations
                              else if (observationLower.includes("market") && (observationLower.includes("bull") || observationLower.includes("bear"))) {
                                if (observationLower.includes("bullish bearishness")) {
                                  if (spectralType === 1) {
                                    humorousInterpretation = ensureUnique(`You just casually invented a market paradox and kept scrolling. Classic $AXIS.`);
                                  } else if (spectralType === 2) {
                                    humorousInterpretation = ensureUnique(`"Bullish bearishness" is such a perfect $FLUX phrase. You're comfortable with contradiction in a way that makes everyone else dizzy.`);
                                  } else if (spectralType === 3) {
                                    humorousInterpretation = ensureUnique(`You enjoy breaking market categories just to see what happens. "Bullish bearishness" is your version of poking things with a stick.`);
                                  }
                                } 
                                else if (observationLower.includes("bear markets are for building")) {
                                  if (spectralType === 1) {
                                    humorousInterpretation = ensureUnique(`You see market downturns as scheduled construction periods. Your calendar probably has "crisis = opportunity" written all over it.`);
                                  } else if (spectralType === 2) {
                                    humorousInterpretation = ensureUnique(`While everyone's panicking, you're like "great weather for building today!" That's peak $FLUX energy.`);
                                  } else if (spectralType === 3) {
                                    humorousInterpretation = ensureUnique(`"Bear markets are for building" is just your polite way of saying "I thrive in chaos." We know.`);
                                  }
                                }
                            else {
                                  if (spectralType === 1) {
                                    humorousInterpretation = ensureUnique(`You categorize market movements like others sort laundry. It's just what you do.`);
                                  } else if (spectralType === 2) {
                                    humorousInterpretation = ensureUnique(`You don't just watch markets, you feel them. It's a bit like having financial synesthesia.`);
                                  } else if (spectralType === 3) {
                                    humorousInterpretation = ensureUnique(`Your market takes always come with a hint of "but what if everything we know is wrong?" Energy.`);
                                  }
                                }
                                return (
                                  <li key={index} className="leading-relaxed mb-3">
                                    <p className="mb-1 break-words pr-1 overflow-hidden text-ellipsis">• "{evidence.observation.replace(/^"+|"+$/g, '')}"</p>
                                    <div className="ml-4 mr-1">
                                      <span className="text-[#999999] text-sm">{humorousInterpretation}</span>
                                    </div>
                                  </li>
                                );
                              }
                              
                              // "gm" or "gn" casts with humor
                              else if (/^gm+[!.]*$/i.test(observationLower) || /^gn+[!.]*$/i.test(observationLower)) {
                                const isGm = /^gm+[!.]*$/i.test(observationLower);
                                if (spectralType === 1) {
                                  humorousInterpretation = ensureUnique(isGm ? 
                                    `Even your greetings are efficiently minimized. I bet you have templates for small talk.` : 
                                    `Two letters, maximum efficiency. Your keyboard thanks you.`);
                                } else if (spectralType === 2) {
                                  humorousInterpretation = ensureUnique(isGm ? 
                                    `Your "gm" ripples through the community like a tiny digital high five.` : 
                                    `You sign off like you're stepping out of a room, not leaving a platform.`);
                                } else if (spectralType === 3) {
                                  humorousInterpretation = ensureUnique(isGm ? 
                                    `Your "gm" somehow feels like both participation and commentary on the ritual itself.` : 
                                    `Your "gn" has big "I'm leaving but also questioning why we announce departures" energy.`);
                                }
                                return (
                                  <li key={index} className="leading-relaxed mb-3">
                                    <p className="mb-1 break-words pr-1 overflow-hidden text-ellipsis">• "{evidence.observation.replace(/^"+|"+$/g, '')}"</p>
                                    <div className="ml-4 mr-1">
                                      <span className="text-[#999999] text-sm">{humorousInterpretation}</span>
                                    </div>
                                  </li>
                                );
                              }
                              
                              // HOLISTIC INTERPRETATION APPROACH WITH SIMPLIFIED, CASUAL HUMOR
                              // Analyze the entire cast based on spectral type and content themes
                              
                              // $AXIS Framer interpretations - focus on structure, frameworks, and systematic thinking
                              if (spectralType === 1) {
                                
                                // Tech/coding related
                                if (containsAny(["code", "build", "dev", "api", "function", "app", "website", "program", "framework", "system", "design", "architecture"])) {
                                  if (containsAny(["problem", "issue", "bug", "fix", "error"])) {
                                    humorousInterpretation = ensureUnique("You don't just fix bugs - you classify them into families and species first.");
                                  } else if (containsAny(["launch", "deploy", "ship", "release"])) {
                                    humorousInterpretation = ensureUnique("Your launches probably come with color-coded checklists and perfectly timed confetti.");
                                  } else {
                                    humorousInterpretation = ensureUnique("I bet your code comments are longer than the code itself. Beautifully documented though.");
                                  }
                                }
                                
                                // Analysis/research related
                                else if (containsAny(["analyze", "research", "study", "learn", "understand", "explore", "discover", "insight", "pattern", "data"])) {
                                  humorousInterpretation = ensureUnique("You turned research into an architectural project. Those mental blueprints must be something.");
                                }
                                
                                // Organization/structure related
                                else if (containsAny(["organize", "structure", "plan", "map", "model", "framework", "system", "process", "method"])) {
                                  humorousInterpretation = ensureUnique("You probably organize your organizers. It's just frameworks all the way down.");
                                }
                                
                                // Opinion/perspective statements
                                else if (containsAny(["think", "believe", "opinion", "perspective", "view", "consider"])) {
                                  humorousInterpretation = ensureUnique("Your casual opinions come with citations and cross-references. Just in case.");
                                }
                                
                                // Questions/curiosity
                                else if (observationLower.includes("?") || containsAny(["wonder", "curious", "question", "how", "why", "what if"])) {
                                  humorousInterpretation = ensureUnique("Your questions are like precision tools. Each one designed to extract exactly the info you need.");
                                }
                                
                                // Observations about trends/patterns
                                else if (containsAny(["trend", "pattern", "notice", "observe", "seeing", "movement", "shift", "change"])) {
                                  humorousInterpretation = ensureUnique("You spot patterns others miss. It's like having pattern-recognition superpowers.");
                                }
                                
                                // Default for other content
                          else {
                                  const options = [
                                    "You've mentally filed this thought in at least three different categories already.",
                                    "I bet even your casual thoughts come with metadata and tags.",
                                    "You probably have a framework for this exact conversation.",
                                    "This thought definitely has a place in your mental filing system."
                                  ];
                                  humorousInterpretation = ensureUnique(options[Math.floor(Math.random() * options.length)]);
                                }
                              }
                              
                              // $FLUX Drifter interpretations - focus on adaptability, flow, and intuitive navigation
                              else if (spectralType === 2) {
                                
                                // Adaptability/change related
                                if (containsAny(["adapt", "change", "evolve", "shift", "flow", "move", "transform"])) {
                                  humorousInterpretation = ensureUnique("Change isn't just something you adapt to - it's your natural habitat.");
                                }
                                
                                // Trend/pattern observation
                                else if (containsAny(["trend", "pattern", "notice", "observe", "seeing", "movement", "emerging", "developing"])) {
                                  humorousInterpretation = ensureUnique("You sense trends before they even know they're trends. It's almost unfair to the rest of us.");
                                }
                                
                                // Connection/relationship focused
                                else if (containsAny(["connect", "relationship", "network", "community", "together", "collaboration", "ecosystem"])) {
                                  humorousInterpretation = ensureUnique("You see connections between things the way some people see constellations. It's all patterns and relationships.");
                                }
                                
                                // Experimentation/exploration
                                else if (containsAny(["try", "experiment", "explore", "test", "play", "discover"])) {
                                  humorousInterpretation = ensureUnique("Your idea of fun is exploring uncharted territory. Maps are just suggestions.");
                                }
                                
                                // Intuition/feeling based
                                else if (containsAny(["feel", "sense", "intuition", "vibe", "energy", "resonance"])) {
                                  humorousInterpretation = ensureUnique("Your intuition has intuition. It's like being psychic but with better branding.");
                                }
                                
                                // Questions about emerging trends
                                else if (observationLower.includes("?") && containsAny(["new", "next", "future", "coming", "emerging", "developing"])) {
                                  humorousInterpretation = ensureUnique("You ask about the future like you've already visited and just need confirmation on the details.");
                                }
                                
                                // Default for other content
                                else {
                                  const options = [
                                    "You surf invisible currents the rest of us can't even see.",
                                    "You're tuned to frequencies most people don't even know exist.",
                                    "While everyone else is standing still, you're dancing with what's emerging.",
                                    "You're already adapting to the next thing before the current thing is even mainstream."
                                  ];
                                  humorousInterpretation = ensureUnique(options[Math.floor(Math.random() * options.length)]);
                                }
                              }
                              
                              // $EDGE Disruptor interpretations - focus on challenging assumptions and finding insights in disruption
                              else if (spectralType === 3) {
                                
                                // Challenging assumptions/status quo
                                if (containsAny(["wrong", "mistake", "problem", "issue", "broken", "fail", "missing", "overlooked"])) {
                                  humorousInterpretation = ensureUnique("You spot the flaw in systems others think are perfect. It's your superpower and dinner party trick.");
                                }
                                
                                // Contrarian perspectives
                                else if (containsAny(["actually", "contrary", "opposite", "instead", "rather", "however", "but", "different"])) {
                                  humorousInterpretation = ensureUnique("You've never met a conventional wisdom you didn't want to flip upside down just to see what falls out.");
                                }
                                
                                // Boundary testing/breaking
                                else if (containsAny(["limit", "boundary", "edge", "beyond", "outside", "break", "disrupt", "challenge"])) {
                                  humorousInterpretation = ensureUnique("You see boundaries as suggestions. Like speed limits or 'wet floor' signs.");
                                }
                                
                                // Questioning established ideas
                                else if (containsAny(["why", "question", "wonder", "doubt", "skeptical"]) || observationLower.includes("?")) {
                                  humorousInterpretation = ensureUnique("Your questions come with tiny built-in grenades for conventional thinking. Just as planned.");
                                }
                                
                                // Alternative perspectives/approaches
                                else if (containsAny(["alternative", "different", "new way", "approach", "perspective", "angle", "lens"])) {
                                  humorousInterpretation = ensureUnique("You collect unusual perspectives like some people collect stamps. But yours are way more fun at parties.");
                                }
                                
                                // Humor/irony/satire
                                else if (containsAny(["lol", "lmao", "haha", "joke", "funny", "irony", "satire"])) {
                                  humorousInterpretation = ensureUnique("Your humor has that perfect mix of funny and 'wait, did they just challenge my entire worldview?'");
                                }
                                
                                // Default for other content
                              else {
                                  const options = [
                                    "Even your casual statements contain little revolutionary ideas.",
                                    "You've probably questioned more assumptions before breakfast than most people do all year.",
                                    "You see the glitches in the matrix that everyone else has learned to ignore.",
                                    "The status quo feels your gaze and gets nervous."
                                  ];
                                  humorousInterpretation = ensureUnique(options[Math.floor(Math.random() * options.length)]);
                                }
                              }
                              
                              // Generic fallback for unknown spectral types
                              else {
                                humorousInterpretation = ensureUnique("You have this knack for being systematic, adaptive, and disruptive all at once. It's impressive and slightly confusing.");
                              }
                              
                              // CUSTOM INTERPRETATIONS FOR SPECIFIC CASTS
                          // These override the general patterns for very specific content
                          
                              // Crypto/web3 specific interpretations
                              if (containsAny(["crypto", "web3", "blockchain", "token", "nft", "dao", "defi"])) {
                            if (spectralType === 1) {
                                    humorousInterpretation = ensureUnique("You bring order to crypto chaos. It's like watching someone organize a tornado.");
                                  } else if (spectralType === 2) {
                                    humorousInterpretation = ensureUnique("You navigate crypto's chaos like it's a perfectly normal Tuesday. For you, maybe it is.");
                                  } else if (spectralType === 3) {
                                    humorousInterpretation = ensureUnique("You're here for the crypto revolution, not the speculation. The weirder it gets, the more at home you feel.");
                                  }
                                }
                                
                                // AI/ML specific interpretations
                              else if (containsAny(["ai", "ml", "gpt", "claude", "intelligence", "artificial", "model", "llm"])) {
                                if (spectralType === 1) {
                                      humorousInterpretation = ensureUnique("You approach AI like it's a building material with very specific load-bearing properties.");
                                    } else if (spectralType === 2) {
                                      humorousInterpretation = ensureUnique("You and AI are having a conversation the rest of us can only partially hear.");
                                    } else if (spectralType === 3) {
                                      humorousInterpretation = ensureUnique("You see AI as a fascinating philosophical experiment that happens to run on computers.");
                                    }
                                  }
                                  
                                  // Farcaster/frames specific interpretations
                                  else if (containsAny(["farcaster", "frame", "cast", "warpcast"])) {
                                    if (spectralType === 1) {
                                          humorousInterpretation = ensureUnique("You're probably mentally redesigning Farcaster's information architecture as you use it.");
                                    } else if (spectralType === 2) {
                                          humorousInterpretation = ensureUnique("You sense the ebb and flow of Farcaster's conversations like a social tide chart.");
                                    } else if (spectralType === 3) {
                                          humorousInterpretation = ensureUnique("You're simultaneously using Farcaster and questioning its fundamental assumptions. Classic you.");
                                        }
                                      }
                                      
                                      // "Looks like X" observation casts
                                      else if (observationLower.startsWith("looks like") || observationLower.includes("seems like")) {
                                        if (spectralType === 1) {
                                          humorousInterpretation = ensureUnique("Your observations come pre-categorized. Nature documentary narrators envy your classification skills.");
                                        } else if (spectralType === 2) {
                                          humorousInterpretation = ensureUnique("You don't just see what's there - you sense the currents that created it.");
                                        } else if (spectralType === 3) {
                                          humorousInterpretation = ensureUnique("Behind your 'looks like' is a silent 'but actually...' questioning everything about appearances.");
                                        }
                                      }
                                      
                                      // "Just shipped/launched/deployed X" casts
                                      else if (containsAny(["just shipped", "just launched", "just deployed", "just released"])) {
                                        if (spectralType === 1) {
                                          humorousInterpretation = ensureUnique("You turned weeks of chaos into a neat little launch announcement. Very $AXIS of you.");
                                        } else if (spectralType === 2) {
                                          humorousInterpretation = ensureUnique("Your launch is really a living organism you've released into the digital wild.");
                                        } else if (spectralType === 3) {
                                          humorousInterpretation = ensureUnique("Your launches always have this subtle 'here's a new way to think about this problem' energy.");
                                        }
                                      }
                                      
                                    }
                                      
                                    return (
                                      <li key={index} className="leading-relaxed mb-3">
                                        <p className="mb-1 break-words pr-1 overflow-hidden text-ellipsis">• "{evidence.observation.replace(/^"+|"+$/g, '')}"</p>
                                        <div className="ml-4 mr-1">
                                          <span className="text-[#999999] text-sm">{humorousInterpretation}</span>
                                        </div>
                                      </li>
                                    );
                                  });
                                })()}
                              </ul>
                          </div>
                        </div>
                        
                        {/* Outside Your Frequency - Updated to a simpler format */}
                        <div className="text-left mb-12 px-2 sm:px-3">
                          <div className="mb-4">
                            <h3 className="text-base font-normal">Where do you diverge from other researchers?</h3>
                          </div>
                          <div className="bg-[#222222] border border-[#333333] p-5 sm:p-8">
                            <p className="leading-relaxed text-sm mb-8 text-[#999999] mx-1">
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
                              <div className="space-y-4 text-[#999999] text-sm px-1">
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
                      <div className="text-center flex flex-col justify-between min-h-[80vh] max-w-3xl mx-auto">
                        <div className="flex justify-center mt-12 mb-4">
                          <Image 
                            src="/images/title.png" 
                            alt="SPECTRAL ALIGNMENT" 
                            width={400} 
                            height={200}
                            priority
                          />
                        </div>
                        
                        <div className="flex-grow flex items-center justify-center">
                          <div className="text-[#C0C2C5] text-xs px-8 mb-4 text-left w-full max-w-[90%] mx-auto">
                            <TypewriterEffect 
                              phrases={[
                                "THE SPECTRAL LAB DECODES HIDDEN PATTERNS IN HOW WE APPROACH REALITY.",
                                "BETWEEN SIGNAL AND INTERFERENCE, YOUR APPROACH TO THE UNKNOWN REVEALS YOUR FUNDAMENTAL ALIGNMENT.",
                                "YOUR METHOD OF ENGAGING WITH CHAOS ISN'T RANDOM—IT'S A SPECTRAL SIGNATURE WE CAN DETECT.",
                                "THE SPECTRAL LAB TRACKS HOW MINDS TRANSFORM UNSEEN PATTERNS INTO MEANING THROUGH DISTINCT FREQUENCIES.",
                                "SOME BUILD STRUCTURE FROM NOISE, OTHERS FLOW BETWEEN SIGNALS, AND A FEW INTENTIONALLY DISRUPT THE PATTERN.",
                                "THE UNKNOWN ISN'T SIMPLY EXPLORED—IT'S WHERE YOUR CONSCIOUSNESS CREATES MEANING THROUGH SPECIFIC PATTERNS.",
                                "BEYOND STATIC CLASSIFICATION LIES YOUR TRUE ALIGNMENT—HOW YOU MOVE BETWEEN ORDER AND CHAOS.",
                                "$AXIS FRAMES, $FLUX FLOWS, $EDGE BREAKS.",
                                "IN CHAOS: $AXIS CREATES ORDER, $FLUX RIDES CURRENTS, $EDGE TRANSFORMS.",
                                "CARRY YOUR ALIGNMENT AS A BADGE OF HONOR. OWN YOUR SPECTRAL TRUTH."
                              ]}
                              typeSpeed={40}
                              pauseDuration={1500}
                            />
                          </div>
                        </div>
                        
                        <div className="bg-[#222222] p-4 mb-6 mt-auto">
                          <p className={`text-center mb-4 text-[13px] text-[#999999] ${firaCode.className}`}>
                            Your alignment exposes your nature and a Spectral identity worth embracing.
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