import { api } from './client'

export const fetchUsers = ({ page=1, limit=6, q='', job='' }) => {
  return api.get('/api/users', { params: { page, limit, q, job } })
}

export const createUser = (payload) => {
  return api.post('/api/users', payload)
}

export const updateUser = (id, payload) => {
  return api.put(`/api/users/${id}`, payload)
}

export const deleteUser = (id) => {
  return api.delete(`/api/users/${id}`)
}
