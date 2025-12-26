/**
 * Environment variable validation
 * Validates required environment variables at startup to prevent runtime failures
 */

const REQUIRED_ENV_VARS = {
  GEMINI_API_KEY: {
    required: true,
    description: 'Google Gemini API key for AI analysis',
  },
  NEYNAR_API_KEY: {
    required: true,
    description: 'Neynar API key for Farcaster data',
  },
  NEXT_PUBLIC_BASE_URL: {
    required: true,
    description: 'Base URL for the application (used for OG images and sharing)',
  },
};

const OPTIONAL_ENV_VARS = {
  CLOUDFLARE_ACCOUNT_ID: {
    required: false,
    description: 'Cloudflare Account ID (required for KV REST API)',
  },
  CLOUDFLARE_KV_NAMESPACE_ID: {
    required: false,
    description: 'Cloudflare KV Namespace ID (required for KV REST API)',
  },
  CLOUDFLARE_API_TOKEN: {
    required: false,
    description: 'Cloudflare API Token with KV permissions (required for KV REST API)',
  },
};

// OPTIONAL_ENV_VARS is defined above

/**
 * Validates all required environment variables
 * @throws {Error} If any required env var is missing
 */
export function validateEnvVars() {
  const missing = [];
  const errors = [];

  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];
    
    if (!value || value.trim() === '') {
      missing.push({ key, description: config.description });
    } else if (key === 'NEXT_PUBLIC_BASE_URL') {
      // Validate URL format
      try {
        new URL(value);
      } catch (e) {
        errors.push({
          key,
          description: config.description,
          issue: 'Invalid URL format',
        });
      }
    }
  }

  if (missing.length > 0 || errors.length > 0) {
    const errorMessages = [];
    
    if (missing.length > 0) {
      errorMessages.push('Missing required environment variables:');
      missing.forEach(({ key, description }) => {
        errorMessages.push(`  - ${key}: ${description}`);
      });
    }
    
    if (errors.length > 0) {
      errorMessages.push('\nInvalid environment variables:');
      errors.forEach(({ key, description, issue }) => {
        errorMessages.push(`  - ${key}: ${description} (${issue})`);
      });
    }
    
    throw new Error(errorMessages.join('\n'));
  }
}

/**
 * Gets a validated environment variable
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Optional default value
 * @returns {string} The environment variable value
 * @throws {Error} If required and missing
 */
export function getEnvVar(key, defaultValue = null) {
  const value = process.env[key];
  
  if (!value || value.trim() === '') {
    if (defaultValue !== null) {
      return defaultValue;
    }
    
    const config = REQUIRED_ENV_VARS[key];
    if (config?.required) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    
    return '';
  }
  
  return value;
}

/**
 * Validates environment variables (call this at app startup)
 * Only runs on server-side to avoid exposing env vars to client
 */
if (typeof window === 'undefined') {
  try {
    validateEnvVars();
  } catch (error) {
    console.error('❌ Environment variable validation failed:');
    console.error(error.message);
    // In production, you might want to throw here to prevent the app from starting
    // For now, we'll just log the error
  }
}

