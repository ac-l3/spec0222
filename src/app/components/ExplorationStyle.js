'use client';

const EXPLORATION_STYLES = {
  1: "You explore through patterns and resonance, finding the hidden rhythms in seemingly random data. Your mind transforms abstract concepts into geometric frameworks that reveal underlying truths. Where others see chaos, you perceive the mathematical harmonies that connect disparate elements. You navigate uncertainty by creating structures that illuminate the unseen - building bridges between intuition and analysis. Your frameworks aren't just tools, but windows into deeper understanding, allowing you to map territories where logic and imagination converge.",
  2: "You explore by immersing yourself in emerging patterns, adapting and flowing with new information rather than forcing predetermined paths. You gather insights through deep listening and observation, allowing connections to reveal themselves naturally. Your strength lies in recognizing meaningful signals within apparent noise, finding coherence where others see only randomness. This receptive approach lets you discover hidden relationships between concepts, creating a living map that evolves with each new discovery.",
  3: "You explore by challenging established boundaries and questioning fundamental assumptions. Your approach combines critical analysis with creative reimagining, breaking open conventional thinking to discover what lies beyond. You systematically identify blind spots in existing models, then experiment with alternative perspectives that reveal new possibilities. This balanced tension between deconstruction and creation allows you to transform limitations into gateways, uncovering insights that remain hidden to those who stay within comfortable frameworks.",
};

function getDefaultExplorationStyle(spectralType) {
  return EXPLORATION_STYLES[spectralType] || "You explore the unknown through a balanced interplay of structure and intuition, creating frameworks that organize complexity while remaining open to unexpected discoveries.";
}

export default function ExplorationStyle({ analysis }) {
  if (!analysis || !analysis.researchProfile) return null;
  
  const explorationStyle = analysis.researchProfile.explorationStyle || 
    getDefaultExplorationStyle(analysis.spectralType);
  
  return (
    <div className="text-left mb-12 px-1">
      <div className="mb-4">
        <h3 className="text-base font-normal">How do you explore the unknown?</h3>
      </div>
      <div className="bg-[#222222] border border-[#333333] p-6 sm:p-8 overflow-hidden">
        <div className="space-y-6">
          <p className="leading-relaxed text-sm text-[#999999] break-words">
            {explorationStyle}
          </p>
        </div>
      </div>
    </div>
  );
}

