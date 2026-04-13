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

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', {
      name: userData.name.trim(),
      email: userData.email.trim(),
      password: userData.password,
      confirmPassword: userData.confirmPassword
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        errors: error.response.data.errors || {},
        error: error.response.data.error
      }
    }
    throw error
  }
}

export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', {
      email: credentials.email.trim(),
      password: credentials.password
    })
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        errors: error.response.data.errors || {},
        error: error.response.data.error
      }
    }
    throw error
  }
}

export const logout = () => {
  localStorage.removeItem('token')
}
