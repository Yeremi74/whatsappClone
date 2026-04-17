import { api } from '../api/client'

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

export const deleteConversation = async (conversationId) => {
  try {
    await api.delete(`/conversations/${encodeURIComponent(String(conversationId))}`)
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
