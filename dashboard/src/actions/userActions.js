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

export const searchUsers = async (field, value) => {
    try {
        const response = await api.get(`/users/search?field=${field}&value=${value}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const getCurrentUser = async () => {
    try {
        const response = await api.get('/users/me')
        return {
            success: true,
            data: response.data.data
        }
    } catch (error) {
        if (error.response) {
            return {
                success: false,
                error: error.response.data.error
            }
        }
        throw error
    }
}

export const updateCurrentUser = async (userData) => {
    try {
        const response = await api.put('/users/me', userData)
        return {
            success: true,
            data: response.data.data
        }
    } catch (error) {
        if (error.response) {
            return {
                success: false,
                error: error.response.data.error,
                errors: error.response.data.errors
            }
        }
        throw error
    }
}

export const getUserById = async (userId) => {
    try {
        const response = await api.get(`/users/${userId}`)
        return {
            success: true,
            data: response.data.data
        }
    } catch (error) {
        if (error.response) {
            return {
                success: false,
                error: error.response.data.error
            }
        }
        throw error
    }
}