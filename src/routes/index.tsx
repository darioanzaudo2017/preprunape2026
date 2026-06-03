import { createBrowserRouter, Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useUserRole } from '../hooks/useUserRole'
import LoginPage from '../pages/Login'
import RegisterPage from '../pages/Register'
import DashboardPage from '../pages/Dashboard'
import NinosPage from '../pages/Ninos'
import NuevoNinoPage from '../pages/NuevoNino'
import NinoDetailPage from '../pages/NinoDetail'
import NuevaPruebaPage from '../pages/NuevaPrueba'
import ConfigPage from '../pages/ConfigPage'
import EvaluacionesPage from '../pages/Evaluaciones'
import MapaPage from '../pages/Mapa'
import InstitucionesPage from '../pages/Instituciones'
import InstitucionDetailPage from '../pages/InstitucionDetail'
import DashboardIndicadoresPage from '../pages/DashboardIndicadores'
import PendienteAprobacion from '../pages/PendienteAprobacion'
import EncuestaPublica from '../pages/EncuestaPublica'
import { LayoutDashboard, Users, MapPin, LogOut, HeartPulse, ShieldCheck, Settings, Network, BarChart2 } from 'lucide-react'

// ProtectedRoute Component
function ProtectedRoute() {
  const { session, loading } = useAuthStore()
  const { isPending } = useUserRole()


  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-brand-slate">
        <div className="flex flex-col items-center gap-4">
          <HeartPulse className="h-12 w-12 animate-pulse text-brand-teal" />
          <span className="font-display font-medium text-brand-navy">Cargando aplicación...</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (isPending) {
    return <Navigate to="/pendiente" replace />
  }

  return <Layout />
}

const ROL_LABELS: Record<string, string> = {
  admin: 'Administrador',
  coordinador: 'Coordinador',
  agente_municipio: 'Agente Municipio',
}

const ROL_COLORS: Record<string, string> = {
  admin: 'bg-rose-500/20 text-rose-300',
  coordinador: 'bg-sky-500/20 text-sky-300',
  agente_municipio: 'bg-emerald-500/20 text-emerald-300',
}

// Layout with Sidebar and Navigation
function Layout() {
  const { user, signOut } = useAuthStore()
  const { rol, localidad, displayName, isAdmin, isCoordinador } = useUserRole()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Error handling signout redirection:', err)
    }
  }

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, visible: true },
    { name: 'Niños (NNyA)', path: '/ninos', icon: Users, visible: true },
    { name: 'Indicadores', path: '/indicadores', icon: BarChart2, visible: isAdmin || isCoordinador },
    { name: 'Instituciones Red PI', path: '/instituciones', icon: Network, visible: true },
    { name: 'Configuración', path: '/config', icon: Settings, visible: isAdmin },
  ].filter((item) => item.visible)

  return (
    <div className="flex h-screen w-screen bg-brand-slate overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-navy text-white flex flex-col justify-between shadow-lg">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-brand-navy-light flex items-center gap-3">
            <HeartPulse className="h-8 w-8 text-brand-teal" />
            <div>
              <h1 className="font-display font-semibold text-lg leading-tight">Serene</h1>
              <p className="text-xs text-brand-teal font-medium tracking-wide">PEDIATRICS</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path)

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-teal text-white shadow-md'
                      : 'text-slate-300 hover:bg-brand-navy-light hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer User Profile & SignOut */}
        <div className="p-4 border-t border-brand-navy-light space-y-3">
          <div className="flex items-start gap-3 px-2">
            <div className="h-10 w-10 rounded-full bg-brand-teal flex items-center justify-center font-display font-semibold text-white shrink-0">
              {(displayName || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{displayName || user?.email || 'Usuario'}</p>
              {localidad && (
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />{localidad}
                </p>
              )}
              {rol && (
                <span className={`inline-flex items-center gap-0.5 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${ROL_COLORS[rol] ?? 'bg-slate-500/20 text-slate-300'}`}>
                  <ShieldCheck className="h-2.5 w-2.5" />
                  {ROL_LABELS[rol] ?? rol}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-950/30 hover:text-rose-200 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-brand-slate-border flex items-center justify-between px-8 shadow-sm">
          <span className="font-display font-medium text-brand-navy text-sm">
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-brand-slate-text font-medium">Supabase Conectado</span>
          </div>
        </header>

        {/* Scrollable Page Container */}
        <div className="flex-1 overflow-y-auto bg-brand-slate">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

// Router configuration
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/pendiente',
    element: <PendienteAprobacion />,
  },
  {
    path: '/encuesta/:token',
    element: <EncuestaPublica />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '',
        element: <DashboardPage />,
      },
      {
        path: 'ninos',
        element: <NinosPage />,
      },
      {
        path: 'ninos/nuevo',
        element: <NuevoNinoPage />,
      },
      {
        path: 'ninos/:id',
        element: <NinoDetailPage />,
      },
      {
        path: 'ninos/:id/nueva-prueba',
        element: <NuevaPruebaPage />,
      },
      {
        path: 'config',
        element: <ConfigPage />,
      },
      {
        path: 'evaluaciones',
        element: <EvaluacionesPage />,
      },
      {
        path: 'mapa',
        element: <MapaPage />,
      },
      {
        path: 'instituciones',
        element: <InstitucionesPage />,
      },
      {
        path: 'instituciones/:id',
        element: <InstitucionDetailPage />,
      },
      {
        path: 'indicadores',
        element: <DashboardIndicadoresPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
