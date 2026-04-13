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

export const listConversations = async () => {
  try {
    const response = await api.get('/conversations')
    return {
      success: true,
      data: response.data.data || []
    }
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.error
      }
    }
    throw error
  }
}

export const openConversationWithUser = async (userId) => {
  try {
    const response = await api.post(`/conversations/open/${userId}`)
    return {
      success: true,
      data: response.data.data
    }
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.error
      }
    }
    throw error
  }
}

export const getConversationMessages = async (conversationId) => {
  try {
    const response = await api.get(`/conversations/${conversationId}/messages`)
    return {
      success: true,
      data: response.data.data || []
    }
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.error
      }
    }
    throw error
  }
}

export const markConversationRead = async (conversationId) => {
  try {
    await api.post(`/conversations/${conversationId}/read`)
    return { success: true }
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.error
      }
    }
    throw error
  }
}
