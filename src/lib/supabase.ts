import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase non configuré')
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey)
  }
  return client
}

/** @deprecated Préférer getSupabase() — conservé pour compatibilité interne */
export const supabase = {
  get auth() { return getSupabase().auth },
  from(table: string) { return getSupabase().from(table) },
  rpc(fn: string, args?: object) { return getSupabase().rpc(fn, args) },
}
