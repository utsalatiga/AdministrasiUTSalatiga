// Supabase Client Configuration
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isValid = url.startsWith('http://') || url.startsWith('https://');

  return createBrowserClient(
    isValid ? url : 'https://placeholder.supabase.co',
    key || 'placeholder'
  )
}

