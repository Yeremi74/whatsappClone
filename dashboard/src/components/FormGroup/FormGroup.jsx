import React from 'react'
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
  ...inputProps
}) => {
  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>
        {label}
        {required && <span className={styles.requiredAsterisk}>*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={error ? styles.inputError : ''}
        required={required}
        {...inputProps}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
      {hint && !error && <span className={styles.passwordHint}>{hint}</span>}
    </div>
  )
}

export default FormGroup
