import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Check } from 'lucide-react'

const ToastContext = createContext<(message: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  const notify = useCallback((next: string) => {
    if (timer.current) window.clearTimeout(timer.current)
    setMessage(next)
    timer.current = window.setTimeout(() => setMessage(null), 2800)
  }, [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className={`toast ${message ? 'is-visible' : ''}`} role="status">
        <span className="toast-icon">
          <Check size={14} strokeWidth={2.5} />
        </span>
        {message}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
