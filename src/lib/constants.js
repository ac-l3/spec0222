export const SPECTRAL_TYPES = {
  1: {
    name: "Edge Theorist",
    motto: "You map the farthest reaches of spectral unknowns—where stability fractures and new structures emerge",
    characteristics: {
      research: ['theoretical exploration', 'boundary testing', 'experimental design'],
      technical: ['speculative frameworks', 'prototype development', 'edge case analysis'],
      impact: ['breakthrough discoveries', 'paradigm shifts', 'novel methodologies'],
      stability: ['rapid iteration', 'experimental risk', 'theoretical volatility']
    },
    colors: {
      main: '#222222',
      accent: '#C8FA1A'
    }
  },
  2: {
    name: "Signal Disruptor",
    motto: "You break, distort, and reassemble data streams to expose hidden frequencies",
    characteristics: {
      research: ['pattern disruption', 'signal manipulation', 'frequency analysis'],
      technical: ['system manipulation', 'data transformation', 'signal processing'],
      impact: ['methodology challenges', 'alternative perspectives', 'hidden insights'],
      stability: ['controlled chaos', 'deliberate disruption', 'systematic deconstruction']
    },
    colors: {
      main: '#FF4500',
      accent: '#C8FA1A'
    }
  },
  3: {
    name: "Lab Orchestrator",
    motto: "You construct the Lab's foundational structures—ensuring research stays stable and replicable",
    characteristics: {
      research: ['systematic analysis', 'protocol development', 'methodology standardization'],
      technical: ['infrastructure design', 'system architecture', 'process optimization'],
      impact: ['research stability', 'operational efficiency', 'structural improvements'],
      stability: ['controlled growth', 'measured progress', 'systematic iteration']
    },
    colors: {
      main: '#8A2BE2',
      accent: '#C8FA1A'
    }
  },
  4: {
    name: "Field Extractor",
    motto: "You retrieve insights from unstable zones—navigating volatile data before it collapses",
    characteristics: {
      research: ['data synthesis', 'pattern recognition', 'rapid analysis'],
      technical: ['extraction tools', 'pattern matching', 'data recovery'],
      impact: ['critical insights', 'time-sensitive discoveries', 'data preservation'],
      stability: ['controlled risk', 'adaptive response', 'situational awareness']
    },
    colors: {
      main: '#6B4226',
      accent: '#C8FA1A'
    }
  },
  5: {
    name: "Frequencies Engineer",
    motto: "You design the Lab's understanding of emergent structures—distilling chaos into clarity",
    characteristics: {
      research: ['pattern analysis', 'structural design', 'systematic investigation'],
      technical: ['algorithm development', 'system modeling', 'pattern recognition'],
      impact: ['methodology improvement', 'system optimization', 'analytical frameworks'],
      stability: ['iterative refinement', 'systematic approach', 'structured evolution']
    },
    colors: {
      main: '#4B0082',
      accent: '#C8FA1A'
    }
  },
  6: {
    name: "Signal Tracker",
    motto: "You document fluctuations in spectral signals—tracing deviations with forensic precision",
    characteristics: {
      research: ['signal analysis', 'pattern tracking', 'deviation study'],
      technical: ['monitoring systems', 'trace analysis', 'documentation tools'],
      impact: ['pattern identification', 'trend analysis', 'historical insights'],
      stability: ['methodical observation', 'detailed documentation', 'systematic tracking']
    },
    colors: {
      main: '#4682B4',
      accent: '#C8FA1A'
    }
  },
  7: {
    name: "Threshold Operator",
    motto: "You push beyond known limits, testing the Lab's tolerance for instability",
    characteristics: {
      research: ['boundary testing', 'limit analysis', 'threshold exploration'],
      technical: ['stress testing', 'system limits', 'performance analysis'],
      impact: ['capability expansion', 'limit definition', 'risk assessment'],
      stability: ['controlled testing', 'measured risk', 'systematic exploration']
    },
    colors: {
      main: '#20B2AA',
      accent: '#C8FA1A'
    }
  },
  8: {
    name: "Echo Compiler",
    motto: "You integrate past findings into the Lab's evolving research—turning scattered fragments into new systems",
    characteristics: {
      research: ['pattern integration', 'historical analysis', 'synthesis development'],
      technical: ['system integration', 'pattern compilation', 'framework development'],
      impact: ['knowledge synthesis', 'historical insights', 'pattern recognition'],
      stability: ['systematic integration', 'measured evolution', 'controlled synthesis']
    },
    colors: {
      main: '#228B22',
      accent: '#C8FA1A'
    }
  },
  9: {
    name: "Transmission Mediator",
    motto: "You bridge raw spectral phenomena into usable concepts—making the abstract tangible",
    characteristics: {
      research: ['concept translation', 'communication analysis', 'accessibility study'],
      technical: ['visualization tools', 'communication systems', 'interface design'],
      impact: ['knowledge transfer', 'understanding enhancement', 'concept clarity'],
      stability: ['consistent communication', 'measured translation', 'systematic explanation']
    },
    colors: {
      main: '#1E3A5F',
      accent: '#C8FA1A'
    }
  }
};

export const getSpectralType = (typeNumber) => {
  return SPECTRAL_TYPES[typeNumber] || null;
};

export const getTypeColors = (typeNumber) => {
  const type = SPECTRAL_TYPES[typeNumber];
  return type ? type.colors : null;
};

export const getRoleCharacteristics = (typeNumber) => {
  const type = SPECTRAL_TYPES[typeNumber];
  return type ? type.characteristics : null;
};

export const SECTION_REQUIREMENTS = {
  coreIdentity: {
    minLength: 100,
    maxLength: 600,
    description: "Clinical assessment of research methodology and approach"
  },
  functionalImpact: {
    minLength: 100,
    maxLength: 600,
    description: "Analysis of concrete research contributions and effects"
  },
  stabilityWarning: {
    minLength: 100,
    maxLength: 600,
    description: "Research-focused risk assessment and mitigation requirements"
  },
  researchDeployment: {
    minLength: 100,
    maxLength: 600,
    description: "Specific division assignment and research directives"
  }
};

export const RESEARCH_DIVISIONS = {
  'Experimental Research Unit': {
    focus: 'early-stage investigations and methodology testing',
    roles: ['Edge Theorist', 'Threshold Operator', 'Signal Disruptor']
  },
  'Pattern Analysis Division': {
    focus: 'systematic analysis and pattern recognition',
    roles: ['Frequencies Engineer', 'Field Extractor', 'Signal Tracker']
  },
  'Systems Integration Lab': {
    focus: 'research integration and framework development',
    roles: ['Lab Orchestrator', 'Echo Compiler', 'Transmission Mediator']
  }
}; 