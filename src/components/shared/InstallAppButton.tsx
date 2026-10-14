import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, Share, PlusSquare, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// El navegador dispara este evento una sola vez y puede hacerlo antes de que el
// botón se monte, así que se captura a nivel de módulo.
let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    listeners.forEach((fn) => fn())
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((fn) => fn())
  })
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

interface Props {
  /** `dark` para el menú lateral, `light` para el encabezado del login */
  variant?: 'dark' | 'light'
}

export default function InstallAppButton({ variant = 'dark' }: Props) {
  const [, setTick] = useState(0)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    const update = () => setTick((t) => t + 1)
    listeners.add(update)
    return () => {
      listeners.delete(update)
    }
  }, [])

  if (isStandalone()) return null

  const canPrompt = deferredPrompt !== null
  const ios = isIos()
  if (!canPrompt && !ios) return null

  const handleClick = async () => {
    if (canPrompt && deferredPrompt) {
      const evt = deferredPrompt
      await evt.prompt()
      await evt.userChoice
      deferredPrompt = null
      setTick((t) => t + 1)
    } else {
      setShowIosHelp(true)
    }
  }

  const buttonClass =
    variant === 'dark'
      ? 'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold bg-brand-orange/15 text-brand-orange hover:bg-brand-orange/25 transition-colors'
      : 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-white hover:brightness-110 transition-all active:scale-95'

  return (
    <>
      <button type="button" onClick={handleClick} className={buttonClass}>
        <Download className={variant === 'dark' ? 'h-5 w-5' : 'h-4 w-4'} />
        Instalar app
      </button>

      {showIosHelp && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => setShowIosHelp(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Cómo instalar la app en iPhone"
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-base font-bold">Instalar en iPhone o iPad</h2>
              <button
                type="button"
                onClick={() => setShowIosHelp(false)}
                className="p-1 -mr-1 -mt-1 rounded-md text-slate-500 hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Abrí esta página desde Safari y seguí estos pasos:</p>
            <ol className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Share className="h-4 w-4" />
                </span>
                <span>
                  Tocá el botón <strong>Compartir</strong> de la barra del navegador.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <PlusSquare className="h-4 w-4" />
                </span>
                <span>
                  Elegí <strong>Añadir a pantalla de inicio</strong>.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                  3
                </span>
                <span>
                  Tocá <strong>Añadir</strong>. Listo: la app queda como un ícono más.
                </span>
              </li>
            </ol>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
