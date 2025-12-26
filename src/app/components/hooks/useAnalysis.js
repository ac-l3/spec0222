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
      // Try multiple sources for user FID
      let userFid = window.userFid;
      
      // Fallback to getting FID from Mini App SDK context
      if (!userFid) {
        // Try miniapp SDK first (window.sdk), then legacy frame SDK (window.frame.sdk)
        const sdk = window.sdk || window.frame?.sdk;
        if (sdk?.context?.user) {
          const user = sdk.context.user;
          userFid = user.fid || user.user?.fid;
          if (userFid) {
            window.userFid = userFid; // Cache it for future use
          }
        }
      }
      
      if (!userFid) {
        console.error('No user FID found');
        setErrorMessage('Unable to identify user. Please try again.');
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

