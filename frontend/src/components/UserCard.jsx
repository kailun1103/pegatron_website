import dayjs from 'dayjs'

const fallbackAvatar = 'https://i.pravatar.cc/150?img=3'

export default function UserCard({ user, onEdit, onDelete }) {
  const { id, name, gender, birthday, job, phone, avatar_url } = user
  return (
    <div className="card h-100">
      <img
        src={avatar_url || fallbackAvatar}
        className="card-img-top"
        alt={`${name} avatar`}
        style={{ objectFit: 'cover', height: 160 }}
      />
      <div className="card-body d-flex flex-column">
        <h5 className="card-title mb-2">{name}</h5>
        <div className="small text-muted mb-1"><b>Gender:</b> {gender || '-'}</div>
        <div className="small text-muted mb-1"><b>Birthday:</b> {birthday ? dayjs(birthday).format('YYYY-MM-DD') : '-'}</div>
        <div className="small text-muted mb-1"><b>Job:</b> {job || '-'}</div>
        <div className="small text-muted mb-3"><b>Phone:</b> {phone || '-'}</div>
        <div className="mt-auto d-flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => onEdit(user)}>Edit</button>
          <button className="btn btn-outline-danger btn-sm" onClick={() => onDelete(id)}>Delete</button>
        </div>
      </div>
    </div>
  )
}
