'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export type AuthState = { error?: string; message?: string } | null | undefined

export async function login(state: AuthState, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

export async function signup(state: AuthState, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()
  const headersList = await headers()
  let origin = headersList.get('origin')
  
  if (!origin) {
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      origin = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    } else if (process.env.VERCEL_URL) {
      origin = `https://${process.env.VERCEL_URL}`
    } else {
      origin = 'http://localhost:3000'
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user && !data.session) {
    return { message: 'Please check your email to verify your account.' }
  }

  redirect('/')
}
