'use client';

function splitCoreIdentity(coreIdentity) {
  const firstSentenceMatch = coreIdentity.match(/^[^.!?]+[.!?]/);
  
  if (firstSentenceMatch) {
    return {
      firstSentence: firstSentenceMatch[0],
      rest: coreIdentity.substring(firstSentenceMatch[0].length).trim()
    };
  } else {
    return {
      firstSentence: coreIdentity.substring(0, 150) + "...",
      rest: coreIdentity
    };
  }
}

export default function CoreIdentity({ coreIdentity }) {
  if (!coreIdentity) return null;
  
  const { firstSentence, rest } = splitCoreIdentity(coreIdentity);
  
  return (
    <div className="text-left mb-12 px-1">
      <p className="leading-relaxed text-sm mb-6 break-words">
        {firstSentence}
      </p>
      <p className="leading-relaxed text-sm break-words">
        {rest}
      </p>
    </div>
  );
}

