import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import { HeartPulse, HelpCircle, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const [fullName, setFullName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [institution, setInstitution] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  
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
    
    if (!termsAccepted) {
      toast.error('Debe aceptar los Términos de Servicio y la Política de Privacidad.')
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: fullName,
            specialty,
            institution,
          },
        },
      })

      if (error) throw error

      if (data.session) {
        toast.success('¡Registro e inicio de sesión exitosos!')
        navigate('/')
      } else {
        toast.success('¡Registro completado! Por favor revisa tu correo electrónico para verificar tu cuenta profesional.')
        navigate('/login')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Ocurrió un error al registrarse. Inténtelo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* TopAppBar */}
      <header className="bg-surface border-b border-outline-variant shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 md:px-10 py-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-primary animate-pulse" />
            <span className="font-display text-xl font-bold text-primary">Prep-PRUNAPE</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex gap-4 text-sm font-medium text-on-surface-variant">
              <a className="hover:bg-surface-container-low px-3 py-1.5 rounded-lg transition-colors" href="#">Soluciones</a>
              <a className="hover:bg-surface-container-low px-3 py-1.5 rounded-lg transition-colors" href="#">Recursos</a>
              <a className="hover:bg-surface-container-low px-3 py-1.5 rounded-lg transition-colors" href="#">Nosotros</a>
            </nav>
            <button className="text-on-surface-variant hover:bg-surface-container-low transition-colors p-2 rounded-full active:scale-95 duration-150">
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col md:flex-row">
        {/* Registration Form Side */}
        <section className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-16 bg-surface-container-lowest">
          <div className="max-w-md w-full space-y-8">
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-bold text-primary">
                Registro Profesional
              </h1>
              <p className="text-body-md text-secondary">
                Únase a nuestra red de profesionales de la salud dedicados al bienestar y desarrollo infantil.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-on-surface-variant" htmlFor="fullName">
                  Nombre Completo
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  id="fullName"
                  name="fullName"
                  placeholder="Dr. Juana Gómez"
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Specialty Select */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-on-surface-variant" htmlFor="specialty">
                  Especialidad Médica
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                  id="specialty"
                  name="specialty"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                >
                  <option value="" disabled>Seleccione su especialidad</option>
                  <option value="pediatria-general">Pediatría General</option>
                  <option value="neurologia-infantil">Neurología Infantil</option>
                  <option value="psicologia-infantil">Psicología Infantil</option>
                  <option value="trabajo-social">Trabajo Social</option>
                  <option value="ortopedia-pediatrica">Ortopedia Pediátrica</option>
                </select>
              </div>

              {/* Institution */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-on-surface-variant" htmlFor="institution">
                  Institución / Clínica
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  id="institution"
                  name="institution"
                  placeholder="Hospital de Niños"
                  required
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-on-surface-variant" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  id="email"
                  name="email"
                  placeholder="juana.gomez@clinica.org"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password with visibility toggle */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-on-surface-variant" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    className="w-full pl-4 pr-12 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    id="password"
                    name="password"
                    placeholder="Mínimo 8 caracteres"
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

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20"
                  id="terms"
                  name="terms"
                  required
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <label className="text-xs text-on-surface-variant select-none" htmlFor="terms">
                  Acepto los <a className="text-primary hover:underline font-semibold" href="#">Términos de Servicio</a> y la <a className="text-primary hover:underline font-semibold" href="#">Política de Privacidad</a>.
                </label>
              </div>

              {/* Submit Button */}
              <button
                className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 disabled:opacity-75 disabled:pointer-events-none"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Procesando registro...
                  </>
                ) : (
                  <>
                    <span>Registrarse</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-sm text-secondary">
                ¿Ya tiene una cuenta?{' '}
                <Link className="text-primary font-bold hover:underline" to="/login">
                  Inicie Sesión aquí
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Visual Side */}
        <section className="hidden md:block w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/15 mix-blend-overlay z-10"></div>
          <img
            alt="Prep-PRUNAPE Reception"
            className="absolute inset-0 w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCX8bQWWR9VZ_4gI3OiiUlktjC_pN-PaI5sxF9b9DbMk49D95s3INKDGoOoYMfEpcblwJeHl0ouTqEp4ROSuz6WFpYG5Amxlz6Q7wp7fIHSmxC-cTY8R8YJbGhjRnVS6KXEPzVGDqSEeRHr-2UMhD3cXjEfZ9FowxmIcX7aYho0nvPWpaeHiG4oqAEuIaK-nPdqDDIXdCIwmciQD5zI9BWmnNskaMNKQjo4QuonatkNfGj6d9b1A8dfu2iS6OC6NbVp2JqqsFbERxs"
          />
          {/* Context Overlay Card */}
          <div className="absolute bottom-12 left-12 right-12 z-20">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-xl">
              <div className="flex gap-4 items-start">
                <div className="bg-primary-container p-2 rounded-xl text-on-primary-container">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-on-surface mb-1">
                    Portal Seguro de Evaluación
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    Acceda a herramientas de diagnóstico avanzadas y seguimiento longitudinal de niños/as en un entorno que cumple con los más altos estándares de confidencialidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant py-4 px-6 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <span className="font-semibold text-secondary">Prep-PRUNAPE</span>
            <p className="text-xs text-secondary/80">© 2026 Prep-PRUNAPE. Todos los derechos reservados.</p>
          </div>
          <nav className="flex gap-6 text-xs font-medium text-secondary">
            <a className="hover:text-primary transition-colors" href="#">Política de Privacidad</a>
            <a className="hover:text-primary transition-colors" href="#">Términos de Servicio</a>
            <a className="hover:text-primary transition-colors" href="#">Soporte Técnico</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
