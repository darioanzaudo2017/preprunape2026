import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartPulse, KeyRound, Loader2, AlertCircle } from 'lucide-react'

const API_BASE = 'https://wbhshrxibzleubcsistn.supabase.co/functions/v1/datos-externos'

export default function OrgAccesoPage() {
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = token.trim()
    if (!t) return
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}?token=${t}&page=1&page_size=1`)
      if (res.status === 401 || res.status === 403) {
        setError('Token inválido o sin acceso. Verificá el código enviado por la Defensoría.')
        return
      }
      if (!res.ok) {
        setError('No se pudo verificar el token. Intentá nuevamente.')
        return
      }
      const json = await res.json()
      if (!json.datos) {
        setError('Respuesta inesperada del servidor.')
        return
      }
      navigate(`/org/${t}`)
    } catch {
      setError('Error de conexión. Verificá tu acceso a internet.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo / Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1e293b] shadow-lg">
            <HeartPulse className="h-8 w-8 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">PrepPRUNAPE</h1>
            <p className="text-sm text-slate-500 mt-0.5">Portal de Datos para Organizaciones</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-indigo-500" />
              Ingresá tu código de acceso
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tu organización recibió un código único de la Defensoría de NNyA de Córdoba. Ingresalo para acceder al tablero de indicadores.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={token}
                onChange={e => { setToken(e.target.value); setError('') }}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-[#f8fafc] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-slate-300"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !token.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {isLoading ? 'Verificando…' : 'Acceder al Tablero'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-400">
          Defensoría de los Derechos de NNyA · Córdoba · Datos anonimizados
        </p>
      </div>
    </div>
  )
}
