import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const createFriendRequest = async (userId) => {
  try {
    const response = await api.post(`/friend-requests`, {
      userId: userId == null ? '' : String(userId)
    })
    return response.data
  } catch (error) {
    throw error
  }
}

export const getReceivedFriendRequests = async () => {
  try {
    const response = await api.get('/friend-requests/received')
    return response.data
  } catch (error) {
    throw error
  }
}

export const getFriends = async () => {
  try {
    const response = await api.get('/friend-requests/friends')
    return response.data
  } catch (error) {
    throw error
  }
}

export const getFriendRequestStatus = async (userId) => {
  try {
    const response = await api.get(
      `/friend-requests/status/${encodeURIComponent(String(userId))}`
    )
    return response.data
  } catch (error) {
    throw error
  }
}

export const removeFriend = async (peerUserId) => {
  try {
    const response = await api.delete(
      `/friend-requests/friends/${encodeURIComponent(String(peerUserId))}`
    )
    return response.data
  } catch (error) {
    if (error.response?.data) {
      return error.response.data
    }
    throw error
  }
}

export const cancelFriendRequest = async (requestId) => {
  try {
    const response = await api.delete(
      `/friend-requests/${encodeURIComponent(String(requestId))}`
    )
    return response.data
  } catch (error) {
    throw error
  }
}

export const acceptFriendRequest = async (requestId) => {
  try {
    const response = await api.put(
      `/friend-requests/${encodeURIComponent(String(requestId))}/accept`
    )
    return response.data
  } catch (error) {
    throw error
  }
}

export const rejectFriendRequest = async (requestId) => {
  try {
    const response = await api.put(
      `/friend-requests/${encodeURIComponent(String(requestId))}/reject`
    )
    return response.data
  } catch (error) {
    throw error
  }
}
