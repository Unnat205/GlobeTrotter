import { getSupabase } from './supabase-client.js';

// Helper to convert email to a consistent, valid UUID v4 format
function emailToUuid(email) {
  const cleanEmail = (email || '').toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < cleanEmail.length; i++) {
    hash = ((hash << 5) - hash) + cleanEmail.charCodeAt(i);
    hash |= 0;
  }
  const hex1 = Math.abs(hash).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash * 31).toString(16).padStart(4, '0');
  const hex3 = Math.abs(hash * 17).toString(16).padStart(4, '0');
  return `${hex1.slice(0, 8)}-${hex2.slice(0, 4)}-4000-8000-${hex3.slice(0, 4)}00000000`;
}

const SESSION_KEY = 'GLOBETROTTER_SIMPLE_SESSION';

/**
 * Save user session locally
 */
function saveLocalSession(user) {
  const session = {
    user: user,
    access_token: 'simple_demo_token_' + Date.now(),
    expires_at: Date.now() + 86400000 * 30 // 30 days
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/**
 * Ensures user record exists in public.users table
 */
async function syncUserProfile(user) {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from('users').insert([{
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        avatar_url: user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
      }]);
    }
  } catch (err) {
    console.warn("Could not sync user profile to DB:", err);
  }
}

/**
 * Sign up a new user with email, password, and profile metadata.
 */
export async function signUp(email, password, firstName, lastName) {
  if (!email || !password) throw new Error("Email and password are required.");
  
  const userId = emailToUuid(email);
  const user = {
    id: userId,
    email: email.trim().toLowerCase(),
    user_metadata: {
      first_name: firstName || '',
      last_name: lastName || '',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
    }
  };

  await syncUserProfile(user);
  const session = saveLocalSession(user);
  return { user, session };
}

/**
 * Sign in an existing user with email and password.
 */
export async function signIn(email, password) {
  if (!email || !password) throw new Error("Email and password are required.");

  const userId = emailToUuid(email);
  const user = {
    id: userId,
    email: email.trim().toLowerCase(),
    user_metadata: {
      first_name: email.split('@')[0],
      last_name: '',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
    }
  };

  await syncUserProfile(user);
  const session = saveLocalSession(user);
  return { user, session };
}

/**
 * Quick 1-click Demo Login for hackathon testing
 */
export async function demoSignIn() {
  const user = {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'alex.rivers@globetrotter.demo',
    user_metadata: {
      first_name: 'Alex',
      last_name: 'Rivers',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
    }
  };

  await syncUserProfile(user);
  const session = saveLocalSession(user);
  return { user, session };
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  localStorage.removeItem(SESSION_KEY);
  const supabase = getSupabase();
  if (supabase) {
    try { await supabase.auth.signOut(); } catch (e) {}
  }
}

/**
 * Get current active session.
 */
export async function getSession() {
  // Check local simple session first
  const localRaw = localStorage.getItem(SESSION_KEY);
  if (localRaw) {
    try {
      const session = JSON.parse(localRaw);
      if (session && session.user) return session;
    } catch (e) {}
  }

  // Fallback check Supabase auth
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) return data.session;
    } catch (e) {}
  }

  return null;
}

/**
 * Get current user profile details.
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session || !session.user) return null;

  const user = session.user;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) return profile;
    } catch (e) {}
  }

  return {
    id: user.id,
    email: user.email,
    first_name: user.user_metadata?.first_name || user.email.split('@')[0],
    last_name: user.user_metadata?.last_name || '',
    avatar_url: user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
  };
}

/**
 * Subscribe to authentication state changes.
 */
export function onAuthStateChange(callback) {
  // Dummy subscription helper for compatibility
  return () => {};
}

/**
 * Update the user's profile info
 */
export async function updateProfile(profileData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated.");

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .upsert([{
        id: user.id,
        email: user.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        city: profileData.city,
        country: profileData.country,
        avatar_url: profileData.avatar_url
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Update local session
    const sessionRaw = localStorage.getItem(SESSION_KEY);
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      session.user.user_metadata = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        avatar_url: profileData.avatar_url
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return data;
  }
  return profileData;
}
