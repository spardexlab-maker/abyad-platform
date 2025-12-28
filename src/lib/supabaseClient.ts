
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace these with your actual Supabase project credentials
// You can get these from your Supabase Dashboard -> Project Settings -> API
// We cast import.meta to any to avoid TypeScript errors when the environment types (like vite/client) are not loaded.
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
    return SUPABASE_URL !== 'https://placeholder-project.supabase.co' && SUPABASE_ANON_KEY !== 'placeholder-anon-key';
};
