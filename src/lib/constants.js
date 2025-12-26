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
  explorationStyle: {
    minLength: 300,
    maxLength: 600,
    description: "Poetic, philosophical description of how the user explores the unknown"
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

// API Configuration
export const API_CONFIG = {
  NEYNAR: {
    BASE_URL: 'https://api.neynar.com/v2/farcaster',
    USER_BULK_ENDPOINT: '/user/bulk',
    USER_CASTS_ENDPOINT: '/feed/user/casts',
    DEFAULT_LIMIT: 50,
    TIMEOUT: 10000,
  },
  GEMINI: {
    DEFAULT_MODEL: 'gemini-1.5-flash',
    FALLBACK_MODEL: 'gemini-1.5-pro',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    TEMPERATURE_FLASH: 1.8,
    TEMPERATURE_PRO: 0.7,
    TOP_K_FLASH: 60,
    TOP_K_PRO: 40,
    TOP_P_FLASH: 0.95,
    TOP_P_PRO: 0.9,
    MAX_OUTPUT_TOKENS_FLASH: 3072,
    MAX_OUTPUT_TOKENS_PRO: 2048,
  },
};

// UI Configuration
export const UI_CONFIG = {
  ERROR_AUTO_DISMISS_DELAY: 5000,
  USER_FID_CHECK_INTERVAL: 1000,
  FRAME_SDK_TIMEOUT: 10000,
  BUTTON_SOUND_PATH: '/sounds/button-sound.mp3',
};

// Content Filtering
export const CONTENT_FILTER = {
  BLOCKED_TERMS: [
    'hitler',
    'nazi',
    'rodeo',
    'zora',
    'fuck',
  ],
};

// Share Configuration
export const SHARE_CONFIG = {
  WARPCAST_COMPOSE_URL: 'https://warpcast.com/~/compose',
  SHARE_TEXT_TEMPLATE: (spectralTypeName) => 
    `Apparently I'm ${spectralTypeName} aligned!\n\nSee what the Spectral Lab says about you.`,
};

// Cache Configuration
export const CACHE_CONFIG = {
  KEY_PREFIX: {
    ANALYSIS: 'spectral:analysis:',
    SHARE_IMAGE: 'spectral:share-image:',
  },
  DEFAULT_TTL: 86400, // 24 hours in seconds
};

// Role Distribution
export const ROLE_DISTRIBUTION = {
  RESET_THRESHOLD: 20,
  INITIAL_COUNTS: {
    '$AXIS Framer': 0,
    '$FLUX Drifter': 0,
    '$EDGE Disruptor': 0,
  },
};

// Metric Configuration
export const METRIC_CONFIG = {
  MAX_SCORE: 5,
  MAX_SECONDARY_SCORE: 4,
  MAX_TERTIARY_SCORE: 3,
  PRIMARY_SCORE: 5,
  PERCENTAGE_MULTIPLIER: 20, // For converting score (1-5) to percentage
  FULL_PERCENTAGE: 100,
}; 
