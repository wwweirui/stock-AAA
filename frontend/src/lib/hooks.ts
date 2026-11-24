import { useEffect, useState } from 'react'

export function useApi<T>(factory: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    factory()
      .then((result) => {
        if (alive) setData(result)
      })
      .catch((err: Error) => {
        if (alive) setError(err.message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}

export function useHashRoute(): string {
  const get = () => window.location.hash.replace(/^#/, '') || '/overview'
  const [path, setPath] = useState(get)

  useEffect(() => {
    const onChange = () => setPath(get())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return path
}

export function navigate(path: string) {
  if (window.location.hash === `#${path}`) return
  window.location.hash = path
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [locked])
}
