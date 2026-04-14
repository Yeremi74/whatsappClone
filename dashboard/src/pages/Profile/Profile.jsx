import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import FormGroup from '../../components/FormGroup/FormGroup'
import { useDashboard } from '../../context/DashboardContext'
import { getCurrentUser, updateCurrentUser } from '../../actions/userActions'
import { IoCameraOutline, IoTrashOutline } from 'react-icons/io5'
import styles from './Profile.module.css'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_OUTPUT_SIDE = 512
const JPEG_QUALITY = 0.86
const MAX_DATA_URL_CHARS = 2 * 1024 * 1024

const compressImageFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (w > MAX_OUTPUT_SIDE || h > MAX_OUTPUT_SIDE) {
          if (w >= h) {
            h = Math.round((h / w) * MAX_OUTPUT_SIDE)
            w = MAX_OUTPUT_SIDE
          } else {
            w = Math.round((w / h) * MAX_OUTPUT_SIDE)
            h = MAX_OUTPUT_SIDE
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('canvas'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
      }
      img.onerror = () => reject(new Error('image'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('read'))
    reader.readAsDataURL(file)
  })

const Profile = () => {
  const { t } = useTranslation()
  const { clearMain } = useDashboard()
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    profilePicture: ''
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoadingData(true)
      try {
        const result = await getCurrentUser()
        if (result.success) {
          setFormData({
            name: result.data.name || '',
            email: result.data.email || '',
            description: result.data.description || '',
            profilePicture: result.data.profilePicture || ''
          })
        } else {
          setErrors({ general: result.error || t('profile.errors.loadError') })
        }
      } catch (error) {
        setErrors({ general: t('profile.errors.network') })
      } finally {
        setIsLoadingData(false)
      }
    }

    loadUserData()
  }, [t])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }))
    }

    if (errors.general) {
      setErrors((prev) => ({
        ...prev,
        general: ''
      }))
    }

    setSuccessMessage('')
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({
        ...prev,
        profilePicture: t('profile.errors.imageInvalid')
      }))
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrors((prev) => ({
        ...prev,
        profilePicture: t('profile.errors.imageTooLarge')
      }))
      return
    }
    setPhotoBusy(true)
    setSuccessMessage('')
    setErrors((prev) => ({ ...prev, profilePicture: '', general: '' }))
    try {
      const dataUrl = await compressImageFile(file)
      if (dataUrl.length > MAX_DATA_URL_CHARS) {
        setErrors((prev) => ({
          ...prev,
          profilePicture: t('profile.errors.imageTooLarge')
        }))
        return
      }
      setFormData((prev) => ({ ...prev, profilePicture: dataUrl }))
    } catch {
      setErrors((prev) => ({
        ...prev,
        profilePicture: t('profile.errors.imageInvalid')
      }))
    } finally {
      setPhotoBusy(false)
    }
  }

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, profilePicture: '' }))
    setErrors((prev) => ({ ...prev, profilePicture: '' }))
    setSuccessMessage('')
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = t('profile.errors.nameRequired')
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('profile.errors.nameMinLength')
    }

    if (!formData.email.trim()) {
      newErrors.email = t('profile.errors.emailRequired')
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('profile.errors.emailInvalid')
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

    setIsLoading(true)
    try {
      const result = await updateCurrentUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        description: formData.description.trim(),
        profilePicture: formData.profilePicture.trim()
      })

      if (result.success) {
        setSuccessMessage(t('profile.success'))
        setErrors({})
      } else {
        if (result.errors && Object.keys(result.errors).length > 0) {
          setErrors(result.errors)
        } else {
          setErrors({ general: result.error || t('profile.errors.general') })
        }
      }
    } catch (error) {
      setErrors({ general: t('profile.errors.network') })
    } finally {
      setIsLoading(false)
    }
  }

  const previewSrc = formData.profilePicture || null
  const initial = (formData.name || formData.email || '?').trim().charAt(0).toUpperCase()

  if (isLoadingData) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingMessage}>{t('profile.loading')}</div>
      </div>
    )
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileCard}>
        <header className={styles.cardHeader}>
          <div
            className={
              photoBusy
                ? `${styles.avatarWrap} ${styles.avatarWrapBusy}`
                : styles.avatarWrap
            }
          >
            {previewSrc ? (
              <img
                className={styles.avatarImg}
                src={previewSrc}
                alt=""
              />
            ) : (
              <div className={styles.avatarPlaceholder} aria-hidden>
                {initial}
              </div>
            )}
            <div className={styles.avatarHover}>
              <button
                type="button"
                className={styles.avatarHoverBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || photoBusy}
                title={t('profile.choosePhoto')}
                aria-label={t('profile.choosePhoto')}
              >
                <IoCameraOutline className={styles.avatarHoverIcon} aria-hidden />
              </button>
              {previewSrc && (
                <button
                  type="button"
                  className={styles.avatarHoverBtnSecondary}
                  onClick={handleRemovePhoto}
                  disabled={isLoading || photoBusy}
                  title={t('profile.removePhoto')}
                  aria-label={t('profile.removePhoto')}
                >
                  <IoTrashOutline className={styles.avatarHoverIcon} aria-hidden />
                </button>
              )}
            </div>
            {photoBusy && (
              <div className={styles.avatarOverlay}>{t('profile.processingPhoto')}</div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenFile}
              onChange={handleFileChange}
              tabIndex={-1}
              aria-label={t('profile.choosePhoto')}
            />
          </div>
          <h1 className={styles.title}>{t('profile.title')}</h1>
          <p className={styles.subtitle}>{t('profile.subtitle')}</p>
        </header>

        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}

        {errors.general && (
          <div className={styles.errorMessage}>{errors.general}</div>
        )}

        {errors.profilePicture && (
          <p className={styles.pictureError}>{errors.profilePicture}</p>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <FormGroup
            id="name"
            name="name"
            type="text"
            label={t('profile.name')}
            value={formData.name}
            onChange={handleChange}
            placeholder={t('profile.namePlaceholder')}
            error={errors.name}
            required
          />

          <FormGroup
            id="email"
            name="email"
            type="email"
            label={t('profile.email')}
            value={formData.email}
            onChange={handleChange}
            placeholder={t('profile.emailPlaceholder')}
            error={errors.email}
            required
          />

          <FormGroup
            id="description"
            name="description"
            type="text"
            label={t('profile.description')}
            value={formData.description}
            onChange={handleChange}
            placeholder={t('profile.descriptionPlaceholder')}
            error={errors.description}
          />

          <div className={styles.buttonContainer}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? t('profile.saving') : t('profile.saveButton')}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => clearMain()}
              disabled={isLoading}
            >
              {t('profile.cancelButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Profile
