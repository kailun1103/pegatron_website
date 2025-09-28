import { api } from './client'

export const fetchUsers = async ({ page=1, limit=6, q='', job='' }) => {
  const { data } = await api.get('/api/users', { params: { page, limit, q, job } })
  return data
}

export const createUser = async (payload) => {
  const { data } = await api.post('/api/users', payload)
  return data
}

export const updateUser = async (id, payload) => {
  const { data } = await api.put(`/api/users/${id}`, payload)
  return data
}

export const deleteUser = async (id) => {
  await api.delete(`/api/users/${id}`)
}
