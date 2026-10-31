import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://pbatxljxcnkogcqfhomc.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYXR4bGp4Y25rb2djcWZob21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNDc4OTUsImV4cCI6MjEwODkyMzg5NX0.jdxHvK_dYjNxW6DL3FXQQLXm56U1A6nTseHsXFWedsQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
