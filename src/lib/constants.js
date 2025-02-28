export const SPECTRAL_TYPES = {
  1: {
    name: "$AXIS Framer",
    characteristics: {
      research: ['mapping frameworks', 'creating structure', 'defining conditions for discovery'],
      technical: ['mental models', 'protocols', 'structured approaches'],
      impact: ['understanding mechanics', 'refining methodologies', 'optimizing systems'],
      stability: ['meta-level thinking', 'maps and infrastructures', 'systematic scaling']
    },
    colors: {
      main: '#222222',
      accent: '#C8FA1A'
    },
    motto: "Mapping frameworks, creating structure, and defining the conditions for discovery."
  },
  2: {
    name: "$FLUX Drifter",
    characteristics: {
      research: ['engaging with emergent trends', 'discovering opportunities in motion', 'real-time adaptation'],
      technical: ['hypothesis testing', 'fluid engagement', 'iterative exploration'],
      impact: ['detecting signals in chaos', 'extracting meaning from shifting patterns', 'network effects'],
      stability: ['learning by doing', 'mapping possibilities through movement', 'engagement-driven']
    },
    colors: {
      main: '#FF4500',
      accent: '#C8FA1A'
    },
    motto: "Engaging with and adapting to emergent trends, discovering opportunities in motion."
  },
  3: {
    name: "$EDGE Disruptor",
    characteristics: {
      research: ['pushing against edges of perception', 'extracting insight from the unknown', 'non-traditional approaches'],
      technical: ['testing limits', 'breaking conventions', 'introducing disruptive thinking'],
      impact: ['challenging assumptions', 'finding new frontiers', 'alternative perspectives'],
      stability: ['discovery through contradiction', 'glitch and error states', 'seeing insights where others see noise']
    },
    colors: {
      main: '#4B0082',
      accent: '#C8FA1A'
    },
    motto: "Pushing against the edges of perception, extracting insight from the unknown."
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
    minLength: 300,
    maxLength: 800,
    description: "Clinical assessment of research methodology and approach"
  },
  functionalImpact: {
    minLength: 250,
    maxLength: 700,
    description: "Analysis of concrete research contributions and effects"
  },
  alignmentConsiderations: {
    minLength: 250,
    maxLength: 600,
    description: "Positioning researcher traits as strengths in optimal contexts"
  },
  researchDeployment: {
    minLength: 300,
    maxLength: 800,
    description: "Specific division assignment and research directives"
  }
};

export const RESEARCH_DIVISIONS = {
  'Framework Development Division': {
    focus: 'creating structured approaches and optimizing systems',
    roles: ['$AXIS Framer']
  },
  'Adaptive Exploration Unit': {
    focus: 'engaging with emergent trends and real-time adaptation',
    roles: ['$FLUX Drifter']
  },
  'Boundary Testing Lab': {
    focus: 'challenging assumptions and finding new frontiers',
    roles: ['$EDGE Disruptor']
  }
}; 