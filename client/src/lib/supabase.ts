export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://brroucjplqmngljroknr.supabase.co';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycm91Y2pwbHFtbmdsanJva25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTg4NDksImV4cCI6MjA3MDEzNDg0OX0.a9QHFs7JtfRM3y5pi82jqAFmrwDRuaPLwDUzeBlG7uE';

export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};

export const createSupabaseHeaders = () => ({
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'apikey': SUPABASE_ANON_KEY,
  'Content-Type': 'application/json',
});
