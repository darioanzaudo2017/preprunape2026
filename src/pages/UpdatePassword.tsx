import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { HeartPulse, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function UpdatePasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [done, setDone] = useState(false)
  const resolvedRef = useRef(false)

  useEffect(() => {
    if (resolvedRef.current) return

    // Check if we already have a recovery session (set by main.tsx)
    supabase.auth.getSession().then(({ data }) => {
      if (resolvedRef.current) return
      if (data.session) {
        console.log('UpdatePassword: Recovery session detected')
        resolvedRef.current = true
        setIsReady(true)
      } else {
        // No session yet — wait for PASSWORD_RECOVERY event
        console.log('UpdatePassword: No session yet, waiting for PASSWORD_RECOVERY event')
      }
    })

    // Listen for the recovery event (fires when Supabase processes the URL hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (resolvedRef.current) return
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        console.log('UpdatePassword: Recovery event detected:', event)
        resolvedRef.current = true
        setIsReady(true)
      }
    })

    // Timeout: if nothing happens in 8 seconds, show expired link message
    const timer = setTimeout(() => {
      if (!resolvedRef.current) {
        resolvedRef.current = true
        setIsExpired(true)
        toast.error('Link inválido o expirado. Solicitá un nuevo restablecimiento de contraseña.')
      }
    }, 8000)

    return () => {
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setDone(true)
      toast.success('Contraseña actualizada correctamente.')

      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error al actualizar la contraseña. Solicitá un nuevo restablecimiento.')
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md">
        <header className="bg-surface border-b border-outline-variant shadow-sm sticky top-0 z-50">
          <div className="flex items-center w-full px-6 md:px-10 py-3">
            <HeartPulse className="h-6 w-6 text-primary animate-pulse" />
            <span className="font-display text-xl font-bold text-primary ml-2">Prep-PRUNAPE</span>
          </div>
        </header>
        <main className="flex-grow flex items-center justify-center p-6 bg-surface-container-lowest">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="font-display text-2xl font-bold text-on-surface">Contraseña actualizada</h1>
            <p className="text-body-md text-on-surface-variant">
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        </main>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md">
        <header className="bg-surface border-b border-outline-variant shadow-sm sticky top-0 z-50">
          <div className="flex items-center w-full px-6 md:px-10 py-3">
            <HeartPulse className="h-6 w-6 text-primary animate-pulse" />
            <span className="font-display text-xl font-bold text-primary ml-2">Prep-PRUNAPE</span>
          </div>
        </header>
        <main className="flex-grow flex items-center justify-center p-6 bg-surface-container-lowest">
          <div className="text-center space-y-6 max-w-md">
            <h1 className="font-display text-2xl font-bold text-on-surface">Link expirado o inválido</h1>
            <p className="text-body-md text-on-surface-variant">
              El link de recuperación no es válido o ya expiró. Solicita uno nuevo desde la página de inicio de sesión.
            </p>
            <button
              onClick={() => navigate('/forgot-password', { replace: true })}
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Solicitar nuevo link
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md">
        <main className="flex-grow flex items-center justify-center bg-surface-container-lowest">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
            <p className="text-sm text-on-surface-variant">Verificando link de recuperación...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md">
      <header className="bg-surface border-b border-outline-variant shadow-sm sticky top-0 z-50">
        <div className="flex items-center w-full px-6 md:px-10 py-3">
          <HeartPulse className="h-6 w-6 text-primary animate-pulse" />
          <span className="font-display text-xl font-bold text-primary ml-2">Prep-PRUNAPE</span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-6 md:p-16 bg-surface-container-lowest">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold text-on-surface">Nueva contraseña</h1>
            <p className="text-body-md text-on-surface-variant">
              Ingresá tu nueva contraseña para recuperar el acceso a tu cuenta.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                className="font-label-md text-sm font-semibold text-on-surface-variant flex items-center gap-1.5"
                htmlFor="password"
              >
                <Lock className="h-4 w-4 text-primary" />
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  className="w-full pl-4 pr-12 py-2.5 border border-outline rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-bright transition-all"
                  id="password"
                  name="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="font-label-md text-sm font-semibold text-on-surface-variant flex items-center gap-1.5"
                htmlFor="confirmPassword"
              >
                <Lock className="h-4 w-4 text-primary" />
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  className="w-full pl-4 pr-12 py-2.5 border border-outline rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-bright transition-all"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Repetí la contraseña"
                  required
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 rounded-lg font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md disabled:opacity-75 disabled:pointer-events-none"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar contraseña'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
