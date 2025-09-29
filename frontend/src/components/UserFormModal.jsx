import { Modal } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import './UserFormModal.css'

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
  // 新增：雲端上傳後的 URL（可為空字串）
  avatar_url: z.string().url('Please upload a valid image URL').optional().or(z.literal('')),
  // 修正：支援 FileList（react-hook-form 給的是 FileList）
  avatar_file: z
    .any()
    .optional()
    .refine(fl => !fl || fl.length === 0 || (fl[0] instanceof File && fl[0].size > 0),
      'Please upload a valid image file'),
});

export default function UserFormModal({ show, onClose, initial, onSubmit, mode = 'edit' }) {
  const { register, handleSubmit, reset, watch, setValue, clearErrors, setError,
   formState: { errors, isSubmitting, isSubmitted } } = useForm({
   resolver: zodResolver(schema),
   mode: "onSubmit",
   reValidateMode: "onSubmit",
   defaultValues: initial || {
     name:'', gender:'', birthday:'', job:'student', phone:'',
     avatar_file: null, avatar_url: ''
   },
   values: initial ? {
     name: initial.name || '',
     gender: initial.gender || '',
     birthday: initial.birthday ? initial.birthday.slice(0,10) : '',
     job: initial.job || 'student',
     phone: initial.phone || '',
     avatar_file: null,
     avatar_url: initial.avatar_url || '',
   } : undefined
});

useEffect(() => {
  reset(initial ? {
    name: initial.name || '',
    gender: initial.gender || '',
    birthday: initial.birthday ? initial.birthday.slice(0,10) : '',
    job: initial.job || 'student',
    phone: initial.phone || '',
    avatar_file: null,
    avatar_url: initial.avatar_url || '',
  } : {
    name: '',
    gender: '',
    birthday: '',
    job: 'student',
    phone: '',
    avatar_file: null,
    avatar_url: '',
  });
  setUploadSuccess(false);
}, [initial]);


const [uploading, setUploading] = useState(false);
const [uploadSuccess, setUploadSuccess] = useState(false);
const fileList = watch('avatar_file');

const handleUpload = async () => {
  const file = fileList && fileList.length > 0 ? fileList[0] : null;
  if (!file) {
    setError('avatar_file', { type: 'manual', message: '請先選擇檔案' });
    return;
  }
  try {
    setUploading(true);
    setUploadSuccess(false);
    const fd = new FormData();
    fd.append('file', file);

    const resp = await fetch('/api/upload', {
      method: 'POST',
      body: fd, // 不要手動加 Content-Type，瀏覽器會自動加 boundary
    });
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      throw new Error(j?.error?.message || `Upload failed: ${resp.status}`);
    }
    const data = await resp.json(); // { url, public_id, ... }
    setValue('avatar_url', data.url, { shouldDirty: true });
    clearErrors('avatar_url');
    clearErrors('avatar_file');
    setUploadSuccess(true);
  } catch (e) {
    console.error(e);
    setError('avatar_url', { type: 'manual', message: e.message || '上傳失敗' });
    setUploadSuccess(false);
  } finally {
    setUploading(false);
  }
};

const submit = async (data) => {
  // 如果沒上傳新圖，但有 initial 舊圖，沿用
  if (!data.avatar_url && initial?.avatar_url) {
    data.avatar_url = initial.avatar_url;
  }

  // 不要把檔案傳到 /api/users
  delete data.avatar_file;

  await onSubmit(data);
  reset();
  setUploadSuccess(false);
  onClose();
};

  // 只有在表單已提交過且有錯誤時才顯示錯誤訊息
  const showNameError = isSubmitted && errors.name;
  const showGenderError = isSubmitted && errors.gender;
  const showBirthdayError = isSubmitted && errors.birthday;
  const showJobError = isSubmitted && errors.job;
  const showPhoneError = isSubmitted && errors.phone;
  const showAvatarError = isSubmitted && errors.avatar_url;

  return (
    // 彈出視窗(對話框)的UI元件
    <Modal show={show} onHide={onClose} centered className={mode === 'view' ? 'view-mode' : ''}>
      <form onSubmit={handleSubmit(submit)}>
        <Modal.Header closeButton>
          <Modal.Title>{mode === 'view' ? 'View User' : (initial ? 'Edit User' : 'Create User')}</Modal.Title>
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
              disabled={mode === 'view'}
            />
            {showNameError && <div className="text-danger small">{errors.name.message}</div>}
          </div>
          {/* Gender */}
          <div className="mb-3">
            <label className="form-label">Gender <span style={{ color: 'red' }}>*</span></label>
            <select className="form-select" {...register('gender')} disabled={mode === 'view'}>
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
              {...register('birthday')} disabled={mode === 'view'}
            />
            {showBirthdayError && <div className="text-danger small">{errors.birthday.message}</div>}
          </div>
          {/* Job */}
          <div className="mb-3">
            <label className="form-label">Job <span style={{ color: 'red' }}>*</span>
            </label>
            <select className="form-select" {...register('job')} disabled={mode === 'view'}>
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
              placeholder="e.g., 0912345678"
              {...register('phone')} disabled={mode === 'view'}
            />
            {showPhoneError && <div className="text-danger small">{errors.phone.message}</div>}
          </div>
          {/* Avatar Upload with button */}
          <input type="hidden" {...register('avatar_url')} />
          <div className="mb-3">
            <label className="form-label">Avatar Upload</label>
            <div className="d-flex align-items-center gap-2">
              <input
                type="file"
                accept="image/*"
                className="form-control"
                style={{ maxWidth: 'calc(100% - 180px)' }}
                {...register('avatar_file')} disabled={mode === 'view'}
                id="avatarFileInput"
              />
              <button
                type="button"
                className="btn btn-secondary flex-shrink-0"
                onClick={handleUpload}
                disabled={uploading || mode === 'view'}
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <button
                type="button"
                className="btn btn-outline-danger flex-shrink-0"
                onClick={() => {
                  setValue('avatar_file', null);
                  setValue('avatar_url', '');
                  clearErrors('avatar_file');
                  clearErrors('avatar_url');
                }}
                disabled={uploading || mode === 'view'}
              >
                Cancel
              </button>
            </div>

            {/* 兩種錯誤都顯示：檔案或 URL */}
            {(isSubmitted && errors.avatar_url) && (
              <div className="text-danger small mt-1">{errors.avatar_url.message}</div>
            )}
            {(isSubmitted && errors.avatar_file) && (
              <div className="text-danger small mt-1">{errors.avatar_file.message}</div>
            )}
          </div>

          {/* Preview：若已上傳成功就顯示雲端 URL，否則顯示本地預覽 */}
          {(initial && watch('avatar_url')) && (
            <div className="mb-3">
              <img
                src={watch('avatar_url')}
                alt="Avatar Preview"
                style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover' }}
              />
            </div>
          )}

          {(watch('avatar_url') && !initial) && (
            <div className="mb-3">
              <img
                src={watch('avatar_url')}
                alt="Avatar Preview"
                style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover' }}
              />
            </div>
          )}
        </Modal.Body>

        {uploadSuccess && (
          <div className="alert alert-success m-3" role="alert">
            上傳成功！
          </div>
        )}


        {mode !== 'view' && (
          <Modal.Footer>
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {initial ? 'Save Changes' : 'Create'}
            </button>
          </Modal.Footer>
        )}
    </form>
  </Modal>
)
}