import { Routes, Route, Navigate } from 'react-router-dom'
import UserManagementPage from './pages/UserManagementPage'

export default function App() {
  return (
    <Routes> 
      <Route path="/" element={<Navigate to="/UsersManagement" replace />} />
      <Route path="/UsersManagement" element={<UserManagementPage />} />
    </Routes>
  )
}
