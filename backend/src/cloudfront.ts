/**
 * CloudFront URL utilities for converting S3 keys to CloudFront URLs
 */

/**
 * Convert S3 key to CloudFront URL
 * @param s3Key - The S3 object key (e.g., "uploads/file.zip" or "submissions/file.zip")
 * @returns CloudFront URL
 */
export const convertS3KeyToCloudFrontUrl = (s3Key: string): string => {
  const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
  
  if (!cloudfrontDomain) {
    throw new Error('CLOUDFRONT_DOMAIN not configured in environment variables');
  }

  // Remove leading slash if present
  const cleanKey = s3Key.startsWith('/') ? s3Key.substring(1) : s3Key;
  
  // Ensure CloudFront domain doesn't end with slash
  const cleanDomain = cloudfrontDomain.endsWith('/') 
    ? cloudfrontDomain.slice(0, -1) 
    : cloudfrontDomain;

  return `${cleanDomain}/${cleanKey}`;
};

/**
 * Extract S3 key from various URL formats
 * @param fileUrl - Can be S3 key, S3 URL, or CloudFront URL
 * @returns Clean S3 key
 */
export const extractS3KeyFromUrl = (fileUrl: string): string => {
  // If it's already just a key (no protocol), return as is
  if (!fileUrl.includes('://')) {
    return fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
  }

  try {
    const url = new URL(fileUrl);
    
    // Extract path and remove leading slash
    const path = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
    
    return path;
  } catch (error) {
    // If URL parsing fails, treat as S3 key
    return fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
  }
};

/**
 * Validate S3 key format
 * @param s3Key - The S3 key to validate
 * @returns boolean indicating if key is valid
 */
export const validateS3Key = (s3Key: string): boolean => {
  if (!s3Key || typeof s3Key !== 'string') {
    return false;
  }

  // Check if key starts with expected folders
  const validPrefixes = ['uploads/', 'submissions/'];
  const hasValidPrefix = validPrefixes.some(prefix => s3Key.startsWith(prefix));
  
  if (!hasValidPrefix) {
    return false;
  }

  // Check for valid file extension (ZIP files)
  const hasValidExtension = s3Key.toLowerCase().endsWith('.zip');
  
  return hasValidExtension;
};

/**
 * Get CloudFront domain from environment
 * @returns CloudFront domain URL
 */
export const getCloudFrontDomain = (): string => {
  const domain = process.env.CLOUDFRONT_DOMAIN;
  if (!domain) {
    throw new Error('CLOUDFRONT_DOMAIN not configured in environment variables');
  }
  return domain;
};
