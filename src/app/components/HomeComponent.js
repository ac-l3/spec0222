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
                          
                      // Only use actual casts from the user's content, up to 2-3 (reduced from 4)
                      return filteredEvidence.slice(0, 3).map((evidence, index) => {
                        // Generate holistic interpretation based on spectral type and the entire cast content
                        let humorousInterpretation = "";
                        const observation = evidence.observation || "";
                        const observationLower = observation.toLowerCase();
                        const spectralType = analysis.spectralType;
                        
                        // Function to check if observation contains any of the terms
                        const containsAny = (terms) => terms.some(term => observationLower.includes(term));
                        
                        // HOLISTIC INTERPRETATION APPROACH
                        // Analyze the entire cast based on spectral type and content themes
                        
                        // $AXIS Framer interpretations - focus on structure, frameworks, and systematic thinking
                        if (spectralType === 1) {
                          
                          // Tech/coding related
                          if (containsAny(["code", "build", "dev", "api", "function", "app", "website", "program", "framework", "system", "design", "architecture"])) {
                            if (containsAny(["problem", "issue", "bug", "fix", "error"])) {
                              humorousInterpretation = "You don't just solve problems—you categorize them into taxonomies of edge cases and systematic improvements. Where others see isolated bugs, you see patterns that reveal structural insights.";
                            } else if (containsAny(["launch", "deploy", "ship", "release"])) {
                              humorousInterpretation = "Even your deployment announcements reveal your architectural mindset. You're not just shipping code—you're extending a carefully designed system into the world.";
                            } else {
                              humorousInterpretation = "Your technical communications reveal how you naturally think in systems and structures. You don't just build—you architect solutions with an awareness of how each component relates to the whole.";
                            }
                          }
                          
                          // Analysis/research related
                          else if (containsAny(["analyze", "research", "study", "learn", "understand", "explore", "discover", "insight", "pattern", "data"])) {
                            humorousInterpretation = "Your approach to knowledge reveals your framework-building nature. You don't just gather information—you're constantly organizing it into coherent systems that reveal hidden connections.";
                          }
                          
                          // Organization/structure related
                          else if (containsAny(["organize", "structure", "plan", "map", "model", "framework", "system", "process", "method"])) {
                            humorousInterpretation = "This statement perfectly captures your $AXIS nature—you instinctively create order and structure, transforming ambiguity into clear frameworks that others can navigate.";
                          }
                          
                          // Opinion/perspective statements
                          else if (containsAny(["think", "believe", "opinion", "perspective", "view", "consider"])) {
                            humorousInterpretation = "Even your casual opinions come with invisible footnotes and cross-references. Your mind naturally organizes thoughts into coherent frameworks rather than isolated viewpoints.";
                          }
                          
                          // Questions/curiosity
                          else if (observationLower.includes("?") || containsAny(["wonder", "curious", "question", "how", "why", "what if"])) {
                            humorousInterpretation = "Your questions reveal how you think—not in isolated curiosities but in structured inquiries that map out conceptual territories and their boundaries.";
                          }
                          
                          // Observations about trends/patterns
                          else if (containsAny(["trend", "pattern", "notice", "observe", "seeing", "movement", "shift", "change"])) {
                            humorousInterpretation = "You don't just notice trends—you automatically place them within larger systems of understanding. This pattern-recognition is the foundation of your framework-building approach.";
                          }
                          
                          // Default for other content
                          else {
                            // Vary interpretation length based on cast length
                            if (observation.length < 60) {
                              humorousInterpretation = "Even your brief thoughts reveal your natural tendency to create structure and order from chaos.";
                            } else {
                              humorousInterpretation = "This statement reveals your $AXIS nature—you naturally organize information into coherent frameworks, finding patterns and structures where others see only isolated elements.";
                            }
                          }
                        }
                        
                        // $FLUX Drifter interpretations - focus on adaptability, flow, and intuitive navigation
                        else if (spectralType === 2) {
                          
                          // Adaptability/change related
                          if (containsAny(["adapt", "change", "evolve", "shift", "flow", "move", "transform"])) {
                            humorousInterpretation = "This perfectly captures your $FLUX nature—you naturally sense and flow with emerging patterns, adapting to changes that others don't even perceive yet.";
                          }
                          
                          // Trend/pattern observation
                          else if (containsAny(["trend", "pattern", "notice", "observe", "seeing", "movement", "emerging", "developing"])) {
                            humorousInterpretation = "You have a natural ability to sense subtle patterns in real-time. Where others need historical data, you can feel currents of change as they're happening.";
                          }
                          
                          // Connection/relationship focused
                          else if (containsAny(["connect", "relationship", "network", "community", "together", "collaboration", "ecosystem"])) {
                            humorousInterpretation = "You naturally perceive the world as interconnected systems rather than isolated elements. This statement reveals how you navigate by sensing relationships and flows between concepts.";
                          }
                          
                          // Experimentation/exploration
                          else if (containsAny(["try", "experiment", "explore", "test", "play", "discover"])) {
                            humorousInterpretation = "Your approach to discovery is quintessentially $FLUX—you learn through immersion and movement rather than rigid analysis, allowing insights to emerge through direct engagement.";
                          }
                          
                          // Intuition/feeling based
                          else if (containsAny(["feel", "sense", "intuition", "vibe", "energy", "resonance"])) {
                            humorousInterpretation = "This statement reveals your natural attunement to subtle frequencies others miss. You navigate by sensing resonances and dissonances that exist beyond logical analysis.";
                          }
                          
                          // Questions about emerging trends
                          else if (observationLower.includes("?") && containsAny(["new", "next", "future", "coming", "emerging", "developing"])) {
                            humorousInterpretation = "Your questions reveal how your mind naturally orients toward what's emerging. You're already sensing the shape of possibilities before they fully materialize.";
                          }
                          
                          // Default for other content
                          else {
                            // Vary interpretation length based on cast length
                            if (observation.length < 60) {
                              humorousInterpretation = "Even in these few words, your adaptive $FLUX nature shines through—sensing patterns where others see only noise.";
                            } else {
                              humorousInterpretation = "This statement reveals your $FLUX sensibility—you naturally perceive the world as flows and currents rather than fixed structures, allowing you to navigate complexity through intuitive adaptation.";
                            }
                          }
                        }
                        
                        // $EDGE Disruptor interpretations - focus on challenging assumptions and finding insights in disruption
                        else if (spectralType === 3) {
                          
                          // Challenging assumptions/status quo
                          if (containsAny(["wrong", "mistake", "problem", "issue", "broken", "fail", "missing", "overlooked"])) {
                            humorousInterpretation = "Classic $EDGE perspective—you naturally identify the limitations in existing systems that others take for granted. This critical lens is how you discover opportunities for transformation.";
                          }
                          
                          // Contrarian perspectives
                          else if (containsAny(["actually", "contrary", "opposite", "instead", "rather", "however", "but", "different"])) {
                            humorousInterpretation = "This statement perfectly captures your contrarian $EDGE thinking—you instinctively look at situations from angles others miss, finding value in perspectives that challenge conventional wisdom.";
                          }
                          
                          // Boundary testing/breaking
                          else if (containsAny(["limit", "boundary", "edge", "beyond", "outside", "break", "disrupt", "challenge"])) {
                            humorousInterpretation = "You naturally gravitate toward boundaries and edges—not to stay safely within them, but to test, challenge, and ultimately transcend them. This is quintessential $EDGE thinking.";
                          }
                          
                          // Questioning established ideas
                          else if (containsAny(["why", "question", "wonder", "doubt", "skeptical"]) || observationLower.includes("?")) {
                            humorousInterpretation = "Your questions aren't just about gathering information—they're about challenging fundamental assumptions that others take for granted. This is how $EDGE thinkers discover breakthrough insights.";
                          }
                          
                          // Alternative perspectives/approaches
                          else if (containsAny(["alternative", "different", "new way", "approach", "perspective", "angle", "lens"])) {
                            humorousInterpretation = "You naturally seek alternative perspectives that challenge conventional thinking. This statement reveals how you find value in viewpoints that exist at the edges of mainstream discourse.";
                          }
                          
                          // Humor/irony/satire
                          else if (containsAny(["lol", "lmao", "haha", "joke", "funny", "irony", "satire"])) {
                            humorousInterpretation = "Your humor reveals your $EDGE nature—you use irony and satire as tools to highlight contradictions and absurdities that conventional thinking overlooks.";
                          }
                          
                          // Default for other content
                          else {
                            // Vary interpretation length based on cast length
                            if (observation.length < 60) {
                              humorousInterpretation = "Even in these few words, your disruptive $EDGE perspective shines through—challenging assumptions others take for granted.";
                            } else {
                              humorousInterpretation = "This statement reveals your $EDGE sensibility—you naturally question established frameworks and find value in perspectives that exist at the boundaries of conventional thinking.";
                            }
                          }
                        }
                        
                        // Generic fallback for unknown spectral types
                        else {
                          humorousInterpretation = "Your unique perspective reveals how you navigate complexity with a distinctive approach that balances structure, adaptation, and critical thinking.";
                        }
                        
                        // CUSTOM INTERPRETATIONS FOR SPECIFIC CASTS
                        // These override the general patterns for very specific content
                        
                        // Crypto/web3 specific interpretations
                        if (containsAny(["crypto", "web3", "blockchain", "token", "nft", "dao", "defi"])) {
                          if (spectralType === 1) {
                            humorousInterpretation = "You approach crypto not as speculation but as systems architecture—mapping the structural relationships that others miss beneath the hype and volatility.";
                          } else if (spectralType === 2) {
                            humorousInterpretation = "You navigate crypto's chaotic landscape by sensing emergent patterns in real-time, flowing with currents of innovation rather than clinging to rigid frameworks.";
                          } else if (spectralType === 3) {
                            humorousInterpretation = "Your engagement with crypto reveals your $EDGE nature—you're interested in how it challenges fundamental assumptions about value, trust, and coordination.";
                          }
                        }
                        
                        // AI/ML specific interpretations
                        else if (containsAny(["ai", "ml", "gpt", "claude", "intelligence", "artificial", "model", "llm"])) {
                          if (spectralType === 1) {
                            humorousInterpretation = "You see AI not just as tools but as components in larger systems—your mind naturally maps how these technologies fit into broader frameworks of knowledge and capability.";
                          } else if (spectralType === 2) {
                            humorousInterpretation = "Your approach to AI reveals your adaptive nature—you're attuned to how these technologies are evolving in real-time and how to flow with their emerging capabilities.";
                          } else if (spectralType === 3) {
                            humorousInterpretation = "Your interest in AI reflects your $EDGE perspective—you're drawn to how these technologies challenge our fundamental assumptions about intelligence, creativity, and human uniqueness.";
                          }
                        }
                        
                        // Farcaster/frames specific interpretations
                        else if (containsAny(["farcaster", "frame", "cast", "warpcast"])) {
                          if (spectralType === 1) {
                            humorousInterpretation = "Even your engagement with social platforms reveals your architectural thinking—you're naturally aware of how features like Frames create structured possibilities for interaction.";
                          } else if (spectralType === 2) {
                            humorousInterpretation = "You engage with Farcaster as a living ecosystem, sensing how conversations and features evolve in real-time rather than treating them as fixed utilities.";
                          } else if (spectralType === 3) {
                            humorousInterpretation = "Your Farcaster activity reveals your boundary-testing nature—you're interested in how these new social primitives challenge conventional assumptions about online interaction.";
                          }
                        }
                        
                        // Specific cast pattern overrides
                        // These are highly specific matches for common patterns
                        
                        // "gm" or "gn" casts
                        if (/^gm+[!.]*$/i.test(observationLower) || /^gn+[!.]*$/i.test(observationLower)) {
                          if (spectralType === 1) {
                            humorousInterpretation = "Even your ritual greetings have an architectural quality—establishing consistent patterns that create structure within community spaces.";
                          } else if (spectralType === 2) {
                            humorousInterpretation = "Your simple greeting is actually a subtle act of community resonance—you're attuning to and reinforcing the rhythms that bind social spaces together.";
                          } else if (spectralType === 3) {
                            humorousInterpretation = "Your participation in greeting rituals has a subversive quality—simultaneously embracing and gently mocking the conventions of online community.";
                          }
                        }
                        
                        // "Looks like X" observation casts
                        else if (observationLower.startsWith("looks like") || observationLower.includes("seems like")) {
                          if (spectralType === 1) {
                            humorousInterpretation = "Your observations reveal how you naturally classify and categorize—identifying patterns and fitting them into existing mental frameworks.";
                          } else if (spectralType === 2) {
                            humorousInterpretation = "You don't just observe—you sense the currents beneath the surface, intuitively grasping emerging patterns before they fully materialize.";
                          } else if (spectralType === 3) {
                            humorousInterpretation = "Your observations often contain subtle challenges to conventional interpretations—you see what others see, but from angles that reveal overlooked contradictions.";
                          }
                        }
                        
                        // Question casts
                        else if (observationLower.includes("?") && observation.length < 50) {
                          if (spectralType === 1) {
                            humorousInterpretation = "Your questions reveal how you build knowledge—systematically identifying gaps in existing frameworks and seeking the precise information needed to complete them.";
                          } else if (spectralType === 2) {
                            humorousInterpretation = "Your questions emerge from intuitive sensing of what's missing—you're attuned to gaps in understanding that others haven't yet noticed.";
                          } else if (spectralType === 3) {
                            humorousInterpretation = "Your questions often contain implicit challenges to assumptions—not just seeking information but subtly highlighting contradictions in conventional thinking.";
                          }
                        }
                        
                        // "Just shipped/launched/deployed X" casts
                        else if (containsAny(["just shipped", "just launched", "just deployed", "just released"])) {
                          if (spectralType === 1) {
                            humorousInterpretation = "Your launch announcements reveal your builder's mindset—you create structured solutions and systematically bring them into the world.";
                          } else if (spectralType === 2) {
                            humorousInterpretation = "You don't just ship products—you release adaptable solutions that can evolve with emerging user needs and environmental changes.";
                          } else if (spectralType === 3) {
                            humorousInterpretation = "Your launches often challenge existing paradigms—you're not just adding to the ecosystem but subtly disrupting it with alternatives to conventional approaches.";
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