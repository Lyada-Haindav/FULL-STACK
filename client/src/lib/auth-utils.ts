export const TOKEN_KEY = "formflow_token";

// Legacy functions - kept for compatibility
export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders(): Record<string, string> {
  // For Supabase, we don't need custom auth headers
  // The Supabase client handles authentication automatically
  return {};
}

// User helper functions for Supabase
export function getUserDisplayName(user: any): string {
  if (!user) return "User";
  
  const metadata = user.user_metadata || {};
  const firstName = metadata.first_name;
  const lastName = metadata.last_name;
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else {
    return user.email?.split('@')[0] || "User";
  }
}
