const JOBS = [
  { value: '', label: 'All' },
  { value: 'Student', label: 'Student' },
  { value: 'Engineer', label: 'Engineer' },
  { value: 'Teacher', label: 'Teacher' },
  { value: 'Homeless', label: 'Homeless' },
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
