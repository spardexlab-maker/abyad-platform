
import { create } from '../lib/zustand';
import type { User, UserRole } from '../types';
import { AppView } from '../types';
import * as api from '../services/apiService';
import { useUiStore } from './uiStore';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// Helper function to handle date deserialization from JSON
const jsonReviver = (key: string, value: any) => {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
  if (typeof value === 'string' && isoDateRegex.test(value)) {
    return new Date(value);
  }
  return value;
};

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (contactInfo: string, password: string) => Promise<void>;
  register: (userData: { name: string; password?: string, email?: string; phoneNumber?: string; otp?: string; }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  sendRegistrationOtp: (phoneNumber: string) => Promise<void>;
  sendPasswordResetOtp: (contactInfo: string) => Promise<void>;
  verifyPasswordResetOtp: (contactInfo: string, otp: string) => Promise<void>;
  resetPassword: (contactInfo: string, otp: string, newPassword: string) => Promise<void>;
  _hydrate: () => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,

  login: async (contactInfo, password) => {
    // Current Logic: Uses Mock API
    // Future Logic: Use `await supabase.auth.signInWithPassword(...)`
    const response = await api.login(contactInfo, password);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An error occurred during login.');
    }
    const user = await response.json();
    set({ currentUser: user, isAuthenticated: true });
    
    const { navigateToRoleDefault } = useUiStore.getState();
    navigateToRoleDefault(user.role);

    localStorage.setItem('myDoctorUser', JSON.stringify(user));
  },
  
  register: async (userData) => {
    const response = await api.register(userData);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An error occurred during registration.');
    }
    if (userData.password) {
        const contactInfo = userData.phoneNumber || userData.email;
        if (contactInfo) {
            await get().login(contactInfo, userData.password);
        }
    }
  },

  loginWithGoogle: async () => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Determine redirect URL based on environment (Localhost vs Production)
                redirectTo: window.location.origin, 
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
        
        if (error) throw new Error(error.message);
        // Supabase will redirect the user to Google, then back to the app.
        // The session handling happens in `checkSession`.
    } else {
        // Fallback for Demo/Mock Mode
        console.warn("Supabase not configured. Using Mock Google Login.");
        const response = await api.loginWithGoogle("mock-token");
        if (!response.ok) throw new Error('Mock Login Failed');
        const user = await response.json();
        set({ currentUser: user, isAuthenticated: true });
        useUiStore.getState().navigateToRoleDefault(user.role);
        localStorage.setItem('myDoctorUser', JSON.stringify(user));
    }
  },
  
  sendRegistrationOtp: async (phoneNumber: string) => {
    const response = await api.sendRegistrationOtp(phoneNumber);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل إرسال رمز التحقق.');
    }
  },

  sendPasswordResetOtp: async (contactInfo: string) => {
    const response = await api.sendPasswordResetOtp(contactInfo);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'فشل إرسال رمز التحقق.');
    }
  },

  verifyPasswordResetOtp: async (contactInfo: string, otp: string) => {
    const response = await api.verifyPasswordResetOtp(contactInfo, otp);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'رمز التحقق غير صالح.');
    }
  },

  resetPassword: async (contactInfo: string, otp: string, newPassword: string) => {
    const response = await api.resetPassword(contactInfo, otp, newPassword);
     if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'فشل تحديث كلمة المرور.');
    }
  },

  logout: async () => {
    if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
    }
    set({ currentUser: null, isAuthenticated: false });
    useUiStore.getState().navigate(AppView.Welcome);
    localStorage.removeItem('myDoctorUser');
  },
  
  checkSession: async () => {
      if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user) {
              const email = session.user.email;
              if (email) {
                  // Attempt to find user role from mock DB / real DB
                  // In a real app, you would query the 'profiles' table via Supabase RPC or Table Select
                  try {
                       // We use the helper from apiService to simulate finding the user across all tables
                       // In real Supabase, this would be `supabase.from('profiles').select('*').eq('id', session.user.id)`
                       const response = await api.getUserByEmail(email);
                       
                       if (response.ok && response.status === 200) {
                           const user = await response.json();
                           // If found in DB, use that user (it has the correct role)
                           set({ currentUser: user, isAuthenticated: true });
                       } else {
                           // If not found (new user via Google), create a default patient profile
                           const newUser: User = {
                              id: session.user.id,
                              email: email,
                              name: session.user.user_metadata.full_name || 'Google User',
                              role: 'patient',
                              status: 'active'
                          };
                          // In a real app, you would insert this into 'profiles'
                          set({ currentUser: newUser, isAuthenticated: true });
                       }
                  } catch (e) {
                       // Fallback
                      const user: User = {
                          id: session.user.id,
                          email: email,
                          name: session.user.user_metadata.full_name || 'Google User',
                          role: 'patient',
                          status: 'active'
                      };
                      set({ currentUser: user, isAuthenticated: true });
                  }
              }
              return;
          }
      }
      // Fallback to local storage for Mock mode
      get()._hydrate();
  },

  _hydrate: () => {
    try {
        const userString = localStorage.getItem('myDoctorUser');
        if(userString) {
            const user = JSON.parse(userString, jsonReviver);
            set({ currentUser: user, isAuthenticated: true });
            
            const { navigateToRoleDefault, currentView } = useUiStore.getState();
            if (currentView === AppView.Welcome || currentView === AppView.Login || currentView === AppView.Register) {
                 navigateToRoleDefault(user.role);
            }
        }
    } catch (e) {
        console.error("Failed to hydrate auth state from localStorage", e);
    }
  }
}));

// Check session on app load (handles redirect from Google)
useAuthStore.getState().checkSession();
