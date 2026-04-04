/**
 * Utility to construct a safe and normalized image URL from local or external paths.
 * Prevents double slashes and handles missing base URLs.
 */
export const getImageUrl = (imgPath) => {
  if (!imgPath) return null;
  
  // If it's already a full URL, return it as is
  if (imgPath.startsWith('http')) return imgPath;
  
  // Replace backslashes with forward slashes for URL compatibility (important for Windows servers)
  const normalizedPath = imgPath.replace(/\\/g, '/');
  
  const base = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:5000/';
  
  // Normalize base (remove trailing slash)
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  
  // Normalize path (ensure leading slash)
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  
  return `${cleanBase}${cleanPath}`;
};
