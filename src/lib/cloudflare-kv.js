// This file can be deleted if not needed

// Or if you want to keep it for future use:

// Simple in-memory cache implementation
const memoryCache = new Map();

export async function putToKV(key, value) {
  try {
    console.log(`KV: Attempting to store cache entry with key: ${key}`);
    console.log(`KV: Cache entry size: ~${JSON.stringify(value).length} bytes`);
    
    // Store in memory cache
    memoryCache.set(key, {
      value: JSON.stringify(value),
      timestamp: Date.now()
    });
    
    console.log(`KV: Cache entry stored successfully for key: ${key}`);
    console.log(`KV: Current cache size: ${memoryCache.size} entries`);
    return true;
  } catch (error) {
    console.error('KV: Error storing cache entry:', error);
    return false;
  }
}

export async function getFromKV(key) {
  try {
    console.log(`KV: Looking up cache entry for key: ${key}`);
    
    // Check memory cache
    const cachedData = memoryCache.get(key);
    
    if (cachedData) {
      // Check if cache is still valid (24 hours)
      const cacheAge = Date.now() - cachedData.timestamp;
      const cacheValidityPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (cacheAge < cacheValidityPeriod) {
        console.log(`KV: Cache hit for key: ${key} (age: ${Math.round(cacheAge / (60 * 1000))} minutes)`);
        return cachedData;
      } else {
        console.log(`KV: Cache expired for key: ${key} (age: ${Math.round(cacheAge / (60 * 60 * 1000))} hours)`);
        memoryCache.delete(key);
      }
    }
    
    console.log(`KV: Cache miss for key: ${key}`);
    return null;
  } catch (error) {
    console.error('KV: Error retrieving cache entry:', error);
    return null;
  }
} 