import { useEffect, useState } from 'react'

export default function DebouncedInput({ value, onChange, delay=500, placeholder }) {
  const [inner, setInner] = useState(value || '')
  useEffect(() => setInner(value || ''), [value]) // 用setInner更新inner
  useEffect(() => { // 當inner、delay或onChange改變時執行
    const t = setTimeout(() => onChange(inner), delay)
    return () => clearTimeout(t)
  }, [inner, delay, onChange])
  return (
    <input
      className="form-control"
      value={inner}
      placeholder={placeholder}
      onChange={(e) => setInner(e.target.value)}
    />
  )
}
