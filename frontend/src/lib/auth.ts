/**
 * Token storage + auth helpers.
 * Tokens are stored in localStorage so they survive page refresh.
 */

const ACCESS_KEY = "td_access";
const REFRESH_KEY = "td_refresh";

export function saveTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isLoggedIn(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  
  // Check if token is expired (basic check)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // If token expires within 5 minutes, consider it expired for safety
    if (payload.exp && payload.exp - now < 300) {
      return false;
    }
    
    return true;
  } catch {
    // If we can't parse the token, it's invalid
    return false;
  }
}

export function isTokenExpiringSoon(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // Check if token expires within 5 minutes
    return payload.exp && payload.exp - now < 300;
  } catch {
    return true; // If we can't parse, assume it needs refresh
  }
}
