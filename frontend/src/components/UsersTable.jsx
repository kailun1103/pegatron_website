import dayjs from 'dayjs'

// UsersTable 元件，顯示使用者清單的表格
export default function UsersTable({ items, onEdit, onDelete }) {
  return (
    <div className="table-responsive">
      {/* table-responsive: Bootstrap 讓表格在小螢幕可左右滑動 */}
      <table className="table align-middle">
        {/* align-middle: 讓表格內文字置中對齊 */}
        <thead>
          <tr>
            {/* 表頭欄位 */}
            <th>Name</th>
            <th>Gender</th>
            <th>Birthday</th>
            <th>Job</th>
            <th>Phone</th>
            <th style={{width: 140}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(u => (
            // 逐一渲染每位使用者
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.gender || '-'}</td>
              {/* 如果有生日，用 dayjs 格式化 YYYY-MM-DD，否則顯示 - */}
              <td>{u.birthday ? dayjs(u.birthday).format('YYYY-MM-DD') : '-'}</td>
              <td>{u.job}</td>
              <td>{u.phone || '-'}</td>
              <td>
                <div className="d-flex gap-2">
                  {/* 編輯按鈕，點擊時呼叫 onEdit 傳入該使用者資料 */}
                  <button className="btn btn-sm btn-primary" onClick={() => onEdit(u)}>Edit</button>
                  {/* 刪除按鈕，點擊時呼叫 onDelete 傳入該使用者的 id */}
                  <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(u.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            // 當 items 陣列為空，顯示「No data found」
            <tr>
              <td colSpan="6" className="text-center text-muted">No data found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}