// This file can be deleted if not needed

// Or if you want to keep it for future use:

// Simple in-memory cache implementation
const memoryCache = new Map();

export async function putToKV(key, value) {
  try {
    // Store in memory cache
    memoryCache.set(key, {
      value: JSON.stringify(value),
      timestamp: Date.now()
    });
    
    console.log(`Cache entry stored for key: ${key}`);
    return true;
  } catch (error) {
    console.error('Error storing cache entry:', error);
    return false;
  }
}

export async function getFromKV(key) {
  try {
    // Check memory cache
    const cachedData = memoryCache.get(key);
    
    if (cachedData) {
      // Check if cache is still valid (24 hours)
      const cacheAge = Date.now() - cachedData.timestamp;
      const cacheValidityPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (cacheAge < cacheValidityPeriod) {
        console.log(`Cache hit for key: ${key}`);
        return cachedData;
      } else {
        console.log(`Cache expired for key: ${key}`);
        memoryCache.delete(key);
      }
    }
    
    console.log(`Cache miss for key: ${key}`);
    return null;
  } catch (error) {
    console.error('Error retrieving cache entry:', error);
    return null;
  }
} 