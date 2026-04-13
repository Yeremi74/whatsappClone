import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ThemeToggle from '../ThemeToggle/ThemeToggle'
import styles from './SidebarSettings.module.css'

const languages = [{ code: 'es' }, { code: 'en' }]

const stripeH = 10 / 13

const FlagEs = ({ className }) => (
  <svg className={className} viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect width="3" height="0.5" fill="#AA151B" />
    <rect width="3" height="1" y="0.5" fill="#F1BF00" />
    <rect width="3" height="0.5" y="1.5" fill="#AA151B" />
  </svg>
)

const FlagUs = ({ className }) => (
  <svg className={className} viewBox="0 0 19 10" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    {Array.from({ length: 13 }, (_, i) => (
      <rect
        key={i}
        x="0"
        y={i * stripeH}
        width="19"
        height={stripeH}
        fill={i % 2 === 0 ? '#B22234' : '#FFFFFF'}
      />
    ))}
    <rect x="0" y="0" width="7.6" height={stripeH * 7} fill="#3C3B6E" />
  </svg>
)

const LanguageFlag = ({ code, className }) =>
  code === 'es' ? <FlagEs className={className} /> : <FlagUs className={className} />

const SidebarSettings = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const currentLng = i18n.language?.startsWith('en') ? 'en' : 'es'
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const handlePick = (lng) => {
    i18n.changeLanguage(lng)
    try {
      localStorage.setItem('i18nextLng', lng)
    } catch {}
    setOpen(false)
  }

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const current = languages.find((l) => l.code === currentLng) || languages[0]

  return (
    <div className={styles.wrap}>
      <div className={styles.themeRow}>
        <span className={styles.themeLabel}>{t('navbar.theme')}</span>
        <ThemeToggle />
      </div>
      <div className={styles.themeRow}>
        <span className={styles.themeLabel} id="sidebarLanguageLabel">
          {t('navbar.language')}
        </span>
        <div className={styles.languageDropdown} ref={wrapRef}>
          <button
            type="button"
            id="sidebarLanguage"
            className={styles.languageTrigger}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls="sidebarLanguageList"
            aria-labelledby="sidebarLanguageLabel sidebarLanguageValue"
            onClick={() => setOpen((v) => !v)}
          >
            <LanguageFlag code={current.code} className={styles.languageFlag} />
            <span className={styles.languageTriggerText} id="sidebarLanguageValue">
              {currentLng === 'es' ? t('navbar.languageEs') : t('navbar.languageEn')}
            </span>
            <svg
              className={`${styles.languageChevron} ${open ? styles.languageChevronOpen : ''}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {open && (
            <ul
              className={styles.languageMenu}
              role="listbox"
              id="sidebarLanguageList"
              aria-labelledby="sidebarLanguageLabel"
            >
              {languages.map((lang) => {
                const selected = lang.code === currentLng
                return (
                  <li key={lang.code} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`${styles.languageOption} ${selected ? styles.languageOptionActive : ''}`}
                      onClick={() => handlePick(lang.code)}
                    >
                      <LanguageFlag code={lang.code} className={styles.languageFlag} />
                      <span>
                        {lang.code === 'es' ? t('navbar.languageEs') : t('navbar.languageEn')}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
      <button
        type="button"
        className={styles.profileButton}
        onClick={() => navigate('/profile')}
      >
        {t('navbar.profile')}
      </button>
    </div>
  )
}

export default SidebarSettings
