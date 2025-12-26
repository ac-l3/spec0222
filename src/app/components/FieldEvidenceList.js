'use client';

import { CONTENT_FILTER } from '../../lib/constants';
import { generateInterpretation } from '../../lib/interpretations';

/**
 * Component to display field evidence with interpretations
 */
export default function FieldEvidenceList({ analysis }) {
  if (!analysis?.researchProfile?.fieldEvidence) {
    return null;
  }

  // Get all field evidence
  const allEvidence = analysis.researchProfile.fieldEvidence || [];
  
  // Filter out problematic content
  const filteredEvidence = allEvidence.filter(evidence => {
    const observation = (evidence.observation || '').toLowerCase();
    return !CONTENT_FILTER.BLOCKED_TERMS.some(term => 
      observation.includes(term)
    );
  });
  
  // Track used interpretations to prevent duplicates
  const usedInterpretations = new Set();
  
  // Process evidence
  const displayEvidence = filteredEvidence.map(evidence => ({
    ...evidence,
    observation: evidence.observation || "",
  }));
  
  // Only proceed if we have any evidence to display
  if (displayEvidence.length === 0) {
    return (
      <li className="leading-relaxed mb-3">
        <p className="mb-1">No casts available to analyze.</p>
      </li>
    );
  }
  
  return (
    <>
      {displayEvidence.map((evidence, index) => {
        const observation = evidence.observation.replace(/^["']+|["']+$/g, '');
        const interpretation = generateInterpretation(
          evidence,
          analysis.spectralType,
          usedInterpretations
        );
        
        return (
          <li key={index} className="leading-relaxed mb-3">
            <p className="mb-1">• "{observation}"</p>
            <div className="ml-4">
              <span className="text-[#999999] text-sm">{interpretation}</span>
            </div>
          </li>
        );
      })}
    </>
  );
}

