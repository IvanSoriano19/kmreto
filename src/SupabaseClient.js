import { createClient } from '@supabase/supabase-js'
import { detectarEnlaceDeRecuperacion } from './lib/recuperacion'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Antes de crear el cliente, que borra el hash del enlace al procesarlo.
detectarEnlaceDeRecuperacion()

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})
