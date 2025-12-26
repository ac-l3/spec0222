/**
 * Cloudflare KV Implementation
 * 
 * Supports:
 * - Cloudflare Workers (native KV binding)
 * - Cloudflare KV REST API (works from Vercel/anywhere)
 * - In-memory fallback for local development
 */

import { CACHE_CONFIG } from './constants';

// In-memory cache for local development fallback
const memoryCache = new Map();
const CACHE_TTL = CACHE_CONFIG.DEFAULT_TTL * 1000; // Convert to milliseconds

/**
 * Get value from Cloudflare KV
 * @param {string} key - The key to retrieve
 * @returns {Promise<string|null>} The cached value or null
 */
export async function getFromKV(key) {
  // Try Cloudflare Workers KV binding first (if available)
  if (typeof globalThis !== 'undefined' && globalThis.KV_NAMESPACE) {
    try {
      const value = await globalThis.KV_NAMESPACE.get(key);
      return value;
    } catch (error) {
      console.error('Error reading from KV binding:', error);
    }
  }

  // Try Cloudflare KV REST API
  if (process.env.CLOUDFLARE_KV_NAMESPACE_ID && process.env.CLOUDFLARE_API_TOKEN) {
    try {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;

      if (!accountId) {
        console.warn('CLOUDFLARE_ACCOUNT_ID not set, skipping KV REST API');
      } else {
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const value = await response.text();
          return value;
        } else if (response.status === 404) {
          // Key doesn't exist, return null
          return null;
        } else {
          console.error(`KV REST API error: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error reading from KV REST API:', error);
    }
  }

  // Fallback to in-memory cache for local development
  if (typeof window === 'undefined') {
    // Server-side: check memory cache
    const cached = memoryCache.get(key);
    if (cached) {
      const { value, expires } = cached;
      if (expires > Date.now()) {
        return value;
      } else {
        memoryCache.delete(key);
      }
    }
  }

  return null;
}

/**
 * Put value into Cloudflare KV
 * @param {string} key - The key to store
 * @param {any} value - The value to store (will be JSON stringified if not a string)
 * @param {number} ttl - Optional TTL in seconds (default: 24 hours)
 * @returns {Promise<boolean>} Success status
 */
export async function putToKV(key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) {
  // Convert value to string if needed
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

  // Try Cloudflare Workers KV binding first (if available)
  if (typeof globalThis !== 'undefined' && globalThis.KV_NAMESPACE) {
    try {
      await globalThis.KV_NAMESPACE.put(key, stringValue, { expirationTtl: ttl });
      return true;
    } catch (error) {
      console.error('Error writing to KV binding:', error);
    }
  }

  // Try Cloudflare KV REST API
  if (process.env.CLOUDFLARE_KV_NAMESPACE_ID && process.env.CLOUDFLARE_API_TOKEN) {
    try {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;

      if (!accountId) {
        console.warn('CLOUDFLARE_ACCOUNT_ID not set, skipping KV REST API');
      } else {
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'text/plain',
          },
          body: stringValue,
        });

        if (response.ok) {
          // Set expiration if TTL is provided
          if (ttl) {
            const expirationUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/metadata/${encodeURIComponent(key)}`;
            await fetch(expirationUrl, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                expiration_ttl: ttl,
              }),
            }).catch(err => {
              // Expiration setting is optional, don't fail if it doesn't work
              console.warn('Failed to set KV expiration:', err);
            });
          }
          return true;
        } else {
          const errorText = await response.text();
          console.error(`KV REST API error: ${response.status} ${response.statusText}`, errorText);
        }
      }
    } catch (error) {
      console.error('Error writing to KV REST API:', error);
    }
  }

  // Fallback to in-memory cache for local development
  if (typeof window === 'undefined') {
    memoryCache.set(key, {
      value: stringValue,
      expires: Date.now() + (ttl * 1000),
    });
    
    // Clean up expired entries periodically
    if (memoryCache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of memoryCache.entries()) {
        if (v.expires <= now) {
          memoryCache.delete(k);
        }
      }
    }
    
    return true;
  }

  return false;
}

/**
 * Delete a key from Cloudflare KV
 * @param {string} key - The key to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFromKV(key) {
  // Try Cloudflare Workers KV binding first
  if (typeof globalThis !== 'undefined' && globalThis.KV_NAMESPACE) {
    try {
      await globalThis.KV_NAMESPACE.delete(key);
      return true;
    } catch (error) {
      console.error('Error deleting from KV binding:', error);
    }
  }

  // Try Cloudflare KV REST API
  if (process.env.CLOUDFLARE_KV_NAMESPACE_ID && process.env.CLOUDFLARE_API_TOKEN) {
    try {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;

      if (accountId) {
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;
        
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
          },
        });

        if (response.ok || response.status === 404) {
          return true;
        }
      }
    } catch (error) {
      console.error('Error deleting from KV REST API:', error);
    }
  }

  // Fallback to in-memory cache
  if (typeof window === 'undefined') {
    memoryCache.delete(key);
    return true;
  }

  return false;
}
