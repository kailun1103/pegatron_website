import { Modal } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

// 透過zod(輕量級的資料驗證庫)再提交資料前檢驗欄位輸入規則正確性
const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50, 'Max 50 characters'),
  gender: z.enum(['male','female','other'], { required_error: 'Gender is required' }),
  birthday: z.string().min(1, 'Birthday is required'),
  job: z.enum(['student','engineer','teacher','unemployed'], { required_error: 'Job is required' }),
  phone: z.string()
    .trim()
    .min(1, 'Phone is required')
    .regex(/^09\d{8}$/, 'Phone must be a valid Taiwan mobile number (e.g., 0912345678)'),
  avatar_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')).transform(v => v || undefined),
})

export default function UserFormModal({ show, onClose, initial, onSubmit }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isSubmitted } } = useForm({
    resolver: zodResolver(schema),
    mode: "onSubmit", // 只在提交時驗證
    reValidateMode: "onSubmit", // 重新驗證也只在提交時
    defaultValues: initial || { name:'', gender:'', birthday:'', job:'student', phone:'', avatar_url:'' }, // 預設值
    values: initial ? {
      name: initial.name || '',
      gender: initial.gender || '',
      birthday: initial.birthday ? initial.birthday.slice(0,10) : '',
      job: initial.job || 'student',
      phone: initial.phone || '',
      avatar_url: initial.avatar_url || '',
    } : undefined
  })

  const submit = async (data) => { 
    await onSubmit(data); 
    reset(); 
    onClose(); 
  }

  // 只有在表單已提交過且有錯誤時才顯示錯誤訊息
  const showNameError = isSubmitted && errors.name;
  const showGenderError = isSubmitted && errors.gender;
  const showBirthdayError = isSubmitted && errors.birthday;
  const showJobError = isSubmitted && errors.job;
  const showPhoneError = isSubmitted && errors.phone;
  const showAvatarError = isSubmitted && errors.avatar_url;

  return (
    // 彈出視窗(對話框)的UI元件
    <Modal show={show} onHide={onClose} centered>
      <form onSubmit={handleSubmit(submit)}>
        <Modal.Header closeButton>
          <Modal.Title>{initial ? 'Edit User' : 'Create User'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* Name */}
          <div className="mb-3">
            <label className="form-label">
              Name <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              className="form-control"
              placeholder="Enter name"
              {...register('name')}
            />
            {showNameError && <div className="text-danger small">{errors.name.message}</div>}
          </div>
          {/* Gender */}
          <div className="mb-3">
            <label className="form-label">Gender <span style={{ color: 'red' }}>*</span></label>
            <select className="form-select" {...register('gender')}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {showGenderError && <div className="text-danger small">{errors.gender.message}</div>}
          </div>
          {/* Birthday */}
          <div className="mb-3">
            <label className="form-label">Birthday <span style={{ color: 'red' }}>*</span></label>
            <input
              type="date"
              className="form-control"
              {...register('birthday')}
            />
            {showBirthdayError && <div className="text-danger small">{errors.birthday.message}</div>}
          </div>
          {/* Job */}
          <div className="mb-3">
            <label className="form-label">Job <span style={{ color: 'red' }}>*</span>
            </label>
            <select className="form-select" {...register('job')}>
              <option value="student">Student</option>
              <option value="engineer">Engineer</option>
              <option value="teacher">Teacher</option>
              <option value="unemployed">Unemployed</option>
            </select>
            {showJobError && <div className="text-danger small">{errors.job.message}</div>}
          </div>
          {/* Phone */}
          <div className="mb-3">
            <label className="form-label">Phone <span style={{ color: 'red' }}>*</span></label>
            <input
              className="form-control"
              placeholder="e.g., 0912-345-678"
              {...register('phone')}
            />
            {showPhoneError && <div className="text-danger small">{errors.phone.message}</div>}
          </div>
          {/* Avatar URL */}
          <div className="mb-3">
            <label className="form-label">Avatar URL</label>
            <input
              className="form-control"
              placeholder="https://..."
              {...register('avatar_url')}
            />
            {showAvatarError && <div className="text-danger small">{errors.avatar_url.message}</div>}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {initial ? 'Save Changes' : 'Create'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}