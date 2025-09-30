const JOBS = [
  { value: '', label: 'All' },
  { value: 'student', label: 'student' },
  { value: 'engineer', label: 'engineer' },
  { value: 'teacher', label: 'teacher' },
  { value: 'homeless', label: 'homeless' },
]

export default function JobSelect({ value, onChange }) {
  return (
    <select
      className="form-select"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {JOBS.map(j => (
        <option key={j.value} value={j.value}>
          {j.label}
        </option>
      ))}
    </select>
  )
}
