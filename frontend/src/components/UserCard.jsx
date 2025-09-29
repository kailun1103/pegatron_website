import dayjs from 'dayjs'

const fallbackAvatar = 'https://img.jollybuy.com/S230525150119862/goods/10cb940c20d74b6c9e33ef6a73deca0e.jpg'

export default function UserCard({ user, onEdit, onDelete, onView }) {
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
          <button className="btn btn-outline-secondary btn-sm" onClick={() => onView && onView(user)}>View</button>
          <button className="btn btn-primary btn-sm" onClick={() => onEdit(user)}>Edit</button>
          <button className="btn btn-outline-danger btn-sm" onClick={() => onDelete(id)}>Delete</button>
        </div>
      </div>
    </div>
  )
}
