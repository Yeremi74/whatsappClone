import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import FormGroup from '../../components/FormGroup/FormGroup'
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle'
import { register, login } from '../../actions/authActions'
import styles from './DashboardLogin.module.css'

const DashboardLogin = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const isRegisterPage = location.pathname === '/register'
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const [errors, setErrors] = useState({})
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password) => {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (isRegisterPage) {
      if (!formData.name.trim()) {
        newErrors.name = t('register.errors.nameRequired')
      } else if (formData.name.trim().length < 2) {
        newErrors.name = t('register.errors.nameMinLength')
      }

      if (!formData.email.trim()) {
        newErrors.email = t('register.errors.emailRequired')
      } else if (!validateEmail(formData.email)) {
        newErrors.email = t('register.errors.emailInvalid')
      }

      if (!formData.password) {
        newErrors.password = t('register.errors.passwordRequired')
      } else if (!validatePassword(formData.password)) {
        newErrors.password = t('register.errors.passwordInvalid')
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = t('register.errors.confirmPasswordRequired')
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('register.errors.passwordsNotMatch')
      }
    } else {
      if (!formData.email.trim()) {
        newErrors.email = t('login.errors.emailRequired')
      } else if (!validateEmail(formData.email)) {
        newErrors.email = t('login.errors.emailInvalid')
      }

      if (!formData.password) {
        newErrors.password = t('login.errors.passwordRequired')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccessMessage('')
    
    if (!validateForm()) {
      return
    }

    if (isRegisterPage) {
      setIsLoading(true)
      try {
        const result = await register(formData)
        
        if (result.success) {
          setSuccessMessage(t('register.success'))
          setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
          })
          setTimeout(() => {
            navigate('/login')
          }, 2000)
        } else {
          if (Object.keys(result.errors).length > 0) {
            setErrors(result.errors)
          } else {
            setErrors({ general: result.error || t('register.errors.general') })
          }
        }
      } catch (error) {
        setErrors({ general: t('register.errors.network') })
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsLoading(true)
      try {
        const result = await login({
          email: formData.email,
          password: formData.password
        })
        
        if (result.success) {
          setSuccessMessage(t('login.success'))
          setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
          })
          setTimeout(() => {
            navigate('/')
          }, 1000)
        } else {
          if (Object.keys(result.errors).length > 0) {
            setErrors(result.errors)
          } else {
            setErrors({ general: result.error || t('login.errors.general') })
          }
        }
      } catch (error) {
        setErrors({ general: t('login.errors.network') })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className={styles.loginContainer}>
      <ThemeToggle variant="floating" />
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1>{t(isRegisterPage ? 'register.title' : 'login.title')}</h1>
          <p>{t(isRegisterPage ? 'register.subtitle' : 'login.subtitle')}</p>
        </div>

        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}
        {errors.general && (
          <div className={styles.errorMessageGeneral}>{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {isRegisterPage && (
            <FormGroup
              id="name"
              name="name"
              type="text"
              label={t('register.name')}
              value={formData.name}
              onChange={handleChange}
              placeholder={t('register.namePlaceholder')}
              error={errors.name}
              required
            />
          )}

          <FormGroup
            id="email"
            name="email"
            type="email"
            label={t(isRegisterPage ? 'register.email' : 'login.email')}
            value={formData.email}
            onChange={handleChange}
            placeholder={t(isRegisterPage ? 'register.emailPlaceholder' : 'login.emailPlaceholder')}
            error={errors.email}
            required
          />

          <FormGroup
            id="password"
            name="password"
            type="password"
            label={t(isRegisterPage ? 'register.password' : 'login.password')}
            value={formData.password}
            onChange={handleChange}
            placeholder={t(isRegisterPage ? 'register.passwordPlaceholder' : 'login.passwordPlaceholder')}
            error={errors.password}
            hint={isRegisterPage && !errors.password && formData.password ? t('register.passwordHint') : null}
            required
          />

          {isRegisterPage && (
            <FormGroup
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label={t('register.confirmPassword')}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={t('register.confirmPasswordPlaceholder')}
              error={errors.confirmPassword}
              required
            />
          )}

          {!isRegisterPage && (
            <div className={styles.formOptions}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>{t('login.rememberMe')}</span>
              </label>
              <a href="#" className={styles.forgotPassword}>{t('login.forgotPassword')}</a>
            </div>
          )}

          <button type="submit" className={styles.loginButton} disabled={isLoading}>
            {isLoading 
              ? t(isRegisterPage ? 'register.loading' : 'login.loading')
              : t(isRegisterPage ? 'register.submitButton' : 'login.submitButton')
            }
          </button>
        </form>

        <div className={styles.loginFooter}>
          <p>
            {t(isRegisterPage ? 'register.haveAccount' : 'login.noAccount')}{' '}
            <Link to={isRegisterPage ? '/login' : '/register'} className={styles.loginLink}>
              {t(isRegisterPage ? 'register.login' : 'login.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default DashboardLogin
