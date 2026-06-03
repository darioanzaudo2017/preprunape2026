import { useAuthStore } from '../store/authStore'
import { useUserRole } from '../hooks/useUserRole'
import { Clock, LogOut } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'

export default function PendienteAprobacion() {
  const { session, signOut } = useAuthStore()
  const { isPending } = useUserRole()
  const navigate = useNavigate()

  // Guard redirects:
  // If no session exists, send to login
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // If session exists but they are NOT pending, send to home dashboard
  if (!isPending) {
    return <Navigate to="/" replace />
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-900 via-brand-navy to-slate-950 px-4 select-none">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl shadow-2xl animate-fade-in">
        {/* Glow effect */}
        <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-brand-teal/20 blur-3xl" />
        <div className="absolute -right-16 -bottom-16 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />

        {/* Icon container */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Clock className="h-10 w-10 animate-pulse" />
        </div>

        {/* Text details */}
        <h2 className="font-display text-2xl font-bold text-white mb-3">
          Cuenta pendiente de aprobación
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-8">
          Tu registro se ha realizado correctamente. Para acceder al sistema, un administrador debe asignarte un <b>rol</b> y una <b>localidad</b>. Por favor, ponte en contacto con el equipo de coordinación.
        </p>

        {/* Actions */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold text-rose-300 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 hover:text-white transition-all shadow-md active:scale-[0.98]"
        >
          <LogOut className="h-4.5 w-4.5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}
