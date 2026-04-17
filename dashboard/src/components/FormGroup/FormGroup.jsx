import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5'
import styles from './FormGroup.module.css'

const FormGroup = ({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  required = false,
  showPasswordToggle = false,
  ...inputProps
}) => {
  const { t } = useTranslation()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const usePasswordToggle = type === 'password' && showPasswordToggle
  const inputType = usePasswordToggle && passwordVisible ? 'text' : type

  const inputClassName = [error ? styles.inputError : '', usePasswordToggle ? styles.inputWithToggle : '']
    .filter(Boolean)
    .join(' ')

  const inputEl = (
    <input
      type={inputType}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={inputClassName || undefined}
      required={required}
      {...inputProps}
    />
  )

  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>
        {label}
        {required && <span className={styles.requiredAsterisk}>*</span>}
      </label>
      {usePasswordToggle ? (
        <div className={styles.passwordInputWrap}>
          {inputEl}
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setPasswordVisible((v) => !v)}
            aria-label={passwordVisible ? t('common.hidePassword') : t('common.showPassword')}
            aria-pressed={passwordVisible}
          >
            {passwordVisible ? <IoEyeOffOutline size={20} aria-hidden /> : <IoEyeOutline size={20} aria-hidden />}
          </button>
        </div>
      ) : (
        inputEl
      )}
      {error && <span className={styles.errorMessage}>{error}</span>}
      {hint && !error && <span className={styles.passwordHint}>{hint}</span>}
    </div>
  )
}

export default FormGroup
