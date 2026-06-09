import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import { HeartPulse, HelpCircle, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if session is already active
  useEffect(() => {
    if (session) {
      navigate('/', { replace: true })
    }
  }, [session, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      toast.success('¡Bienvenido de nuevo!')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error al iniciar sesión. Verifique sus credenciales.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md">
      {/* TopAppBar */}
      <header className="bg-surface border-b border-outline-variant shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 md:px-10 py-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-primary animate-pulse" />
            <span className="font-display text-xl font-bold text-primary">Prep-PRUNAPE</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-on-surface-variant hover:bg-surface-container-low transition-colors p-2 rounded-full active:scale-95 duration-150">
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content: Login Split Screen */}
      <main className="flex-grow flex flex-col md:flex-row">
        {/* Left Side: Login Form */}
        <section className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-16 bg-surface-container-lowest">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-bold text-on-surface">Bienvenido de nuevo</h1>
              <p className="text-body-md text-on-surface-variant">Por favor, ingresa tus datos para acceder al portal.</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="font-label-md text-sm font-semibold text-on-surface-variant flex items-center gap-1.5" htmlFor="email">
                  <Mail className="h-4 w-4 text-primary" />
                  Correo electrónico
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-outline rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-bright transition-all"
                  id="email"
                  name="email"
                  placeholder="nombre@ejemplo.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-label-md text-sm font-semibold text-on-surface-variant flex items-center gap-1.5" htmlFor="password">
                    <Lock className="h-4 w-4 text-primary" />
                    Contraseña
                  </label>
                  <a className="text-xs text-primary hover:underline transition-all font-medium" href="#">
                    Política de Privacidad
                  </a>
                </div>
                <div className="relative">
                  <input
                    className="w-full pl-4 pr-12 py-2.5 border border-outline rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-bright transition-all"
                    id="password"
                    name="password"
                    placeholder="••••••••"
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

              <div className="flex items-center gap-2">
                <input
                  className="w-4 h-4 text-primary border-outline rounded focus:ring-primary/20"
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="text-xs text-on-surface-variant select-none" htmlFor="remember">
                  Recordarme por 30 días
                </label>
              </div>

              <button
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 rounded-lg font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md disabled:opacity-75 disabled:pointer-events-none"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-sm text-on-surface-variant">
                ¿No tienes una cuenta?{' '}
                <Link className="text-primary font-bold hover:underline transition-all" to="/register">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Right Side: Imagery */}
        <section className="hidden md:block md:w-1/2 relative overflow-hidden">
          <img
            alt="Medical Interior"
            className="absolute inset-0 w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCX8bQWWR9VZ_4gI3OiiUlktjC_pN-PaI5sxF9b9DbMk49D95s3INKDGoOoYMfEpcblwJeHl0ouTqEp4ROSuz6WFpYG5Amxlz6Q7wp7fIHSmxC-cTY8R8YJbGhjRnVS6KXEPzVGDqSEeRHr-2UMhD3cXjEfZ9FowxmIcX7aYho0nvPWpaeHiG4oqAEuIaK-nPdqDDIXdCIwmciQD5zI9BWmnNskaMNKQjo4QuonatkNfGj6d9b1A8dfu2iS6OC6NbVp2JqqsFbERxs"
          />
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px]"></div>
          <div className="absolute bottom-12 left-12 right-12 p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
            <h2 className="font-display text-2xl font-bold text-primary mb-2">
              Atención que se siente como en casa.
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Nuestro entorno sereno está diseñado para que tanto los niños como los padres se sientan tranquilos en cada visita.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant py-4 px-6 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <span className="font-semibold text-secondary">Prep-PRUNAPE</span>
            <span className="hidden md:inline text-secondary opacity-60">|</span>
            <span className="text-xs text-secondary/80">© 2026 Prep-PRUNAPE. Todos los derechos reservados.</span>
          </div>
          <div className="flex gap-6 text-xs font-medium text-secondary">
            <a className="hover:text-primary transition-colors" href="#">Política de Privacidad</a>
            <a className="hover:text-primary transition-colors" href="#">Términos de Servicio</a>
            <a className="hover:text-primary transition-colors" href="#">Soporte Técnico</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
