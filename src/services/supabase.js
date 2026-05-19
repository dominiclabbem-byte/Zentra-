import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://cghjpfszeffdeiqajown.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_aMLfMbNeHVZ9gvyILaQAfw_v3uVe6rN';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  FALLBACK_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase no configurado. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY o VITE_SUPABASE_PUBLISHABLE_KEY a tu .env'
  );
}
 
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
