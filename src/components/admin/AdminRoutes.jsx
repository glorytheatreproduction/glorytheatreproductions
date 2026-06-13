import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function StaffRoute({ children }) {
  const { isStaff } = useAuth()
  if (!isStaff) return <Navigate to="/admin/blog" replace />
  return children
}

export function AdminRoute({ children }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/admin" replace />
  return children
}
