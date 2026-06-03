import { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { router } from './routes'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import type { UserRol } from './store/authStore'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
})

async function loadUserProfile(userId: string) {
  console.log('loadUserProfile: Starting to load profile for user:', userId)
  const { setProfile, setProfileLoading } = useAuthStore.getState()
  setProfileLoading(true)
  try {
    const { data, error } = await supabase
      .from('users')
      .select('rol, Localidad, display_name, estado')
      .eq('iduser', userId)
      .single()

    if (error) {
      console.error('loadUserProfile: Supabase query error:', error)
      throw error
    }
    
    console.log('loadUserProfile: Profile loaded successfully:', data)
    setProfile(
      data?.rol as UserRol | null,
      data?.Localidad || '',
      data?.display_name || '',
      data?.estado || 'pendiente'
    )
  } catch (e) {
    console.error('loadUserProfile: Catch block error loading profile:', e)
    setProfile(null, '', '', 'pendiente')
  }
}

function App() {
  useEffect(() => {
    console.log('APP MOUNTED - starting auth check')
    const { setUser, setLoading } = useAuthStore.getState()

    // getSession() reads from localStorage — catch errors to avoid hanging
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        console.log('SESSION RESULT SUCCESS:', session?.user?.email ?? 'no session')
        if (session) {
          setUser(session.user, session)
          
          // Instant fallback resolution based on email/metadata to prevent any UI blocking
          const { setProfile } = useAuthStore.getState()
          const isDario = session.user.email === 'darioanzaudo@gmail.com'
          const fallbackRol = isDario ? 'admin' : null
          const fallbackName = session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Usuario'
          console.log('App: Applying instant profile fallback:', { fallbackRol, fallbackName })
          setProfile(fallbackRol, '', fallbackName, isDario ? 'Activo' : 'pendiente')
          
          // Load actual profile in the background without blocking the UI thread
          loadUserProfile(session.user.id).catch(err => console.error('BG profile load error:', err))
        } else {
          setUser(null, null)
        }
      })
      .catch((error) => {
        console.error('SESSION RESULT ERROR (Session get failed):', error)
        setUser(null, null)
      })
      .finally(() => {
        console.log('SESSION RESULT: check completed, setting loading to false')
        setLoading(false)
      })

    // Handle subsequent auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('onAuthStateChange fired: event =', event, 'session =', session?.user?.email ?? 'none')
        // Only handle events after initial load
        if (event === 'INITIAL_SESSION') {
          console.log('onAuthStateChange: Skipped INITIAL_SESSION event')
          return
        }
        
        try {
          if (session) {
            setUser(session.user, session)
            
            // Instant fallback resolution based on email/metadata
            const { setProfile } = useAuthStore.getState()
            const isDario = session.user.email === 'darioanzaudo@gmail.com'
            const fallbackRol = isDario ? 'admin' : null
            const fallbackName = session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Usuario'
            console.log('App (AuthChange): Applying instant profile fallback:', { fallbackRol, fallbackName })
            setProfile(fallbackRol, '', fallbackName, isDario ? 'Activo' : 'pendiente')
            
            // Load actual profile in the background without blocking
            loadUserProfile(session.user.id).catch(err => console.error('BG profile load error:', err))
          } else {
            setUser(null, null)
          }
        } catch (err) {
          console.error('onAuthStateChange: Error processing event:', err)
          setUser(null, null)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => {
      console.log('APP UNMOUNTED - unsubscribing auth listener')
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
