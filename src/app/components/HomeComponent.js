'use client';

import { useState, useRef, useEffect } from 'react';
import { UI_CONFIG, SHARE_CONFIG, CONTENT_FILTER, SPECTRAL_TYPES, METRIC_CONFIG } from '../../lib/constants';
import Layout from './Layout';
import { Fira_Code } from 'next/font/google';
import ErrorMessage from './ErrorMessage';
import LandingPage from './LandingPage';
import AnalysisHeader from './AnalysisHeader';
import AnalysisActions from './AnalysisActions';
import CoreIdentity from './CoreIdentity';
import ExplorationStyle from './ExplorationStyle';
import FieldEvidenceList from './FieldEvidenceList';
import { useAnalysis } from './hooks/useAnalysis';
import { useFrameUser } from './hooks/useFrameUser';

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

export default function HomeComponent({ fid: initialFid, initialData }) {
  const [isSharing, setIsSharing] = useState(false);
  const buttonSoundRef = useRef(null);
  
  // Use custom hooks for state management
  const {
    analysis,
    fid,
    userInfo,
    isAnalyzing,
    errorMessage,
    setErrorMessage,
    handleAnalyze,
  } = useAnalysis(initialFid, initialData);
  
  // Frame user context available if needed
  useFrameUser(fid);

  // Initialize audio on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      buttonSoundRef.current = new Audio(UI_CONFIG.BUTTON_SOUND_PATH);
      
      // Listen for test error events from LandingPage
      const handleTestError = (event) => {
        setErrorMessage(event.detail);
      };
      window.addEventListener('test-error', handleTestError);
      return () => window.removeEventListener('test-error', handleTestError);
    }
  }, [setErrorMessage]);

  // Enhanced handleAnalyze with sound
  const handleAnalyzeWithSound = async () => {
    if (buttonSoundRef.current) {
      buttonSoundRef.current.currentTime = 0;
      buttonSoundRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
    await handleAnalyze();
  };

  const handleShare = async (e) => {
    e.preventDefault();
    setIsSharing(true);
    
    try {
      // Get the spectral type name and number
      const spectralTypeName = SPECTRAL_TYPES[analysis.spectralType].name;
      const spectralTypeNumber = analysis.spectralType;
      
      // Create share text with spectral type
      const shareText = SHARE_CONFIG.SHARE_TEXT_TEMPLATE(spectralTypeName);
      
      // Add a timestamp to force a refresh of the metadata
      const timestamp = Date.now();
      
      // Create a simplified URL with JUST the type parameter and a timestamp
      const resultUrl = `${process.env.NEXT_PUBLIC_BASE_URL}?type=${spectralTypeNumber}&t=${timestamp}`;
      
      console.log('Sharing URL with timestamp:', resultUrl);
      
      // Use warpcast.com/~/ link format which works on both mobile and desktop
      const warpcastUrl = `${SHARE_CONFIG.WARPCAST_COMPOSE_URL}?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(resultUrl)}`;
      console.log('Opening Warpcast URL:', warpcastUrl);
      
      // Use the Frame SDK to open the URL
      window.frame.sdk.actions.openUrl(warpcastUrl);
    } catch (error) {
      console.error('Error sharing:', error);
      setErrorMessage('Failed to share. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  // Add safety checks and use correct path
  const metrics = analysis?.researchProfile?.researchDeployment?.metrics;

  return (
    <Layout>
      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
          autoDismiss={true}
          autoDismissDelay={UI_CONFIG.ERROR_AUTO_DISMISS_DELAY}
        />
      )}
      <div className={`min-h-screen bg-[#191919] ${firaCode.className} font-normal overflow-x-hidden w-full`}>
          <div className={`max-w-4xl mx-auto ${analysis ? 'px-4 sm:px-6 md:px-8' : 'px-3'} py-8 sm:py-12`}>
            {analysis && analysis.researchProfile && (
              <div className="text-center text-[#C0C2C5] max-w-3xl mx-auto">
                <AnalysisHeader 
                analysis={analysis} 
                username={userInfo?.username} 
              />
              
                <AnalysisActions 
                  analysis={analysis}
                  onShare={handleShare}
                  isSharing={isSharing}
                />
              
                <CoreIdentity 
                  coreIdentity={analysis.researchProfile?.coreIdentity} 
                />
              
                <ExplorationStyle analysis={analysis} />
              
                {/* Field Evidence - Now in its own box with new title */}
                <div className="text-left mb-12 px-1">
                <div className="mb-4">
                  <h3 className="text-base font-normal">What do your casts whisper about you?</h3>
                </div>
                <div className="bg-[#222222] border border-[#333333] p-6 sm:p-8 overflow-hidden">
                  <ul className="list-none pl-0 space-y-3 text-[#BEBFC2] text-sm">
                    <FieldEvidenceList analysis={analysis} />
                              </ul>
                          </div>
                        </div>
                        
                        {/* Outside Your Frequency - Updated to a simpler format */}
                        <div className="text-left mb-12 px-1">
                          <div className="mb-4">
                            <h3 className="text-base font-normal">Where do you diverge from other researchers?</h3>
                          </div>
                          <div className="bg-[#222222] border border-[#333333] p-6 sm:p-8 overflow-hidden">
                            <p className="leading-relaxed text-sm mb-8 text-[#999999] break-words">
                              {(() => {
                                // Get the spectral type to determine the contrast explanation
                                const spectralType = analysis.spectralType;
                                
                                // Get the metrics to determine second and third alignments
                                const axisScore = typeof metrics?.exploratoryDepth === 'object' ? metrics?.exploratoryDepth.score : metrics?.exploratoryDepth || 0;
                                const fluxScore = typeof metrics?.dataRetention === 'object' ? metrics?.dataRetention.score : metrics?.dataRetention || 0;
                                const edgeScore = typeof metrics?.systematicThinking === 'object' ? metrics?.systematicThinking.score : metrics?.systematicThinking || 0;
                                
                                // Set the primary type to 5
                                let primaryScore = METRIC_CONFIG.PRIMARY_SCORE;
                                let secondaryType, secondaryScore, tertiaryType, tertiaryScore;
                                
                                // Determine secondary and tertiary types based on spectral type
                                if (spectralType === 1) { // $AXIS Framer
                                  secondaryType = fluxScore >= edgeScore ? 2 : 3;
                                  secondaryScore = Math.min(METRIC_CONFIG.MAX_SECONDARY_SCORE, Math.max(fluxScore, edgeScore));
                                  tertiaryType = fluxScore >= edgeScore ? 3 : 2;
                                  tertiaryScore = Math.min(METRIC_CONFIG.MAX_TERTIARY_SCORE, Math.min(fluxScore, edgeScore));
                                } else if (spectralType === 2) { // $FLUX Drifter
                                  secondaryType = axisScore >= edgeScore ? 1 : 3;
                                  secondaryScore = Math.min(METRIC_CONFIG.MAX_SECONDARY_SCORE, Math.max(axisScore, edgeScore));
                                  tertiaryType = axisScore >= edgeScore ? 3 : 1;
                                  tertiaryScore = Math.min(METRIC_CONFIG.MAX_TERTIARY_SCORE, Math.min(axisScore, edgeScore));
                                } else if (spectralType === 3) { // $EDGE Disruptor
                                  secondaryType = axisScore >= fluxScore ? 1 : 2;
                                  secondaryScore = Math.min(METRIC_CONFIG.MAX_SECONDARY_SCORE, Math.max(axisScore, fluxScore));
                                  tertiaryType = axisScore >= fluxScore ? 2 : 1;
                                  tertiaryScore = Math.min(METRIC_CONFIG.MAX_TERTIARY_SCORE, Math.min(axisScore, fluxScore));
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
                                        return `${METRIC_CONFIG.PRIMARY_SCORE}/${METRIC_CONFIG.MAX_SCORE}`;
                                      } else {
                                        // Otherwise use the calculated score, max 4
                                        const score = typeof metrics?.exploratoryDepth === 'object' ? 
                                          metrics?.exploratoryDepth.score : metrics?.exploratoryDepth || 0;
                                        return `${Math.min(METRIC_CONFIG.MAX_SECONDARY_SCORE, score)}/${METRIC_CONFIG.MAX_SCORE}`;
                                      }
                                    })()}
                                  </span>
                                </div>
                                <div className="w-full bg-[#333333] h-2">
                                  <div className="bg-[#C8FA1A] h-2" style={{ 
                                    width: `${analysis.spectralType === 1 ? METRIC_CONFIG.FULL_PERCENTAGE : Math.min(METRIC_CONFIG.MAX_SECONDARY_SCORE, (typeof metrics?.exploratoryDepth === 'object' ? metrics?.exploratoryDepth.score : metrics?.exploratoryDepth || 0)) * METRIC_CONFIG.PERCENTAGE_MULTIPLIER}%` 
                                  }}></div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-[#BEBFC2] text-sm">$FLUX Drifter</span>
                                  <span className="text-right text-[#BEBFC2] text-sm">
                                    {(() => {
                                      // If this is the user's spectral type, always show 5/5
                                      if (analysis.spectralType === 2) {
                                        return `${METRIC_CONFIG.PRIMARY_SCORE}/${METRIC_CONFIG.MAX_SCORE}`;
                                      } else {
                                        // Otherwise use the calculated score, max 4
                                        const score = typeof metrics?.dataRetention === 'object' ? 
                                          metrics?.dataRetention.score : metrics?.dataRetention || 0;
                                        return `${Math.min(METRIC_CONFIG.MAX_SECONDARY_SCORE, score)}/${METRIC_CONFIG.MAX_SCORE}`;
                                      }
                                    })()}
                                  </span>
                                </div>
                                <div className="w-full bg-[#333333] h-2">
                                  <div className="bg-[#C8FA1A] h-2" style={{ 
                                    width: `${analysis.spectralType === 2 ? METRIC_CONFIG.FULL_PERCENTAGE : Math.min(METRIC_CONFIG.MAX_SECONDARY_SCORE, (typeof metrics?.dataRetention === 'object' ? metrics?.dataRetention.score : metrics?.dataRetention || 0)) * METRIC_CONFIG.PERCENTAGE_MULTIPLIER}%` 
                                  }}></div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-[#BEBFC2] text-sm">$EDGE Disruptor</span>
                                  <span className="text-right text-[#BEBFC2] text-sm">
                                    {(() => {
                                      // If this is the user's spectral type, always show 5/5
                                      if (analysis.spectralType === 3) {
                                        return `${METRIC_CONFIG.PRIMARY_SCORE}/${METRIC_CONFIG.MAX_SCORE}`;
                                      } else {
                                        // Otherwise use the calculated score, max 4
                                        const score = typeof metrics?.systematicThinking === 'object' ? 
                                          metrics?.systematicThinking.score : metrics?.systematicThinking || 0;
                                        return `${Math.min(METRIC_CONFIG.MAX_SECONDARY_SCORE, score)}/${METRIC_CONFIG.MAX_SCORE}`;
                                      }
                                    })()}
                                  </span>
                                </div>
                                <div className="w-full bg-[#333333] h-2">
                                  <div className="bg-[#C8FA1A] h-2" style={{ 
                                    width: `${analysis.spectralType === 3 ? METRIC_CONFIG.FULL_PERCENTAGE : Math.min(METRIC_CONFIG.MAX_SECONDARY_SCORE, (typeof metrics?.systematicThinking === 'object' ? metrics?.systematicThinking.score : metrics?.systematicThinking || 0)) * METRIC_CONFIG.PERCENTAGE_MULTIPLIER}%` 
                                  }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
            )}
            
            {!analysis && (
              <LandingPage 
                onAnalyze={handleAnalyzeWithSound}
                isAnalyzing={isAnalyzing}
              />
            )}
          </div>
        </div>
    </Layout>
  );
}