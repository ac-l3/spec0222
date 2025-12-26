'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for managing analysis state and operations
 */
export function useAnalysis(initialFid, initialData) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(initialData?.analysis || null);
  const [fid, setFid] = useState(initialFid);
  const [userInfo, setUserInfo] = useState(
    initialData ? {
      username: initialData.username,
      display_name: initialData.displayName,
      pfp_url: initialData.pfpUrl,
      profile: { bio: { text: initialData.bio } }
    } : null
  );
  const [errorMessage, setErrorMessage] = useState(null);

  async function analyzeWithRetry(data) {
    if (!data || typeof data !== 'object') {
      console.error('Invalid data structure:', data);
      throw new Error('Invalid data structure');
    }

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
        setErrorMessage('Failed to load analysis. Please try again.');
      }
    }

    loadAnalysis();
  }, [initialFid, initialData]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // Try multiple sources for user FID with retry logic
      let userFid = window.userFid;
      
      // If not found, try to get from SDK with retries (user context might load asynchronously)
      if (!userFid) {
        console.log('User FID not cached, trying to get from SDK...');
        
        // Try multiple times with increasing delays
        for (let attempt = 0; attempt < 5; attempt++) {
          const sdk = window.sdk || window.frame?.sdk;
          
          if (sdk?.context?.user) {
            const user = sdk.context.user;
            userFid = user.fid || user.user?.fid;
            
            if (userFid) {
              console.log('Found user FID from SDK:', userFid);
              window.userFid = userFid; // Cache it for future use
              break;
            }
          }
          
          // Also check if SDK has a different user structure
          if (sdk?.context) {
            console.log('SDK context structure:', {
              hasUser: !!sdk.context.user,
              contextKeys: Object.keys(sdk.context),
              userKeys: sdk.context.user ? Object.keys(sdk.context.user) : []
            });
          }
          
          if (attempt < 4) {
            console.log(`User FID not found, retrying in ${(attempt + 1) * 200}ms... (attempt ${attempt + 1}/5)`);
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 200));
          }
        }
      }
      
      if (!userFid) {
        console.error('No user FID found after retries', {
          windowUserFid: window.userFid,
          hasSdk: !!(window.sdk || window.frame?.sdk),
          sdkContext: window.sdk?.context || window.frame?.sdk?.context
        });
        setErrorMessage('Unable to identify user. Please try again.');
        setIsAnalyzing(false);
        return;
      }

      const response = await fetch(`/api/analyze-profile?fid=${userFid}&nocache=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      const validatedData = await analyzeWithRetry(data);
      
      console.log('Analysis result:', validatedData);
      
      window.history.pushState({}, '', `/?fid=${userFid}`);
      
      setAnalysis(validatedData.analysis);
      setFid(userFid);
      setUserInfo({
        username: validatedData.username,
        display_name: validatedData.displayName,
        pfp_url: validatedData.pfpUrl,
        profile: { bio: { text: validatedData.bio } }
      });
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analysis,
    fid,
    userInfo,
    isAnalyzing,
    errorMessage,
    setErrorMessage,
    handleAnalyze,
  };
}

