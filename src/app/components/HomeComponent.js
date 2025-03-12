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
                  </div>
                </div>
              </div>
              
              {/* Field Evidence - Now in its own box with new title */}
              <div className="text-left mb-12">
                <div className="mb-4">
                  <h3 className="text-base font-normal">What do your casts whisper about you?</h3>
                </div>
                <div className="bg-[#222222] border border-[#333333] p-6">
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
                          
                          // Only use actual casts from the user's content, up to 2-3 (reduced from 4)
                          return filteredEvidence.slice(0, 3).map((evidence, index) => {
                            // Generate holistic interpretation based on spectral type and the entire cast content
                            let humorousInterpretation = "";
                            const observation = evidence.observation || "";
                            const observationLower = observation.toLowerCase();
                            const spectralType = analysis.spectralType;
                            
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
                                return variation + interpretation.charAt(0).toLowerCase() + interpretation.slice(1);
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
                                humorousInterpretation = ensureUnique(`You quantify fun to the hundredth of a second. In the Venn diagram of 'people who track game times with two decimal places' and 'people who build frameworks,' you're comfortably in the overlap.`);
                              } else if (spectralType === 2) {
                                humorousInterpretation = ensureUnique(`That ${time}s isn't just a score—it's a snapshot of your mind in flow state. You don't just play Memory Shift; you temporarily merge with its patterns and rhythms.`);
                              } else if (spectralType === 3) {
                                humorousInterpretation = ensureUnique(`Most people just play Memory Shift. You're reverse-engineering its cognitive mechanics while simultaneously competing against yourself. Classic $EDGE approach.`);
                              }
                              return (
                                <li key={index} className="leading-relaxed mb-3">
                                  <p className="mb-1">• "{evidence.observation.replace(/^"+|"+$/g, '')}"</p>
                                  <div className="ml-4">
                                    <span className="text-[#999999] text-sm">{humorousInterpretation}</span>
                                  </div>
                                </li>
                              );
                            }
                            
                            // Market sentiment specific interpretations
                            else if (observationLower.includes("market") && (observationLower.includes("bull") || observationLower.includes("bear"))) {
                              if (observationLower.includes("bullish bearishness")) {
                                if (spectralType === 1) {
                                  humorousInterpretation = ensureUnique(`You've created a taxonomy for market paradoxes that would make Linnaeus proud. Where others see contradictions, you see a perfectly categorizable phenomenon.`);
                                } else if (spectralType === 2) {
                                  humorousInterpretation = ensureUnique(`When most people see 'bullish bearishness,' they see a contradiction. You see Tuesday. Your mind naturally processes seemingly opposing forces as complementary currents.`);
                                } else if (spectralType === 3) {
                                  humorousInterpretation = ensureUnique(`'Bullish bearishness' is exactly the kind of conceptual tension that delights your $EDGE mind—you're drawn to the spaces where conventional categories break down and reveal their limitations.`);
                                }
                              } 
                              else if (observationLower.includes("bear markets are for building")) {
                                if (spectralType === 1) {
                                  humorousInterpretation = ensureUnique(`Your relationship with bear markets is like an architect's relationship with winter—everyone else sees dormancy, you see the perfect time to draft blueprints.`);
                                } else if (spectralType === 2) {
                                  humorousInterpretation = ensureUnique(`You intuitively sense the creative potential in market downturns. While others retreat, you're already flowing with the hidden currents of opportunity that will emerge in the next cycle.`);
                                } else if (spectralType === 3) {
                                  humorousInterpretation = ensureUnique(`This isn't just optimism—it's your $EDGE perspective recognizing that transformation happens precisely when established systems are under stress. You build during bear markets because that's when the old rules are most vulnerable.`);
                                }
                              }
                              else {
                                if (spectralType === 1) {
                                  humorousInterpretation = ensureUnique(`Your market commentary reveals how you naturally organize chaos into structured patterns. Bull, bear, or something in between—it all fits into your mental framework.`);
                                } else if (spectralType === 2) {
                                  humorousInterpretation = ensureUnique(`You don't just observe markets—you feel their rhythms and currents. Your commentary shows how you intuitively sense shifts that others only recognize in retrospect.`);
                                } else if (spectralType === 3) {
                                  humorousInterpretation = ensureUnique(`Your market analysis has that characteristic $EDGE quality—looking past the obvious narratives to identify the underlying contradictions and opportunities others miss.`);
                                }
                              }
                              return (
                                <li key={index} className="leading-relaxed mb-3">
                                  <p className="mb-1">• "{evidence.observation.replace(/^"+|"+$/g, '')}"</p>
                                  <div className="ml-4">
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
                                  `Your 'gm' isn't just a greeting—it's a calibration point in your daily framework. I bet you have a spreadsheet tracking community engagement metrics somewhere.` : 
                                  `Even your 'gn' has perfect documentation. I suspect your dreams are organized into folders with clear naming conventions.`);
                              } else if (spectralType === 2) {
                                humorousInterpretation = ensureUnique(isGm ? 
                                  `Your 'gm' is like a pebble dropped in a pond—you're sensing the ripples of connection it creates throughout the community ecosystem.` : 
                                  `Your 'gn' is a subtle recalibration of the community's shared rhythms. You're attuning to the collective energy even as you sign off.`);
                              } else if (spectralType === 3) {
                                humorousInterpretation = ensureUnique(isGm ? 
                                  `Your two-letter 'gm' somehow manages to both participate in and subtly critique social media rituals. That's peak $EDGE efficiency.` : 
                                  `Your 'gn' simultaneously embraces and questions the convention of announcing one's departure. Classic $EDGE paradox.`);
                              }
                              return (
                                <li key={index} className="leading-relaxed mb-3">
                                  <p className="mb-1">• "{evidence.observation.replace(/^"+|"+$/g, '')}"</p>
                                  <div className="ml-4">
                                    <span className="text-[#999999] text-sm">{humorousInterpretation}</span>
                                  </div>
                                </li>
                              );
                            }
                            
                            // HOLISTIC INTERPRETATION APPROACH WITH ENHANCED HUMOR
                            // Analyze the entire cast based on spectral type and content themes
                            
                            // $AXIS Framer interpretations - focus on structure, frameworks, and systematic thinking
                            if (spectralType === 1) {
                              
                              // Tech/coding related
                              if (containsAny(["code", "build", "dev", "api", "function", "app", "website", "program", "framework", "system", "design", "architecture"])) {
                                if (containsAny(["problem", "issue", "bug", "fix", "error"])) {
                                  humorousInterpretation = ensureUnique("You don't just fix bugs—you perform taxonomic classification on them. 'Ah yes, the rare Undefined Reference Exception, closely related to the more common Null Pointer. Fascinating specimen!'");
                                } else if (containsAny(["launch", "deploy", "ship", "release"])) {
                                  humorousInterpretation = ensureUnique("Your deployment announcements read like architectural unveilings. I can almost see you cutting a tiny ribbon with comically oversized scissors in front of your terminal.");
                                } else {
                                  humorousInterpretation = ensureUnique("You don't just write code—you craft digital cathedrals with perfect structural integrity. Your comments probably include load-bearing calculations.");
                                }
                              }
                              
                              // Analysis/research related
                              else if (containsAny(["analyze", "research", "study", "learn", "understand", "explore", "discover", "insight", "pattern", "data"])) {
                                humorousInterpretation = ensureUnique("Your brain doesn't just process information—it automatically creates a three-dimensional taxonomy with cross-referenced indices. Your casual thoughts have footnotes.");
                              }
                              
                              // Organization/structure related
                              else if (containsAny(["organize", "structure", "plan", "map", "model", "framework", "system", "process", "method"])) {
                                humorousInterpretation = ensureUnique("You probably have a framework for organizing your frameworks. And yes, that meta-framework is itself perfectly organized in a higher-order structure. It's frameworks all the way up.");
                              }
                              
                              // Opinion/perspective statements
                              else if (containsAny(["think", "believe", "opinion", "perspective", "view", "consider"])) {
                                humorousInterpretation = ensureUnique("Your opinions come pre-organized into a coherent worldview with supporting evidence and anticipated counterarguments. Casual conversation with you is like finding a perfectly formatted research paper in a fortune cookie.");
                              }
                              
                              // Questions/curiosity
                              else if (observationLower.includes("?") || containsAny(["wonder", "curious", "question", "how", "why", "what if"])) {
                                humorousInterpretation = ensureUnique("Your questions aren't just curiosities—they're precision instruments designed to extract exactly the information needed to complete your mental model. You probably have a decision tree for follow-ups ready before anyone answers.");
                              }
                              
                              // Observations about trends/patterns
                              else if (containsAny(["trend", "pattern", "notice", "observe", "seeing", "movement", "shift", "change"])) {
                                humorousInterpretation = ensureUnique("You don't just notice patterns—you automatically file them in your mental pattern library, cross-referenced by category, frequency, and potential applications. Your brain has a Dewey Decimal System for observations.");
                              }
                              
                              // Default for other content
                              else {
                                // Vary interpretation length based on cast length
                                if (observation.length < 60) {
                                  humorousInterpretation = ensureUnique("Even this brief statement has been mentally cataloged, cross-referenced, and filed in your perfectly organized brain library. Your thoughts have call numbers.");
                                } else {
                                  humorousInterpretation = ensureUnique("I can almost hear the soft whirring of your mind as it processes this statement, extracting patterns, identifying structural elements, and filing everything in its proper conceptual location. Your brain makes librarians jealous.");
                                }
                              }
                            }
                            
                            // $FLUX Drifter interpretations - focus on adaptability, flow, and intuitive navigation
                            else if (spectralType === 2) {
                              
                              // Adaptability/change related
                              if (containsAny(["adapt", "change", "evolve", "shift", "flow", "move", "transform"])) {
                                humorousInterpretation = ensureUnique("You don't just adapt to change—you're practically change's personal choreographer. 'Oh, you call that a paradigm shift? Hold my beverage and watch this.'");
                              }
                              
                              // Trend/pattern observation
                              else if (containsAny(["trend", "pattern", "notice", "observe", "seeing", "movement", "emerging", "developing"])) {
                                humorousInterpretation = ensureUnique("You sense emerging patterns like sharks detect blood in water—from impossibly far away and with an almost supernatural precision. The rest of us are still using binoculars while you've got pattern-detecting sonar.");
                              }
                              
                              // Connection/relationship focused
                              else if (containsAny(["connect", "relationship", "network", "community", "together", "collaboration", "ecosystem"])) {
                                humorousInterpretation = ensureUnique("You perceive relationships between concepts that are so distant from each other, they're practically in different area codes. Your mind doesn't just connect dots—it reveals constellations where others see random stars.");
                              }
                              
                              // Experimentation/exploration
                              else if (containsAny(["try", "experiment", "explore", "test", "play", "discover"])) {
                                humorousInterpretation = ensureUnique("Your approach to discovery makes Lewis and Clark look like cautious homebodies. 'What's over that conceptual horizon? Only one way to find out!' *dives headfirst into unexplored territory*");
                              }
                              
                              // Intuition/feeling based
                              else if (containsAny(["feel", "sense", "intuition", "vibe", "energy", "resonance"])) {
                                humorousInterpretation = ensureUnique("Your intuition isn't just good—it's suspiciously accurate. If you ever say you have 'a feeling about this,' I'm immediately placing all my bets on whatever you're sensing.");
                              }
                              
                              // Questions about emerging trends
                              else if (observationLower.includes("?") && containsAny(["new", "next", "future", "coming", "emerging", "developing"])) {
                                humorousInterpretation = ensureUnique("Your questions about the future aren't really questions—they're your way of giving the rest of us a gentle heads-up about what you've already sensed is coming. It's like you're reading tomorrow's newspaper today.");
                              }
                              
                              // Default for other content
                              else {
                                // Vary interpretation length based on cast length
                                if (observation.length < 60) {
                                  humorousInterpretation = ensureUnique("Even in these few words, I can sense you surfing invisible currents that the rest of us won't notice until they become tsunamis of change.");
                                } else {
                                  humorousInterpretation = ensureUnique("Reading your thoughts is like watching someone navigate a river that's simultaneously flowing in multiple directions. Somehow you're not just staying afloat but deliberately choosing which current to ride at any moment. The rest of us are still looking for our water wings.");
                                }
                              }
                            }
                            
                            // $EDGE Disruptor interpretations - focus on challenging assumptions and finding insights in disruption
                            else if (spectralType === 3) {
                              
                              // Challenging assumptions/status quo
                              if (containsAny(["wrong", "mistake", "problem", "issue", "broken", "fail", "missing", "overlooked"])) {
                                humorousInterpretation = ensureUnique("You don't just identify problems—you perform conceptual autopsies that reveal how seemingly functional systems are actually spectacular failures waiting to happen. 'This looks fine' is not in your vocabulary.");
                              }
                              
                              // Contrarian perspectives
                              else if (containsAny(["actually", "contrary", "opposite", "instead", "rather", "however", "but", "different"])) {
                                humorousInterpretation = ensureUnique("Your contrarian takes aren't just reflexive opposition—they're precision strikes against the weak points in conventional thinking. You can find the load-bearing assumption in any argument and give it a gentle tap that brings the whole structure down.");
                              }
                              
                              // Boundary testing/breaking
                              else if (containsAny(["limit", "boundary", "edge", "beyond", "outside", "break", "disrupt", "challenge"])) {
                                humorousInterpretation = ensureUnique("You approach boundaries the way cats approach closed doors—with a mixture of curiosity, skepticism, and the absolute conviction that they shouldn't apply to you specifically.");
                              }
                              
                              // Questioning established ideas
                              else if (containsAny(["why", "question", "wonder", "doubt", "skeptical"]) || observationLower.includes("?")) {
                                humorousInterpretation = ensureUnique("Your questions aren't just seeking information—they're conceptual demolition charges placed precisely where they'll reveal the structural weaknesses in established thinking. 'Just asking questions' in your case should come with a warning label.");
                              }
                              
                              // Alternative perspectives/approaches
                              else if (containsAny(["alternative", "different", "new way", "approach", "perspective", "angle", "lens"])) {
                                humorousInterpretation = ensureUnique("You collect alternative perspectives like some people collect stamps, except your collection is specifically curated to challenge every comfortable assumption in existence. Your mental museum of 'but what if we're all wrong about this?' is extensive.");
                              }
                              
                              // Humor/irony/satire
                              else if (containsAny(["lol", "lmao", "haha", "joke", "funny", "irony", "satire"])) {
                                humorousInterpretation = ensureUnique("Your humor isn't just entertainment—it's a Trojan horse delivering subversive ideas past the guards of conventional thinking. You've weaponized laughter as a tool for cognitive disruption.");
                              }
                              
                              // Default for other content
                              else {
                                // Vary interpretation length based on cast length
                                if (observation.length < 60) {
                                  humorousInterpretation = ensureUnique("Even this brief statement contains at least three challenges to conventional wisdom. You disrupt assumptions so naturally you probably do it in your sleep.");
                                } else {
                                  humorousInterpretation = ensureUnique("Reading your thoughts is like watching someone casually juggle conceptual hand grenades while everyone else is playing with tennis balls. The truly concerning part is how comfortable you look doing it.");
                                }
                              }
                            }
                            
                            // Generic fallback for unknown spectral types
                            else {
                              humorousInterpretation = ensureUnique("Your perspective has that rare quality of being simultaneously structured, adaptive, and disruptive—like a Swiss Army knife that's also somehow a flowing river and occasionally explodes.");
                            }
                            
                            // CUSTOM INTERPRETATIONS FOR SPECIFIC CASTS
                            // These override the general patterns for very specific content
                            
                            // Crypto/web3 specific interpretations
                            if (containsAny(["crypto", "web3", "blockchain", "token", "nft", "dao", "defi"])) {
                              if (spectralType === 1) {
                                humorousInterpretation = ensureUnique("You see crypto not as speculative chaos but as an architectural challenge—like someone handed you a pile of non-Euclidean building blocks and you're determined to create something with perfect structural integrity.");
                              } else if (spectralType === 2) {
                                humorousInterpretation = ensureUnique("You navigate crypto's wild currents like a surfer who's somehow reading the waves before they even form. While others are being tossed around, you're doing tricks off the whitecaps of volatility.");
                              } else if (spectralType === 3) {
                                humorousInterpretation = ensureUnique("Your interest in crypto isn't about gains—it's about the delicious chaos of watching traditional financial assumptions get turned inside out. You're here for the conceptual revolution, not the token prices.");
                              }
                            }
                            
                            // AI/ML specific interpretations
                            else if (containsAny(["ai", "ml", "gpt", "claude", "intelligence", "artificial", "model", "llm"])) {
                              if (spectralType === 1) {
                                humorousInterpretation = ensureUnique("You approach AI like an architect examining a new building material with fascinating properties. 'Yes, but how does it handle load-bearing cognitive structures? What's its tolerance for logical stress?'");
                              } else if (spectralType === 2) {
                                humorousInterpretation = ensureUnique("You relate to AI as a dance partner in an evolving improvisation—sensing its movements, adapting to its capabilities, and intuitively finding the flow between human and machine cognition.");
                              } else if (spectralType === 3) {
                                humorousInterpretation = ensureUnique("Your interest in AI isn't just technological—it's philosophical disruption in digital form. You're fascinated by how it forces us to question our assumptions about intelligence, creativity, and what it means to be human.");
                              }
                            }
                            
                            // Farcaster/frames specific interpretations
                            else if (containsAny(["farcaster", "frame", "cast", "warpcast"])) {
                              if (spectralType === 1) {
                                humorousInterpretation = ensureUnique("You don't just use Farcaster—you're mentally mapping its information architecture and probably designing improvements to its taxonomy. Your casual scrolling includes UML diagrams.");
                              } else if (spectralType === 2) {
                                humorousInterpretation = ensureUnique("You experience Farcaster as a living ecosystem of conversations and connections, intuitively sensing the ebb and flow of community attention. You probably know a trend is forming before the people starting it do.");
                              } else if (spectralType === 3) {
                                humorousInterpretation = ensureUnique("Your Farcaster activity has that characteristic $EDGE quality—simultaneously participating in the platform while subtly questioning its fundamental assumptions and limitations.");
                              }
                            }
                            
                            // "Looks like X" observation casts
                            else if (observationLower.startsWith("looks like") || observationLower.includes("seems like")) {
                              if (spectralType === 1) {
                                humorousInterpretation = ensureUnique("Your observations come pre-categorized and cross-referenced with similar phenomena. I bet you have a mental filing system just for 'things that look like other things.'");
                              } else if (spectralType === 2) {
                                humorousInterpretation = ensureUnique("You don't just observe surface appearances—you intuitively sense the underlying currents and patterns that created what you're seeing. It's like you're reading the backstory of reality in real-time.");
                              } else if (spectralType === 3) {
                                humorousInterpretation = ensureUnique("Your observations come with built-in skepticism about appearances. 'Looks like' in your vocabulary is almost always followed by an unspoken 'but actually reveals something entirely different if you question the underlying assumptions.'");
                              }
                            }
                            
                            // "Just shipped/launched/deployed X" casts
                            else if (containsAny(["just shipped", "just launched", "just deployed", "just released"])) {
                              if (spectralType === 1) {
                                humorousInterpretation = ensureUnique("Your launch announcements have the precise satisfaction of an architect unveiling a perfectly constructed building. I can almost hear the soft 'click' of the final piece falling into place.");
                              } else if (spectralType === 2) {
                                humorousInterpretation = ensureUnique("You don't just ship products—you release living organisms into the digital ecosystem, already sensing how they'll adapt and evolve through user interaction.");
                              } else if (spectralType === 3) {
                                humorousInterpretation = ensureUnique("Your launches aren't just new products—they're conceptual challenges wrapped in code. 'Here's something that questions how we've been thinking about this problem. Enjoy!'");
                              }
                            }
                            
                            return (
                              <li key={index} className="leading-relaxed mb-3">
                                <p className="mb-1">• "{evidence.observation.replace(/^"+|"+$/g, '')}"</p>
                                <div className="ml-4">
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