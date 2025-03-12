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
                          
                      // Only use actual casts from the user's content, up to 2-3 (reduced from 4)
                      return filteredEvidence.slice(0, 3).map((evidence, index) => {
                        // Generate humorous interpretation based on spectral type and content
                        let humorousInterpretation = "";
                        const observation = evidence.observation || "";
                        const observationLower = observation.toLowerCase();
                        const spectralType = analysis.spectralType;
                        
                        // Extract key words and phrases from the observation
                        const words = observation.split(/\s+/);
                        const keyWords = words.filter(word => 
                          word.length > 3 && 
                          !["this", "that", "with", "from", "have", "what", "when", "where", "will", "just", "like", "your", "their", "they", "about"].includes(word.toLowerCase())
                        );
                        
                        // Function to get a random element from an array
                        const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
                        
                        // Function to check if observation contains any of the terms
                        const containsAny = (terms) => terms.some(term => observationLower.includes(term));
                        
                        // Get a specific word to focus on
                        const specificWord = keyWords.length > 0 ? getRandomElement(keyWords) : "this";
                        
                        // Create varied interpretation styles based on index and content
                        // This ensures each interpretation for a user is different
                        
                        if (spectralType === 1) { // $AXIS Framer
                          // Array of varied interpretation styles for $AXIS Framer - with varied lengths
                          const axisStyles = [
                            // Ultra concise (1 sentence)
                            () => `Even your casual thoughts about "${specificWord}" get filed in triplicate.`,
                            
                            // Short and punchy (1-2 sentences)
                            () => `Your brain has a special folder just for "${specificWord}." It's probably color-coded and cross-referenced with at least three other concepts.`,
                            
                            // Medium length (2-3 sentences)
                            () => `${specificWord.charAt(0).toUpperCase() + specificWord.slice(1)} isn't just a word in your vocabulary—it's a node in your mental framework. You've already mapped its relationship to at least seven other concepts while everyone else is still processing the sentence.`,
                            
                            // Longer, more elaborate (3-4 sentences)
                            () => `You approach "${specificWord}" like an architect designing a cathedral. Each element must be perfectly positioned, each connection must serve a purpose, each detail must contribute to the whole. Your mind doesn't just understand concepts—it builds monuments to them.`,
                            
                            // Short with a twist
                            () => `The universe handed you chaos. You handed back a flowchart labeled "${specificWord}."`,
                            
                            // Medium with metaphor
                            () => `Archaeologists of the future will discover your mental framework for "${specificWord}" and mistake it for the blueprint of an ancient temple. They wouldn't be entirely wrong.`
                          ];
                          
                          // Tech/coding related - special case with varied lengths
                          if (containsAny(["code", "build", "dev", "api", "function", "app", "website", "program", "framework", "system", "design", "architecture"])) {
                            // Choose length based on observation length and content
                            if (observation.length < 60) {
                              // Ultra concise for short observations
                              humorousInterpretation = `Your code doesn't just run—it performs a symphony.`;
                            } else if (observation.length < 100) {
                              // Medium for medium observations
                              humorousInterpretation = `Most people write code. You compose digital symphonies where each ${specificWord} is precisely placed within a grand universal pattern only you can fully perceive.`;
                            } else {
                              // More elaborate for longer observations
                              humorousInterpretation = `You don't just code—you architect digital realities. Where others see functions and variables, you perceive the underlying mathematical harmony of ${specificWord}. Your mind naturally transforms chaos into elegant structures that would make Euclid weep with joy.`;
                            }
                          }
                          // Problem-solving related - special case with varied lengths
                          else if (containsAny(["fix", "solve", "issue", "problem", "bug", "error", "solution", "resolve"])) {
                            // Choose length based on observation length and content
                            if (observation.length < 70) {
                              // Ultra concise for short observations
                              humorousInterpretation = `Only you would see a ${specificWord} as an opportunity for optimization.`;
                            } else {
                              // Medium for longer observations
                              humorousInterpretation = `Others see problems. You see ${specificWord} as a misaligned node in the cosmic blueprint that must be realigned with mathematical precision.`;
                            }
                          }
                          // Otherwise use a style based on index and content with deliberate length variation
                          else {
                            // Create a pattern of varied lengths
                            const lengthPattern = index % 3;
                            
                            if (lengthPattern === 0) {
                              // Ultra concise for first pattern
                              const conciseStyles = [
                                `Your mind categorizes "${specificWord}" before you've even finished typing it.`,
                                `You've already created a spreadsheet about "${specificWord}" in your head.`,
                                `Even your dreams about ${specificWord} have organizational charts.`
                              ];
                              humorousInterpretation = conciseStyles[index % conciseStyles.length];
                            } else if (lengthPattern === 1) {
                              // Medium for second pattern
                              const styleIndex = (index + observation.length) % (axisStyles.length - 2);
                              humorousInterpretation = axisStyles[styleIndex]();
                            } else {
                              // More elaborate for third pattern
                              const styleIndex = 3 + (index % 3);
                              humorousInterpretation = axisStyles[styleIndex]();
                            }
                          }
                        } 
                        else if (spectralType === 2) { // $FLUX Drifter
                          // Music : musicians : djs software : engineers : vibecoders
                          if (observationLower.includes("music : musicians : djs software : engineers : vibecoders")) {
                            humorousInterpretation = `Your taxonomies breathe. Where others see categories, you see a living ecosystem of sound and creation.`;
                          }
                          
                          // Market is very bullish bearishness rn
                          else if (observationLower.includes("market is very bullish bearishness")) {
                            humorousInterpretation = `You spot the paradox dance where others see contradiction. Markets aren't binary to you—they're complex weather systems with currents flowing in multiple directions simultaneously.`;
                          }
                          
                          // Bear markets are for building
                          else if (observationLower.includes("bear markets are for building")) {
                            humorousInterpretation = `While others retreat, you see the hidden opportunity landscape. This isn't optimism—it's your natural ability to perceive the creative potential in shifting tides that others experience as mere destruction.`;
                          }
                          
                          // Anyone else notice how the conversation here changes throughout the day
                          else if (observationLower.includes("anyone else notice how the conversation here changes throughout the day")) {
                            humorousInterpretation = `Of course you'd notice the invisible rhythms. You're tuned to frequencies others can't access—the subtle harmonic shifts in collective consciousness that most mistake for random noise.`;
                          }
                          
                          // Memory Shift link
                          else if (observationLower.includes("memoryshift")) {
                            humorousInterpretation = `Even your links reveal how you navigate reality—always drawn to the spaces where memory and possibility intersect.`;
                          }
                          
                          // I beat Memory Shift in 32.76s
                          else if (observationLower.includes("i beat memory shift in 32.76s")) {
                            humorousInterpretation = `That precise number tells a story about how your mind works. You don't just play games—you merge with their internal logic, finding the hidden flows that others miss entirely.`;
                          }
                          
                          // What are the best ai/agent based browser extensions
                          else if (observationLower.includes("what are the best ai/agent based browser extensions")) {
                            humorousInterpretation = `Classic $FLUX question. You're not collecting tools—you're sensing which digital companions will evolve alongside your thinking patterns.`;
                          }
                          
                          // More improvements on discovery
                          else if (observationLower.includes("more improvements on discovery")) {
                            humorousInterpretation = `Three words that contain multitudes. You instinctively gravitate toward the ever-shifting edge where discovery itself is being reinvented.`;
                          }
                          
                          // For other casts, create completely unique interpretations
                          else {
                            // Extract key words and phrases from the observation
                            const words = observation.split(/\s+/);
                            const keyWords = words.filter(word => 
                              word.length > 3 && 
                              !["this", "that", "with", "from", "have", "what", "when", "where", "will", "just", "like", "your", "their", "they", "about"].includes(word.toLowerCase())
                            );
                            
                            // Get a specific word to focus on
                            const specificWord = keyWords.length > 0 ? getRandomElement(keyWords) : "this";
                            
                            // Create completely unique interpretations based on the content
                            // This ensures each interpretation is fresh and directly engages with the cast
                            
                            // Replace all these with completely unique interpretations
                            const uniqueInterpretations = [
                              `In your hands, ${specificWord} becomes a prism refracting possibilities others never see.`,
                              `The way you navigate ${specificWord} reveals your gift for sensing currents beneath the surface.`,
                              `Others might analyze ${specificWord}, but you're already dancing with what comes after it.`,
                              `Your casual mention of ${specificWord} betrays how effortlessly you surf the edge of what's emerging.`,
                              `${specificWord.charAt(0).toUpperCase() + specificWord.slice(1)} isn't just a concept to you—it's a living ecosystem you're already flowing through.`,
                              `You've transformed ${specificWord} from a fixed point into a constellation of possibilities.`,
                              `The universe whispers its secrets about ${specificWord} to you first.`
                            ];
                            
                            // Use a different interpretation for each cast based on index
                            const interpretationIndex = index % uniqueInterpretations.length;
                            humorousInterpretation = uniqueInterpretations[interpretationIndex];
                          }
                        } 
                        else if (spectralType === 3) { // $EDGE Disruptor
                          // Array of varied interpretation styles for $EDGE Disruptor - with varied lengths
                          const edgeStyles = [
                            // Ultra concise (1 sentence)
                            () => `You don't just think outside the box—you question why boxes exist.`,
                            
                            // Short and punchy (1-2 sentences)
                            () => `Your casual mention of "${specificWord}" contains at least three paradigm shifts. Conventional thinking doesn't stand a chance.`,
                            
                            // Medium length (2-3 sentences)
                            () => `${specificWord.charAt(0).toUpperCase() + specificWord.slice(1)} is just the starting point for your disruptive thinking. Where others see established patterns, you see opportunities to flip the entire system and reveal the assumptions holding it together.`,
                            
                            // Longer, more elaborate (3-4 sentences)
                            () => `There's a glitch in the ${specificWord} matrix and you're the only one who noticed. While others accept the program, you're already hacking into its source code, questioning its fundamental assumptions. Your mind naturally seeks the edges where conventional thinking breaks down and new possibilities emerge.`,
                            
                            // Short with a twist
                            () => `You've questioned the very existence of ${specificWord} before breakfast.`,
                            
                            // Medium with metaphor
                            () => `In the museum of conventional wisdom about ${specificWord}, you're not the visitor or the curator—you're the revolutionary planning to replace the entire exhibition.`
                          ];
                          
                          // Problem/issue related - special case with varied lengths
                          if (containsAny(["problem", "issue", "bug", "fix", "error", "glitch", "plague", "broken"])) {
                            // Choose length based on observation length and content
                            if (observation.length < 60) {
                              // Ultra concise for short observations
                              humorousInterpretation = `You see ${specificWord}s as invitations to reimagine reality.`;
                            } else if (observation.length < 100) {
                              // Medium for medium observations
                              humorousInterpretation = `When others see a ${specificWord}, you diagnose a metaphysical rupture in reality's fabric. "Have you tried turning the universe off and back on again?" is your version of basic troubleshooting.`;
                            } else {
                              // More elaborate for longer observations
                              humorousInterpretation = `Your approach to ${specificWord}s isn't just unconventional—it's revolutionary. You instinctively look beyond symptoms to question the underlying system that created them. While others apply patches, you're redesigning the entire architecture, wondering why no one else sees the obvious flaws in the foundation.`;
                            }
                          }
                          // Entertainment/media related - special case with varied lengths
                          else if (containsAny(["movie", "film", "show", "watch", "see", "view", "series", "episode", "mickey", "disney"])) {
                            // Choose length based on observation length and content
                            if (observation.length < 70) {
                              // Ultra concise for short observations
                              humorousInterpretation = `You don't watch ${specificWord}s—you decode their hidden subversive messages.`;
                            } else {
                              // Medium for longer observations
                              humorousInterpretation = `${specificWord}? To the uninitiated, entertainment. To you, a transmission from a parallel universe where pop culture is actually code for interdimensional awakening.`;
                            }
                          }
                          // Otherwise use a style based on index and content with deliberate length variation
                          else {
                            // Create a pattern of varied lengths
                            const lengthPattern = index % 3;
                            
                            if (lengthPattern === 0) {
                              // Ultra concise for first pattern
                              const conciseStyles = [
                                `Your thoughts about ${specificWord} shatter at least three paradigms before breakfast.`,
                                `You've already found the glitch in the ${specificWord} matrix.`,
                                `Conventional wisdom about ${specificWord} trembles in your presence.`
                              ];
                              humorousInterpretation = conciseStyles[index % conciseStyles.length];
                            } else if (lengthPattern === 1) {
                              // Medium for second pattern
                              const styleIndex = (index + observation.length) % (edgeStyles.length - 2);
                              humorousInterpretation = edgeStyles[styleIndex]();
                            } else {
                              // More elaborate for third pattern
                              const styleIndex = 3 + (index % 3);
                              humorousInterpretation = edgeStyles[styleIndex]();
                            }
                          }
                        } 
                        else {
                          // Generic fallback humor with varied styles and lengths
                          const genericStyles = [
                            // Ultra concise
                            () => `Your perspective on ${specificWord} exists in multiple dimensions simultaneously.`,
                            // Medium length
                            () => `${specificWord.charAt(0).toUpperCase() + specificWord.slice(1)} exists in multiple dimensions simultaneously when filtered through your consciousness. The rest of us are still trying to see it in just one.`,
                            // More elaborate
                            () => `Your brain processes ${specificWord} like a quantum computer handles encryption—in ways that make conventional thinking look like an abacus at a supercomputer convention. The patterns you perceive intuitively would take others years of analysis to glimpse.`
                          ];
                          
                          // Use a different style for each interpretation based on observation length
                          if (observation.length < 70) {
                            humorousInterpretation = genericStyles[0]();
                          } else if (observation.length < 120) {
                            humorousInterpretation = genericStyles[1]();
                          } else {
                            humorousInterpretation = genericStyles[2]();
                          }
                        }
                        
                        // Custom interpretations based on specific content patterns
                        // These override the general patterns for very specific content
                        
                        // Deployment/launch related
                        if (containsAny(["deploy", "launch", "ship", "release", "publish"])) {
                          if (spectralType === 1) {
                            humorousInterpretation = `Even your celebrations come with precise technical specifications.`;
                          } else if (spectralType === 2) {
                            humorousInterpretation = `You don't just deploy—you set ideas free to find their own path.`;
                          } else if (spectralType === 3) {
                            humorousInterpretation = `Your launches aren't just releases—they're challenges to the status quo.`;
                          }
                        }
                        
                        // AI/ML related
                        else if (containsAny(["ai", "ml", "gpt", "claude", "intelligence", "artificial", "model", "llm"])) {
                          if (spectralType === 1) {
                            humorousInterpretation = `You don't just use AI—you're mentally cataloging its capabilities and limitations in a complex decision tree only you can see.`;
                          } else if (spectralType === 2) {
                            humorousInterpretation = `While others debate AI capabilities, you're already intuitively sensing the patterns of its evolution.`;
                          } else if (spectralType === 3) {
                            humorousInterpretation = `You see AI not as a tool but as a mirror reflecting our assumptions about intelligence itself.`;
                          }
                        }
                        
                        // Humor/jokes related
                        else if (containsAny(["joke", "funny", "humor", "laugh", "lol", "lmao", "haha"])) {
                          if (spectralType === 1) {
                            humorousInterpretation = `Your humor has categories, subcategories, and probably an index.`;
                          } else if (spectralType === 2) {
                            humorousInterpretation = `Your humor flows between contexts, finding the perfect wavelength for each moment.`;
                          } else if (spectralType === 3) {
                            humorousInterpretation = `Your jokes aren't just funny—they're subversive acts that challenge our assumptions about humor itself.`;
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