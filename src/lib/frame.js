const TIMEOUT = 30000;

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

async function waitForFrameSDK() {
  return new Promise((resolve, reject) => {
    const checkSDK = () => {
      if (window.frame?.sdk) {
        console.log('Frame SDK initialized');
        resolve();
      } else {
        setTimeout(checkSDK, 100);
      }
    };
    
    const timeoutId = setTimeout(() => {
      console.warn('Frame SDK initialization timeout - continuing anyway');
      resolve();
    }, TIMEOUT);
    
    checkSDK();
    
    return () => clearTimeout(timeoutId);
  });
}

async function waitForUser() {
  return new Promise((resolve) => {
    const checkUser = () => {
      console.log('Checking user');
      if (window.frame?.sdk?.context?.user) {
        resolve(window.frame.sdk.context.user);
      } else {
        setTimeout(checkUser, 100);
      }
    };
    
    const timeoutId = setTimeout(() => {
      console.warn('User context timeout - continuing without user context');
      resolve(null);
    }, TIMEOUT);
    
    checkUser();
    
    return () => clearTimeout(timeoutId);
  });
}

export async function initializeFrame() {
  if (typeof window === 'undefined') return;

  try {
    // Wait for DOM to be ready
    await waitForDOMContentLoaded();
    console.log('DOM Content Loaded');

    // Wait for Frame SDK initialization
    await waitForFrameSDK();

    // Wait for user context
    const user = await waitForUser();

    // Continue even if we don't have user info
    window.userFid = user?.fid || null;
    window.userName = user?.username || 'Anonymous';
    console.log('User Info:', { fid: window.userFid, username: window.userName });

    // Initialize Frame SDK
    if (window.frame?.sdk?.actions?.ready) {
      console.log('Calling ready');
      try {
        await window.frame.sdk.actions.ready();
        console.log('Frame SDK ready');
      } catch (readyError) {
        console.warn('Error calling ready, but continuing:', readyError);
      }
    } else {
      console.log('Frame SDK ready action not available - continuing anyway');
    }
  } catch (error) {
    console.error('Frame initialization error:', error);
    // Continue execution even if there's an error
  }
} 