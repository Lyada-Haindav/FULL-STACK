import { createClient } from '@supabase/supabase-js';

// Try environment variables first, fallback to hardcoded values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://srnzhlxmmljizohqlfce.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNybnpobHhtbWxqaXpvaHFsZmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDA5NzYsImV4cCI6MjA4NTg3Njk3Nn0.KjCHJ9mTdvN5fq5fKgSF4b12IQ-Ajlgc3usXCAgeAQI';

// Debug logging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key exists:', !!supabaseAnonKey);
console.log('Environment URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Environment Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// Test if URL is reachable
const testUrl = async () => {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey
      }
    });
    console.log('URL test response:', response.status);
    return response.ok;
  } catch (error) {
    console.error('URL test failed:', error);
    return false;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
export const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    
    // First test if URL is reachable
    const urlReachable = await testUrl();
    if (!urlReachable) {
      console.error('Supabase URL is not reachable');
      return { success: false, error: 'URL not reachable' };
    }
    
    // Test auth endpoint
    const { data, error } = await supabase.auth.getSession();
    console.log('Auth test result:', { data, error });
    return { success: !error, error };
  } catch (error) {
    console.error('Connection test failed:', error);
    return { success: false, error };
  }
};

// Authentication functions
export const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
  try {
    console.log('Attempting to sign up:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });
    
    if (error) {
      console.error('Supabase signup error:', error);
      throw error;
    }
    
    console.log('Signup successful:', data);
    
    // Check if user needs email confirmation
    if (data.user && !data.user.email_confirmed_at) {
      console.log('Email confirmation required');
      return { 
        user: data.user, 
        session: data.session, 
        needsEmailConfirmation: true 
      };
    }
    
    return data;
  } catch (error) {
    console.error('Signup failed:', error);
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    console.log('Attempting to sign in:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Supabase signin error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. If you just registered, please check your email for confirmation.');
      }
      
      throw error;
    }
    
    console.log('Signin successful:', data);
    return data;
  } catch (error) {
    console.error('Signin failed:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    console.log('Attempting to sign out');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase signout error:', error);
      throw error;
    }
    console.log('Signout successful');
  } catch (error) {
    console.error('Signout failed:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    console.log('Getting current user...');
    // First check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session check:', { session, sessionError });
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return null;
    }
    
    if (!session) {
      console.log('No session found');
      return null;
    }
    
    // If we have a session, get the user
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Get user error:', error);
      return null;
    }
    console.log('Current user:', user);
    return user;
  } catch (error) {
    console.error('Get user failed:', error);
    return null;
  }
};

export const onAuthStateChange = (callback: (event: any, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};
