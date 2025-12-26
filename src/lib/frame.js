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

async function waitForUser() {
  return new Promise((resolve, reject) => {
    const checkUser = () => {
      console.log('Checking user');
      const sdk = getSDK();
      if (sdk?.context?.user) {
        resolve(sdk.context.user);
      } else {
        setTimeout(checkUser, 100);
      }
    };
    setTimeout(() => reject(new Error('User context timeout')), TIMEOUT);
    checkUser();
  });
}

// Debug helper - expose to window for console debugging
if (typeof window !== 'undefined') {
  window.debugFarcasterSDK = function() {
    const sdk = miniappSdk || window.sdk || window.frame?.sdk;
    console.log('=== Farcaster SDK Debug ===');
    console.log('miniappSdk (imported):', miniappSdk);
    console.log('window.sdk:', window.sdk);
    console.log('window.frame?.sdk:', window.frame?.sdk);
    console.log('Current SDK:', sdk);
    console.log('SDK context:', sdk?.context);
    console.log('SDK context.user:', sdk?.context?.user);
    console.log('window.userFid:', window.userFid);
    console.log('window.userName:', window.userName);
    
    if (sdk?.context?.user) {
      const user = sdk.context.user;
      console.log('User object:', user);
      console.log('User FID:', user.fid);
      console.log('User keys:', Object.keys(user));
    }
    
    return {
      sdk,
      context: sdk?.context,
      user: sdk?.context?.user,
      userFid: sdk?.context?.user?.fid || window.userFid,
      cachedFid: window.userFid
    };
  };
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

      if (user.user) {
        user = user.user;
      }

      if (user && user.fid) {
        // Store user info
        window.userFid = user.fid;
        window.userName = user.username || 'Anonymous';
        console.log('User Info stored:', { fid: window.userFid, username: window.userName });
      } else {
        console.log('No user context available, but ready() was called');
        // Try to get user from SDK context directly as fallback
        const sdk = getSDK();
        if (sdk?.context?.user) {
          const directUser = sdk.context.user;
          const directFid = directUser.fid || directUser.user?.fid;
          if (directFid) {
            window.userFid = directFid;
            window.userName = directUser.username || 'Anonymous';
            console.log('User Info stored from direct SDK access:', { fid: window.userFid, username: window.userName });
          }
        }
      }
    } catch (userError) {
      // User context might not be available, but that's okay
      // We've already called ready() to dismiss the splash screen
      console.log('User context not available:', userError.message);
      
      // Last resort: try direct SDK access
      const sdk = getSDK();
      if (sdk?.context?.user) {
        const directUser = sdk.context.user;
        const directFid = directUser.fid || directUser.user?.fid;
        if (directFid) {
          window.userFid = directFid;
          console.log('User FID stored from fallback SDK access:', directFid);
        }
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