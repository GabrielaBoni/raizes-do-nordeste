import { useEffect, useState } from 'react'

export function usePolling(fetcher, interval = 5000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    function load() {
      fetcher()
        .then((result) => {
          if (!active) return
          setData(result)
          setError(null)
        })
        .catch((err) => {
          if (active) setError(err)
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }

    load()
    const timer = setInterval(load, interval)
    window.addEventListener('storage', load)

    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('storage', load)
    }
  }, [fetcher, interval])

  return { data, loading, error }
}
