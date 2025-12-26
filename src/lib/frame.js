import { UI_CONFIG } from './constants';

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
  // When running as a miniapp, the Farcaster client injects the SDK
  // Priority order:
  // 1. window.sdk (Mini App SDK injected by Farcaster client - @farcaster/miniapp-sdk)
  // 2. window.frame.sdk (Legacy Frame SDK - kept for backwards compatibility only)
  // Per docs: https://miniapps.farcaster.xyz/docs/getting-started#making-your-app-display
  return window.sdk || window.frame?.sdk;
}

async function waitForFrameSDK() {
  return new Promise((resolve, reject) => {
    const checkSDK = () => {
      const sdk = getSDK();
      if (sdk) {
        console.log('Mini App SDK initialized');
        resolve();
      } else {
        setTimeout(checkSDK, 100);
      }
    };
    setTimeout(() => reject(new Error('SDK initialization timeout')), TIMEOUT);
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

export async function initializeFrame() {
  if (typeof window === 'undefined') return;

  try {
    // Wait for DOM to be ready
    await waitForDOMContentLoaded();
    console.log('DOM Content Loaded');

    // Wait for SDK initialization
    await waitForFrameSDK();

    // Get the SDK instance (Mini App SDK - injected by Farcaster client)
    const sdk = getSDK();
    
    // Call ready() immediately after SDK is available
    // This dismisses the splash screen even if user context isn't ready yet
    // Per Farcaster miniapp docs: https://miniapps.farcaster.xyz/docs/getting-started#making-your-app-display
    if (sdk?.actions?.ready) {
      console.log('Calling sdk.actions.ready()');
      await sdk.actions.ready();
      console.log('Mini App SDK ready - splash screen dismissed');
    } else {
      console.warn('SDK actions.ready not available');
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
        console.log('User Info:', { fid: window.userFid, username: window.userName });
      } else {
        console.log('No user context available, but ready() was called');
      }
    } catch (userError) {
      // User context might not be available, but that's okay
      // We've already called ready() to dismiss the splash screen
      console.log('User context not available:', userError.message);
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
    }
  }
} 