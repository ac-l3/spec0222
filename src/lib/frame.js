import { UI_CONFIG } from './constants';

// Try to import miniapp SDK statically
// When running in Farcaster client, it may also be injected as window.sdk
let miniappSdk = null;
if (typeof window !== 'undefined') {
  // Dynamic import for client-side only
  import('@farcaster/miniapp-sdk').then(module => {
    miniappSdk = module.sdk;
    console.log('Mini App SDK imported from package');
  }).catch(err => {
    console.log('Mini App SDK package not available, will use injected SDK:', err.message);
  });
}

const TIMEOUT = UI_CONFIG.FRAME_SDK_TIMEOUT;

async function waitForDOMContentLoaded() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        resolve();
      });
    }
  });
}

function getSDK() {
  // Priority order:
  // 1. Imported SDK from @farcaster/miniapp-sdk package (miniappSdk)
  // 2. window.sdk (Mini App SDK injected by Farcaster client)
  // 3. window.frame.sdk (Legacy Frame SDK - kept for backwards compatibility only)
  // Per docs: https://miniapps.farcaster.xyz/docs/getting-started#making-your-app-display
  const sdk = miniappSdk || window.sdk || window.frame?.sdk;
  if (!sdk) {
    console.warn('No SDK found. Available:', { 
      miniappSdk: !!miniappSdk, 
      windowSdk: !!window.sdk, 
      windowFrameSdk: !!window.frame?.sdk 
    });
  }
  return sdk;
}

async function waitForFrameSDK() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = TIMEOUT / 100; // Check every 100ms
    
    const checkSDK = () => {
      attempts++;
      const sdk = getSDK();
      if (sdk) {
        console.log('Mini App SDK initialized', { source: miniappSdk ? 'package' : window.sdk ? 'injected' : 'legacy' });
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error('SDK initialization timeout - SDK not found'));
      } else {
        setTimeout(checkSDK, 100);
      }
    };
    checkSDK();
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function resolveUserFromSdk(sdk) {
  if (!sdk) return null;
  
  try {
    const contextCandidate = sdk.context;
    
    if (contextCandidate) {
      const context = typeof contextCandidate.then === 'function'
        ? await contextCandidate
        : contextCandidate;
      if (context?.user) {
        return context.user;
      }
    }
  } catch (err) {
    console.warn('Error resolving SDK context:', err);
  }

  return sdk.user || null;
}

async function waitForUser() {
  const maxAttempts = TIMEOUT / 100;
  for (let attempts = 1; attempts <= maxAttempts; attempts++) {
    if (attempts % 10 === 0 || attempts === 1) {
      console.log('Checking user (attempt', attempts, ')');
    }

    const sdk = getSDK();
    if (!sdk) {
      await delay(100);
      continue;
    }

    const user = await resolveUserFromSdk(sdk);
    if (user) {
      console.log('User found:', user);
      return user;
    }

    await delay(100);
  }

  const sdk = getSDK();
  console.error('User context not found after timeout', {
    hasSdk: !!sdk,
    sdkKeys: sdk ? Object.keys(sdk) : [],
    hasContext: !!sdk?.context,
    contextType: typeof sdk?.context,
    hasUser: !!sdk?.user,
    fullSdk: sdk,
  });
  throw new Error('User context timeout');
}

// Debug helper - expose to window for console debugging
// Also add a button to the page for easy access
if (typeof window !== 'undefined') {
  window.debugFarcasterSDK = function() {
    const sdk = miniappSdk || window.sdk || window.frame?.sdk;
    console.log('=== Farcaster SDK Debug ===');
    console.log('miniappSdk (imported):', !!miniappSdk);
    console.log('window.sdk available:', !!window.sdk);
    console.log('window.frame?.sdk available:', !!window.frame?.sdk);
    console.log('Current SDK type:', miniappSdk ? 'package' : window.sdk ? 'injected' : window.frame?.sdk ? 'legacy' : 'none');
    console.log('window.userFid:', window.userFid);
    console.log('window.userName:', window.userName);
    console.log('SDK has context:', !!sdk?.context, 'context type:', typeof sdk?.context);

    resolveUserFromSdk(sdk)
      .then(user => {
        if (user) {
          console.log('Resolved user object:', user);
          console.log('Resolved user FID:', user.fid);
        } else {
          console.log('User not yet resolved from SDK context');
        }
      })
      .catch(err => {
        console.warn('Failed to resolve user during debug:', err);
      });
    
    return {
      sdkAvailable: !!sdk,
      sdkType: miniappSdk ? 'package' : window.sdk ? 'injected' : window.frame?.sdk ? 'legacy' : 'none',
      hasContext: !!sdk?.context,
      contextType: typeof sdk?.context,
      cachedFid: window.userFid
    };
  };
  
  // Add a keyboard shortcut: Press 'd' key to run debug
  document.addEventListener('keydown', (e) => {
    // Only trigger if not typing in an input field
    if (e.key === 'd' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      console.log('=== Running debugFarcasterSDK() ===');
      window.debugFarcasterSDK();
    }
  });
}

export async function initializeFrame() {
  if (typeof window === 'undefined') return;

  try {
    // Wait for DOM to be ready
    await waitForDOMContentLoaded();
    console.log('DOM Content Loaded');

    // Wait for SDK initialization
    await waitForFrameSDK();

    // Get the SDK instance (Mini App SDK - imported or injected by Farcaster client)
    const sdk = getSDK();
    
    if (!sdk) {
      throw new Error('SDK not available after wait');
    }
    
    // Call ready() immediately after SDK is available
    // This dismisses the splash screen even if user context isn't ready yet
    // Per Farcaster miniapp docs: https://miniapps.farcaster.xyz/docs/getting-started#making-your-app-display
    if (sdk?.actions?.ready) {
      console.log('Calling sdk.actions.ready()', { sdkType: miniappSdk ? 'package' : window.sdk ? 'injected' : 'legacy' });
      await sdk.actions.ready();
      console.log('Mini App SDK ready - splash screen dismissed');
    } else {
      console.error('SDK actions.ready not available', { 
        sdk, 
        hasActions: !!sdk?.actions,
        actionsKeys: sdk?.actions ? Object.keys(sdk.actions) : []
      });
    }

    // Try to get user context (but don't fail if it's not available)
    try {
    let user = await waitForUser();

      if (user && user.fid) {
    // Store user info
    window.userFid = user.fid;
    window.userName = user.username || 'Anonymous';
        console.log('User Info stored:', { fid: window.userFid, username: window.userName });
      } else {
        console.log('No user context available, but ready() was called');
        // Try to get user from SDK context directly as fallback
        const sdk = getSDK();
        const directUser = await resolveUserFromSdk(sdk);
        if (directUser?.fid) {
          window.userFid = directUser.fid;
          window.userName = directUser.username || 'Anonymous';
          console.log('User Info stored from direct SDK access:', { fid: window.userFid, username: window.userName });
        }
      }
    } catch (userError) {
      // User context might not be available, but that's okay
      // We've already called ready() to dismiss the splash screen
      console.log('User context not available:', userError.message);
      
      // Last resort: try direct SDK access
      const sdk = getSDK();
      const directUser = await resolveUserFromSdk(sdk);
      if (directUser?.fid) {
        window.userFid = directUser.fid;
        console.log('User FID stored from fallback SDK access:', directUser.fid);
      }
    }
  } catch (error) {
    console.error('Mini App initialization error:', error);
    // Even if there's an error, try to call ready() if SDK is available
    const sdk = getSDK();
    if (sdk?.actions?.ready) {
      try {
        await sdk.actions.ready();
        console.log('Called ready() after error');
      } catch (readyError) {
        console.error('Error calling ready():', readyError);
      }
    } else {
      console.error('Cannot call ready() - SDK not available', { sdk, error });
    }
  }
} 
