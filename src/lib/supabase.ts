import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidUrl = rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))

const supabaseUrl = isValidUrl ? rawUrl : 'https://placeholder-project.supabase.co'
const supabaseAnonKey = rawKey || 'placeholder-anon-key'

if (!isValidUrl || !rawKey) {
  console.warn(
    'Supabase credentials are missing or invalid in .env file. Using placeholder client.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export type { Database }
