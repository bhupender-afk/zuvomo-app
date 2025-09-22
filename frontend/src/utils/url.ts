// Utility function to construct full URL for uploaded files
export const getFullImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  
  // If already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Get the base URL for uploads - in production, nginx serves uploads on the same domain
  const baseUrl = import.meta.env.MODE === 'production' 
                  ? window.location.origin  // Use frontend domain (nginx serves uploads)
                  : 'http://localhost:3001';  // Development: backend serves uploads
  
  // Ensure URL starts with /
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  return `${baseUrl}${cleanUrl}`;
};