// Utility function to construct full URL for uploaded files
export const getFullImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';

  // If already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Get the base URL for uploads - in production, nginx serves uploads on the same domain
  let baseUrl: string;

  if (import.meta.env.MODE === 'production') {
    // In production, use the current origin (nginx serves uploads on same domain)
    baseUrl = window.location.origin;

    // Port 80 is default for HTTP and 443 for HTTPS, so origin already includes them correctly
  } else {
    // Development: backend serves uploads
    baseUrl = 'http://localhost:3001';
  }

  // Ensure URL starts with /
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;

  return `${baseUrl}${cleanUrl}`;
};

 export function handleJoinNow() {
        window.location.href = '/signup';
    }