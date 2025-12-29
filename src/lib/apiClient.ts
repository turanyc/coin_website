// API client for static export compatibility
// When running on GitHub Pages (static export), API routes won't be available

const isStaticExport = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

export const apiCall = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  // If static export, return a mock response or handle gracefully
  if (isStaticExport) {
    console.warn(`API call to ${endpoint} skipped in static export mode`);
    return new Response(JSON.stringify({ error: 'API not available in static export mode' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return fetch(endpoint, options);
};

