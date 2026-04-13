import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './SettingsHome.module.css'

const SettingsHome = () => {
  const { t } = useTranslation()
  return (
    <div className={styles.wrap}>
      <p className={styles.lead}>{t('layout.settingsMain')}</p>
    </div>
  )
}

export default SettingsHome
