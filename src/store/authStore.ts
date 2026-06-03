import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type UserRol = 'admin' | 'coordinador' | 'agente_municipio'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  profileLoading: boolean
  rol: UserRol | null
  localidad: string | null
  displayName: string | null
  setUser: (user: User | null, session: Session | null) => void
  setProfile: (rol: UserRol, localidad: string, displayName: string) => void
  setProfileLoading: (profileLoading: boolean) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  profileLoading: false,
  rol: null,
  localidad: null,
  displayName: null,
  setUser: (user, session) => set({ user, session, loading: false }),
  setProfile: (rol, localidad, displayName) => set({ rol, localidad, displayName, profileLoading: false }),
  setProfileLoading: (profileLoading) => set({ profileLoading }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    // Instantly reset auth state so React Router redirects to /login immediately without showing the loader
    set({ user: null, session: null, loading: false, rol: null, localidad: null, displayName: null })
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  },
}))
