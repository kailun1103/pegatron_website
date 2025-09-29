import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUsers, createUser, updateUser, deleteUser } from '../api/users'
import DebouncedInput from '../components/DebouncedInput'
import JobSelect from '../components/JobSelect'
import PaginationBar from '../components/PaginationBar'
import UserCard from '../components/UserCard'
import UsersTable from '../components/UsersTable'
import UserFormModal from '../components/UserFormModal'

import './UserManagementPage.css'


export default function UserManagementPage() {
  // 讀取並設定網址查詢參數（用於同步 tab / page / q / job）
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') || 'card' // 'card' | 'table'
  const page = Math.max(parseInt(sp.get('page') || '1', 10), 1)
// 監聽 URL 變化，輸出變化前後的查詢參數，幫助定位問題
useEffect(() => {
  const handlePopState = () => {
    console.log('URL changed:', window.location.search)
  }
  window.addEventListener('popstate', handlePopState)
  return () => window.removeEventListener('popstate', handlePopState)
}, [])
  const q = sp.get('q') || ''
  const job = sp.get('job') || ''


  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Delayed check - current page:', sp.get('page'), 'q:', sp.get('q'))
    }, 1000)
    return () => clearTimeout(timer)
  }, [sp])

  // React Query 客戶端（用於快取與失效）
  const qc = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', { page, limit: 6, q, job }],
    queryFn: () => fetchUsers({ page, limit: 6, q, job }),
    keepPreviousData: true,
    onError: (err) => {
      console.error('[users] query error:', err);
    },
  });

  // Modal 狀態：是否顯示表單、目前是否在編輯某位使用者
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  // 建立 / 更新 / 刪除 的 mutation，成功後讓 'users' 相關查詢失效以重新抓取
  const mCreate = useMutation({
    mutationFn: (payload) => createUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
  const mUpdate = useMutation({
    mutationFn: ({ id, payload }) => updateUser(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
  const mDelete = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  // 從查詢結果取出資料與總頁數（加上安全預設）
  const items = data?.items || []
  const totalPages = data?.totalPages || 1

  // 工具：更新 URL 查詢參數（空字串或 null/undefined 會刪除該參數）
  const setParam = (kv) => {
    const next = new URLSearchParams(sp)
    Object.entries(kv).forEach(([k, v]) => {
      if (v === '' || v == null) next.delete(k)
      else next.set(k, String(v))
    })
    // 參數沒有實際變化就不更新，避免重設 page
    if (next.toString() !== sp.toString()) setSp(next)
  }

  // 各種查詢參數變更事件
  const onChangeTab = (nextTab) => setParam({ tab: nextTab })
  const [currentPage, setCurrentPage] = useState(page)

  useEffect(() => {
    setCurrentPage(page)
  }, [page])

  const onPageChange = (p) => {
    const newPage = Math.max(1, p)
    setCurrentPage(newPage)
    setParam({ page: newPage })
  }
  const onChangeQ = (value) => {
    if (value !== q) setParam({ q: value, page: 1 })
  }

  const onChangeJob = (value) => {
    if (value !== job) setParam({ job: value, page: 1 })
  }

  // 送出新增 / 編輯
  const onCreate = async (payload) => { await mCreate.mutateAsync(payload) }
  const onSaveEdit = async (payload) => { await mUpdate.mutateAsync({ id: editing.id, payload }) }

  // 刪除確認
  const onDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    await mDelete.mutateAsync(id)
  }

  // 初始預設 tab（若網址沒有 tab 參數，預設為 card）
  useEffect(() => {
    if (!sp.get('tab')) setParam({ tab: 'card' })
    // eslint-disable-next-line
  }, [])

  return (
    <div className={`container py-4 ${tab === 'table' ? 'table-mode' : ''}`}>
      {/* 頁面標題與檢視切換（卡片 / 表格） */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0">User Management</h3>
        <div className="btn-group" role="group">
          <button
            className={`btn btn-sm ${tab === 'card' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => onChangeTab('card')}
          >
            Cards
          </button>
          <button
            className={`btn btn-sm ${tab === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => onChangeTab('table')}
          >
            Table
          </button>
        </div>
      </div>

      {/* 篩選區：關鍵字 + 職業 + 新增按鈕 */}
      <div className="row g-2 align-items-center mb-3">
        <div className="col-sm-6">
          {/* DebouncedInput：停止輸入一段時間才觸發查詢，降低 API 次數 */}
          <DebouncedInput
            value={q}
            onChange={onChangeQ}
            placeholder="Search name / phone (e.g., Teacher)"
          />
        </div>
        <div className="col-sm-3">
          {/* 職業下拉（你前面已改為英文版 JobSelect） */}
          <JobSelect value={job} onChange={onChangeJob} />
        </div>
        <div className="col-sm-3 text-sm-end">
          {/* 開啟新增表單（editing 設為 null 代表新增） */}
          <button
            className="btn btn-success w-100"
            onClick={() => { setEditing(null); setShowForm(true) }}
          >
            Create User
          </button>
        </div>
      </div>

      {/* 載入 / 錯誤狀態 */}
      {isLoading && <div className="text-muted">Loading...</div>}
      {isError && <div className="text-danger">Failed to load. Please try again later.</div>}

      {/* 主內容：卡片或表格 + 分頁 */}
      {!isLoading && !isError && (
        <>
          {tab === 'card' ? (
            // 卡片檢視
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
              {items.map((u) => (
                <div className="col" key={u.id}>
                  <UserCard
                    user={u}
                    onEdit={(user) => { setEditing({ ...user, viewOnly: false }); setShowForm(true); console.log('Edit clicked', user, showForm, editing); }}
                    onDelete={onDelete}
                    onView={(user) => { setEditing({ ...user, viewOnly: true }); setShowForm(true); console.log('View clicked', user, showForm, editing); }}
                  />
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center text-muted py-5">No data found</div>
              )}
            </div>
          ) : (
            // 表格檢視
            <UsersTable
              items={items}
              onEdit={(user) => { setEditing({ ...user, viewOnly: false }); setShowForm(true) }}
              onDelete={onDelete}
              onView={(user) => { setEditing({ ...user, viewOnly: true }); setShowForm(true); }}
            />
          )}

          {/* 分頁列 */}
          <PaginationBar page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </>
      )}

      {/* 新增 / 編輯 的表單 Modal */}
      <UserFormModal
        show={showForm}
        onClose={() => setShowForm(false)}
        initial={editing}
        onSubmit={editing ? onSaveEdit : onCreate}
        mode={editing && editing.viewOnly ? 'view' : 'edit'}
      />
    </div>
  )
}
