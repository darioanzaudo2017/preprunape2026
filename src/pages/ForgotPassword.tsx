import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { HeartPulse, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) throw error
      setSent(true)
      toast.success('Revisá tu correo — te enviamos el link para recuperar tu contraseña.')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error al enviar el correo. Intentalo de nuevo.')
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6 md:p-16 bg-surface-container-lowest">
        <div className="w-full max-w-md space-y-8">
          {sent ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold text-on-surface">Correo enviado</h1>
                <p className="text-body-md text-on-surface-variant">
                  Si existe una cuenta con <strong>{email}</strong>, vas a recibir un link para restablecer tu contraseña.
                </p>
                <p className="text-sm text-on-surface-variant mt-4">
                  ¿No lo ves? Revisá la carpeta de spam o correo no deseado.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-bold text-on-surface">Recuperar contraseña</h1>
                <p className="text-body-md text-on-surface-variant">
                  Ingresá tu correo electrónico y te enviamos un link para restablecer tu contraseña.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label
                    className="font-label-md text-sm font-semibold text-on-surface-variant flex items-center gap-1.5"
                    htmlFor="email"
                  >
                    <Mail className="h-4 w-4 text-primary" />
                    Correo electrónico
                  </label>
                  <input
                    className="w-full px-4 py-2.5 border border-outline rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-bright transition-all"
                    id="email"
                    name="email"
                    placeholder="luca@ejemplo.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 rounded-lg font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md disabled:opacity-75 disabled:pointer-events-none"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar link de recuperación'
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a iniciar sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
