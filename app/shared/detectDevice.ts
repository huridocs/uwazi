/**
 * Detects if a device is mobile based on User-Agent string
 * Useful for server-side rendering where window is not available
 */
export const isMobileDevice = (userAgent: string): boolean => {
  if (!userAgent) return false;

  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  return mobileRegex.test(userAgent);
};

/**
 * Gets the User-Agent from Express request headers
 */
export const getUserAgent = (headers: { [key: string]: string | string[] | undefined }): string => {
  const ua = headers['user-agent'];
  return typeof ua === 'string' ? ua : '';
};
